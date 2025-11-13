/**
 * A/B Test Results API
 * 
 * GET /api/ab-test/results/[webinarId]
 * Returns aggregated A/B test results including:
 * - Overall statistics
 * - Per-element metrics (registration, schedule, offer, video)
 * - Statistical significance calculations
 * - Winner determination
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getABTestResults } from '@/lib/abTracking';

interface RouteParams {
  params: {
    webinarId: string;
  };
}

/**
 * Calculate statistical significance using Chi-square test
 * Returns p-value (lower = more significant)
 * p < 0.05 is generally considered statistically significant
 */
function calculatePValue(
  conversionsA: number,
  viewsA: number,
  conversionsB: number,
  viewsB: number
): number {
  // Avoid division by zero
  if (viewsA === 0 || viewsB === 0) return 1;
  
  const nonConversionsA = viewsA - conversionsA;
  const nonConversionsB = viewsB - conversionsB;
  
  const totalConversions = conversionsA + conversionsB;
  const totalNonConversions = nonConversionsA + nonConversionsB;
  const totalA = viewsA;
  const totalB = viewsB;
  const total = totalA + totalB;
  
  // Avoid division by zero
  if (total === 0) return 1;
  
  // Calculate expected values
  const expectedConversionsA = (totalA * totalConversions) / total;
  const expectedConversionsB = (totalB * totalConversions) / total;
  const expectedNonConversionsA = (totalA * totalNonConversions) / total;
  const expectedNonConversionsB = (totalB * totalNonConversions) / total;
  
  // Avoid division by zero in chi-square calculation
  if (
    expectedConversionsA === 0 ||
    expectedConversionsB === 0 ||
    expectedNonConversionsA === 0 ||
    expectedNonConversionsB === 0
  ) {
    return 1;
  }
  
  // Calculate chi-square statistic
  const chiSquare =
    Math.pow(conversionsA - expectedConversionsA, 2) / expectedConversionsA +
    Math.pow(conversionsB - expectedConversionsB, 2) / expectedConversionsB +
    Math.pow(nonConversionsA - expectedNonConversionsA, 2) / expectedNonConversionsA +
    Math.pow(nonConversionsB - expectedNonConversionsB, 2) / expectedNonConversionsB;
  
  // Simplified p-value calculation (degrees of freedom = 1)
  // More accurate would use chi-square distribution table
  // This is an approximation for quick significance testing
  if (chiSquare > 10.83) return 0.001; // 99.9% confidence
  if (chiSquare > 7.88) return 0.005; // 99.5% confidence
  if (chiSquare > 6.63) return 0.01; // 99% confidence
  if (chiSquare > 3.84) return 0.05; // 95% confidence
  if (chiSquare > 2.71) return 0.10; // 90% confidence
  
  return 0.5; // Not significant
}

/**
 * Calculate confidence interval for conversion rate
 * Returns [lower, upper] bounds as percentages
 */
function calculateConfidenceInterval(
  conversions: number,
  views: number,
  confidence: number = 0.95
): [number, number] {
  if (views === 0) return [0, 0];
  
  const rate = conversions / views;
  
  // Z-score for 95% confidence
  const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
  
  // Standard error
  const se = Math.sqrt((rate * (1 - rate)) / views);
  
  // Margin of error
  const margin = z * se;
  
  const lower = Math.max(0, (rate - margin) * 100);
  const upper = Math.min(100, (rate + margin) * 100);
  
  return [lower, upper];
}

/**
 * Determine minimum sample size for reliable results
 * Based on expected conversion rate and desired confidence
 */
function getMinimumSampleSize(
  baselineRate: number,
  minimumDetectableEffect: number = 0.1 // 10% relative change
): number {
  // Simplified calculation
  // For more accuracy, use proper power analysis formulas
  const z = 1.96; // 95% confidence
  const power = 0.8; // 80% power
  
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);
  const pAvg = (p1 + p2) / 2;
  
  const n = (2 * Math.pow(z, 2) * pAvg * (1 - pAvg)) / Math.pow(p2 - p1, 2);
  
  return Math.ceil(n);
}

