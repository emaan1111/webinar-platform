import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/reports/filter-options
 *
 * The distinct countries and timezones registrants have on file, across both
 * internal and external registrations. Feeds the include/exclude filter on the
 * reports pages, so the options offered are exactly the values the filter will
 * match against (filtering is an exact match on the stored string).
 *
 * Also reports whether any live Zoom session exists at all, so the Zoom
 * include/exclude control is only offered where it would do something.
 */
export async function GET() {
  try {
    const [regCountries, regTimezones, extCountries, extTimezones, zoomSessionCount, liveZoomCount] = await Promise.all([
      prisma.registration.findMany({
        where: { country: { not: null } },
        distinct: ['country'],
        select: { country: true },
      }),
      prisma.registration.findMany({
        where: { timezone: { not: null } },
        distinct: ['timezone'],
        select: { timezone: true },
      }),
      prisma.externalWebinarRegistration.findMany({
        where: { country: { not: null } },
        distinct: ['country'],
        select: { country: true },
      }),
      prisma.externalWebinarRegistration.findMany({
        where: { timezone: { not: null } },
        distinct: ['timezone'],
        select: { timezone: true },
      }),
      // An external webinar's own live Zoom (liveZoomEnabled + liveZoomAt) has
      // no ZoomSession row behind it, so both sources have to be checked -
      // same union loadZoomSessionSlots() filters on.
      prisma.zoomSession.count({ where: { isActive: true } }),
      prisma.externalWebinar.count({
        where: { liveZoomEnabled: true, liveZoomAt: { not: null } },
      }),
    ]);

    const collect = (values: (string | null)[]) =>
      Array.from(new Set(values.map(v => (v || '').trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      );

    return NextResponse.json(
      {
        success: true,
        countries: collect([
          ...regCountries.map(r => r.country),
          ...extCountries.map(r => r.country),
        ]),
        timezones: collect([
          ...regTimezones.map(r => r.timezone),
          ...extTimezones.map(r => r.timezone),
        ]),
        hasZoomSessions: zoomSessionCount + liveZoomCount > 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching report filter options:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
