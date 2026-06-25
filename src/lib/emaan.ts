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
