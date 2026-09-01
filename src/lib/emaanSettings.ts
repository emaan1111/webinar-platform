import { promises as fs } from 'fs'
import path from 'path'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

/**
 * Global Emaan routing rules.
 *
 * Stored in the database, not on disk. The `data/` directory these used to live
 * in is the container's own filesystem — the Railway volume is mounted
 * elsewhere — so anything written there is erased by the next deploy. That is
 * survivable for branding; for integration wiring it means pushes silently stop
 * and nothing reports an error, because a blank URL just means "don't push".
 *
 * A "route" forwards registrations to an Emaan lead-webhook URL based on the
 * webinar kind, gated by Zoom-only scope.
 *
 * These are the BROAD rules ("all webinars", "all internal", "all external").
 * Targeting a single specific webinar is done with the per-webinar
 * `emaanWebhookUrl` field on the webinar itself, not here.
 */

const EMAAN_FILE = path.join(process.cwd(), 'data', 'emaan-routes.json')
const SETTING_KEY = 'emaan'

export type EmaanScope = 'ALL' | 'ZOOM_ONLY'
export type EmaanAppliesTo = 'ALL' | 'INTERNAL' | 'EXTERNAL'

export interface EmaanGlobalRoute {
  id: string
  label: string
  webhookUrl: string
  scope: EmaanScope // "ALL" = every session, "ZOOM_ONLY" = only live Zoom sessions
  appliesTo: EmaanAppliesTo // which webinar kinds this rule covers
  isActive: boolean
}

interface EmaanSettings {
  routes: EmaanGlobalRoute[]
  /**
   * Where registration UPDATES are sent — a moved Zoom session, a swapped
   * link, attendance from the WebinarJam sync, a pasted replay URL, the
   * backfill script.
   *
   * Must point at an Emaan lead-webhook endpoint configured with NO tags and
   * NO lists. Emaan fires its tag/list triggers on every post, new or not, and
   * its workflow enrolment has no re-entry guard — so sending updates to a
   * TAGGED endpoint re-enrols the registrant every time, duplicating their
   * reminders, and a backfill would mail everyone at once.
   *
   * Blank = updates are not sent. Registrations still are, through the routes
   * above and the per-webinar URL on the webinar itself.
   */
  syncWebhookUrl: string
}

const EMPTY: EmaanSettings = { routes: [], syncWebhookUrl: '' }

function shape(raw: unknown): EmaanSettings {
  const v = (raw ?? {}) as Partial<EmaanSettings>
  return {
    routes: Array.isArray(v.routes) ? v.routes : [],
    syncWebhookUrl: typeof v.syncWebhookUrl === 'string' ? v.syncWebhookUrl : '',
  }
}

/**
 * One-time rescue of settings written before this moved into the database.
 *
 * The old file lives at process.cwd()/data — the container's own disk, not the
 * Railway volume — so it is wiped by every deploy. If a value happens to have
 * survived (a container that has not restarted since it was saved), adopt it;
 * otherwise there is nothing to recover and we start empty.
 */
async function readLegacyFile(): Promise<EmaanSettings | null> {
  try {
    const raw = await fs.readFile(EMAAN_FILE, 'utf-8')
    return shape(JSON.parse(raw))
  } catch {
    return null
  }
}

async function read(): Promise<EmaanSettings> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
    if (row) return shape(row.value)
  } catch (err) {
    // A missing table (pre-migration) must not take registrations down with it.
    console.error('Emaan settings read failed:', err)
    return EMPTY
  }
  // Nothing stored yet — adopt whatever the old file still holds, once.
  const legacy = await readLegacyFile()
  if (legacy && (legacy.routes.length > 0 || legacy.syncWebhookUrl)) {
    await write(legacy).catch(() => {})
    return legacy
  }
  return EMPTY
}

async function write(settings: EmaanSettings): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: settings as unknown as Prisma.InputJsonValue },
    update: { value: settings as unknown as Prisma.InputJsonValue },
  })
}

export async function readEmaanRoutes(): Promise<EmaanGlobalRoute[]> {
  return (await read()).routes
}

/** The update channel's URL. Falls back to the old env var if one is still set. */
export async function readEmaanSyncUrl(): Promise<string> {
  const stored = (await read()).syncWebhookUrl?.trim()
  if (stored) return stored
  return process.env.EMAAN_WEBINAR_SYNC_URL?.trim() || ''
}

export async function writeEmaanRoutes(routes: EmaanGlobalRoute[]): Promise<void> {
  const current = await read()
  await write({ ...current, routes })
}

export async function writeEmaanSyncUrl(syncWebhookUrl: string): Promise<void> {
  const current = await read()
  await write({ ...current, syncWebhookUrl: syncWebhookUrl.trim() })
}
