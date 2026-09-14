/**
 * Facebook Conversions API Integration
 * 
 * This utility sends server-side events to Facebook for tracking webinar registrations.
 * Server-side tracking is more reliable than browser-based pixels as it's not affected
 * by ad blockers or browser restrictions.
 * 
 * Setup Instructions:
 * 1. Go to Facebook Events Manager: https://business.facebook.com/events_manager2
 * 2. Select your pixel
 * 3. Go to Settings > Conversions API
 * 4. Generate an access token
 * 5. Add FB_PIXEL_ID and FB_ACCESS_TOKEN to your .env file
 */

import crypto from 'crypto'
const bizSdk = require('facebook-nodejs-business-sdk')

// Facebook SDK Setup
const ServerEvent = bizSdk.ServerEvent
const EventRequest = bizSdk.EventRequest
const UserData = bizSdk.UserData
const CustomData = bizSdk.CustomData
const Content = bizSdk.Content

const pixelId = process.env.FB_PIXEL_ID
const accessToken = process.env.FB_ACCESS_TOKEN
const testEventCode = process.env.FB_TEST_EVENT_CODE

// Meta blocks events without event_source_url, so never let it go out empty
// even if NEXT_PUBLIC_APP_URL is missing from the environment.
const DEFAULT_EVENT_SOURCE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com/'

// Initialize the Facebook API
if (accessToken && pixelId) {
  bizSdk.FacebookAdsApi.init(accessToken)
}

/**
 * Hash user data for privacy (required by Facebook)
 */
function hashData(data: string | null | undefined): string | undefined {
  if (!data) return undefined
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex')
}

/**
 * Normalize phone number (remove spaces, dashes, etc.)
 */
function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  // Remove all non-digit characters except + at the start
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Meta requires client_ip_address and client_user_agent to be sent together;
 * an IP on its own gets the event flagged. The WebinarJam sync only has an IP
 * (no browser context), so in that case send neither.
 */
function pairIpWithUserAgent(data: FacebookEventData): {
  ipAddress?: string
  userAgent?: string
} {
  const ipAddress =
    data.ipAddress && data.ipAddress !== 'unknown' ? data.ipAddress : undefined
  if (!ipAddress || !data.userAgent) return {}
  return { ipAddress, userAgent: data.userAgent }
}

export interface FacebookEventData {
  email: string
  name?: string
  phone?: string
  ipAddress?: string
  userAgent?: string
  fbc?: string // Facebook click ID from cookie
  fbp?: string // Facebook browser ID from cookie
  eventSourceUrl?: string
  
  // Custom event data
  webinarId?: string
  webinarTitle?: string
  registrationId?: string
  value?: number // For conversion value tracking
  currency?: string
}

/**
 * Send a registration event to Facebook Conversions API
 */
