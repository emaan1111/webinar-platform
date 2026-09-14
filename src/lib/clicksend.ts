import { prisma } from './prisma'

const CLICK_SEND_API_URL = 'https://rest.clicksend.com/v3/sms/send'
const CLICK_SEND_USERNAME = process.env.CLICK_SEND_USERNAME
const CLICK_SEND_API_KEY = process.env.CLICK_SEND_API_KEY
const CLICK_SEND_FROM = (process.env.CLICK_SEND_FROM || 'Webinar').trim()

interface ClickSendResponse {
  success: boolean
  error?: string
  response?: unknown
}

function getAuthHeader(): string {
  const creds = `${CLICK_SEND_USERNAME}:${CLICK_SEND_API_KEY}`
  return `Basic ${Buffer.from(creds).toString('base64')}`
}

function isConfigured(): boolean {
  return Boolean(CLICK_SEND_USERNAME && CLICK_SEND_API_KEY)
}

async function getSmsSettings() {
  try {
    return await prisma.sMSSettings.findUnique({
      where: { id: 'default' }
    })
  } catch (error) {
    console.error('Error loading SMS settings:', error)
    return null // Don't block on error
  }
}

/**
 * When an allowed-countries list is set, only numbers starting with one of
 * those dialing codes go out. Numbers stored without a recognizable country
 * code fail the check on purpose — better to skip than to text a country the
 * host is paying to avoid.
 */
function isCountryAllowed(to: string, allowedCodes: string[]): boolean {
  if (allowedCodes.length === 0) return true
  const digits = to.replace(/\D/g, '').replace(/^00/, '')
  return allowedCodes.some((code) => digits.startsWith(code))
}

/**
 * Send an SMS message via ClickSend
 * @param to - Phone number to send to
 * @param body - SMS message body
 * @param timezone - Optional timezone of recipient (for blocking check)
 */
export async function sendClickSendSMS(
  to: string, 
  body: string,
  timezone?: string | null
): Promise<ClickSendResponse> {
  if (!isConfigured()) {
    return {
      success: false,
      error: 'ClickSend credentials are not configured'
    }
  }

  if (!to) {
    return {
      success: false,
      error: 'Phone number is missing'
    }
  }

  const settings = await getSmsSettings()

  // Check if timezone is blocked
  if (timezone && settings?.blockedTimezones?.includes(timezone)) {
    console.log(`[SMS] Blocked: timezone ${timezone} is in blocked list`)
    return {
      success: false,
      error: `SMS blocked: timezone ${timezone} is in blocked list`
    }
  }

  // Check the allowed-countries list (empty list = every country)
  const allowedCodes = settings?.allowedCountryCodes || []
  if (!isCountryAllowed(to, allowedCodes)) {
    console.log(`[SMS] Blocked: ${to} is outside the allowed country codes (${allowedCodes.join(', ')})`)
    return {
      success: false,
      error: 'SMS blocked: destination is outside the allowed countries'
    }
  }

  if (!body.trim()) {
    return {
      success: false,
      error: 'SMS body is empty'
    }
  }

  try {
    const payload = {
      messages: [
        {
          source: 'sdk',
          from: CLICK_SEND_FROM,
          to,
          body
        }
      ]
    }

    const response = await fetch(CLICK_SEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader()
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      const details = responseData ? JSON.stringify(responseData) : response.statusText
      return {
        success: false,
        error: `ClickSend API error ${response.status}: ${details}`,
        response: responseData
      }
    }

    return {
      success: true,
      response: responseData
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to reach ClickSend: ${error.message}`
    }
  }
}
