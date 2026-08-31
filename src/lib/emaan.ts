/**
 * Emaan email-management integration.
 *
 * Pushes a webinar registrant into the Emaan app via its inbound "lead webhook"
 * (POST /webhooks/in/:token). The token URL is configured per-webinar in the
 * dashboard; on the Emaan side that token carries the target list, tag and
 * source, and adding the contact to the list / applying the tag automatically
 * fires Emaan's workflow triggers (list_added / tag_applied) — so the workflow
 * starts with no extra call from us.
 *
 * The webhook is lenient about payload shape: it extracts email / name / phone
 * from common field names and captures any other scalar field as a contact
 * custom field. We therefore send a flat JSON body.
 *
 * This is best-effort and never throws — a failed push must not break (or slow
 * down) the registration. Callers fire-and-forget.
 */

type CustomFieldValue = string | number | boolean | null | undefined

export interface EmaanLeadInput {
  /** Full emaan lead-webhook URL, e.g. https://emaan.example.com/webhooks/in/<token> */
  webhookUrl: string
  name?: string | null
  email: string
  phone?: string | null
  /** Extra fields recorded as contact custom fields on the emaan side. */
  customFields?: Record<string, CustomFieldValue>
}

/**
 * The webinar fields Emaan needs from one registration.
 *
 * Emaan turns these into a real WebinarRegistration row — the table its stats
 * report reads, and the one its reminder emails read to know WHICH session
 * they are about. Built in one place because there are several push sites
 * (registration, a host editing a Zoom session, the WebinarJam attendance
 * sync, the backfill script) and drift between them would show up as wrong
 * dates in someone's inbox.
 *
 * Two rules Emaan depends on:
 *   - webinar_time is ALWAYS `.toISOString()`, so it carries an explicit Z.
 *     Emaan refuses a bare wall clock rather than reading it in its own
 *     server timezone, which would shift an Australian session by ten hours.
 *   - webinar_timezone is the REGISTRANT's own IANA zone, used only to render
 *     their local time. It is never used to compute an instant.
 */
export interface WebinarPushInput {
  externalWebinarId: string
  webinarName: string
  scheduledStartTime: Date | null
  timezone?: string | null
  liveRoomUrl?: string | null
  /**
   * Replay link, most specific first. The per-attendee WebinarJam room ranks
   * LAST deliberately: a re-registration preserves the previous value, so after
   * someone switches session it can point at the recording of a session they no
   * longer attend. Anything a host typed for this session beats it.
   */
  replayRoomUrl?: string | null
  /** This session's own recording, pasted in by the host after it ran. */
  sessionReplayUrl?: string | null
  /** The webinar's evergreen recording, when every cohort watches the same one. */
  webinarReplayUrl?: string | null
  sessionType: 'zoom' | 'everwebinar'
  registeredAt?: Date | null
  /** Only sent by the attendance re-push; omitted entirely at registration. */
  attended?: boolean
  watchTimeMinutes?: number
}

export function buildWebinarPushFields(
  input: WebinarPushInput,
): Record<string, CustomFieldValue> {
  const fields: Record<string, CustomFieldValue> = {
    webinar_external_id: input.externalWebinarId,
    webinar_name: input.webinarName,
    webinar_time: input.scheduledStartTime?.toISOString(),
    webinar_timezone: input.timezone || undefined,
    webinar_join_url: input.liveRoomUrl || undefined,
    webinar_replay_url:
      input.sessionReplayUrl || input.webinarReplayUrl || input.replayRoomUrl || undefined,
    webinar_registered_at: input.registeredAt?.toISOString(),
    session_type: input.sessionType,
  }
  // Only include attendance when we actually have it. Sending attended=false
  // at registration would tell Emaan the person definitively did not show up
  // to a webinar that has not happened yet.
  if (input.attended !== undefined) {
    fields.webinar_attended_live = input.attended
    fields.webinar_minutes_live = input.watchTimeMinutes ?? 0
  }
  return fields
}

/**
 * Decide which Emaan webhook URLs a single registration should be pushed to.
 *
 * Combines the webinar's own per-webinar URL with any matching global routes,
 * each gated by Zoom-only scope, and de-duplicates by URL so the same endpoint
 * is never hit twice for one registration (which would double-fire workflows).
 */
export interface EmaanRouteLike {
  webhookUrl: string
  scope: string // "ALL" | "ZOOM_ONLY"
  appliesTo: string // "ALL" | "INTERNAL" | "EXTERNAL"
  isActive: boolean
}

export interface ResolveEmaanTargetsInput {
  kind: 'internal' | 'external'
  isZoom: boolean
  /** The webinar's own emaanWebhookUrl (per-webinar targeting). */
  perWebinarUrl?: string | null
  /** The webinar's own scope; defaults to ALL when absent (internal webinars). */
  perWebinarScope?: string | null
  /** Broad rules from settings (data/emaan-routes.json). */
  globalRoutes: EmaanRouteLike[]
}

/** A ZOOM_ONLY scope only allows Zoom-session registrations; anything else allows all. */
function scopeAllows(scope: string | null | undefined, isZoom: boolean): boolean {
  return scope === 'ZOOM_ONLY' ? isZoom : true
}