export async function sendFacebookRegistration(data: FacebookEventData): Promise<boolean> {
  // Check if Facebook integration is configured
  if (!pixelId || !accessToken) {
    console.warn('⚠️ Facebook Conversions API not configured. Skipping event.')
    return false
  }

  try {
    // Split name into first and last if provided
    let firstName: string | undefined
    let lastName: string | undefined
    if (data.name) {
      const nameParts = data.name.trim().split(' ')
      firstName = nameParts[0]
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined
    }

    const { ipAddress, userAgent } = pairIpWithUserAgent(data)

    // Create user data with hashed PII
    const userData = new UserData()
      .setEmails([hashData(data.email)])
      .setPhones(data.phone ? [hashData(normalizePhone(data.phone))] : undefined)
      .setFirstNames(firstName ? [hashData(firstName)] : undefined)
      .setLastNames(lastName ? [hashData(lastName)] : undefined)
      .setClientIpAddress(ipAddress)
      .setClientUserAgent(userAgent)
      .setFbc(data.fbc) // Facebook click ID from _fbc cookie
      .setFbp(data.fbp) // Facebook browser ID from _fbp cookie

    // Create custom data for the event
    const customData = new CustomData()
      .setCurrency(data.currency || 'USD')
      .setValue(data.value || 0)

    // Add custom properties
    if (data.webinarId) {
      customData.setCustomProperties({
        webinar_id: data.webinarId,
        webinar_title: data.webinarTitle || 'Unknown',
        registration_id: data.registrationId || 'Unknown'
      })
    }

    // Create the server event
    const serverEvent = new ServerEvent()
      .setEventName('CompleteRegistration') // Standard Facebook event
      .setEventTime(Math.floor(Date.now() / 1000))
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(data.eventSourceUrl || DEFAULT_EVENT_SOURCE_URL)
      .setActionSource('website')

    // Create event request
    const eventsData = [serverEvent]
    const eventRequest = new EventRequest(accessToken, pixelId)
      .setEvents(eventsData)

    // Add test event code if in development/testing
    if (testEventCode) {
      eventRequest.setTestEventCode(testEventCode)
    }

    // Send the event
    const response = await eventRequest.execute()
    
    console.log('✅ Facebook Conversions API event sent successfully')
    console.log('   Event ID:', serverEvent.event_id)
    console.log('   Events received:', response.events_received)
    console.log('   FBTRACE ID:', response.fbtrace_id)
    
    if (testEventCode) {
      console.log('   🧪 Test Event - Check Facebook Events Manager')
    }

    return true
  } catch (error: any) {
    console.error('❌ Facebook Conversions API error:', error.message)
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2))
    }
    return false
  }
}

/**
 * Send a custom event to Facebook Conversions API
 */
export async function sendFacebookCustomEvent(
  eventName: string,
  data: FacebookEventData
): Promise<boolean> {
  if (!pixelId || !accessToken) {
    console.warn('⚠️ Facebook Conversions API not configured. Skipping event.')
    return false
  }

  try {
    // Similar to registration event but with custom event name
    let firstName: string | undefined
    let lastName: string | undefined
    if (data.name) {
      const nameParts = data.name.trim().split(' ')
      firstName = nameParts[0]
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined
    }

    const { ipAddress, userAgent } = pairIpWithUserAgent(data)

    const userData = new UserData()
      .setEmails([hashData(data.email)])
      .setPhones(data.phone ? [hashData(normalizePhone(data.phone))] : undefined)
      .setFirstNames(firstName ? [hashData(firstName)] : undefined)
      .setLastNames(lastName ? [hashData(lastName)] : undefined)
      .setClientIpAddress(ipAddress)
      .setClientUserAgent(userAgent)
      .setFbc(data.fbc)
      .setFbp(data.fbp)

    const customData = new CustomData()
      .setCurrency(data.currency || 'USD')
      .setValue(data.value || 0)

    if (data.webinarId) {
      customData.setCustomProperties({
        webinar_id: data.webinarId,
        webinar_title: data.webinarTitle || 'Unknown',
      })
    }

    const serverEvent = new ServerEvent()
      .setEventName(eventName)
      .setEventTime(Math.floor(Date.now() / 1000))
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(data.eventSourceUrl || DEFAULT_EVENT_SOURCE_URL)
      .setActionSource('website')

    const eventsData = [serverEvent]
    const eventRequest = new EventRequest(accessToken, pixelId)
      .setEvents(eventsData)

    if (testEventCode) {
      eventRequest.setTestEventCode(testEventCode)
    }

    const response = await eventRequest.execute()
    
    console.log(`✅ Facebook custom event "${eventName}" sent successfully`)
    console.log('   Events received:', response.events_received)

    return true
  } catch (error: any) {
    console.error(`❌ Facebook custom event "${eventName}" error:`, error.message)
    return false
  }
}

/**
 * Utility to extract Facebook cookies from request headers
 */
export function extractFacebookCookies(cookieHeader: string | null): {
  fbc?: string
  fbp?: string
} {
  if (!cookieHeader) return {}

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  return {
    fbc: cookies._fbc,
    fbp: cookies._fbp
  }
}
