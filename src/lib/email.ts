// Email Service — Microsoft Graph API + AWS SES
// EMAIL_PROVIDER env var controls which sender is used: "microsoft" | "ses" | "ses_fallback"
//   "microsoft"     → Microsoft Graph only (default, current behaviour)
//   "ses"           → AWS SES only
//   "ses_fallback"  → Try Microsoft Graph first, fall back to SES

import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses'

interface EmailAttachment {
  filename: string
  content: string   // Base64-encoded content
  contentType: string
}

interface EmailOptions {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  fromName?: string  // Display name for sender (e.g. "Emaan Power")
  attachments?: EmailAttachment[]
  /**
   * RFC 8058 one-click unsubscribe URL. When set, the SES path adds
   * `List-Unsubscribe` + `List-Unsubscribe-Post` headers — Gmail/Yahoo require
   * them on subscription mail (reminders, follow-ups) and Postmaster flags the
   * whole domain as "Needs work" without them. Pass it for every registrant
   * email; the recipient decides what counts as a subscription.
   */
  unsubscribeUrl?: string
}

// ─── Microsoft Graph ─────────────────────────────────────────────────────────

interface MicrosoftGraphTokenResponse {
  token_type: string
  expires_in: number
  access_token: string
}

let cachedAccessToken: string | null = null
let tokenExpiresAt: number = 0

// Abort hung Microsoft Graph calls so a slow provider can't stall our request handlers.
const GRAPH_TIMEOUT_MS = 15_000

async function graphFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(GRAPH_TIMEOUT_MS) })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      console.error(`⏱️ Microsoft Graph request timed out after ${GRAPH_TIMEOUT_MS}ms: ${url}`)
    }
    throw error
  }
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedAccessToken
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common'

  if (!clientId || !clientSecret) {
    throw new Error('Microsoft Graph API credentials not configured')
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  })

  const response = await graphFetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get access token: ${response.status} ${error}`)
  }

  const data: MicrosoftGraphTokenResponse = await response.json()
  cachedAccessToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000
  return cachedAccessToken
}

async function sendViaMicrosoftGraph(options: EmailOptions): Promise<boolean> {
  const { to, subject, htmlBody, fromName, attachments, unsubscribeUrl } = options
  const fromEmail = process.env.EMAIL_ADDRESS || 'support@emaanpower.com'
  const senderName = fromName || process.env.EMAIL_FROM_NAME || 'Emaan Power'

  // Graph's internetMessageHeaders only accepts "x-"-prefixed headers, so
  // List-Unsubscribe cannot be set here. Production sends via SES; this warns
  // if EMAIL_PROVIDER is ever flipped back, since dropping the header silently
  // fails Gmail's one-click unsubscribe requirement for the whole domain.
  if (unsubscribeUrl) {
    console.warn(
      '⚠️ Microsoft Graph cannot set List-Unsubscribe — this subscription email will not be one-click compliant. Use EMAIL_PROVIDER=ses for bulk mail.'
    )
  }

  try {
    console.log('📧 Sending email via Microsoft Graph API:', { to, subject, from: fromEmail, fromName: senderName })
    const accessToken = await getAccessToken()

    const apiUrl = `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`
    const emailMessage: any = {
      message: {
        subject,
        body: { contentType: 'HTML', content: htmlBody },
        toRecipients: [{ emailAddress: { address: to } }],
        from: { emailAddress: { address: fromEmail, name: senderName } },
      },
      saveToSentItems: true
    }

    if (attachments && attachments.length > 0) {
      emailMessage.message.attachments = attachments.map((att) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.filename,
        contentType: att.contentType,
        contentBytes: att.content,
      }))
    }

    const response = await graphFetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailMessage)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Microsoft Graph API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return false
    }

    console.log('✅ Email sent successfully via Microsoft Graph API')
    return true
  } catch (error) {
    console.error('❌ Failed to send email via Microsoft Graph:', error)
    return false
  }
}

// ─── AWS SES ─────────────────────────────────────────────────────────────────

let sesClient: SESClient | null = null

function getSESClient(): SESClient {
  if (sesClient) return sesClient

  const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1'

  // If explicit keys are set, use them; otherwise the SDK uses the default
  // credential chain (env vars, IAM role, etc.)
  const credentials =
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined

  sesClient = new SESClient({ region, credentials })
  return sesClient
}

// ─── Raw MIME helpers ────────────────────────────────────────────────────────
//
// Everything goes out via SendRawEmail so we control the headers. SES's
// SendEmail (v1) cannot set List-Unsubscribe, which is the one header Gmail's
// bulk-sender rules require on subscription mail.

/** RFC 2047 encoded-word for header values that aren't printable ASCII. */
function encodeHeaderValue(value: string): string {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

/** Display name for a From: header — quoted when ASCII, encoded-word otherwise. */
function formatMailbox(name: string | undefined, email: string): string {
  const trimmed = name?.trim()
  if (!trimmed) return email
  if (/^[\x20-\x7e]*$/.test(trimmed)) {
    return `"${trimmed.replace(/["\\]/g, '')}" <${email}>`
  }
  return `${encodeHeaderValue(trimmed)} <${email}>`
}

/** Base64 body, wrapped at 76 chars as RFC 2045 requires (SES rejects >998-char lines). */
function base64Body(content: string | Buffer): string {
  const buf = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
  return buf.toString('base64').replace(/(.{76})/g, '$1\r\n')
}

