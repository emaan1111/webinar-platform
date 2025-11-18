import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reports/sales
 * 
 * Fetch daily sales metrics for charts
 * Aggregates WebinarSale data by date with revenue, count, and conversion rates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to' },
        { status: 400 }
      );
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); // Include full last day

    console.log('📊 Fetching sales data:', {
      from: from.toISOString(),
      to: to.toISOString(),
    });

    // Fetch all sales in date range
    const sales = await prisma.webinarSale.findMany({
      where: {
        purchasedAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        purchasedAt: true,
        registrationId: true,
        email: true,
        productName: true,
      },
      orderBy: {
        purchasedAt: 'asc',
      },
    });

    // Fetch registrations for conversion rate calculation
    const registrations = await prisma.registration.findMany({
      where: {
        registeredAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
        registeredAt: true,
      },
    });

    // Fetch ad spend for ROAS calculation (optional, may not have data for all days)
    let adSpendByDate: Map<string, number> = new Map();
    try {
      // Try to get Facebook ad spend data
      const adMetrics = await fetch(
        `${request.nextUrl.origin}/api/ads/charts?from=${fromDate}&to=${toDate}`,
        {
          headers: {
            'Cookie': request.headers.get('cookie') || '',
          },
        }
      );
      
      if (adMetrics.ok) {
        const adData = await adMetrics.json();
        if (Array.isArray(adData)) {
          adData.forEach((day: any) => {
            adSpendByDate.set(day.date, day.spend || 0);
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch ad spend data for ROAS calculation:', error);
    }

    // Group by date
    const salesByDate = new Map<string, {
      date: string;
      count: number;
      revenue: number;
      registrations: number;
      adSpend: number;
    }>();

    // Initialize all dates in range with zero values
    const currentDate = new Date(from);
    while (currentDate <= to) {
      const dateKey = currentDate.toISOString().split('T')[0];
      salesByDate.set(dateKey, {
        date: dateKey,
        count: 0,
        revenue: 0,
        registrations: 0,
        adSpend: adSpendByDate.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate sales by date
    sales.forEach((sale) => {
      if (!sale.purchasedAt) return;
      
      const dateKey = sale.purchasedAt.toISOString().split('T')[0];
      const dayData = salesByDate.get(dateKey);
      
      if (dayData) {
        dayData.count++;
        dayData.revenue += sale.amount || 0;
      }
    });

    // Add registrations count by date
    registrations.forEach((reg) => {
      const dateKey = reg.registeredAt.toISOString().split('T')[0];
      const dayData = salesByDate.get(dateKey);
      
      if (dayData) {
        dayData.registrations++;
      }
    });

    // Convert to array and calculate derived metrics
    const result = Array.from(salesByDate.values()).map((day) => {
      const conversionRate = day.registrations > 0 
        ? (day.count / day.registrations) * 100 
        : 0;
      
      const costPerSale = day.count > 0 && day.adSpend > 0
        ? day.adSpend / day.count
        : 0;
      
      const averageOrderValue = day.count > 0
        ? day.revenue / day.count
        : 0;
      
      const roas = day.adSpend > 0
        ? day.revenue / day.adSpend
        : 0;

      return {
        date: day.date,
        salesCount: day.count,
        revenue: parseFloat(day.revenue.toFixed(2)),
        registrations: day.registrations,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        costPerSale: parseFloat(costPerSale.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        adSpend: day.adSpend,
        roas: parseFloat(roas.toFixed(2)),
      };
    });

    console.log('✅ Sales data fetched:', {
      days: result.length,
      totalSales: result.reduce((sum, day) => sum + day.salesCount, 0),
      totalRevenue: result.reduce((sum, day) => sum + day.revenue, 0),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error fetching sales data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch sales data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
