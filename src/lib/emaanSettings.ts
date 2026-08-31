import { promises as fs } from 'fs'
import path from 'path'

/**
 * Global Emaan routing rules.
 *
 * Stored as a JSON file on the same `data/` volume as the other app settings
 * (mirrors src/lib/brandingSettings.ts). A "route" forwards registrations to an
 * Emaan lead-webhook URL based on the webinar kind, gated by Zoom-only scope.
 *
 * These are the BROAD rules ("all webinars", "all internal", "all external").
 * Targeting a single specific webinar is done with the per-webinar
 * `emaanWebhookUrl` field on the webinar itself, not here.
 */

const EMAAN_FILE = path.join(process.cwd(), 'data', 'emaan-routes.json')

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

interface EmaanSettingsFile {
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
   * reminders, and a backfill would mail everyone at once. The registration
   * itself still updates through a tag-less endpoint, because that is keyed on
   * the contact and webinar rather than on the tag.
   *
   * Blank = updates are not sent. Registrations still are.
   */
  syncWebhookUrl?: string
}

async function readFile(): Promise<EmaanSettingsFile> {
  try {
    const raw = await fs.readFile(EMAAN_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as EmaanSettingsFile
    return {
      routes: Array.isArray(parsed?.routes) ? parsed.routes : [],
      syncWebhookUrl: typeof parsed?.syncWebhookUrl === 'string' ? parsed.syncWebhookUrl : '',
    }
  } catch {
    // No file yet (or unreadable) → nothing configured.
    return { routes: [], syncWebhookUrl: '' }
  }
}

export async function readEmaanRoutes(): Promise<EmaanGlobalRoute[]> {
  return (await readFile()).routes
}

/**
 * The update channel's URL. Falls back to the old EMAAN_WEBINAR_SYNC_URL env
 * var so an environment configured before this moved into the app keeps
 * working; the saved setting wins when both are present.
 */
export async function readEmaanSyncUrl(): Promise<string> {
  const stored = (await readFile()).syncWebhookUrl?.trim()
  if (stored) return stored
  return process.env.EMAAN_WEBINAR_SYNC_URL?.trim() || ''
}

export async function writeEmaanRoutes(routes: EmaanGlobalRoute[]): Promise<void> {
  const current = await readFile()
  await fs.mkdir(path.dirname(EMAAN_FILE), { recursive: true })
  await fs.writeFile(
    EMAAN_FILE,
    JSON.stringify({ routes, syncWebhookUrl: current.syncWebhookUrl ?? '' }, null, 2),
  )
}

export async function writeEmaanSyncUrl(syncWebhookUrl: string): Promise<void> {
  const current = await readFile()
  await fs.mkdir(path.dirname(EMAAN_FILE), { recursive: true })
  await fs.writeFile(
    EMAAN_FILE,
    JSON.stringify({ routes: current.routes, syncWebhookUrl: syncWebhookUrl.trim() }, null, 2),
  )
}
