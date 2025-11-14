/**
 * Database optimization utilities
 * Helpers to reduce N+1 queries and improve Prisma performance
 */

import { prisma } from './prisma'

/**
 * Get webinars with optimized includes
 * Only fetches necessary fields
 */
export async function getWebinarsOptimized(userId: string) {
  return await prisma.webinar.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      slug: true,
      scheduledAt: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          registrations: true,
          schedules: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get single webinar with all relations
 * Uses efficient eager loading
 */
export async function getWebinarWithRelations(webinarId: string) {
  return await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: {
      _count: {
        select: {
          registrations: true,
          schedules: true,
          attendeeAnalytics: true,
        },
      },
    },
  })
}

/**
 * Get registrations with pagination
 */
export async function getRegistrationsPaginated(
  webinarId: string,
  page: number = 1,
  limit: number = 50
) {
  const skip = (page - 1) * limit

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where: { webinarId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        attended: true,
        timezone: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.registration.count({ where: { webinarId } }),
  ])

  return {
    registrations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Batch fetch webinar stats
 * Avoids multiple database round trips
 */
export async function getWebinarStats(webinarIds: string[]) {
  const [registrations, attendees, analytics] = await Promise.all([
    prisma.registration.groupBy({
      by: ['webinarId'],
      where: { webinarId: { in: webinarIds } },
      _count: true,
    }),
    prisma.registration.groupBy({
      by: ['webinarId'],
      where: { webinarId: { in: webinarIds }, attended: true },
      _count: true,
    }),
    prisma.attendeeAnalytics.groupBy({
      by: ['webinarId'],
      where: { webinarId: { in: webinarIds } },
      _sum: { watchTimeSeconds: true },
      _avg: { watchTimeSeconds: true },
    }),
  ])

  return webinarIds.map((id) => ({
    webinarId: id,
    totalRegistrations: registrations.find((r) => r.webinarId === id)?._count || 0,
    totalAttendees: attendees.find((a) => a.webinarId === id)?._count || 0,
    totalWatchTime: analytics.find((a) => a.webinarId === id)?._sum.watchTimeSeconds || 0,
    avgWatchTime: analytics.find((a) => a.webinarId === id)?._avg.watchTimeSeconds || 0,
  }))
}

/**
 * Dashboard stats with single query
 */
export async function getDashboardStatsOptimized(userId: string) {
  const [
    totalWebinars,
    totalRegistrations,
    totalAttendees,
    upcomingWebinars,
  ] = await Promise.all([
    prisma.webinar.count({ where: { userId } }),
    prisma.registration.count({
      where: { webinar: { userId } },
    }),
    prisma.registration.count({
      where: { webinar: { userId }, attended: true },
    }),
    prisma.webinar.count({
      where: {
        userId,
        scheduledAt: { gte: new Date() },
        status: 'SCHEDULED',
      },
    }),
  ])

  return {
    totalWebinars,
    totalRegistrations,
    totalAttendees,
    upcomingWebinars,
    attendanceRate:
      totalRegistrations > 0
        ? Math.round((totalAttendees / totalRegistrations) * 100)
        : 0,
  }
}

/**
 * Bulk update with transaction
 */
export async function bulkUpdateRegistrations(
  registrationIds: string[],
  data: { attended?: boolean; watchTimeSeconds?: number }
) {
  return await prisma.$transaction(
    registrationIds.map((id) =>
      prisma.registration.update({
        where: { id },
        data,
      })
    )
  )
}

/**
 * Clean old data (run periodically)
 */
export async function cleanOldData(daysOld: number = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await prisma.$transaction([
    // Delete old chat messages
    prisma.chatMessage.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    }),
    // Delete old sessions
    prisma.session.deleteMany({
      where: { expires: { lt: new Date() } },
    }),
  ])

  return {
    deletedMessages: result[0].count,
    deletedSessions: result[1].count,
  }
}
