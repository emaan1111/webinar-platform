import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendees/[registrationId]/profile - Get detailed attendee profile
export async function GET(
  request: NextRequest,
  { params }: { params: { registrationId: string } }
) {
  try {
    const { registrationId } = params;

    // Get registration with all related data
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            slug: true,
            videoDuration: true,
          },
        },
        sessions: {
          include: {
            engagements: {
              orderBy: { createdAt: 'asc' },
            },
            videoEvents: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        pageVisits: {
          orderBy: { enteredAt: 'asc' },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Get offer analytics
    const offerAnalytics = await prisma.offerAnalytics.findFirst({
      where: {
        registrationId,
        webinarId: registration.webinarId,
      },
    });

    // Calculate journey timeline
    const journey = [];

    // Registration
    journey.push({
      type: 'registration',
      timestamp: registration.registeredAt,
      title: 'Registered for Webinar',
      details: {
        name: registration.name,
        email: registration.email,
        timezone: registration.timezone,
        country: registration.country,
      },
    });

    // Page visits
    registration.pageVisits.forEach((visit) => {
      journey.push({
        type: 'page_visit',
        timestamp: visit.enteredAt,
        title: `Visited ${visit.pageType} Page`,
        details: {
          timeSpent: visit.timeSpent,
          device: visit.device,
          referrer: visit.referrer,
        },
      });
    });

    // Session join
    if (registration.joinedAt) {
      journey.push({
        type: 'joined',
        timestamp: registration.joinedAt,
        title: 'Joined Live Webinar',
        details: {
          device: registration.sessions[0]?.device,
          browser: registration.sessions[0]?.browser,
        },
      });
    }

    // Engagement events
    registration.sessions.forEach((session) => {
      session.engagements.forEach((engagement) => {
        let title = '';
        let icon = '';

        switch (engagement.eventType) {
          case 'chat':
            title = 'Sent Chat Message';
            icon = 'fa-comment';
            break;
          case 'reaction':
            title = 'Reacted';
            icon = 'fa-heart';
            break;
          case 'question':
            title = 'Asked Question';
            icon = 'fa-question-circle';
            break;
          case 'offer_view':
            title = 'Viewed Offer';
            icon = 'fa-eye';
            break;
          case 'offer_click':
            title = 'Clicked Offer';
            icon = 'fa-click';
            break;
        }

        journey.push({
          type: 'engagement',
          timestamp: engagement.createdAt,
          title,
          icon,
          details: {
            eventType: engagement.eventType,
            videoPosition: engagement.timestamp,
            data: engagement.eventData ? JSON.parse(engagement.eventData) : null,
          },
        });
      });

      // Video events
      session.videoEvents.forEach((event) => {
        if (event.eventType === 'ended') {
          journey.push({
            type: 'video_event',
            timestamp: event.createdAt,
            title: 'Watched to End',
            icon: 'fa-check-circle',
            details: {
              videoPosition: event.timestamp,
            },
          });
        }
      });
    });

    // Session left
    if (registration.leftAt) {
      journey.push({
        type: 'left',
        timestamp: registration.leftAt,
        title: 'Left Webinar',
        details: {
          totalWatchTime: registration.sessions.reduce(
            (sum, s) => sum + s.totalWatchTime,
            0
          ),
        },
      });
    }

    // Offer interactions
    if (offerAnalytics?.sawOffer) {
      journey.push({
        type: 'offer',
        timestamp: offerAnalytics.sawOfferAt,
        title: 'Saw Offer',
        icon: 'fa-gift',
        details: {
          offerTitle: offerAnalytics.offerTitle,
          videoPosition: offerAnalytics.videoPosition,
        },
      });
    }

    if (offerAnalytics?.clickedOffer) {
      journey.push({
        type: 'offer',
        timestamp: offerAnalytics.clickedOfferAt,
        title: 'Clicked Offer',
        icon: 'fa-mouse-pointer',
        details: {
          offerTitle: offerAnalytics.offerTitle,
          offerUrl: offerAnalytics.offerUrl,
        },
      });
    }

    if (offerAnalytics?.converted) {
      journey.push({
        type: 'offer',
        timestamp: offerAnalytics.convertedAt,
        title: 'Converted! 🎉',
        icon: 'fa-trophy',
        details: {
          offerTitle: offerAnalytics.offerTitle,
        },
      });
    }

    // Sort journey by timestamp
    journey.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate metrics
    const totalWatchTime = registration.sessions.reduce(
      (sum, s) => sum + s.totalWatchTime,
      0
    );

    const maxVideoPosition = registration.sessions.reduce(
      (max, s) => Math.max(max, s.videoPosition),
      0
    );

    const videoDuration = registration.webinar.videoDuration || 2700; // 45 min default
    const watchPercentage = (maxVideoPosition / videoDuration) * 100;

    const engagementCount = registration.sessions.reduce(
      (sum, s) => sum + s.engagements.length,
      0
    );

    const engagementScore = calculateEngagementScore({
      attended: registration.attended,
      watchTime: totalWatchTime,
      videoDuration,
      engagements: engagementCount,
      sawOffer: !!offerAnalytics?.sawOffer,
      clickedOffer: !!offerAnalytics?.clickedOffer,
      completed: registration.sessions.some((s) => s.completed),
    });

    return NextResponse.json({
      success: true,
      profile: {
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          phone: registration.phone,
          timezone: registration.timezone,
          country: registration.country,
          registeredAt: registration.registeredAt,
        },
        webinar: registration.webinar,
        metrics: {
          attended: registration.attended,
          totalWatchTime,
          maxVideoPosition,
          watchPercentage: Math.round(watchPercentage * 10) / 10,
          engagementCount,
          engagementScore: Math.round(engagementScore),
          completed: registration.sessions.some((s) => s.completed),
        },
        offer: offerAnalytics
          ? {
              sawOffer: offerAnalytics.sawOffer,
              clickedOffer: offerAnalytics.clickedOffer,
              converted: offerAnalytics.converted,
              offerTitle: offerAnalytics.offerTitle,
            }
          : null,
        journey,
      },
    });
  } catch (error) {
    console.error('Attendee profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendee profile' },
      { status: 500 }
    );
  }
}

function calculateEngagementScore(data: {
  attended: boolean;
  watchTime: number;
  videoDuration: number;
  engagements: number;
  sawOffer: boolean;
  clickedOffer: boolean;
  completed: boolean;
}): number {
  let score = 0;

  // Attended: 20 points
  if (data.attended) score += 20;

  // Watch time: up to 30 points
  const watchPercentage = (data.watchTime / data.videoDuration) * 100;
  score += Math.min(30, (watchPercentage / 100) * 30);

  // Engagement: up to 25 points (5 points per engagement, max 25)
  score += Math.min(25, data.engagements * 5);

  // Saw offer: 10 points
  if (data.sawOffer) score += 10;

  // Clicked offer: 10 points
  if (data.clickedOffer) score += 10;

  // Completed: 5 points
  if (data.completed) score += 5;

  return score;
}
