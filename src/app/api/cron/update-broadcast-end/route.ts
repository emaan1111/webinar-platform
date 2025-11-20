import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job to finalize leftAt timestamp for registrations after broadcast ends
 * Should run every 5-10 minutes
 * 
 * Logic:
 * - Find all registrations where attended = true and leftAt is null
 * - Check if the broadcast has ended (scheduledStartTime + duration has passed)
 * - Set leftAt to their ACTUAL last session's leftAt time (not broadcast end time)
 * - This captures accurate "last seen" time while allowing rejoins during broadcast
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n🕒 [Cron] Finalize Last-Seen Times - Starting...');

    // Verify this is a cron job request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`⏰ Current time: ${now.toISOString()}`);

    // Find registrations that attended but don't have leftAt set
    const registrationsToUpdate = await prisma.registration.findMany({
      where: {
        attended: true,
        leftAt: null,
        scheduledStartTime: {
          not: null
        }
      },
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            duration: true,
            status: true
          }
        },
        sessions: {
          orderBy: {
            lastSeenAt: 'desc'
          },
          take: 1,
          select: {
            leftAt: true,
            lastSeenAt: true
          }
        }
      }
    });

    console.log(`📋 Found ${registrationsToUpdate.length} registrations to check`);

    let updatedCount = 0;

    for (const registration of registrationsToUpdate) {
      // Skip if no scheduled start time or duration
      if (!registration.scheduledStartTime || !registration.webinar.duration) {
        continue;
      }

      // Calculate broadcast end time
      const broadcastStartTime = new Date(registration.scheduledStartTime);
      const broadcastEndTime = new Date(
        broadcastStartTime.getTime() + (registration.webinar.duration * 60 * 1000)
      );

      // Only update if broadcast has ended
      if (now >= broadcastEndTime) {
        const lastSession = registration.sessions[0];
        
        // Use leftAt if available, otherwise fall back to lastSeenAt
        // This handles cases where user is still active when broadcast ends
        const finalLeftAt = lastSession?.leftAt || lastSession?.lastSeenAt;
        
        if (finalLeftAt) {
          await prisma.registration.update({
            where: { id: registration.id },
            data: { leftAt: finalLeftAt }
          });
          updatedCount++;
          const source = lastSession?.leftAt ? 'leftAt' : 'lastSeenAt';
          console.log(`  ✓ Updated registration ${registration.id} with ${source}: ${finalLeftAt.toISOString()}`);
        }
      }
    }

    // Handle replay sessions separately - set leftAt immediately since no broadcast end time
    const replayRegistrations = await prisma.registration.findMany({
      where: {
        attended: true,
        leftAt: null,
        watchedReplay: true,
        webinar: {
          status: 'ENDED'
        }
      },
      include: {
        sessions: {
          orderBy: {
            lastSeenAt: 'desc'
          },
          take: 1,
          select: {
            leftAt: true,
            lastSeenAt: true
          }
        }
      }
    });

    console.log(`📺 Found ${replayRegistrations.length} replay registrations to finalize`);

    let replayUpdatedCount = 0;

    for (const registration of replayRegistrations) {
      const lastSession = registration.sessions[0];
      const finalLeftAt = lastSession?.leftAt || lastSession?.lastSeenAt;
      
      if (finalLeftAt) {
        // For replays, only finalize if session ended more than 10 minutes ago
        // This gives them time to resume watching
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
        
        if (finalLeftAt < tenMinutesAgo) {
          await prisma.registration.update({
            where: { id: registration.id },
            data: { leftAt: finalLeftAt }
          });
          replayUpdatedCount++;
          console.log(`  ✓ Finalized replay registration ${registration.id}`);
        }
      }
    }

    console.log(`✅ Finalized ${updatedCount} live and ${replayUpdatedCount} replay registration last-seen times`);

    return NextResponse.json({
      success: true,
      message: `Finalized ${updatedCount + replayUpdatedCount} registration timestamps with accurate last-seen time`,
      updated: updatedCount,
      replayUpdated: replayUpdatedCount,
      total: updatedCount + replayUpdatedCount,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('❌ Error finalizing last-seen times:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
