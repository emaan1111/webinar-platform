import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/events/[id]/register - Register for an event
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      timezone,
      eventScheduleId,
      gdprConsent,
      privacyConsent,
      marketingConsent,
      // Step 2 - Webinar bundle fields (optional)
      webinarScheduleId,
      skipWebinar,
      // Landing Page / Split Test tracking
      splitTestId,
      splitTestVariantId,
    } = body;

    // Validate required fields
    if (!name || !email || !eventScheduleId) {
      return NextResponse.json(
        { error: 'Name, email, and event schedule are required' },
        { status: 400 }
      );
    }

    // Get event with bundled webinar info
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        bundledWebinar: {
          select: {
            id: true,
            title: true,
            slug: true,
            schedules: {
              where: { isActive: true },
              orderBy: { scheduledAt: 'asc' }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if schedule exists and is active
    const schedule = await prisma.eventSchedule.findUnique({
      where: { id: eventScheduleId },
      include: {
        _count: { select: { registrations: true } }
      }
    });

    if (!schedule || !schedule.isActive) {
      return NextResponse.json({ error: 'Invalid schedule' }, { status: 400 });
    }

    // Check capacity
    if (schedule.maxAttendees && schedule._count.registrations >= schedule.maxAttendees) {
      return NextResponse.json({ error: 'This session is full' }, { status: 400 });
    }

    // Check if already registered for this schedule
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        email_eventScheduleId: {
          email,
          eventScheduleId,
        }
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this session' },
        { status: 400 }
      );
    }

    // Create webinar registration if bundle is selected and not skipped
    let webinarRegistrationId: string | null = null;
    
    if (event.bundledWebinarId && webinarScheduleId && !skipWebinar) {
      // Register for the webinar
      const webinarRegistration = await prisma.registration.create({
        data: {
          webinarId: event.bundledWebinarId,
          scheduleId: webinarScheduleId,
          name,
          email,
          phone,
          timezone,
          gdprConsent: gdprConsent ?? false,
          privacyConsent: privacyConsent ?? false,
          marketingConsent: marketingConsent ?? false,
        }
      });
      webinarRegistrationId = webinarRegistration.id;
    }

    // Create event registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: params.id,
        eventScheduleId,
        name,
        email,
        phone,
        timezone,
        gdprConsent: gdprConsent ?? false,
        privacyConsent: privacyConsent ?? false,
        marketingConsent: marketingConsent ?? false,
        webinarRegistrationId,
        skippedWebinar: skipWebinar ?? false,
        splitTestId: splitTestId || null,
        splitTestVariantId: splitTestVariantId || null,
      },
      include: {
        event: {
          select: { title: true, slug: true }
        },
        eventSchedule: true,
      }
    });

    // Handle Split Test Tracking
    if (splitTestId && splitTestVariantId) {
        try {
            // Log Event
            await prisma.splitTestEvent.create({
                data: {
                    splitTestId,
                    variantId: splitTestVariantId,
                    type: 'EVENT_REGISTRATION', // Specialized type for this (Trial Class)
                    visitorId: null // or extract from cookie if available
                }
            });

            // Increment conversions on Variant/Test
            await prisma.splitTestVariant.update({
                where: { id: splitTestVariantId },
                data: { conversions: { increment: 1 } }
            });

            console.log(`✅ Logged Event Registration for Split Test ${splitTestId} variant ${splitTestVariantId}`);
        } catch (e) {
            console.error("Failed to log split test event", e);
        }
    }

    return NextResponse.json({
      success: true,
      registration,
      webinarRegistrationId,
      hasWebinarBundle: !!event.bundledWebinarId,
      webinarOptional: event.webinarOptional,
    });
  } catch (error) {
    console.error('Failed to register for event:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
