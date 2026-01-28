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

    const registrations = await prisma.registration.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Failed to fetch lead details', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
