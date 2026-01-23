import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EventRegistrationClient from './page-client';

interface PageProps {
  params: { slug: string };
}

async function getEventData(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      host: { select: { name: true } },
      schedules: {
        where: { 
          isActive: true,
          startTime: { gte: new Date() } // Only future schedules
        },
        orderBy: { startTime: 'asc' },
        include: {
          _count: { select: { registrations: true } }
        }
      },
      bundledWebinar: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          duration: true,
          schedules: {
            where: { isActive: true },
            orderBy: { scheduledAt: 'asc' }
          }
        }
      }
    }
  });

  if (!event || event.status === 'CANCELLED') {
    return null;
  }

  return event;
}

export default async function EventRegistrationPage({ params }: PageProps) {
  const event = await getEventData(params.slug);

  if (!event) {
    notFound();
  }

  // Transform data for client component
  const eventData = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    hostName: event.host.name,
    zoomLink: event.zoomLink,
    requirePhone: event.requirePhone,
    maxAttendees: event.maxAttendees,
    bundleDescription: event.bundleDescription,
    webinarOptional: event.webinarOptional,
    schedules: event.schedules.map((s: any) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString(),
      timezone: s.timezone,
      spotsLeft: s.maxAttendees ? s.maxAttendees - s._count.registrations : null,
      isFull: s.maxAttendees ? s._count.registrations >= s.maxAttendees : false,
    })),
    bundledWebinar: event.bundledWebinar ? {
      id: event.bundledWebinar.id,
      title: event.bundledWebinar.title,
      slug: event.bundledWebinar.slug,
      description: event.bundledWebinar.description,
      duration: event.bundledWebinar.duration,
      schedules: event.bundledWebinar.schedules.map((s: any) => ({
        id: s.id,
        scheduledAt: s.scheduledAt?.toISOString(),
        scheduleType: s.scheduleType,
        minutesFromReg: s.minutesFromReg,
        timezone: s.timezone,
      })),
    } : null,
  };

  return <EventRegistrationClient event={eventData} />;
}

export async function generateMetadata({ params }: PageProps) {
  const event = await getEventData(params.slug);

  if (!event) {
    return { title: 'Event Not Found' };
  }

  return {
    title: `Register - ${event.title}`,
    description: event.description || `Register for ${event.title}`,
  };
}