/**
 * GET /api/ab-test/results/[webinarId]
 * Returns A/B test results with statistical analysis
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { webinarId } = params;

    // Verify webinar exists and belongs to user
    const webinar = await prisma.webinar.findFirst({
      where: {
        id: webinarId,
        hostId: (session.user as any).id,
      },
      select: {
        id: true,
        title: true,
        enableABTesting: true,
        trafficSplitPercent: true,
        testRegistrationPage: true,
        regPageAId: true,
        regPageBId: true,
        testSchedule: true,
        scheduleAIds: true,
        scheduleBIds: true,
        testOffer: true,
        offerAId: true,
        offerBId: true,
        testVideo: true,
        videoAId: true,
        videoBId: true,
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    if (!webinar.enableABTesting) {
      return NextResponse.json(
        { error: 'A/B testing is not enabled for this webinar' },
        { status: 400 }
      );
    }

    // Get aggregated results from tracking library
    const rawResults = await getABTestResults(webinarId);

    // Get total metrics across all elements
    const totalMetrics = await prisma.aBTestMetric.groupBy({
      by: ['testGroup'],
      where: {
        webinarId,
      },
      _count: {
        id: true,
      },
      _sum: {
        clicks: true,
      },
    });

    const groupATotal = totalMetrics.find(m => m.testGroup === 'A');
    const groupBTotal = totalMetrics.find(m => m.testGroup === 'B');

    // Get unique visitors per group
    const uniqueVisitors = await prisma.aBTestMetric.groupBy({
      by: ['testGroup', 'visitorId'],
      where: {
        webinarId,
      },
    });

    const uniqueVisitorsA = uniqueVisitors.filter(v => v.testGroup === 'A').length;
    const uniqueVisitorsB = uniqueVisitors.filter(v => v.testGroup === 'B').length;

    // Get conversion counts
    const conversions = await prisma.aBTestMetric.groupBy({
      by: ['testGroup'],
      where: {
        webinarId,
        converted: true,
      },
      _count: {
        id: true,
      },
    });

    const conversionsA = conversions.find(c => c.testGroup === 'A')?._count.id || 0;
    const conversionsB = conversions.find(c => c.testGroup === 'B')?._count.id || 0;

    // Calculate overall conversion rates
    const overallConversionRateA = uniqueVisitorsA > 0 ? (conversionsA / uniqueVisitorsA) * 100 : 0;
    const overallConversionRateB = uniqueVisitorsB > 0 ? (conversionsB / uniqueVisitorsB) * 100 : 0;

    // Calculate statistical significance for overall results
    const pValue = calculatePValue(conversionsA, uniqueVisitorsA, conversionsB, uniqueVisitorsB);
    const isSignificant = pValue < 0.05;

    // Calculate confidence intervals
    const ciA = calculateConfidenceInterval(conversionsA, uniqueVisitorsA);
    const ciB = calculateConfidenceInterval(conversionsB, uniqueVisitorsB);

    // Determine overall winner
    let overallWinner: 'A' | 'B' | 'none' = 'none';
    if (isSignificant && Math.abs(overallConversionRateA - overallConversionRateB) > 2) {
      overallWinner = overallConversionRateA > overallConversionRateB ? 'A' : 'B';
    }

    // Calculate improvement percentage
    const improvement =
      overallWinner === 'A'
        ? ((overallConversionRateA - overallConversionRateB) / overallConversionRateB) * 100
        : overallWinner === 'B'
        ? ((overallConversionRateB - overallConversionRateA) / overallConversionRateA) * 100
        : 0;

    // Estimate minimum sample size needed
    const baselineRate = Math.max(overallConversionRateA, overallConversionRateB) / 100;
    const minSampleSize = getMinimumSampleSize(baselineRate);
    const hasEnoughData = uniqueVisitorsA >= minSampleSize && uniqueVisitorsB >= minSampleSize;

    // Enhance results with statistical significance for each element
    const enhancedResults: Record<string, any> = {};

    Object.entries(rawResults).forEach(([element, data]) => {
      const elementPValue = calculatePValue(
        data.groupA.conversions,
        data.groupA.views,
        data.groupB.conversions,
        data.groupB.views
      );

      const elementIsSignificant = elementPValue < 0.05;
      const elementCiA = calculateConfidenceInterval(data.groupA.conversions, data.groupA.views);
      const elementCiB = calculateConfidenceInterval(data.groupB.conversions, data.groupB.views);

      // Recalculate winner with statistical significance
      let elementWinner: 'A' | 'B' | 'none' = 'none';
      if (elementIsSignificant && Math.abs(data.conversionRateA - data.conversionRateB) > 5) {
        elementWinner = data.conversionRateA > data.conversionRateB ? 'A' : 'B';
      }

      const elementImprovement =
        elementWinner === 'A'
          ? ((data.conversionRateA - data.conversionRateB) / data.conversionRateB) * 100
          : elementWinner === 'B'
          ? ((data.conversionRateB - data.conversionRateA) / data.conversionRateA) * 100
          : 0;

      enhancedResults[element] = {
        ...data,
        winner: elementWinner,
        improvement: elementImprovement,
        pValue: elementPValue,
        isSignificant: elementIsSignificant,
        confidenceIntervalA: elementCiA,
        confidenceIntervalB: elementCiB,
      };
    });

    // Build response
    const response = {
      webinar: {
        id: webinar.id,
        title: webinar.title,
        trafficSplitPercent: webinar.trafficSplitPercent,
      },
      overall: {
        groupA: {
          visitors: uniqueVisitorsA,
          conversions: conversionsA,
          conversionRate: overallConversionRateA,
          confidenceInterval: ciA,
          totalViews: groupATotal?._count.id || 0,
          totalClicks: groupATotal?._sum.clicks || 0,
        },
        groupB: {
          visitors: uniqueVisitorsB,
          conversions: conversionsB,
          conversionRate: overallConversionRateB,
          confidenceInterval: ciB,
          totalViews: groupBTotal?._count.id || 0,
          totalClicks: groupBTotal?._sum.clicks || 0,
        },
        winner: overallWinner,
        improvement: Math.abs(improvement),
        pValue,
        isSignificant,
        hasEnoughData,
        minSampleSize,
      },
      elements: {
        registration: webinar.testRegistrationPage ? enhancedResults.registration : null,
        schedule: webinar.testSchedule ? enhancedResults.schedule : null,
        offer: webinar.testOffer ? enhancedResults.offer : null,
        video: webinar.testVideo ? enhancedResults.video : null,
      },
      configuration: {
        testRegistrationPage: webinar.testRegistrationPage,
        regPageAId: webinar.regPageAId,
        regPageBId: webinar.regPageBId,
        testSchedule: webinar.testSchedule,
        scheduleAIds: webinar.scheduleAIds,
        scheduleBIds: webinar.scheduleBIds,
        testOffer: webinar.testOffer,
        offerAId: webinar.offerAId,
        offerBId: webinar.offerBId,
        testVideo: webinar.testVideo,
        videoAId: webinar.videoAId,
        videoBId: webinar.videoBId,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching A/B test results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch A/B test results' },
      { status: 500 }
    );
  }
}
