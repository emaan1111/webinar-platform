/**
 * A/B Testing Tracking Library
 * 
 * Handles tracking of A/B test metrics including page views,
 * conversions, clicks, and analytics data.
 */

import { prisma } from '@/lib/prisma';
import { getVisitorId } from './abTesting';

type ElementType = 'registration' | 'schedule' | 'offer' | 'video';

interface TrackPageViewParams {
  webinarId: string;
  visitorId: string;
  testGroup: 'A' | 'B';
  elements: Array<{
    element: ElementType;
    variantShown: string;
  }>;
  country?: string;
  referrer?: string;
  device?: string;
}

interface TrackConversionParams {
  visitorId: string;
  webinarId: string;
  registrationId: string;
}

interface TrackClickParams {
  webinarId: string;
  visitorId: string;
  element: ElementType;
}

interface UpdateTimeOnPageParams {
  webinarId: string;
  visitorId: string;
  element: ElementType;
  timeOnPage: number;
}

/**
 * Track page view for A/B test
 * Creates metric records for each tested element
 */
export async function trackPageView(params: TrackPageViewParams): Promise<void> {
  const { webinarId, visitorId, testGroup, elements, country, referrer, device } = params;
  
  try {
    // Create a metric record for each element being tested
    await Promise.all(
      elements.map(({ element, variantShown }) =>
        prisma.aBTestMetric.create({
          data: {
            webinarId,
            visitorId,
            testGroup,
            element,
            variantShown,
            country: country || null,
            referrer: referrer || null,
            device: device || null,
            pageView: new Date(),
            converted: false,
            clicks: 0,
          },
        })
      )
    );
  } catch (error) {
    console.error('Error tracking page view:', error);
    // Don't throw - we don't want tracking failures to break the user experience
  }
}

/**
 * Track conversion (registration)
 * Updates all metric records for this visitor/webinar to mark as converted
 */
export async function trackConversion(params: TrackConversionParams): Promise<void> {
  const { visitorId, webinarId, registrationId } = params;
  
  try {
    await prisma.aBTestMetric.updateMany({
      where: {
        webinarId,
        visitorId,
        converted: false,
      },
      data: {
        converted: true,
        registrationId,
      },
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
}

/**
 * Track click on a specific element
 * Increments click counter for the most recent metric of this element
 */
export async function trackClick(params: TrackClickParams): Promise<void> {
  const { webinarId, visitorId, element } = params;
  
  try {
    // Find the most recent metric for this visitor/webinar/element
    const metric = await prisma.aBTestMetric.findFirst({
      where: {
        webinarId,
        visitorId,
        element,
      },
      orderBy: {
        pageView: 'desc',
      },
    });
    
    if (metric) {
      await prisma.aBTestMetric.update({
        where: { id: metric.id },
        data: {
          clicks: metric.clicks + 1,
        },
      });
    }
  } catch (error) {
    console.error('Error tracking click:', error);
  }
}

/**
 * Update time on page for a specific element
 */
export async function updateTimeOnPage(params: UpdateTimeOnPageParams): Promise<void> {
  const { webinarId, visitorId, element, timeOnPage } = params;
  
  try {
    // Find the most recent metric for this visitor/webinar/element
    const metric = await prisma.aBTestMetric.findFirst({
      where: {
        webinarId,
        visitorId,
        element,
      },
      orderBy: {
        pageView: 'desc',
      },
    });
    
    if (metric) {
      await prisma.aBTestMetric.update({
        where: { id: metric.id },
        data: {
          timeOnPage,
        },
      });
    }
  } catch (error) {
    console.error('Error updating time on page:', error);
  }
}

/**
 * Get device type from user agent
 */
export function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  
  return 'desktop';
}

/**
 * Track complete page view with request headers
 * Helper function that extracts device, referrer, etc. from request
 */
export async function trackPageViewFromRequest(
  webinarId: string,
  testGroup: 'A' | 'B',
  elements: Array<{ element: ElementType; variantShown: string }>,
  headers: Headers
): Promise<void> {
  const visitorId = await getVisitorId();
  const userAgent = headers.get('user-agent');
  const referrer = headers.get('referer') || headers.get('referrer');
  
  await trackPageView({
    webinarId,
    visitorId,
    testGroup,
    elements,
    device: getDeviceType(userAgent),
    referrer: referrer || undefined,
    country: undefined, // Could integrate with IP geolocation service
  });
}

/**
 * Track conversion from registration
 */
export async function trackConversionFromRequest(
  webinarId: string,
  registrationId: string
): Promise<void> {
  const visitorId = await getVisitorId();
  
  await trackConversion({
    visitorId,
    webinarId,
    registrationId,
  });
}

/**
 * Get A/B test results for a webinar
 * Aggregates metrics by element and test group
 */
export async function getABTestResults(webinarId: string) {
  try {
    const metrics = await prisma.aBTestMetric.groupBy({
      by: ['element', 'testGroup'],
      where: {
        webinarId,
      },
      _count: {
        id: true,
        converted: true,
      },
      _avg: {
        timeOnPage: true,
        clicks: true,
      },
    });
    
    // Transform into more usable format
    const results: Record<string, {
      groupA: { views: number; conversions: number; avgTime: number; avgClicks: number };
      groupB: { views: number; conversions: number; avgTime: number; avgClicks: number };
      conversionRateA: number;
      conversionRateB: number;
      winner: 'A' | 'B' | 'none';
    }> = {};
    
    // Initialize results for each element
    const elements = ['registration', 'schedule', 'offer', 'video'] as const;
    elements.forEach(element => {
      const groupAMetrics = metrics.find((m: any) => m.element === element && m.testGroup === 'A');
      const groupBMetrics = metrics.find((m: any) => m.element === element && m.testGroup === 'B');
      
      const viewsA = groupAMetrics?._count.id || 0;
      const viewsB = groupBMetrics?._count.id || 0;
      const conversionsA = groupAMetrics?._count.converted || 0;
      const conversionsB = groupBMetrics?._count.converted || 0;
      
      const rateA = viewsA > 0 ? (conversionsA / viewsA) * 100 : 0;
      const rateB = viewsB > 0 ? (conversionsB / viewsB) * 100 : 0;
      
      // Simple winner determination (could add statistical significance testing)
      let winner: 'A' | 'B' | 'none' = 'none';
      if (Math.abs(rateA - rateB) > 5) { // At least 5% difference
        winner = rateA > rateB ? 'A' : 'B';
      }
      
      results[element] = {
        groupA: {
          views: viewsA,
          conversions: conversionsA,
          avgTime: groupAMetrics?._avg.timeOnPage || 0,
          avgClicks: groupAMetrics?._avg.clicks || 0,
        },
        groupB: {
          views: viewsB,
          conversions: conversionsB,
          avgTime: groupBMetrics?._avg.timeOnPage || 0,
          avgClicks: groupBMetrics?._avg.clicks || 0,
        },
        conversionRateA: rateA,
        conversionRateB: rateB,
        winner,
      };
    });
    
    return results;
  } catch (error) {
    console.error('Error getting A/B test results:', error);
    throw error;
  }
}

/**
 * Reset A/B test metrics for a webinar
 * Use with caution - this deletes all test data
 */
export async function resetABTestMetrics(webinarId: string): Promise<void> {
  try {
    await prisma.aBTestMetric.deleteMany({
      where: {
        webinarId,
      },
    });
  } catch (error) {
    console.error('Error resetting A/B test metrics:', error);
    throw error;
  }
}
