import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import WebinarReplayClient from './page-client';
import Link from 'next/link';

interface PageProps {
  params: {
    slug: string;
  };
  searchParams: {
    email?: string;
    r?: string; // registration ID
  };
}

export default async function WebinarReplayPage({ params, searchParams }: PageProps) {
  const { slug } = params;
  const { email, r: registrationId } = searchParams;

  // Fetch webinar with all necessary data
  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    include: {
      offers: {
        orderBy: {
          videoTimestamp: 'asc',
        },
      },
      schedules: {
        orderBy: {
          scheduledAt: 'asc',
        },
      },
    },
  });

  if (!webinar) {
    notFound();
  }

  // Check if replay is enabled
  if (!webinar.replayEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-white mb-4">
            Replay Not Available
          </h1>
          <p className="text-gray-300 mb-6">
            Replay access is not enabled for this webinar.
          </p>
          <Link
            href={`/w/${webinar.slug || webinar.id}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Registration Page
          </Link>
        </div>
      </div>
    );
  }

  // Fetch viewer/registration data
  let viewer = null;
  let scheduledSession = null;
  
  if (registrationId) {
    viewer = await prisma.registration.findUnique({
      where: { id: registrationId },
    });
    
    // Fetch the user's scheduled session if they have one
    if (viewer?.scheduleId) {
      scheduledSession = await prisma.webinarSchedule.findUnique({
        where: { id: viewer.scheduleId },
      });
    }
  } else if (email) {
    viewer = await prisma.registration.findFirst({
      where: {
        webinarId: webinar.id,
        email: email.toLowerCase(),
      },
    });
    
    // Fetch the user's scheduled session if they have one
    if (viewer?.scheduleId) {
      scheduledSession = await prisma.webinarSchedule.findUnique({
        where: { id: viewer.scheduleId },
      });
    }
  }

  // Fetch chat messages (only approved ones for replay)
  const allChatMessages = await prisma.chatMessage.findMany({
    where: {
      webinarId: webinar.id,
      isApproved: true, // Only show approved messages in replay
    },
    orderBy: {
      videoTimestamp: 'asc',
    },
  });

  // Fetch reactions
  const reactionEvents = await prisma.reaction.findMany({
    where: {
      webinarId: webinar.id,
    },
    orderBy: {
      videoTimestamp: 'asc',
    },
  });

  // Calculate replay expiration
  // Priority: 1) Absolute expiration date, 2) Duration-based from user's session, 3) Duration from first schedule
  let replayExpiresAt: string | null = null;
  const now = new Date();

  if (webinar.replayExpiresAt) {
    // Use absolute expiration if set (overrides everything)
    replayExpiresAt = webinar.replayExpiresAt.toISOString();
  } else if (webinar.replayDurationDays && scheduledSession?.scheduledAt) {
    // Calculate expiration based on user's scheduled session + duration
    const sessionDate = new Date(scheduledSession.scheduledAt);
    const expirationDate = new Date(sessionDate.getTime() + webinar.replayDurationDays * 24 * 60 * 60 * 1000);
    replayExpiresAt = expirationDate.toISOString();
  } else if (webinar.replayDurationDays && webinar.schedules[0]?.scheduledAt) {
    // Fallback: Use first schedule + duration if no user session
    const firstSchedule = new Date(webinar.schedules[0].scheduledAt);
    const expirationDate = new Date(firstSchedule.getTime() + webinar.replayDurationDays * 24 * 60 * 60 * 1000);
    replayExpiresAt = expirationDate.toISOString();
  }

  // Check if replay has expired
  if (replayExpiresAt && new Date(replayExpiresAt) < now) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-white mb-4">
            Replay Expired
          </h1>
          <p className="text-gray-300 mb-2">
            This webinar replay is no longer available.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Replay access expired on {new Date(replayExpiresAt).toLocaleDateString()} at {new Date(replayExpiresAt).toLocaleTimeString()}
          </p>
          <Link
            href={`/w/${webinar.slug || webinar.id}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Check Upcoming Sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <WebinarReplayClient
      webinar={webinar}
      offers={webinar.offers}
      chatMessages={allChatMessages}
      reactionEvents={reactionEvents}
      viewer={viewer}
      replayExpiresAt={replayExpiresAt}
    />
  );
}
