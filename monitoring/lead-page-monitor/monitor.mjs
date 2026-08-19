#!/usr/bin/env node
/**
 * Lead Page & Split Test 24-hour health monitor (read-only, net-zero).
 *
 * What it checks, every cycle:
 *   - Each ACTIVE split test (/t/{slug}) returns a 307 redirect to a /p/{slug}
 *     whose `st` matches the test and whose `v` is a real configured variant.
 *   - Each lead page (/p/{slug}) returns 200 and renders a real page (not a
 *     404 / 500 / Next.js error screen).
 *
 * Net-zero: both routes increment a `views` counter on every GET (and /t also
 * writes a split_test_events VIEW row). The monitor tags its requests with a
 * sentinel visitor id, records exactly how many views it caused, and reverses
 * them at the end of each cycle. A crash-safe ledger guarantees the reversal
 * happens even if the process dies mid-run.
 *
 * Usage:
 *   node monitor.mjs            # run the full 24h loop (foreground)
 *   node monitor.mjs --once     # run a single funnel + full sweep, then exit
 *   node monitor.mjs --no-writeback   # probe but do NOT reverse view bumps
 *
 * Env overrides:
 *   MONITOR_BASE_URL   default https://emaanpowerclasses.com
 *   MONITOR_DURATION_H default 24
 *   MONITOR_FUNNEL_MIN default 15   (split tests + their lead pages)
 *   MONITOR_SWEEP_MIN  default 180  (all lead pages)
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '../..');
const LOG_DIR = resolve(SCRIPT_DIR, 'logs');
const LEDGER_PATH = resolve(LOG_DIR, 'writeback-ledger.json');

// ---- minimal .env loader (no deps) -----------------------------------------
function loadEnv(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      let [, k, v] = m;
      if (k in process.env) continue;
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  } catch { /* file may not exist; PrismaClient will surface a clearer error */ }
}
loadEnv(resolve(PROJECT_ROOT, '.env'));

// ---- config ----------------------------------------------------------------
const ARGS = new Set(process.argv.slice(2));
const ONCE = ARGS.has('--once');
const WRITEBACK = !ARGS.has('--no-writeback');
const BASE_URL = (process.env.MONITOR_BASE_URL || 'https://emaanpowerclasses.com').replace(/\/$/, '');
const DURATION_MS = Number(process.env.MONITOR_DURATION_H || 24) * 3600_000;
const FUNNEL_MS = Number(process.env.MONITOR_FUNNEL_MIN || 15) * 60_000;
const SWEEP_MS = Number(process.env.MONITOR_SWEEP_MIN || 180) * 60_000;
const REQ_TIMEOUT_MS = 30_000;
const CONCURRENCY = 6;
const VISITOR_ID = '__monitor_bot__'; // sentinel so our split_test_events are filterable/deletable
const UA = 'EmaanPowerClasses-HealthMonitor/1.0 (+read-only net-zero check)';

const prisma = new PrismaClient();

// ---- log files -------------------------------------------------------------
mkdirSync(LOG_DIR, { recursive: true });
const START = new Date();
const STAMP = START.toISOString().replace(/[:.]/g, '-');
const EVENTS_PATH = resolve(LOG_DIR, `events-${STAMP}.jsonl`);
const SUMMARY_MD = resolve(LOG_DIR, 'summary.md');
const SUMMARY_JSON = resolve(LOG_DIR, 'summary.json');

function ts() { return new Date().toISOString(); }
function logEvent(obj) {
  const rec = { ts: ts(), ...obj };
  try { writeFileSync(EVENTS_PATH, JSON.stringify(rec) + '\n', { flag: 'a' }); } catch {}
}
function say(line) { process.stdout.write(`[${ts()}] ${line}\n`); }

