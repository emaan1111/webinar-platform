import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job to update leftAt timestamp for registrations after broadcast ends
 * Should run every 5-10 minutes
 * 
 * Logic:
 * - Find all registrations where attended = true and leftAt is null
 * - Check if the broadcast has ended (scheduledStartTime + duration has passed)
 * - Set leftAt to the broadcast end time (not current time)
 * - This ensures leftAt represents broadcast end, not when user disconnected
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n🕒 [Cron] Update Broadcast End Times - Starting...');

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
            duration: true
          }
        }
      }
    });

    console.log(`📋 Found ${registrationsToUpdate.length} registrations to check`);

    let updatedCount = 0;
    const updates: Array<{ id: string; broadcastEndTime: Date }> = [];

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
        updates.push({
          id: registration.id,
          broadcastEndTime
        });
      }
    }

    console.log(`✅ ${updates.length} registrations have broadcasts that ended`);

    // Batch update all registrations
    if (updates.length > 0) {
      for (const update of updates) {
        await prisma.registration.update({
          where: { id: update.id },
          data: { leftAt: update.broadcastEndTime }
        });
        updatedCount++;
      }

      console.log(`✅ Updated ${updatedCount} registration leftAt timestamps`);
    }

    // Also update any registrations with joinedAt but no scheduledStartTime
    // (legacy data or edge cases) - use current time
    const legacyUpdates = await prisma.registration.updateMany({
      where: {
        attended: true,
        leftAt: null,
        joinedAt: { not: null },
        OR: [
          { scheduledStartTime: null },
          { webinar: { duration: null } }
        ]
      },
      data: {
        leftAt: now
      }
    });

    if (legacyUpdates.count > 0) {
      console.log(`⚠️  Updated ${legacyUpdates.count} legacy registrations with current time`);
    }

    const totalUpdated = updatedCount + legacyUpdates.count;

    return NextResponse.json({
      success: true,
      message: `Updated ${totalUpdated} registration timestamps`,
      updated: totalUpdated,
      broadcastEnded: updatedCount,
      legacy: legacyUpdates.count,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating broadcast end times:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
