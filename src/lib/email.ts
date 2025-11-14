// Microsoft Graph API Email Service
// Uses Microsoft Graph API to send emails (no phone verification needed!)

interface EmailOptions {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
}

interface MicrosoftGraphTokenResponse {
  token_type: string
  expires_in: number
  access_token: string
}

let cachedAccessToken: string | null = null
let tokenExpiresAt: number = 0

/**
 * Get Microsoft Graph API access token
 * Uses client credentials flow (app-only authentication)
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedAccessToken
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common'

  if (!clientId || !clientSecret) {
    throw new Error('Microsoft Graph API credentials not configured')
  }

  // Get token using client credentials flow
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  })

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
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
  } catch (error) {
    console.error('❌ Microsoft Graph API authentication failed:', error)
    throw error
  }
}

/**
 * Send email using Microsoft Graph API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, htmlBody, textBody } = options
  
  const fromEmail = process.env.EMAIL_ADDRESS || 'support@emaanpower.com'
  
  try {
    console.log('📧 Sending email via Microsoft Graph API:', {
      to,
      subject,
      from: fromEmail
    })

    const accessToken = await getAccessToken()
    
    // Microsoft Graph API endpoint
    const apiUrl = `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`
    
    const emailMessage = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlBody
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      },
      saveToSentItems: true
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    console.error('❌ Failed to send email:', error)
    return false
  }
}

/**
 * Send email with fallback to SMTP
 * Tries Microsoft Graph API first, falls back to SMTP if it fails
 */
export async function sendEmailWithFallback(options: EmailOptions): Promise<boolean> {
  // Try Microsoft Graph API first
  const graphSuccess = await sendEmail(options)
  
  if (graphSuccess) {
    return true
  }

  // TODO: Implement SMTP fallback if needed
  console.log('⚠️ Microsoft Graph API failed, SMTP fallback not implemented yet')
  return false
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(): boolean {
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
