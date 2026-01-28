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

  const { searchParams } = new URL(req.url);
  const variantId = searchParams.get('variantId');
  const type = searchParams.get('type'); // 'webinar', 'form', or null (all)

  if (!params.id) {
     return NextResponse.json({ error: 'Split Test ID required' }, { status: 400 });
  }

  try {
    const whereClause: any = {
        splitTestId: params.id
    };

    if (variantId) {
        whereClause.splitTestVariantId = variantId;
    }

    let results: any[] = [];

    // Fetch Registrations (Webinar)
    if (!type || type === 'webinar') {
        const registrations = await prisma.registration.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                registeredAt: true,
                splitTestVariant: {
                    select: {
                        leadPage: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { registeredAt: 'desc' }
        });
        
        results.push(...registrations.map(r => ({
            ...r,
            type: 'WEBINAR_REGISTRATION',
            source: 'Webinar Registration'
        })));
    }

    // Fetch Form Submissions & Event Registrations (Trial Leads)
    if (!type || type === 'form') {
        const submissions = await prisma.formSubmission.findMany({
            where: whereClause,
            select: {
                id: true,
                data: true, 
                createdAt: true,
                splitTestVariant: {
                    select: {
                        leadPage: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const eventRegistrations = await prisma.eventRegistration.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                registeredAt: true,
                splitTestVariant: {
                    select: {
                        leadPage: { select: { name: true } }
                    }
                }
            },
            orderBy: { registeredAt: 'desc' }
        });

        // Parse Form Submissions
        const parsedSubmissions = submissions.map(s => {
            let parsedData: any = {};
            try { 
                parsedData = typeof s.data === 'string' ? JSON.parse(s.data) : s.data;
            } catch (e) {}
            
            const values = Object.values(parsedData);
            const email = values.find(v => typeof v === 'string' && v.includes('@')) as string || 'N/A';
            const name = values.find(v => typeof v === 'string' && !v.includes('@') && v.length > 2) as string || 'Lead';

            return {
                id: s.id,
                name: name,
                email: email,
                registeredAt: s.createdAt,
                splitTestVariant: s.splitTestVariant,
                type: 'FORM_SUBMISSION',
                source: 'Trial Form'
            };
        });

        // Map Event Registrations
        const mappedEvents = eventRegistrations.map(e => ({
            id: e.id,
            name: e.name,
            email: e.email,
            registeredAt: e.registeredAt,
            splitTestVariant: e.splitTestVariant,
            type: 'EVENT_REGISTRATION',
            source: 'Trial Event Class'
        }));
        
        results.push(...parsedSubmissions, ...mappedEvents);
    }

    // Sort combined results by date desc
    results.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch lead details', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