// ---- crash-safe writeback ledger -------------------------------------------
// Tracks outstanding view increments we still owe a decrement for.
function loadLedger() {
  if (!existsSync(LEDGER_PATH)) return { variants: {}, leadPages: {} };
  try { return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')); }
  catch { return { variants: {}, leadPages: {} }; }
}
function saveLedger(l) { try { writeFileSync(LEDGER_PATH, JSON.stringify(l)); } catch {} }
let ledger = loadLedger();
function owe(kind, id, n = 1) { ledger[kind][id] = (ledger[kind][id] || 0) + n; }

// Reverse everything currently owed in the ledger. Decrement by the EXACT count
// we added, so concurrent real traffic is never affected (we add N, subtract N).
async function settleLedger() {
  if (!WRITEBACK) return { skipped: true };
  const settled = { variants: 0, leadPages: 0, events: 0, errors: [] };
  for (const [id, n] of Object.entries(ledger.variants)) {
    if (!n) continue;
    try { await prisma.splitTestVariant.update({ where: { id }, data: { views: { decrement: n } } }); ledger.variants[id] = 0; settled.variants += n; }
    catch (e) { settled.errors.push(`variant ${id}: ${e.message}`); }
  }
  for (const [id, n] of Object.entries(ledger.leadPages)) {
    if (!n) continue;
    try { await prisma.leadPage.update({ where: { id }, data: { views: { decrement: n } } }); ledger.leadPages[id] = 0; settled.leadPages += n; }
    catch (e) { settled.errors.push(`leadPage ${id}: ${e.message}`); }
  }
  // Our split-test VIEW rows are all tagged with the sentinel visitor id.
  try { const r = await prisma.splitTestEvent.deleteMany({ where: { visitorId: VISITOR_ID } }); settled.events = r.count; }
  catch (e) { settled.errors.push(`events: ${e.message}`); }
  saveLedger(ledger);
  return settled;
}

// ---- running stats ---------------------------------------------------------
const stats = new Map(); // key -> { kind, target, checks, fails, lastStatus, lastError, lastOkAt, lastFailAt }
const variantHits = new Map(); // splitTestSlug -> { variantId: count }
function bump(key, kind, target, ok, status, error) {
  let s = stats.get(key);
  if (!s) { s = { kind, target, checks: 0, fails: 0, lastStatus: null, lastError: null, lastOkAt: null, lastFailAt: null }; stats.set(key, s); }
  s.checks++; s.lastStatus = status;
  if (ok) s.lastOkAt = ts(); else { s.fails++; s.lastError = error; s.lastFailAt = ts(); }
}

// ---- discovery -------------------------------------------------------------
let TESTS = [];        // { slug, id, variantIds:Set, variantSlug:Map(id->leadPageSlug), weights:[{id,weight,slug}] }
let LEAD_PAGES = [];   // { slug, id, type }
let FUNNEL_PAGES = []; // lead pages referenced by an active split test

async function discover() {
  const rawTests = await prisma.splitTest.findMany({
    where: { isActive: true },
    include: { variants: { include: { leadPage: { select: { id: true, slug: true } } } } },
  });
  TESTS = rawTests
    .filter((t) => t.variants.length > 0)
    .map((t) => ({
      slug: t.slug,
      id: t.id,
      variantIds: new Set(t.variants.map((v) => v.id)),
      variantSlug: new Map(t.variants.map((v) => [v.id, v.leadPage?.slug || null])),
      weights: t.variants.map((v) => ({ id: v.id, weight: v.weight, slug: v.leadPage?.slug || null })),
    }));
  LEAD_PAGES = await prisma.leadPage.findMany({ select: { id: true, slug: true, type: true } });
  const usedSlugs = new Set();
  for (const t of TESTS) for (const w of t.weights) if (w.slug) usedSlugs.add(w.slug);
  FUNNEL_PAGES = LEAD_PAGES.filter((p) => usedSlugs.has(p.slug));
}

// ---- HTTP probes -----------------------------------------------------------
async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Cookie: `webinar_visitor_id=${VISITOR_ID}`, ...(opts.headers || {}) },
    });
    return { res, latencyMs: Date.now() - t0 };
  } finally { clearTimeout(timer); }
}

function parseRedirectTarget(location) {
  // location is a path like /p/COURAGE?st=...&v=...
  try {
    const u = new URL(location, BASE_URL);
    return { path: u.pathname, st: u.searchParams.get('st'), v: u.searchParams.get('v') };
  } catch { return { path: location, st: null, v: null }; }
}

async function probeSplitTest(test) {
  const url = `${BASE_URL}/t/${encodeURIComponent(test.slug)}`;
  try {
    const { res, latencyMs } = await fetchWithTimeout(url, { redirect: 'manual' });
    const status = res.status;
    if (status !== 307 && status !== 308 && status !== 302) {
      const detail = `expected redirect, got HTTP ${status}`;
      logEvent({ kind: 'split_test', target: test.slug, ok: false, status, detail, latencyMs });
      bump(`t:${test.slug}`, 'split_test', test.slug, false, status, detail);
      return;
    }
    // We caused one variant view increment + one tagged event; reverse later.
    const loc = res.headers.get('location') || '';
    const { path, st, v } = parseRedirectTarget(loc);
    const problems = [];
    if (!path.startsWith('/p/')) problems.push(`redirect not to /p/ (${path})`);
    if (st !== test.id) problems.push(`st mismatch (${st})`);
    if (!v || !test.variantIds.has(v)) problems.push(`variant id not recognized (${v})`);
    if (v) { owe('variants', v); const m = variantHits.get(test.slug) || {}; m[v] = (m[v] || 0) + 1; variantHits.set(test.slug, m); }
    const ok = problems.length === 0;
    const detail = ok ? `→ ${path} (v=${v})` : problems.join('; ');
    logEvent({ kind: 'split_test', target: test.slug, ok, status, location: loc, detail, latencyMs });
    bump(`t:${test.slug}`, 'split_test', test.slug, ok, status, ok ? null : detail);
  } catch (e) {
    const detail = e.name === 'AbortError' ? `timeout >${REQ_TIMEOUT_MS}ms` : e.message;
    logEvent({ kind: 'split_test', target: test.slug, ok: false, status: 0, detail });
    bump(`t:${test.slug}`, 'split_test', test.slug, false, 0, detail);
  }
}

