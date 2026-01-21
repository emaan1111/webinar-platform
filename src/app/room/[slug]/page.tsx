import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { calculateScheduleDateTime } from '@/lib/webinarSchedule';
import WebinarLiveClient from '@/app/w/[slug]/live/page-client';

type ReactionType = 'heart' | 'clap' | 'thumbsUp';

interface PageProps {
  params: { slug: string };
  searchParams: { r?: string; s?: string; tz?: string };
}

interface RegistrationMeta {
  id: string;
  name: string;
  email: string;
  registeredAt: Date;
  scheduleId: string | null;
  timezone: string | null;
  firstJoinedAt: Date | null;
  lastWatchedPosition: number;
}

interface ChatMessagePayload {
  id: string;
  userName: string;
  message: string;
  videoTimestamp: number | null;
  isScripted: boolean;
  createdAt: string;
  likes: number;
  likedBySystem: string | null;
}

interface ReactionPayload {
  id: string;
  type: ReactionType;
  userName: string;
  videoTimestamp: number;
}

const REACTION_TYPES: ReactionType[] = ['heart', 'clap', 'thumbsUp'];

export const dynamic = 'force-dynamic';

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function buildReactionTimeline(
  messages: ChatMessagePayload[],
  videoDuration: number | null
): ReactionPayload[] {
  const reactions: ReactionPayload[] = [];

  messages
    .filter(
      (message) =>
        message.isScripted && typeof message.videoTimestamp === 'number'
    )
    .forEach((message) => {
      const baseHash = hashString(message.id);
      const reactionCount = baseHash % 3 === 0 ? 2 : 1;

      for (let offset = 0; offset < reactionCount; offset += 1) {
        const type = REACTION_TYPES[(baseHash + offset) % REACTION_TYPES.length];
        const jitter = (baseHash % 6) + offset * 3;
        const timestamp = (message.videoTimestamp ?? 0) + jitter;

        if (videoDuration && timestamp > videoDuration) {
          continue;
        }

        reactions.push({
          id: `${message.id}-reaction-${offset}`,
          type,
          userName: message.userName,
          videoTimestamp: timestamp,
        });
      }
    });

  reactions.sort((a, b) => a.videoTimestamp - b.videoTimestamp);
  return reactions;
}

function findScheduleStart(
  schedules: Array<{
    id: string;
    scheduleType: string;
    scheduledAt: Date | null;
    minutesFromReg: number | null;
    timezone: string | null;
    recurringPattern: string | null;
  }>,
  registration: RegistrationMeta | null,
  explicitScheduleId?: string | null
) {
  const now = new Date();

  const matchFromExplicit = explicitScheduleId
    ? schedules.find((item) => item.id === explicitScheduleId) ?? null
    : null;

  const matchFromRegistration =
    registration?.scheduleId
      ? schedules.find((item) => item.id === registration.scheduleId) ?? null
      : null;

  const selectedSchedule = matchFromRegistration ?? matchFromExplicit ?? null;

  if (selectedSchedule) {
    return {
      schedule: selectedSchedule,
      startTime: calculateScheduleDateTime(selectedSchedule, registration, now),
    };
  }

  const scheduleCandidates = schedules.map((schedule) => ({
    schedule,
    start: calculateScheduleDateTime(schedule, registration, now),
  }));

  if (scheduleCandidates.length === 0) {
    return { schedule: null, startTime: now };
  }

  scheduleCandidates.sort((a, b) => a.start.getTime() - b.start.getTime());

  const upcoming = scheduleCandidates.find((entry) => entry.start >= now);
  const fallback = scheduleCandidates[0];

  return {
    schedule: upcoming?.schedule ?? fallback.schedule,
    startTime: upcoming?.start ?? fallback.start,
  };
}

