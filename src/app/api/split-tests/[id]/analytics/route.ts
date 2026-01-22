import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  const { searchParams } = new URL(req.url);
  const timeRange = searchParams.get('range') || '7d';

  try {
    // 1. Determine Date Range
    const now = new Date();
    let fromDate = new Date();
    
    switch(timeRange) {
      case '1h':
        fromDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        fromDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        fromDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        fromDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        fromDate = new Date(0);
        break;
      default:
        fromDate.setDate(now.getDate() - 7);
    }

    // 2. Fetch Split Test & Variants
    const splitTest = await prisma.splitTest.findUnique({
      where: { id },
      include: {
        variants: {
          include: { leadPage: true }
        }
      }
    });

    if (!splitTest) {
      return NextResponse.json({ error: 'Split test not found' }, { status: 404 });
    }

    // 3. Fetch Events
    const events = await prisma.splitTestEvent.findMany({
      where: {
        splitTestId: id,
        createdAt: { gte: fromDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    // 4. Aggregate Data Over Time
    // We want to return an array of time buckets
    const timeBuckets: Record<string, any> = {};
    
    // Determine bucket size and format
    // 1h -> minute
    // 24h -> hour
    // 7d -> 6 hours? or day? Let's do hour for 24h, day for 7d+
    
    const getBucketKey = (date: Date) => {
      // Use ISO string but ensure it is reconstructable
      if (timeRange === '1h') {
        // Minute bucket
        return date.toISOString().slice(0, 16) + ':00.000Z'; // YYYY-MM-DDTHH:mm:00.000Z
      } else if (timeRange === '24h') {
        // Hour bucket
        return date.toISOString().slice(0, 13) + ':00:00.000Z'; // YYYY-MM-DDTHH:00:00.000Z
      } else {
        // Day bucket
        return date.toISOString().slice(0, 10) + 'T00:00:00.000Z'; // YYYY-MM-DDT00:00:00.000Z
      }
    };

    // Initialize buckets with 0
    // (Skipping full zero-filling for brevity, but UI can handle gaps or we rely on sparse data)
    
    // Structure: 
    // { 
    //   "2023-10-27": { 
    //      timestamp: "...", 
    //      "variantA_views": 10, "variantA_conv": 2, 
    //      "variantB_views": 12, "variantB_conv": 5 
    //   } 
    // }

    events.forEach(event => {
      const key = getBucketKey(event.createdAt);
      if (!timeBuckets[key]) {
        timeBuckets[key] = { timestamp: key };
        // Initialize all variants to 0 for this bucket
        splitTest.variants.forEach(v => {
          timeBuckets[key][`${v.id}_views`] = 0;
          timeBuckets[key][`${v.id}_conversions`] = 0;
        });
      }

      // Important: Cumulative counting? Or per-bucket counting?
      // Charts usually want "per day". But cumulative totals are good for "total/rate over time".
      // Let's stick to per-bucket "velocity" for now. 
      // EXCEPT: The user might expect "Total Conversions" line to go up.
      // But the current naming "Conversions by Time" implies a histogram/bar chart feel (how many happened TODAY).
      // Let's keep it as per-bucket counts.
      
      if (event.type === 'VIEW') {
        timeBuckets[key][`${event.variantId}_views`] = (timeBuckets[key][`${event.variantId}_views`] || 0) + 1;
      } else if (event.type === 'CONVERSION') {
        timeBuckets[key][`${event.variantId}_conversions`] = (timeBuckets[key][`${event.variantId}_conversions`] || 0) + 1;
      }
    });

    // If no events, return empty array but with test data
    if (Object.keys(timeBuckets).length === 0 && events.length === 0) {
         // Maybe return at least one empty bucket for "now"?
         const nowKey = getBucketKey(new Date());
         const initialBucket: any = { timestamp: nowKey };
         splitTest.variants.forEach(v => {
              initialBucket[`${v.id}_views`] = 0;
              initialBucket[`${v.id}_conversions`] = 0;
              initialBucket[`${v.id}_rate`] = 0;
         });
         return NextResponse.json({
            test: splitTest,
            chartData: [initialBucket]
         });
    }

    // Convert to array and sort
    const chartData = Object.values(timeBuckets).sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));

    // Calculate Conversion Rates per Variant per Bucket
    chartData.forEach((bucket: any) => {
      splitTest.variants.forEach(v => {
        const views = bucket[`${v.id}_views`] || 0;
        const conv = bucket[`${v.id}_conversions`] || 0;
        bucket[`${v.id}_rate`] = views > 0 ? (conv / views * 100).toFixed(2) : 0;
      });
    });

    return NextResponse.json({
      test: splitTest,
      chartData
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
