import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EventRegistrationClient from './page-client';

interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
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
          roundJITTo15Minutes: true,
          maxSchedulesToShow: true,
          schedules: {
            where: { 
              isActive: true,
              // Include: justInTime/recurring schedules OR specific schedules in the future
              OR: [
                { scheduleType: { not: 'specific' } },
                { scheduleType: 'specific', scheduledAt: { gte: new Date() } }
              ]
            },
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

export default async function EventRegistrationPage({ params, searchParams }: PageProps) {
  const event = await getEventData(params.slug);

  if (!event) {
    notFound();
  }

  // Extract tracking parameters from URL
  const splitTestId = typeof searchParams.st === 'string' ? searchParams.st : undefined;
  const variantId = typeof searchParams.v === 'string' ? searchParams.v : undefined;
  const leadPageId = typeof searchParams.lp === 'string' ? searchParams.lp : undefined;

  // Transform data for client component (convert null to undefined for optional fields)
  const eventData = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description ?? undefined,
    hostName: event.host.name ?? undefined,
    zoomLink: event.zoomLink ?? undefined,
    requirePhone: event.requirePhone,
    smsReminderEnabled: event.smsReminderEnabled,
    maxAttendees: event.maxAttendees ?? undefined,
    bundleDescription: event.bundleDescription ?? undefined,
    webinarOptional: event.webinarOptional,
    thankYouPageUrl: event.thankYouPageUrl ?? undefined,
    thankYouTemplateId: event.thankYouTemplateId ?? undefined,
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
      slug: event.bundledWebinar.slug ?? '',
      description: event.bundledWebinar.description ?? undefined,
      duration: event.bundledWebinar.duration,
      roundJITTo15Minutes: event.bundledWebinar.roundJITTo15Minutes ?? true,
      maxSchedulesToShow: event.bundledWebinar.maxSchedulesToShow ?? 5,
      schedules: event.bundledWebinar.schedules.map((s: any) => ({
        id: s.id,
        scheduledAt: s.scheduledAt?.toISOString(),
        scheduleType: s.scheduleType,
        minutesFromReg: s.minutesFromReg ?? undefined,
        timezone: s.timezone ?? undefined,
        recurringPattern: s.recurringPattern ?? undefined,
      })),
    } : null,
  };

  return (
    <EventRegistrationClient 
      event={eventData} 
      splitTestId={splitTestId}
      variantId={variantId}
      leadPageId={leadPageId}
    />
  );
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