function htmlToPlainText(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

interface RawMessageInput {
  from: string
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  attachments?: EmailAttachment[]
  unsubscribeUrl?: string
}

export function buildRawMessage(input: RawMessageInput): string {
  const { from, to, subject, htmlBody, textBody, attachments, unsubscribeUrl } = input
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const altBoundary = `----=_Alt_${stamp}`
  const mixedBoundary = `----=_Mixed_${stamp}`

  const headers: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeaderValue(subject)}`,
    'MIME-Version: 1.0',
  ]
  if (unsubscribeUrl) {
    headers.push(
      `List-Unsubscribe: <${unsubscribeUrl}>`,
      'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
    )
  }

  const alternative: string[] = [
    `--${altBoundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(textBody || htmlToPlainText(htmlBody)),
    `--${altBoundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(htmlBody),
    `--${altBoundary}--`,
  ]

  const lines: string[] = [...headers]
  if (attachments && attachments.length > 0) {
    lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`, '')
    lines.push(`--${mixedBoundary}`)
    lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`, '')
    lines.push(...alternative)
    for (const att of attachments) {
      lines.push(
        '',
        `--${mixedBoundary}`,
        `Content-Type: ${att.contentType}; name="${att.filename}"`,
        `Content-Disposition: attachment; filename="${att.filename}"`,
        'Content-Transfer-Encoding: base64',
        '',
        // Attachment content arrives already base64-encoded; just re-wrap it.
        att.content.replace(/\s+/g, '').replace(/(.{76})/g, '$1\r\n'),
      )
    }
    lines.push('', `--${mixedBoundary}--`)
  } else {
    lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`, '')
    lines.push(...alternative)
  }
  return lines.join('\r\n')
}

async function sendViaSES(options: EmailOptions): Promise<boolean> {
  const { to, subject, htmlBody, textBody, fromName, attachments, unsubscribeUrl } = options
  const fromEmail = process.env.AWS_SES_FROM_EMAIL || process.env.EMAIL_ADDRESS || 'support@emaanpower.com'
  const senderName = fromName || process.env.EMAIL_FROM_NAME || 'Emaan Power'
  // Optional: route bounces/complaints/opens to an SES configuration set's event
  // destinations (e.g. the one the emaan email app already consumes).
  const configurationSet = process.env.AWS_SES_CONFIGURATION_SET || undefined

  try {
    console.log('📧 Sending email via AWS SES:', { to, subject, from: fromEmail, fromName: senderName })

    const client = getSESClient()
    const raw = buildRawMessage({
      from: formatMailbox(senderName, fromEmail),
      to,
      subject,
      htmlBody,
      textBody,
      attachments,
      unsubscribeUrl,
    })
    await client.send(
      new SendRawEmailCommand({
        Source: fromEmail,
        Destinations: [to],
        RawMessage: { Data: new TextEncoder().encode(raw) },
        ...(configurationSet ? { ConfigurationSetName: configurationSet } : {}),
      })
    )
    console.log('✅ Email sent successfully via AWS SES')
    return true
  } catch (error) {
    console.error('❌ Failed to send email via AWS SES:', error)
    return false
  }
}

// ─── Public API (unchanged signatures) ───────────────────────────────────────

/**
 * Send email using the configured provider.
 *
 * EMAIL_PROVIDER values:
 *   "microsoft"     → Microsoft Graph only (default)
 *   "ses"           → AWS SES only
 *   "ses_fallback"  → Microsoft Graph first, then SES if it fails
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const provider = (process.env.EMAIL_PROVIDER || 'microsoft').toLowerCase()

  switch (provider) {
    case 'ses':
      return sendViaSES(options)

    case 'ses_fallback': {
      const graphOk = await sendViaMicrosoftGraph(options)
      if (graphOk) return true
      console.log('⚠️ Microsoft Graph failed, falling back to AWS SES…')
      return sendViaSES(options)
    }

    case 'microsoft':
    default:
      return sendViaMicrosoftGraph(options)
  }
}

/**
 * @deprecated Use sendEmail() — it now handles provider selection & fallback.
 */
export async function sendEmailWithFallback(options: EmailOptions): Promise<boolean> {
  return sendEmail(options)
}

/**
 * Validate email configuration for the active provider.
 */
export function validateEmailConfig(): boolean {
  const provider = (process.env.EMAIL_PROVIDER || 'microsoft').toLowerCase()

  if (provider === 'ses') {
    const fromEmail = process.env.AWS_SES_FROM_EMAIL || process.env.EMAIL_ADDRESS
    if (!fromEmail) {
      console.error('❌ AWS SES: AWS_SES_FROM_EMAIL or EMAIL_ADDRESS is required')
      return false
    }
    // Credentials are optional (IAM role fallback), so only warn
    if (!process.env.AWS_ACCESS_KEY_ID) {
      console.warn('⚠️ AWS_ACCESS_KEY_ID not set — relying on IAM role / instance credentials')
    }
    return true
  }

  // Microsoft Graph validation
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  const emailAddress = process.env.EMAIL_ADDRESS

  if (!clientId || !clientSecret || !emailAddress) {
    console.error('❌ Email configuration incomplete:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasEmailAddress: !!emailAddress
    })
    return false
  }

  return true
}