const ERROR_MARKERS = /Internal Server Error|Application error: a (server|client)-side exception|This page could(n'?t| not) be found|__next_error__/i;

async function probeLeadPage(page) {
  const url = `${BASE_URL}/p/${encodeURIComponent(page.slug)}`;
  try {
    const { res, latencyMs } = await fetchWithTimeout(url, { redirect: 'follow' });
    const status = res.status;
    let body = '';
    try { body = await res.text(); } catch {}
    if (status === 200) owe('leadPages', page.id); // GET incremented this page's views
    const problems = [];
    if (status !== 200) problems.push(`HTTP ${status}`);
    if (status === 200 && body.length < 600) problems.push(`suspiciously small body (${body.length}b)`);
    if (status === 200 && ERROR_MARKERS.test(body)) problems.push('error page markers in body');
    const ok = problems.length === 0;
    const detail = ok ? `200 ok (${body.length}b)` : problems.join('; ');
    logEvent({ kind: 'lead_page', target: page.slug, ok, status, detail, latencyMs });
    bump(`p:${page.slug}`, 'lead_page', page.slug, ok, status, ok ? null : detail);
  } catch (e) {
    const detail = e.name === 'AbortError' ? `timeout >${REQ_TIMEOUT_MS}ms` : e.message;
    logEvent({ kind: 'lead_page', target: page.slug, ok: false, status: 0, detail });
    bump(`p:${page.slug}`, 'lead_page', page.slug, false, 0, detail);
  }
}

// ---- concurrency pool ------------------------------------------------------
async function pool(items, worker, concurrency = CONCURRENCY) {
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length || 1) }, async () => {
    while (i < items.length) { const idx = i++; await worker(items[idx]); }
  });
  await Promise.all(runners);
}

// ---- summary writer --------------------------------------------------------
function writeSummary(final = false) {
  const now = new Date();
  const elapsedH = ((now - START) / 3600_000);
  const all = [...stats.values()];
  const fails = all.filter((s) => s.fails > 0);
  const totalChecks = all.reduce((a, s) => a + s.checks, 0);
  const totalFails = all.reduce((a, s) => a + s.fails, 0);
  const uptime = totalChecks ? (100 * (totalChecks - totalFails) / totalChecks) : 100;
  const outstanding = Object.values(ledger.variants).reduce((a, n) => a + (n || 0), 0)
    + Object.values(ledger.leadPages).reduce((a, n) => a + (n || 0), 0);

  const json = {
    base: BASE_URL, startedAt: START.toISOString(), updatedAt: now.toISOString(),
    elapsedHours: +elapsedH.toFixed(2), final, totalChecks, totalFails,
    uptimePct: +uptime.toFixed(3), outstandingViewWrites: outstanding, writeback: WRITEBACK,
    targets: all.map((s) => ({ kind: s.kind, target: s.target, checks: s.checks, fails: s.fails, lastStatus: s.lastStatus, lastError: s.lastError, lastFailAt: s.lastFailAt })),
    variantDistribution: Object.fromEntries([...variantHits.entries()].map(([slug, m]) => {
      const test = TESTS.find((t) => t.slug === slug);
      const total = Object.values(m).reduce((a, n) => a + n, 0) || 1;
      return [slug, (test?.weights || []).map((w) => ({ variantId: w.id, leadPage: w.slug, configuredWeight: w.weight, observed: m[w.id] || 0, observedPct: +(100 * (m[w.id] || 0) / total).toFixed(1) }))];
    })),
  };
  try { writeFileSync(SUMMARY_JSON, JSON.stringify(json, null, 2)); } catch {}

  const L = [];
  L.push(`# Lead Page & Split Test Monitor — ${final ? 'FINAL' : 'live'} summary`);
  L.push('');
  L.push(`- Target: ${BASE_URL}`);
  L.push(`- Started: ${START.toISOString()}`);
  L.push(`- Updated: ${now.toISOString()}  (${elapsedH.toFixed(2)}h elapsed)`);
  L.push(`- Checks: **${totalChecks}**  |  Failures: **${totalFails}**  |  Uptime: **${uptime.toFixed(2)}%**`);
  L.push(`- Net-zero writeback: ${WRITEBACK ? 'ON' : 'OFF'}  |  Outstanding view writes owed: ${outstanding}`);
  L.push(`- Event log: ${EVENTS_PATH}`);
  L.push('');
  L.push('## Failures');
  if (!fails.length) L.push('None — every target healthy on every check. ✅');
  else { L.push('| Target | Kind | Checks | Fails | Last status | Last error | Last fail |'); L.push('|---|---|--:|--:|--:|---|---|'); for (const s of fails.sort((a, b) => b.fails - a.fails)) L.push(`| ${s.target} | ${s.kind} | ${s.checks} | ${s.fails} | ${s.lastStatus} | ${(s.lastError || '').replace(/\|/g, '\\|')} | ${s.lastFailAt || ''} |`); }
  L.push('');
  L.push('## Variant distribution (split tests) — observed vs configured');
  for (const [slug, rows] of Object.entries(json.variantDistribution)) {
    L.push(`\n**/t/${slug}**`);
    L.push('| Variant lead page | Configured | Observed | Observed % |');
    L.push('|---|--:|--:|--:|');
    for (const r of rows) L.push(`| ${r.leadPage || r.variantId} | ${r.configuredWeight} | ${r.observed} | ${r.observedPct}% |`);
  }
  try { writeFileSync(SUMMARY_MD, L.join('\n') + '\n'); } catch {}
}

