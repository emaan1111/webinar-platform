import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVisitorTestGroup } from '@/lib/abTesting'

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
      timezone,
      gdprConsent,
      privacyConsent,
      marketingConsent,
      country
    } = body

    // Validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }

    if (!privacyConsent) {
      return NextResponse.json(
        { error: 'You must agree to the privacy policy' },
        { status: 400 }
      )
    }

    // Verify webinar exists and get A/B testing config
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: {
        id: true,
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

    // Check if already registered (by email)
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        webinarId: id,
        email: email.toLowerCase()
      }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this webinar' },
        { status: 400 }
      )
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        webinarId: id,
        scheduleId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        timezone,
        country,
        gdprConsent: gdprConsent || false,
        privacyConsent: privacyConsent || false,
        marketingConsent: marketingConsent || false,
        testGroup: testGroup, // Store test group for A/B testing
        registeredAt: new Date()
      }
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
          email: registration.email
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