function ReplayExpiredPage({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-white border border-gray-200 shadow-xl rounded-3xl p-10 text-center space-y-6">
        <div className="text-7xl" aria-hidden="true">
          😢
        </div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Sorry, replay expired
        </h1>
        <p className="text-gray-500">
          This replay window has closed, or the host opted not to publish a replay. You can register again to join the next live session.
        </p>
        <Link
          href={`/w/${slug}`}
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-indigo-300/50 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Register again
        </Link>
      </div>
    </div>
  );
}

export default async function WebinarRoomPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = params;
  const registrationId = searchParams.r;
  const scheduleParam = searchParams.s;

  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    include: {
      schedules: true,
      offers: {
        where: { isActive: true },
        orderBy: { videoTimestamp: 'asc' },
      },
      faqs: {
        orderBy: { sortOrder: 'asc' },
      },
      chatMessages: {
        where: {
          isHidden: false,
          // Fetch all non-hidden messages
          // Client will handle filtering approved vs current session
        },
        orderBy: [
          { videoTimestamp: 'asc' },
          { createdAt: 'asc' },
        ],
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          registration: {
            select: {
              name: true,
              email: true,
            },
          },
          // _count: {
          //   select: { likes: true }
          // },
          // likes: {
          //   where: { isSystem: true },
          //   select: { likerName: true }
          // }
        },
      },
      reactions: {
        where: { isHidden: false },
        orderBy: [
          { videoTimestamp: 'asc' },
          { createdAt: 'asc' },
        ],
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          registration: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!webinar) {
    notFound();
  }

  const registration = registrationId
    ? await prisma.registration.findUnique({
        where: {
          id: registrationId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          registeredAt: true,
          scheduleId: true,
          timezone: true,
          webinarId: true,
          scheduledStartTime: true, // NEW: Get the stored start time
          firstJoinedAt: true, // For grace period tracking (never changes)
          // @ts-ignore - Field exists in schema, TS server hasn't refreshed yet
          lastWatchedPosition: true, // For replay resume functionality
        },
      })
    : null;

  if (registration && registration.webinarId !== webinar.id) {
    notFound();
  }

  const registrationMeta: RegistrationMeta | null = registration
    ? {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        registeredAt: registration.registeredAt,
        scheduleId: registration.scheduleId,
        timezone: registration.timezone,
        firstJoinedAt: registration.firstJoinedAt,
        lastWatchedPosition: (registration as any).lastWatchedPosition || 0,
      }
    : null;

  // Debug logging for replay position
  if (registrationMeta) {
    console.log('📊 [Room] Registration lastWatchedPosition:', registrationMeta.lastWatchedPosition);
  }

  // Use stored scheduledStartTime if available, otherwise calculate it
  let originalStartTime: Date;
  if (registration && 'scheduledStartTime' in registration && registration.scheduledStartTime) {
    originalStartTime = new Date(registration.scheduledStartTime as Date);
    console.log('✅ [Room] Using stored scheduledStartTime:', originalStartTime.toISOString());
  } else {
    // Fallback for old registrations or guests
    const { startTime } = findScheduleStart(
      webinar.schedules,
      registrationMeta,
      scheduleParam ?? null
    );
    originalStartTime = startTime;
    console.log('⚠️ [Room] Fallback - calculating scheduledTime:', originalStartTime.toISOString());
  }

  const now = new Date();
  const inferredVideoDuration =
    webinar.videoDuration ??
    (typeof webinar.duration === 'number' ? webinar.duration * 60 : null);
  
  // Use firstJoinedAt for grace period calculation if available
  // This prevents the grace period from recalculating on page refresh
  const referenceTime = registrationMeta?.firstJoinedAt || now;
  const elapsedSecondsRaw = Math.floor(
    (referenceTime.getTime() - originalStartTime.getTime()) / 1000
  );
  
  // Grace period logic for late joiners
  // Adjust the startTime to make it appear the webinar started more recently
  // If 0-5 mins late: start from beginning (0 seconds elapsed)
  // If 5-15 mins late: start from 2 min mark (120 seconds elapsed)
  // If 15+ mins late: show actual elapsed time (late replay)
  let adjustedStartTime = new Date(originalStartTime);
  let gracePeriodApplied = '';
  
  if (elapsedSecondsRaw > 0) {
    const minutesLate = elapsedSecondsRaw / 60;
    
    if (minutesLate <= 5) {
      // 0-5 mins late: adjust start time so elapsed = 0
      adjustedStartTime = new Date(referenceTime.getTime());
      gracePeriodApplied = `⏰ Grace period: ${minutesLate.toFixed(1)} mins late, starting from beginning${registrationMeta?.firstJoinedAt ? ' (locked)' : ''}`;
    } else if (minutesLate <= 15) {
      // 5-15 mins late: adjust start time so elapsed = 120 seconds (2 mins)
      adjustedStartTime = new Date(referenceTime.getTime() - 120000); // 120 seconds = 120000 ms
      gracePeriodApplied = `⏰ Grace period: ${minutesLate.toFixed(1)} mins late, starting from 2:00${registrationMeta?.firstJoinedAt ? ' (locked)' : ''}`;
    } else {
      // 15+ mins late: use actual start time (no adjustment)
      gracePeriodApplied = `⏰ No grace period: ${minutesLate.toFixed(1)} mins late, showing actual time`;
    }
    
    console.log(gracePeriodApplied);
  }
  
  const initialElapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - adjustedStartTime.getTime()) / 1000)
  );

  // Check if webinar has ended and redirect to replay if enabled
  const webinarEndTime = new Date(
    adjustedStartTime.getTime() + webinar.duration * 60 * 1000
  );
  
  // Calculate replay expiration date (for countdown banner)
  let calculatedReplayExpiresAt: string | null = null;
  
  if (now > webinarEndTime && webinar.replayEnabled) {
    console.log('🎬 Webinar ended, showing replay on same page');
    
    // Priority: 1) Absolute expiration date, 2) Duration-based from scheduled start
    if (webinar.replayExpiresAt) {
      // Use absolute expiration if set (overrides everything)
      calculatedReplayExpiresAt = webinar.replayExpiresAt.toISOString();
      console.log('📅 Using absolute replay expiration:', calculatedReplayExpiresAt);
    } else if (webinar.replayDurationDays && originalStartTime) {
      // Calculate expiration based on scheduled start time + duration
      const expirationDate = new Date(
        originalStartTime.getTime() + webinar.replayDurationDays * 24 * 60 * 60 * 1000
      );
      calculatedReplayExpiresAt = expirationDate.toISOString();
      console.log(`📅 Calculated replay expiration: ${webinar.replayDurationDays} days from start = ${calculatedReplayExpiresAt}`);
    }
  } else if (now > webinarEndTime) {
    // Replay not enabled - show ended message
    console.log('⚠️ Webinar ended but replay is not enabled');
    // Let them see the room with ended state
  }

  const replayHasExpired = calculatedReplayExpiresAt
    ? new Date(calculatedReplayExpiresAt).getTime() <= now.getTime()
    : false;
  const showReplayExpiredPage =
    now > webinarEndTime &&
    (!webinar.replayEnabled || replayHasExpired);

  if (showReplayExpiredPage) {
    return <ReplayExpiredPage slug={slug} />;
  }

  const chatMessages: ChatMessagePayload[] = webinar.chatMessages.map(
    (message) => {
      // Prefer stored userName, then user info, then registration info
      const displayName =
        message.userName ||
        message.user?.name ||
        (message.user?.email
          ? message.user.email.split('@')[0]
          : null) ||
        message.registration?.name ||
        'Guest';

      // Safe access to _count and likes (Prisma types might need refresh)
      // const likeCount = (message as any)._count?.likes || 0;
      // const systemLike = (message as any).likes?.find((l: any) => l.likerName) // Just take first one for now
      
      return {
        id: message.id,
        userName: displayName,
        message: message.message,
        videoTimestamp: message.videoTimestamp,
        isScripted: message.isScripted,
        createdAt: message.createdAt.toISOString(),
        likes: 0, // likeCount,
        likedBySystem: null // systemLike ? systemLike.likerName : null
      };
    }
  );

  console.log(`📨 [Room] Loaded ${chatMessages.length} chat messages for webinar ${webinar.id}`);
  if (chatMessages.length > 0) {
    console.log(`📨 [Room] First message: "${chatMessages[0].message}" at ${chatMessages[0].videoTimestamp}s`);
    console.log(`📨 [Room] Last message: "${chatMessages[chatMessages.length - 1].message}" at ${chatMessages[chatMessages.length - 1].videoTimestamp}s`);
  }

  const offers = webinar.offers.map((offer) => ({
    id: offer.id,
    title: offer.title,
    description: offer.description ?? '',
    price: offer.price,
    ctaText: offer.ctaText,
    ctaUrl: offer.ctaUrl,
    videoTimestamp: offer.videoTimestamp,
    hideAfter: offer.hideAfter,
    countdownDuration: offer.countdownDuration,
    bulletPoints: offer.bulletPoints ?? [],
    originalPrice: offer.originalPrice,
    discountLabel: offer.discountLabel,
  }));

  // Load real reactions from database (time-synced, not fake)
  const reactions: ReactionPayload[] = webinar.reactions.map((reaction) => {
    // Prefer stored userName, then user info, then registration info
    const displayName =
      reaction.userName ||
      reaction.user?.name ||
      (reaction.user?.email
        ? reaction.user.email.split('@')[0]
        : null) ||
      reaction.registration?.name ||
      'Guest';

    return {
      id: reaction.id,
      type: reaction.type as ReactionType,
      userName: displayName,
      videoTimestamp: reaction.videoTimestamp,
    };
  });

  console.log(`🎉 [Room] Loaded ${reactions.length} reactions for webinar ${webinar.id}`);
  if (reactions.length > 0) {
    console.log(`🎉 [Room] First reaction: ${reactions[0].type} at ${reactions[0].videoTimestamp}s`);
    console.log(`🎉 [Room] Last reaction: ${reactions[reactions.length - 1].type} at ${reactions[reactions.length - 1].videoTimestamp}s`);
  }

  // Load FAQs from database
  const faqs = webinar.faqs.map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
  }));

  console.log(`❓ [Room] Loaded ${faqs.length} FAQs for webinar ${webinar.id}`);

  return (
    <WebinarLiveClient
      webinar={{
        id: webinar.id,
        title: webinar.title,
        description: webinar.description,
        videoUrl: webinar.videoUrl,
        vimeoVideoId: webinar.vimeoVideoId,
        videoDuration: inferredVideoDuration,
        hasChat: webinar.hasChat,
        hasOffers: webinar.hasOffers,
        hasReactions: webinar.hasReactions,
        showElapsedTime: webinar.showElapsedTime !== undefined ? webinar.showElapsedTime : true,
        replayEnabled: webinar.replayEnabled,
        replayExpiresAt: calculatedReplayExpiresAt,
      }}
      offers={offers}
      faqs={faqs}
      chatMessages={chatMessages}
      reactionEvents={reactions}
      viewer={
        registrationMeta
          ? {
              id: registrationMeta.id,
              name: registrationMeta.name,
              email: registrationMeta.email,
              lastWatchedPosition: registrationMeta.lastWatchedPosition,
            }
          : null
      }
      timing={{
        startTimeIso: adjustedStartTime.toISOString(),
        nowIso: now.toISOString(),
        initialElapsedSeconds:
          inferredVideoDuration != null
            ? Math.min(initialElapsedSeconds, inferredVideoDuration)
            : initialElapsedSeconds,
        videoDuration: inferredVideoDuration,
      }}
      isReplayMode={now > webinarEndTime && webinar.replayEnabled}
    />
  );
}