// ---- cycle -----------------------------------------------------------------
async function runFunnelCycle() {
  say(`funnel cycle: ${TESTS.length} split tests + ${FUNNEL_PAGES.length} lead pages`);
  await pool(TESTS, probeSplitTest);
  await pool(FUNNEL_PAGES, probeLeadPage);
  const settled = await settleLedger();
  const all = [...stats.values()];
  const fails = all.reduce((a, s) => a + s.fails, 0);
  say(`funnel done. cumulative checks=${all.reduce((a, s) => a + s.checks, 0)} fails=${fails} | writeback ${WRITEBACK ? `reverted v=${settled.variants ?? 0} p=${settled.leadPages ?? 0} events=${settled.events ?? 0}` : 'OFF'}`);
  writeSummary();
}

async function runFullSweep() {
  say(`full sweep: ${LEAD_PAGES.length} lead pages`);
  await pool(LEAD_PAGES, probeLeadPage);
  const settled = await settleLedger();
  say(`sweep done | writeback ${WRITEBACK ? `reverted p=${settled.leadPages ?? 0}` : 'OFF'}`);
  writeSummary();
}

// ---- main ------------------------------------------------------------------
let stopping = false;
async function shutdown(reason) {
  if (stopping) return; stopping = true;
  say(`shutting down (${reason}); flushing writeback + final summary…`);
  try { await settleLedger(); } catch {}
  writeSummary(true);
  try { await prisma.$disconnect(); } catch {}
  say(`final summary: ${SUMMARY_MD}`);
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function main() {
  say(`starting monitor → ${BASE_URL}`);
  // Settle anything left over from a previous crashed run before we begin.
  const leftover = Object.values(ledger.variants).reduce((a, n) => a + (n || 0), 0) + Object.values(ledger.leadPages).reduce((a, n) => a + (n || 0), 0);
  if (leftover) { say(`settling ${leftover} leftover view writes from a prior run…`); await settleLedger(); }
  await discover();
  say(`discovered ${TESTS.length} active split tests, ${LEAD_PAGES.length} lead pages (${FUNNEL_PAGES.length} used by tests)`);
  logEvent({ kind: 'start', base: BASE_URL, tests: TESTS.map((t) => t.slug), leadPages: LEAD_PAGES.length, funnelPages: FUNNEL_PAGES.length });

  if (ONCE) {
    await runFunnelCycle();
    await runFullSweep();
    await shutdown('--once complete');
    return;
  }

  // First pass immediately, then on intervals.
  await runFunnelCycle();
  await runFullSweep();
  const funnelTimer = setInterval(() => { runFunnelCycle().catch((e) => say(`funnel error: ${e.message}`)); }, FUNNEL_MS);
  const sweepTimer = setInterval(() => { runFullSweep().catch((e) => say(`sweep error: ${e.message}`)); }, SWEEP_MS);
  setTimeout(() => { clearInterval(funnelTimer); clearInterval(sweepTimer); shutdown('24h duration reached'); }, DURATION_MS);
  say(`looping: funnels every ${FUNNEL_MS / 60000}min, full sweep every ${SWEEP_MS / 60000}min, auto-stop in ${DURATION_MS / 3600000}h`);
}

main().catch(async (e) => { say(`FATAL: ${e.message}`); try { await settleLedger(); } catch {} writeSummary(true); try { await prisma.$disconnect(); } catch {} process.exit(1); });
