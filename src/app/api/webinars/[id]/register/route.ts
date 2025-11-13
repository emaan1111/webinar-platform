import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVisitorTestGroup } from '@/lib/abTesting'
import { syncWebinarRegistrationToClickFunnels } from '@/lib/clickfunnels'
import { generateReferralCode } from '@/lib/referral'
import { sendFacebookRegistration, extractFacebookCookies } from '@/lib/facebook'

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

    // Send event to Facebook Conversions API (async - don't block response)
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
      value: 0, // You can set a value for conversion tracking
      currency: 'USD'
    }).catch(error => {
      console.error('⚠️ Facebook Conversions API failed (non-blocking):', error)
    })

    // Get webinar slug for building links
    const webinarData = await prisma.webinar.findUnique({
      where: { id },
      select: { slug: true }
    })

    // Build countdown page link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yoursite.com'
    const countdownLink = webinarData?.slug 
      ? `${baseUrl}/countdown/${webinarData.slug}?r=${registration.id}${scheduleId ? `&s=${scheduleId}` : ''}`
      : null

    // Build referral link
    const referralLink = webinarData?.slug
      ? `${baseUrl}/w/${webinarData.slug}?ref=${uniqueReferralCode}`
      : null

    // Format scheduled time in US/Eastern timezone (human readable)
    let formattedWebinarTime: string | null = null
    let webinarTimeEST: Date | null = null
    
    if (registration.scheduledStartTime) {
      try {
        // Human-readable format for webinar_time field
        const easternTime = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          dateStyle: 'full',
          timeStyle: 'long'
        }).format(new Date(registration.scheduledStartTime))
        formattedWebinarTime = easternTime
        
        // For webinar_time_est: send as Date object (will be converted to ISO by ClickFunnels)
        webinarTimeEST = new Date(registration.scheduledStartTime)
      } catch (error) {
        console.error('Failed to format time for EST:', error)
      }
    }

    // Log the generated links for debugging
    console.log('🔗 Generated ClickFunnels Links:', {
      countdownLink,
      referralLink,
      formattedWebinarTime,
      baseUrl,
      slug: webinarData?.slug,
      registrationId: registration.id,
      scheduleId,
      uniqueReferralCode
    })

    // Sync to ClickFunnels (async - don't block response)
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
      webinarTimeEST: webinarTimeEST,
    }).catch(error => {
      console.error('⚠️ ClickFunnels sync failed (non-blocking):', error)
    })

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
