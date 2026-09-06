import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fromZonedTime } from 'date-fns-tz';
import { parseRegistrantFilters, registrantFilterWhere } from '@/lib/reports/registrantFilters';
import {
  addExternalSession,
  addExternalSignup,
  addInternalSession,
  addInternalSignup,
  finalizeCompareRow,
  isTestRegistrant,
  newCompareAccumulator,
  CompareAccumulator,
} from '@/lib/reports/compare';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/reports/compare
 *
 * One aggregate row per chosen webinar over the whole date range, so webinars
 * can be laid side by side. Same id convention as /api/reports: external
 * webinars arrive prefixed `ext_`. Same clocks too — registrations are
 * selected by registeredAt, the session-side counters by scheduledStartTime,
 * and the registrant country/timezone filter applies to every query.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const engagementMinutes = parseInt(searchParams.get('engagementMinutes') || '30');
    const timezone = searchParams.get('timezone') || 'UTC';
    const webinarIds = searchParams.get('webinarIds')?.split(',').filter(Boolean) || [];
    const registrantWhere = registrantFilterWhere(parseRegistrantFilters(searchParams));

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Date range required (from and to parameters)' },
        { status: 400 }
      );
    }
    if (webinarIds.length === 0) {
      return NextResponse.json(
        { error: 'webinarIds required: the webinars to compare' },
        { status: 400 }
      );
    }

    const internalIds = webinarIds.filter(id => !id.startsWith('ext_'));
    const externalIds = webinarIds
      .filter(id => id.startsWith('ext_'))
      .map(id => id.replace('ext_', ''));

    const fromDate = fromZonedTime(from + 'T00:00:00', timezone);
    const toDate = fromZonedTime(to + 'T23:59:59.999', timezone);

    const [internalWebinars, externalWebinars] = await Promise.all([
      internalIds.length > 0
        ? prisma.webinar.findMany({
            where: { id: { in: internalIds } },
            select: { id: true, internalName: true, title: true },
          })
        : Promise.resolve([]),
      externalIds.length > 0
        ? prisma.externalWebinar.findMany({
            where: { id: { in: externalIds } },
            select: { id: true, name: true, externalWebinarName: true },
          })
        : Promise.resolve([]),
    ]);

    // One accumulator per webinar, keyed by the client-facing id.
    const accs = new Map<string, CompareAccumulator>();
    for (const w of internalWebinars) {
      accs.set(w.id, newCompareAccumulator(w.id, w.internalName || w.title, false));
    }
    for (const w of externalWebinars) {
      accs.set(
        `ext_${w.id}`,
        newCompareAccumulator(`ext_${w.id}`, w.externalWebinarName || w.name, true)
      );
    }

    const foundInternalIds = internalWebinars.map(w => w.id);
    const foundExternalIds = externalWebinars.map(w => w.id);

    const internalInclude = {
      user: { select: { name: true, email: true } },
      webinar: { select: { duration: true } },
      sessions: true,
      sales: true,
    } as const;
    const externalInclude = {
      externalWebinar: { select: { webinarDurationMinutes: true } },
    } as const;

    const [internalSignups, internalSessions, externalSignups, externalSessions] =
      await Promise.all([
        foundInternalIds.length > 0
          ? prisma.registration.findMany({
              where: {
                registeredAt: { gte: fromDate, lte: toDate },
                webinarId: { in: foundInternalIds },
                ...registrantWhere,
              },
              include: internalInclude,
            })
          : Promise.resolve([]),
        foundInternalIds.length > 0
          ? prisma.registration.findMany({
              where: {
                scheduledStartTime: { gte: fromDate, lte: toDate },
                webinarId: { in: foundInternalIds },
                ...registrantWhere,
              },
              include: internalInclude,
            })
          : Promise.resolve([]),
        foundExternalIds.length > 0
          ? prisma.externalWebinarRegistration.findMany({
              where: {
                registeredAt: { gte: fromDate, lte: toDate },
                externalWebinarId: { in: foundExternalIds },
                ...registrantWhere,
              },
              include: externalInclude,
            })
          : Promise.resolve([]),
        foundExternalIds.length > 0
          ? prisma.externalWebinarRegistration.findMany({
              where: {
                scheduledStartTime: { gte: fromDate, lte: toDate },
                externalWebinarId: { in: foundExternalIds },
                ...registrantWhere,
              },
              include: externalInclude,
            })
          : Promise.resolve([]),
      ]);

    const nowMs = Date.now();

    for (const reg of internalSignups) {
      if (isTestRegistrant(reg.name || reg.user?.name, reg.email || reg.user?.email)) continue;
      const acc = accs.get(reg.webinarId);
      if (acc) addInternalSignup(acc, reg, engagementMinutes);
    }
    for (const reg of internalSessions) {
      if (isTestRegistrant(reg.name || reg.user?.name, reg.email || reg.user?.email)) continue;
      const acc = accs.get(reg.webinarId);
      if (acc) addInternalSession(acc, reg, engagementMinutes, nowMs);
    }
    for (const reg of externalSignups) {
      if (isTestRegistrant(reg.name, reg.email)) continue;
      const acc = accs.get(`ext_${reg.externalWebinarId}`);
      if (acc) addExternalSignup(acc, reg, engagementMinutes);
    }
    for (const reg of externalSessions) {
      if (isTestRegistrant(reg.name, reg.email)) continue;
      const acc = accs.get(`ext_${reg.externalWebinarId}`);
      if (acc) addExternalSession(acc, reg, engagementMinutes, nowMs);
    }

    // Columns come back in the order they were asked for; ids that matched no
    // webinar are dropped rather than shown as phantom zero columns.
    const rows = webinarIds
      .map(id => accs.get(id))
      .filter((acc): acc is CompareAccumulator => Boolean(acc))
      .map(finalizeCompareRow);

    return NextResponse.json(
      {
        success: true,
        webinars: rows,
        dateRange: { from, to },
        engagementMinutes,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error generating comparison:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
