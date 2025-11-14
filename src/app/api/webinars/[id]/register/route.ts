import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVisitorTestGroup } from '@/lib/abTesting'
import { syncWebinarRegistrationToClickFunnels } from '@/lib/clickfunnels'
import { scheduleDelayedClickFunnelsTag } from '@/lib/clickfunnelsReminderTags'
import { generateReferralCode } from '@/lib/referral'
import { sendFacebookRegistration, extractFacebookCookies } from '@/lib/facebook'

const runInBackground = (label: string, task: () => Promise<unknown> | unknown) => {
  Promise.resolve()
    .then(task)
    .catch(error => {
      console.error(`⚠️ ${label} failed (non-blocking):`, error)
    })
}

// POST /api/webinars/[id]/register - Public registration endpoint
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const {
      name,
      email,
      phone,
      scheduleId,
      scheduledStartTime,
      timezone,
      gdprConsent,
      privacyConsent,
      marketingConsent,
      country,
      referralCode: referredByCode // The referral code of who referred them
    } = body

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (!privacyConsent) {
      return NextResponse.json(
        { error: 'You must agree to the privacy policy' },
        { status: 400 }
      )
    }

    console.log('📝 Registration API - Received scheduledStartTime:', scheduledStartTime)

    // Verify webinar exists and get A/B testing config
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        enableABTesting: true,
        trafficSplitPercent: true,
      }
    })

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    // Get test group if A/B testing is enabled
    let testGroup: string | null = null
    if (webinar.enableABTesting) {
      testGroup = await getVisitorTestGroup(webinar.id, webinar.trafficSplitPercent)
    }

    // Generate unique referral code for this registration
    let uniqueReferralCode = generateReferralCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure referral code is unique
    while (attempts < maxAttempts) {
      const existing = await prisma.registration.findUnique({
        where: { referralCode: uniqueReferralCode }
      });
      
      if (!existing) break;
      
      uniqueReferralCode = generateReferralCode();
      attempts++;
    }

    // Validate referral code if provided (who referred them)
    let referredBy: string | null = null;
    if (referredByCode) {
      const referrer = await prisma.registration.findUnique({
        where: { referralCode: referredByCode },
        select: { referralCode: true }
      });
      
      if (referrer) {
        referredBy = referrer.referralCode;
        console.log(`🎁 Referral tracked: New user referred by ${referredByCode}`);
      }
    }

    // Note: Allowing multiple registrations per email
    // Users can register multiple times for the same webinar with the same email
    
    // Create registration
    const registration = await prisma.registration.create({
      data: {
        webinarId: id,
        scheduleId,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        timezone,
        country,
        gdprConsent: gdprConsent || false,
        privacyConsent: privacyConsent || false,
        marketingConsent: marketingConsent || false,
        testGroup: testGroup, // Store test group for A/B testing
        referralCode: uniqueReferralCode, // Their unique code to share
        referredBy: referredBy, // Who referred them
        registeredAt: new Date()
      }
    })

    console.log('✅ Registration created with scheduledStartTime:', registration.scheduledStartTime)

    // Get IP address and user agent from request headers
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || undefined
    const cookieHeader = request.headers.get('cookie')
    const { fbc, fbp } = extractFacebookCookies(cookieHeader)

    // Get referer URL
    const referer = request.headers.get('referer') || undefined

    // Send event to Facebook Conversions API in the background
    runInBackground('Facebook Conversions API', () =>
      sendFacebookRegistration({
        email: registration.email,
        name: registration.name,
        phone: registration.phone || undefined,
        ipAddress,
        userAgent,
        fbc,
        fbp,
        eventSourceUrl: referer,
        webinarId: webinar.id,
        webinarTitle: webinar.title,
        registrationId: registration.id,
        value: 0,
        currency: 'USD'
      })
    )

    // Build countdown page link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yoursite.com'
    const countdownLink = webinar.slug 
      ? `${baseUrl}/countdown/${webinar.slug}?r=${registration.id}${scheduleId ? `&s=${scheduleId}` : ''}`
      : null

    // Build referral link
    const referralLink = webinar.slug
      ? `${baseUrl}/w/${webinar.slug}?ref=${uniqueReferralCode}`
      : null

    // Format scheduled time in US/Eastern timezone and attendee timezone
    const formatInTimezone = (date: Date, timeZone: string) => {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        dateStyle: 'full',
        timeStyle: 'long'
      }).format(date)
    }

    let formattedWebinarTime: string | null = null
    let formattedLocalWebinarTime: string | null = null
    let attendeeTimezoneLabel: string | null = null
    if (registration.scheduledStartTime) {
      try {
        formattedWebinarTime = formatInTimezone(new Date(registration.scheduledStartTime), 'America/New_York')
      } catch (error) {
        console.error('Failed to format time for EST:', error)
      }

      const attendeeTimezone = registration.timezone || timezone
      if (attendeeTimezone) {
        try {
          const userTime = formatInTimezone(new Date(registration.scheduledStartTime), attendeeTimezone)
          const [region, city] = attendeeTimezone.split('/')
          const cityLabel = city?.replace(/_/g, ' ') || attendeeTimezone
          const regionLabel = region?.replace(/_/g, ' ')
          attendeeTimezoneLabel = regionLabel ? `${cityLabel}, ${regionLabel}` : cityLabel
          formattedLocalWebinarTime = `${userTime}${attendeeTimezoneLabel ? ` (${attendeeTimezoneLabel})` : ''}`
        } catch (error) {
          console.error('Failed to format attendee timezone time:', error)
        }
      }
    }

    // Fallback to EST time when attendee timezone formatting fails
    if (!formattedLocalWebinarTime && formattedWebinarTime) {
      formattedLocalWebinarTime = formattedWebinarTime
    }

    // Log the generated links for debugging
    console.log('🔗 Generated ClickFunnels Links:', {
      countdownLink,
      referralLink,
      formattedWebinarTime,
      baseUrl,
      slug: webinar.slug,
      registrationId: registration.id,
      scheduleId,
      uniqueReferralCode
    })

    // Sync to ClickFunnels (background)
    runInBackground('ClickFunnels sync', () =>
      syncWebinarRegistrationToClickFunnels({
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        timezone: registration.timezone,
        country: registration.country,
        webinarId: webinar.id,
        webinarTitle: webinar.title,
        scheduledStartTime: registration.scheduledStartTime,
        countdownLink: countdownLink,
        referralLink: referralLink,
        formattedWebinarTime: formattedWebinarTime,
        formattedWebinarTimeLocal: formattedLocalWebinarTime,
        attendeeTimezoneLabel
      })
    )

    if (registration.scheduledStartTime) {
      const webinarStart = new Date(registration.scheduledStartTime)
      const now = new Date()
      const hoursUntilWebinar = (webinarStart.getTime() - now.getTime()) / (1000 * 60 * 60)

      const timingBuckets = [
        { tagName: '24HRREMINDER', offsetHours: 24 },
        { tagName: '2HRREMINDER', offsetHours: 2 },
        { tagName: '1HRREMINDER', offsetHours: 1 },
        { tagName: '15MINREMINDER', offsetHours: 0.25 },
        { tagName: 'WESTARTED', offsetHours: 0 }
      ] as const

      const selectedBucket = timingBuckets.find(bucket => hoursUntilWebinar >= bucket.offsetHours) ?? timingBuckets[timingBuckets.length - 1]
      const scheduledFor = selectedBucket.offsetHours > 0
        ? new Date(webinarStart.getTime() - selectedBucket.offsetHours * 60 * 60 * 1000)
        : now

      if (selectedBucket.offsetHours > 0 && scheduledFor > now) {
        runInBackground(`Schedule ClickFunnels ${selectedBucket.tagName} reminder tag`, () =>
          scheduleDelayedClickFunnelsTag({
            registrationId: registration.id,
            tagName: selectedBucket.tagName,
            scheduledFor
          })
        )
      } else {
        runInBackground(`Apply ClickFunnels reminder tag ${selectedBucket.tagName}`, async () => {
          const { applyReminderTagToContact } = await import('@/lib/clickfunnels')
          const success = await applyReminderTagToContact(registration.email, selectedBucket.tagName)
          if (success) {
            console.log(`✅ Reminder tag "${selectedBucket.tagName}" applied immediately`)
          } else {
            console.warn(`⚠️ Failed to apply reminder tag "${selectedBucket.tagName}" immediately`)
          }
        })
      }
    }

    // TODO: Send confirmation email
    // TODO: Send calendar invite
    // TODO: Add to email list if marketingConsent is true

    return NextResponse.json(
      { 
        registrationId: registration.id, // Include ID for A/B tracking
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          referralCode: registration.referralCode // Their unique referral code
        },
        message: 'Registration successful! Check your email for confirmation.' 
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        error: 'Registration failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
