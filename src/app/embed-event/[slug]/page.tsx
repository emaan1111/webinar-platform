import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EmbedEventRegistrationForm from './EmbedEventRegistrationForm';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function EmbedEventPage({ params }: PageProps) {
  const { slug } = params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      host: { select: { name: true } },
      schedules: {
        where: {
          isActive: true,
          startTime: { gte: new Date() },
        },
        orderBy: { startTime: 'asc' },
        include: {
          _count: { select: { registrations: true } },
        },
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
              OR: [
                { scheduleType: { not: 'specific' } },
                { scheduleType: 'specific', scheduledAt: { gte: new Date() } },
              ],
            },
            orderBy: { scheduledAt: 'asc' },
          },
        },
      },
    },
  });

  if (!event || event.status === 'CANCELLED') {
    notFound();
  }

  // Transform data for client component
  const eventData = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description ?? undefined,
    hostName: event.host.name ?? undefined,
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
    bundledWebinar: event.bundledWebinar
      ? {
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
        }
      : null,
  };

  return <EmbedEventRegistrationForm event={JSON.parse(JSON.stringify(eventData))} />;
}
