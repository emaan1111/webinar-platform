#!/usr/bin/env node
/**
 * Manual safety cleanup for the lead-page monitor.
 *
 * Normally the monitor reverses its own view writes automatically (net-zero).
 * Run this only if the monitor was killed hard (e.g. machine slept / kill -9)
 * and you want to guarantee its footprint is gone:
 *   - settles any outstanding decrements recorded in the ledger
 *   - deletes every split_test_events row tagged with the monitor's sentinel id
 *
 * Usage: node cleanup.mjs
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '../..');
const LEDGER_PATH = resolve(SCRIPT_DIR, 'logs', 'writeback-ledger.json');
const VISITOR_ID = '__monitor_bot__';

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
  } catch {}
}
loadEnv(resolve(PROJECT_ROOT, '.env'));

const prisma = new PrismaClient();
try {
  let ledger = { variants: {}, leadPages: {} };
  if (existsSync(LEDGER_PATH)) { try { ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')); } catch {} }

  let v = 0, p = 0;
  for (const [id, n] of Object.entries(ledger.variants)) {
    if (!n) continue;
    try { await prisma.splitTestVariant.update({ where: { id }, data: { views: { decrement: n } } }); ledger.variants[id] = 0; v += n; }
    catch (e) { console.error(`variant ${id}: ${e.message}`); }
  }
  for (const [id, n] of Object.entries(ledger.leadPages)) {
    if (!n) continue;
    try { await prisma.leadPage.update({ where: { id }, data: { views: { decrement: n } } }); ledger.leadPages[id] = 0; p += n; }
    catch (e) { console.error(`leadPage ${id}: ${e.message}`); }
  }
  const del = await prisma.splitTestEvent.deleteMany({ where: { visitorId: VISITOR_ID } });
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger));
  console.log(`Cleanup done. Reverted variant views=${v}, lead-page views=${p}, deleted ${del.count} tagged split_test_events.`);
} catch (e) {
  console.error('Cleanup failed:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
