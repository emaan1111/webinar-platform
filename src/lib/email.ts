// Email Service — Microsoft Graph API + AWS SES
// EMAIL_PROVIDER env var controls which sender is used: "microsoft" | "ses" | "ses_fallback"
//   "microsoft"     → Microsoft Graph only (default, current behaviour)
//   "ses"           → AWS SES only
//   "ses_fallback"  → Try Microsoft Graph first, fall back to SES

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

interface EmailOptions {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  fromName?: string  // Display name for sender (e.g. "Emaan Power")
}

// ─── Microsoft Graph ─────────────────────────────────────────────────────────

interface MicrosoftGraphTokenResponse {
  token_type: string
  expires_in: number
  access_token: string
}

let cachedAccessToken: string | null = null
let tokenExpiresAt: number = 0

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

  const response = await fetch(tokenUrl, {
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
  const { to, subject, htmlBody, fromName } = options
  const fromEmail = process.env.EMAIL_ADDRESS || 'support@emaanpower.com'
  const senderName = fromName || process.env.EMAIL_FROM_NAME || 'Emaan Power'

  try {
    console.log('📧 Sending email via Microsoft Graph API:', { to, subject, from: fromEmail, fromName: senderName })
    const accessToken = await getAccessToken()

    const apiUrl = `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`
    const emailMessage = {
      message: {
        subject,
        body: { contentType: 'HTML', content: htmlBody },
        toRecipients: [{ emailAddress: { address: to } }],
        from: { emailAddress: { address: fromEmail, name: senderName } }
      },
      saveToSentItems: true
    }

    const response = await fetch(apiUrl, {
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

async function sendViaSES(options: EmailOptions): Promise<boolean> {
  const { to, subject, htmlBody, textBody, fromName } = options
  const fromEmail = process.env.AWS_SES_FROM_EMAIL || process.env.EMAIL_ADDRESS || 'support@emaanpower.com'
  const senderName = fromName || process.env.EMAIL_FROM_NAME || 'Emaan Power'
  // Format: "Display Name <email@example.com>"
  const source = senderName ? `${senderName} <${fromEmail}>` : fromEmail

  try {
    console.log('📧 Sending email via AWS SES:', { to, subject, from: fromEmail, fromName: senderName })

    const client = getSESClient()
    const command = new SendEmailCommand({
      Source: source,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: htmlBody, Charset: 'UTF-8' },
          ...(textBody ? { Text: { Data: textBody, Charset: 'UTF-8' } } : {}),
        },
      },
    })

    await client.send(command)
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
