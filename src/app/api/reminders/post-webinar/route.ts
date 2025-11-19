import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { sendClickSendSMS } from '@/lib/clicksend';

// POST /api/reminders/post-webinar - Send SMS to attendees who watched up to a certain point
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      webinarId,
      watchedMinimum, // minimum minutes watched (or null if using percentage)
      watchedPercentage, // minimum percentage watched (or null if using minutes)
      message,
      sendTiming, // 'immediate' or 'scheduled'
      scheduledDays // number of days from now (only if sendTiming = 'scheduled')
    } = body;

    // Validate inputs
    if (!webinarId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get webinar details
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
      select: {
        id: true,
        title: true,
        duration: true
      }
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    // Get all registrations with their watch position
    const registrations = await prisma.registration.findMany({
      where: {
        webinarId,
        phone: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        phone: true,
        lastWatchedPosition: true
      }
    });

    // Filter registrations based on watch criteria
    const eligibleRegistrations = registrations.filter((reg: typeof registrations[number]) => {
      const watchedSeconds = reg.lastWatchedPosition || 0;
      const watchedMinutes = watchedSeconds / 60;

      if (watchedMinimum !== null) {
        // Filter by minimum minutes
        return watchedMinutes >= watchedMinimum;
      } else if (watchedPercentage !== null && webinar.duration) {
        // Filter by minimum percentage
        const percentageWatched = (watchedSeconds / (webinar.duration * 60)) * 100;
        return percentageWatched >= watchedPercentage;
      }

      return false;
    });

    if (eligibleRegistrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible attendees found',
        scheduled: 0,
        sent: 0
      });
    }

    // Calculate send time
    const sendAt = sendTiming === 'immediate'
      ? new Date()
      : new Date(Date.now() + scheduledDays * 24 * 60 * 60 * 1000);

    // Create reminder records
    const reminders = [];
    for (const registration of eligibleRegistrations) {
      // Personalize message
      const personalizedMessage = message
        .replace('{name}', registration.name || 'there')
        .replace('{webinar_title}', webinar.title)
        .replace('{offer_link}', `https://yoursite.com/offer/${webinarId}`); // Replace with actual offer link

      const reminder = await prisma.webinarReminderSent.create({
        data: {
          registrationId: registration.id,
          phone: registration.phone!,
          message: personalizedMessage,
          sendAt,
          status: sendTiming === 'immediate' ? 'PENDING' : 'SCHEDULED',
          type: 'post_webinar'
        }
      });

      reminders.push(reminder);

      // If immediate, send now
      if (sendTiming === 'immediate') {
        try {
          await sendClickSendSMS(registration.phone!, personalizedMessage);

          // Update status to SENT
          await prisma.webinarReminderSent.update({
            where: { id: reminder.id },
            data: {
              status: 'SENT',
              sentAt: new Date()
            }
          });
        } catch (error) {
          console.error(`Failed to send SMS to ${registration.phone}:`, error);

          // Update status to FAILED
          await prisma.webinarReminderSent.update({
            where: { id: reminder.id },
            data: {
              status: 'FAILED',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }
    }

    const response = {
      success: true,
      message: sendTiming === 'immediate'
        ? `Sent ${reminders.length} SMS reminders`
        : `Scheduled ${reminders.length} SMS reminders for ${sendAt.toLocaleDateString()}`,
      [sendTiming === 'immediate' ? 'sent' : 'scheduled']: reminders.length,
      eligibleAttendees: eligibleRegistrations.length,
      sendAt: sendAt.toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Post-webinar reminder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