export function resolveEmaanTargets(input: ResolveEmaanTargetsInput): string[] {
  const { kind, isZoom, perWebinarUrl, perWebinarScope, globalRoutes } = input
  const urls = new Set<string>()

  if (perWebinarUrl && perWebinarUrl.trim() && scopeAllows(perWebinarScope, isZoom)) {
    urls.add(perWebinarUrl.trim())
  }

  for (const route of globalRoutes || []) {
    if (!route?.isActive || !route.webhookUrl || !route.webhookUrl.trim()) continue
    const appliesTo = (route.appliesTo || 'ALL').toUpperCase()
    const matchesKind =
      appliesTo === 'ALL' ||
      (appliesTo === 'INTERNAL' && kind === 'internal') ||
      (appliesTo === 'EXTERNAL' && kind === 'external')
    if (!matchesKind) continue
    if (!scopeAllows(route.scope, isZoom)) continue
    urls.add(route.webhookUrl.trim())
  }

  return [...urls]
}

/**
 * Re-push a registration whose details changed AFTER signup.
 *
 * Deliberately does NOT go through resolveEmaanTargets. Emaan's lead webhook
 * fires list_added and tag_applied on every post, new or not, and its workflow
 * enrolment has no re-entry guard — so re-posting to a tagged endpoint would
 * enrol the registrant into the registration workflow again, every time. This
 * targets EMAAN_WEBINAR_SYNC_URL instead, which must point at an Emaan webhook
 * endpoint configured with NO tags and NO lists. Emaan still updates the
 * registration row (that is keyed on the contact and webinar, not the tag), so
 * the session time, room link and attendance all land without side effects.
 *
 * No-ops when the env var is unset, so this is safe to deploy before the
 * endpoint exists.
 */
export async function pushRegistrationUpdateToEmaan(input: {
  email: string
  name?: string | null
  phone?: string | null
  webinar: WebinarPushInput
}): Promise<boolean> {
  const url = process.env.EMAAN_WEBINAR_SYNC_URL
  if (!url || !url.trim()) return false
  return pushLeadToEmaan({
    webhookUrl: url.trim(),
    email: input.email,
    name: input.name,
    phone: input.phone,
    customFields: buildWebinarPushFields(input.webinar),
  })
}

/**
 * Re-push many registrations, paced.
 *
 * Emaan rate-limits by IP and Webinar Play has a single egress IP, so a webinar
 * with a few thousand registrants would trip it if pushed flat out. Small
 * batches with a pause between them; individual failures are logged and skipped
 * rather than aborting the run, because a partial sync is better than none and
 * the whole thing is safely re-runnable.
 */
export async function pushRegistrationUpdatesToEmaan(
  rows: Array<{
    email: string
    name?: string | null
    phone?: string | null
    webinar: WebinarPushInput
  }>,
  opts: { batchSize?: number; pauseMs?: number } = {},
): Promise<{ pushed: number; failed: number }> {
  const url = process.env.EMAAN_WEBINAR_SYNC_URL
  if (!url || !url.trim() || rows.length === 0) return { pushed: 0, failed: 0 }

  const batchSize = opts.batchSize ?? 4
  const pauseMs = opts.pauseMs ?? 1000
  let pushed = 0
  let failed = 0

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map((row) =>
        pushRegistrationUpdateToEmaan(row).catch(() => false),
      ),
    )
    for (const ok of results) ok ? pushed++ : failed++
    if (i + batchSize < rows.length) {
      await new Promise((resolve) => setTimeout(resolve, pauseMs))
    }
  }

  return { pushed, failed }
}

/** Only allow the emaan lead-webhook shape; reject anything that isn't an http(s) URL. */
function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * POST a registrant to the configured emaan lead webhook.
 * Returns true on a 2xx response, false otherwise (including on error/timeout).
 */
export async function pushLeadToEmaan(input: EmaanLeadInput): Promise<boolean> {
  const { webhookUrl, name, email, phone, customFields } = input

  if (!webhookUrl || !isValidWebhookUrl(webhookUrl)) {
    console.warn('⚠️ Emaan push skipped: missing or invalid webhook URL')
    return false
  }
  if (!email) {
    console.warn('⚠️ Emaan push skipped: no email')
    return false
  }

  // Flat body: email/name/phone are extracted by emaan; the rest become custom
  // fields. Drop empty custom fields so we don't mint blank attributes.
  const body: Record<string, CustomFieldValue> = {
    email: email.toLowerCase(),
    name: name?.trim() || undefined,
    phone: phone?.trim() || undefined,
  }
  if (customFields) {
    for (const [key, value] of Object.entries(customFields)) {
      if (value === null || value === undefined) continue
      if (typeof value === 'string' && !value.trim()) continue
      body[key] = value
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`❌ Emaan push failed (${res.status}): ${text.slice(0, 200)}`)
      return false
    }

    console.log(`✅ Emaan push ok for ${email}`)
    return true
  } catch (err) {
    console.error('❌ Emaan push error:', err instanceof Error ? err.message : err)
    return false
  } finally {
    clearTimeout(timeout)
  }
}
