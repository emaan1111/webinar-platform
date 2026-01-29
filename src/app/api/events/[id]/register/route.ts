import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReferralCode, buildReferralLink } from '@/lib/referral';
import { 
  tagClickFunnelsContact, 
  syncWebinarRegistrationToClickFunnels,
  scheduleDelayedClickFunnelsTag,
  applyReminderTagToContact
} from '@/lib/clickfunnels';

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
      studentName,
      studentAge,
      timezone,
      eventScheduleId,
      gdprConsent,
      privacyConsent,
      marketingConsent,
      // Step 2 - Webinar bundle fields (optional)
      webinarScheduleId,
      webinarScheduledTime, // The actual scheduled time (for recurring/generated slots)
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
            registrationTag: true,
            attendedTag: true,
            mostlyAttendedTag: true,
            partlyAttendedTag: true,
            missedTag: true,
            replayAttendedTag: true,
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

    // Check for existing registration to handle capacity logic correctly
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        email_eventScheduleId: {
          email,
          eventScheduleId,
        }
      }
    });

    // Check capacity - only enforce for NEW registrations
    if (!existingRegistration && schedule.maxAttendees && schedule._count.registrations >= schedule.maxAttendees) {
      return NextResponse.json({ error: 'This session is full' }, { status: 400 });
    }

    // Create webinar registration if bundle is selected and not skipped
    let webinarRegistrationId: string | null = null;
    
    if (event.bundledWebinarId && webinarScheduleId && !skipWebinar) {
      // Get the webinar schedule to get the scheduled time
      const webinarSchedule = await prisma.webinarSchedule.findUnique({
        where: { id: webinarScheduleId }
      });
      
      // Calculate scheduled start time
      // Priority: client-provided time > schedule's fixed time > JIT calculation
      let scheduledStartTime: Date | null = null;
      
      if (webinarScheduledTime) {
        // Client provided the exact time (works for all schedule types including recurring)
        scheduledStartTime = new Date(webinarScheduledTime);
      } else if (webinarSchedule) {
        if (webinarSchedule.scheduledAt) {
          // Fixed schedule - use the scheduled time
          scheduledStartTime = webinarSchedule.scheduledAt;
        } else if (webinarSchedule.scheduleType === 'justInTime' && webinarSchedule.minutesFromReg) {
          // JIT schedule - calculate time from now
          scheduledStartTime = new Date(Date.now() + webinarSchedule.minutesFromReg * 60 * 1000);
        }
      }
      
      // Register for the webinar
      const referralCode = generateReferralCode();
      const webinarRegistration = await prisma.registration.create({
        data: {
          webinarId: event.bundledWebinarId,
          scheduleId: webinarScheduleId,
          scheduledStartTime,
          name,
          email,
          phone,
          timezone,
          referralCode,
          gdprConsent: gdprConsent ?? false,
          privacyConsent: privacyConsent ?? false,
          marketingConsent: marketingConsent ?? false,
        }
      });
      webinarRegistrationId = webinarRegistration.id;

      // --- WEBINAR BUNDLE INTEGRATION SYNC ---
      // Sync to ClickFunnels immediately (apply tags, sync contact)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://emaanpowerclasses.com';
      const webSlug = event.bundledWebinar!.slug;
      const countdownLink = webSlug ? `${baseUrl}/countdown/${webSlug}?r=${webinarRegistration.id}` : null;
      const referralLink = webSlug ? buildReferralLink(webSlug, referralCode, baseUrl) : null;
      
      // Calculate formatted times
      let formattedWebinarTime: string | null = null;
      let formattedLocalWebinarTime: string | null = null;
      
      if (scheduledStartTime) {
        const formatInTimezone = (date: Date, tz: string) => {
          return new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            dateStyle: 'full',
            timeStyle: 'long'
          }).format(date);
        };
        
        try {
          formattedWebinarTime = formatInTimezone(scheduledStartTime, 'America/New_York');
          if (timezone) {
            const userTime = formatInTimezone(scheduledStartTime, timezone);
            formattedLocalWebinarTime = `${userTime} (${timezone})`;
          } else {
             formattedLocalWebinarTime = formattedWebinarTime;
          }
        } catch (e) {
          console.error('Time formatting error in bundle sync', e);
        }
      }

      // Sync Contact & Registration Tag
      try {
         await syncWebinarRegistrationToClickFunnels({
           name,
           email,
           phone,
           timezone,
           webinarId: event.bundledWebinarId,
           webinarTitle: event.bundledWebinar!.title,
           scheduledStartTime,
           countdownLink,
           referralLink,
           formattedWebinarTime,
           formattedWebinarTimeLocal: formattedLocalWebinarTime,
           customTags: {
             registrationTag: event.bundledWebinar!.registrationTag,
             attendedTag: event.bundledWebinar!.attendedTag,
             mostlyAttendedTag: event.bundledWebinar!.mostlyAttendedTag,
             partlyAttendedTag: event.bundledWebinar!.partlyAttendedTag,
             missedTag: event.bundledWebinar!.missedTag,
             replayAttendedTag: event.bundledWebinar!.replayAttendedTag,
           }
         });
      } catch (e) {
        console.error('Failed to sync bundled webinar registration to ClickFunnels', e);
      }

      // Apply Timing/Reminder Tags
      if (scheduledStartTime) {
        const now = new Date();
        const hoursUntilWebinar = (scheduledStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        const timingBuckets = [
          { tagName: '24HRREMINDER', offsetHours: 24 },
          { tagName: '2HRREMINDER', offsetHours: 2 },
          { tagName: '1HRREMINDER', offsetHours: 1 },
          { tagName: '15MINREMINDER', offsetHours: 0.25 },
          { tagName: 'WESTARTED', offsetHours: 0 }
        ] as const;

        const selectedBucket = timingBuckets.find(bucket => hoursUntilWebinar >= bucket.offsetHours) ?? timingBuckets[timingBuckets.length - 1];
        const scheduledFor = selectedBucket.offsetHours > 0
          ? new Date(scheduledStartTime.getTime() - selectedBucket.offsetHours * 60 * 60 * 1000)
          : now;

        if (selectedBucket.offsetHours > 0 && scheduledFor > now) {
          try {
            await scheduleDelayedClickFunnelsTag({
              registrationId: webinarRegistration.id,
              tagName: selectedBucket.tagName,
              scheduledFor
            });
            console.log(`⏰ [Bundle] Scheduled ${selectedBucket.tagName} for later`);
          } catch (err) {
             console.error(`Failed to schedule ${selectedBucket.tagName}:`, err);
          }
        } else {
          try {
            await applyReminderTagToContact(email, selectedBucket.tagName);
            console.log(`✅ [Bundle] Applied ${selectedBucket.tagName} immediately`);
          } catch (err) {
             console.error(`Failed to apply ${selectedBucket.tagName}:`, err);
          }
        }
      }
      // --- END WEBINAR BUNDLE INTEGRATION ---
      
      // Add a small delay to ensure ClickFunnels processes the first update/tagging
      // before we send the second one for the event itself.
      // This prevents potential race conditions or locking issues on the CF side.
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Determine referral code
    const eventReferralCode = existingRegistration?.referralCode || generateReferralCode();

    // Create or update event registration
    const registration = await prisma.eventRegistration.upsert({
      where: {
        email_eventScheduleId: {
          email,
          eventScheduleId,
        }
      },
      update: {
        name,
        phone,
        studentName: studentName || null,
        studentAge: studentAge ? parseInt(studentAge) : null,
        timezone,
        gdprConsent: gdprConsent ?? false,
        privacyConsent: privacyConsent ?? false,
        marketingConsent: marketingConsent ?? false,
        webinarRegistrationId, // Update this if they chose a webinar this time
        skippedWebinar: skipWebinar ?? false,
        referralCode: eventReferralCode, // Ensure code is present
        // Don't update split test info on re-registration usually, but maybe we should?
        // Let's update it to track the latest source
        splitTestId: splitTestId || null,
        splitTestVariantId: splitTestVariantId || null,
        updatedAt: new Date(),
      },
      create: {
        eventId: params.id,
        eventScheduleId,
        name,
        email,
        phone,
        studentName: studentName || null,
        studentAge: studentAge ? parseInt(studentAge) : null,
        timezone,
        gdprConsent: gdprConsent ?? false,
        privacyConsent: privacyConsent ?? false,
        marketingConsent: marketingConsent ?? false,
        webinarRegistrationId,
        skippedWebinar: skipWebinar ?? false,
        referralCode: eventReferralCode, 
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

    // --- EVENT SYNC TO CLICKFUNNELS ---
    // Sync the MAIN event registration to ClickFunnels (Time, Zoom Link, Tags)
    
    // 1. Calculate Event Timings
    let formattedEventTime: string | null = null;
    let formattedLocalEventTime: string | null = null;
    let eventAttendeeTimezoneLabel: string | null = null;
    
    if (schedule && schedule.startTime) {
      const formatInTimezone = (date: Date, tz: string) => {
        return new Intl.DateTimeFormat('en-US', {
           timeZone: tz,
           dateStyle: 'full',
           timeStyle: 'long'
        }).format(date);
      };

      try {
        formattedEventTime = formatInTimezone(schedule.startTime, 'America/New_York'); // Default System Time
        
        if (timezone) {
          const userTime = formatInTimezone(schedule.startTime, timezone);
          const [region, city] = timezone.split('/');
          const cityLabel = city?.replace(/_/g, ' ') || timezone;
          eventAttendeeTimezoneLabel = cityLabel;
          formattedLocalEventTime = `${userTime} (${cityLabel})`;
        } else {
           formattedLocalEventTime = formattedEventTime;
        }
      } catch (e) {
        console.error('Event time formatting error', e);
      }
    }

    // 2. Determine Zoom Link (Schedule override > Event default)
    const eventZoomLink = schedule.zoomLink || event.zoomLink;

    // 3. Sync to ClickFunnels
    try {
      console.log(`🚀 Syncing EVENT registration to ClickFunnels for ${email}`);
      await syncWebinarRegistrationToClickFunnels({
        name,
        email,
        phone,
        timezone,
        webinarId: event.id,          // Using Event ID
        webinarTitle: event.title,    // Using Event Title
        scheduledStartTime: schedule.startTime,
        // For events, we might not have a countdown link, or we use the event page itself
        countdownLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com'}/event/${event.slug}`, 
        formattedWebinarTime: formattedEventTime,
        formattedWebinarTimeLocal: formattedLocalEventTime,
        attendeeTimezoneLabel: eventAttendeeTimezoneLabel,
        zoomLink: eventZoomLink || undefined,
        isZoomSession: true, // Events are typically live Zoom sessions
        customTags: {
          registrationTag: event.registrationTag,
          // Events might not have these granular attendance tags yet, so we omit or pass null
          attendedTag: null,
          mostlyAttendedTag: null,
          partlyAttendedTag: null,
          missedTag: null,
          replayAttendedTag: null,
        }
      });
      console.log('✅ Event registration synced to ClickFunnels!');
    } catch (error) {
       console.error('Failed to sync event registration to ClickFunnels:', error);
    }

    // 4. Apply Event Reminder Tags (Same logic as webinars)
    // NOTE: This assumes you want standard reminder tags (24HRREMINDER etc) for events too.
    if (schedule && schedule.startTime) {
        const now = new Date();
        const hoursUntilEvent = (schedule.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        const timingBuckets = [
          { tagName: '24HRREMINDER', offsetHours: 24 },
          { tagName: '2HRREMINDER', offsetHours: 2 },
          { tagName: '1HRREMINDER', offsetHours: 1 },
          { tagName: '15MINREMINDER', offsetHours: 0.25 },
          { tagName: 'WESTARTED', offsetHours: 0 }
        ] as const;

        const selectedBucket = timingBuckets.find(bucket => hoursUntilEvent >= bucket.offsetHours) ?? timingBuckets[timingBuckets.length - 1];
        const scheduledFor = selectedBucket.offsetHours > 0
          ? new Date(schedule.startTime.getTime() - selectedBucket.offsetHours * 60 * 60 * 1000)
          : now;

        // Note: We use the REGISTRATION ID here to track the reminder job
        // But our scheduler might expect a specific table. 
        // For now, let's just apply immediate tags if relevant, or rely on the scheduler if it supports EventRegistration.
        // Checking `scheduleDelayedClickFunnelsTag`... it likely uses `webinar_reminders_sent` table which links to `registrationId`.
        // `EventRegistration` and `Registration` (Webinar) are different models.
        // `Registration` has `reminders`. `EventRegistration` does NOT have reminders relation yet in many schemas.
        // Let's check schema.prisma first before adding delayed reminders for events.
        
        // For now, let's just apply IMMEDIATE tags if the time is close.
        if (selectedBucket.offsetHours === 0 || (selectedBucket.offsetHours > 0 && scheduledFor <= now)) {
             try {
                await applyReminderTagToContact(email, selectedBucket.tagName);
                console.log(`✅ [Event] Applied ${selectedBucket.tagName} immediately`);
             } catch (err) {
                console.error(`Failed to apply event reminder tag ${selectedBucket.tagName}:`, err);
             }
        }
    }

    // 5. Schedule Event SMS Reminder (1 hour before, if enabled)
    if (event.smsReminderEnabled && schedule.startTime && phone) {
      const now = new Date();
      // 1 hour before
      const oneHourBefore = new Date(schedule.startTime.getTime() - 60 * 60 * 1000);
      
      if (oneHourBefore > now) {
         try {
           await prisma.eventReminderSent.create({
             data: {
               eventRegistrationId: registration.id,
               scheduledFor: oneHourBefore,
               channel: 'SMS',
               sentTo: phone,
               message: event.smsReminderBody || 'Reminder: Your event is starting in 1 hour!',
               status: 'PENDING'
             }
           });
           console.log(`📅 Scheduled Event SMS Reminder for ${email} at ${oneHourBefore.toISOString()}`);
         } catch (e) {
           console.error('Failed to schedule Event SMS:', e);
         }
      }
    }

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
