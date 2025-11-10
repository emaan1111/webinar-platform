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
}

interface ChatMessagePayload {
  id: string;
  userName: string;
  message: string;
  videoTimestamp: number | null;
  isScripted: boolean;
  createdAt: string;
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
      chatMessages: {
        where: {
          isHidden: false,
          OR: [
            { isScripted: true },
            { isApproved: true },
          ],
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
      }
    : null;

  const { startTime: originalStartTime } = findScheduleStart(
    webinar.schedules,
    registrationMeta,
    scheduleParam ?? null
  );

  const now = new Date();
  const inferredVideoDuration =
    webinar.videoDuration ??
    (typeof webinar.duration === 'number' ? webinar.duration * 60 : null);
  const elapsedSecondsRaw = Math.floor(
    (now.getTime() - originalStartTime.getTime()) / 1000
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
      adjustedStartTime = new Date(now.getTime());
      gracePeriodApplied = `⏰ Grace period: ${minutesLate.toFixed(1)} mins late, starting from beginning`;
    } else if (minutesLate <= 15) {
      // 5-15 mins late: adjust start time so elapsed = 120 seconds (2 mins)
      adjustedStartTime = new Date(now.getTime() - 120000); // 120 seconds = 120000 ms
      gracePeriodApplied = `⏰ Grace period: ${minutesLate.toFixed(1)} mins late, starting from 2:00`;
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

  const chatMessages: ChatMessagePayload[] = webinar.chatMessages.map(
    (message) => {
      const displayName =
        message.user?.name ||
        (message.user?.email
          ? message.user.email.split('@')[0]
          : 'Guest');

      return {
        id: message.id,
        userName: displayName,
        message: message.message,
        videoTimestamp: message.videoTimestamp,
        isScripted: message.isScripted,
        createdAt: message.createdAt.toISOString(),
      };
    }
  );

  const offers = webinar.offers.map((offer) => ({
    id: offer.id,
    title: offer.title,
    description: offer.description ?? '',
    price: offer.price,
    ctaText: offer.ctaText,
    ctaUrl: offer.ctaUrl,
    videoTimestamp: offer.videoTimestamp,
    hideAfter: offer.hideAfter,
  }));

  // Load real reactions from database (time-synced, not fake)
  const reactions: ReactionPayload[] = webinar.reactions.map((reaction) => {
    const displayName =
      reaction.user?.name ||
      (reaction.user?.email
        ? reaction.user.email.split('@')[0]
        : 'Guest');

    return {
      id: reaction.id,
      type: reaction.type as ReactionType,
      userName: displayName,
      videoTimestamp: reaction.videoTimestamp,
    };
  });

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
      }}
      offers={offers}
      chatMessages={chatMessages}
      reactionEvents={reactions}
      viewer={
        registrationMeta
          ? {
              id: registrationMeta.id,
              name: registrationMeta.name,
              email: registrationMeta.email,
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
    />
  );
}
