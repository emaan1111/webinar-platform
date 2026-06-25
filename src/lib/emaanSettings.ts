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
}

export async function readEmaanRoutes(): Promise<EmaanGlobalRoute[]> {
  try {
    const raw = await fs.readFile(EMAAN_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as EmaanSettingsFile
    return Array.isArray(parsed?.routes) ? parsed.routes : []
  } catch {
    // No file yet (or unreadable) → no global routes configured.
    return []
  }
}

export async function writeEmaanRoutes(routes: EmaanGlobalRoute[]): Promise<void> {
  await fs.mkdir(path.dirname(EMAAN_FILE), { recursive: true })
  await fs.writeFile(EMAAN_FILE, JSON.stringify({ routes }, null, 2))
}
