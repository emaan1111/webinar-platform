import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/registration-pages/stats - Get statistics for all registration pages
export async function GET(request: NextRequest) {
  try {
    // Get all page visits for registration pages
    const pageVisits = await prisma.pageVisit.findMany({
      where: {
        pageType: 'registration',
      },
    });

    // Group statistics by pageId
    const statsMap = new Map<string, {
      views: number;
      uniqueVisitors: Set<string>;
      conversions: number;
      lastUsed: Date;
    }>();

    pageVisits.forEach((visit: any) => {
      if (!visit.pageId) return;

      if (!statsMap.has(visit.pageId)) {
        statsMap.set(visit.pageId, {
          views: 0,
          uniqueVisitors: new Set(),
          conversions: 0,
          lastUsed: visit.enteredAt,
        });
      }

      const stats = statsMap.get(visit.pageId)!;
      stats.views++;
      stats.uniqueVisitors.add(visit.visitorId);
      if (visit.registrationId) {
        stats.conversions++;
      }
      if (visit.enteredAt > stats.lastUsed) {
        stats.lastUsed = visit.enteredAt;
      }
    });

    // Convert to array format with conversion rate
    const statistics = Array.from(statsMap.entries()).map(([pageId, stats]) => {
      const conversionRate = stats.uniqueVisitors.size > 0 
        ? (stats.conversions / stats.uniqueVisitors.size) * 100 
        : 0;

      return {
        pageId,
        views: stats.views,
        uniqueVisitors: stats.uniqueVisitors.size,
        conversions: stats.conversions,
        conversionRate: Math.round(conversionRate * 10) / 10,
        lastUsed: stats.lastUsed,
      };
    });

    return NextResponse.json({ success: true, statistics });
  } catch (error) {
    console.error('Error fetching registration page stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
