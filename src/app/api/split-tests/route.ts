import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');

  try {
    const splitTests = await prisma.splitTest.findMany({
      include: {
        variants: {
          include: {
            leadPage: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const fromDate = from ? new Date(from) : new Date(0); // Default to epoch if no date provided

    const testsWithStats = await Promise.all(splitTests.map(async (test: any) => {
      const variantsWithStats = await Promise.all(test.variants.map(async (variant: any) => {
        const countUniqueEventsWithNullFallback = async (typeFilter: any) => {
          const [nonNullGroups, nullVisitorCount] = await Promise.all([
            prisma.splitTestEvent.groupBy({
              by: ['visitorId'],
              where: {
                variantId: variant.id,
                type: typeFilter,
                visitorId: { not: null },
                createdAt: { gte: fromDate }
              }
            }),
            prisma.splitTestEvent.count({
              where: {
                variantId: variant.id,
                type: typeFilter,
                visitorId: null,
                createdAt: { gte: fromDate }
              }
            })
          ]);

          // Null visitorIds cannot be deduped reliably, so count each as its own unique.
          return nonNullGroups.length + nullVisitorCount;
        };

        // 1. Calculate Unique Views (Group by VisitorID)
        const uniqueViews = await countUniqueEventsWithNullFallback('VIEW');

        // 2. Calculate Total Views (Count all VIEW events)
        const totalViews = await prisma.splitTestEvent.count({
            where: {
                variantId: variant.id,
                type: 'VIEW',
                createdAt: { gte: fromDate }
            }
        });

        // 3 & 4. Webinar registrations come from two places, because a variant's lead page
        // can be bound to either an internal webinar or an external one (EverWebinar/Zoom):
        //   internal -> a Registration row carrying splitTestId/splitTestVariantId
        //   external -> external_webinar_registrations, a table with no split-test columns.
        //               Its attribution survives only as a CONVERSION event whose visitorId
        //               is `ext_<email>` (external-webinars/[id]/register, webinarjamSync).
        // Reading the Registration table alone reports 0 for any test running on external
        // webinars. The two sources cannot overlap - the external path writes no Registration
        // row, and an internal CONVERSION event is not `ext_`-prefixed - so summing them does
        // not double-count. The leads modal builds its list by this same rule, so the number
        // and the drill-down behind it always agree.
        const [registrationRows, externalConversions] = await Promise.all([
          prisma.registration.findMany({
            where: {
              splitTestId: test.id,
              splitTestVariantId: variant.id,
              ...(fromDate > new Date(0) ? { registeredAt: { gte: fromDate } } : {})
            },
            select: { email: true }
          }),
          prisma.splitTestEvent.findMany({
            where: {
              variantId: variant.id,
              type: 'CONVERSION',
              visitorId: { startsWith: 'ext_' },
              createdAt: { gte: fromDate }
            },
            select: { visitorId: true }
          })
        ]);

        // Unique = distinct emails across both sources.
        const internalEmails = registrationRows.map((r: any) => r.email?.toLowerCase()).filter(Boolean);
        const externalEmails = externalConversions.map((e: any) => String(e.visitorId).slice(4).toLowerCase());

        const uniqueRegistrations = new Set([...internalEmails, ...externalEmails]).size;
        const totalRegistrations = registrationRows.length + externalConversions.length;

        // 5. Calculate Unique Form Submissions (Trial Leads / Event Registrations)
        // We look for both FORM_SUBMISSION (legacy/forms) and EVENT_REGISTRATION (trial events)
        const uniqueFormSubmissions = await countUniqueEventsWithNullFallback({
          in: ['FORM_SUBMISSION', 'EVENT_REGISTRATION']
        });

        // 6. Calculate Total Form Submissions
        const totalFormSubmissions = await prisma.splitTestEvent.count({
            where: {
                variantId: variant.id,
                type: { in: ['FORM_SUBMISSION', 'EVENT_REGISTRATION'] },
                createdAt: { gte: fromDate }
            }
        });

        return {
          ...variant,
          views: totalViews,
          uniqueViews,
          registrations: totalRegistrations,
          uniqueRegistrations,
          formSubmissions: totalFormSubmissions,
          uniqueFormSubmissions,
          conversions: totalRegistrations + totalFormSubmissions, // Combined for backward compat
          uniqueConversions: uniqueRegistrations + uniqueFormSubmissions // Combined
        };
      }));

      return {
        ...test,
        variants: variantsWithStats
      };
    }));

    return NextResponse.json(testsWithStats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch split tests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, variants } = body;

    const splitTest = await prisma.splitTest.create({
      data: {
        name,
        slug,
        variants: {
          create: variants.map((v: any) => ({
            leadPageId: v.leadPageId,
            weight: v.weight
          }))
        }
      }
    });

    return NextResponse.json(splitTest);
  } catch (error: any) {
    console.error('❌ Failed to create split test:', error);
    
    // Check for unique constraint violation on slug
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        return NextResponse.json({ error: 'A split test with this slug already exists.' }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Failed to create split test' }, { status: 500 });
  }
}
