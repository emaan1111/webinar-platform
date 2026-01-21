import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { splitTestId, variantId, registrationId } = await req.json();

    if (!variantId) {
        return NextResponse.json({ error: 'Variant ID required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const visitorId = cookieStore.get('webinar_visitor_id')?.value;

    // Use transaction to ensure all counts update together
    await prisma.$transaction(async (tx) => {
        // 1. Update Variant
        const variant = await tx.splitTestVariant.update({
            where: { id: variantId },
            data: { conversions: { increment: 1 } },
            select: { splitTestId: true, leadPageId: true }
        });

        // 2. Update Parent Split Test
        if (splitTestId) {
             await tx.splitTest.update({
                where: { id: splitTestId },
                data: { conversions: { increment: 1 } }
            });
        }

        // 3. Log Event
        await tx.splitTestEvent.create({
            data: {
                splitTestId: splitTestId || variant.splitTestId,
                variantId: variantId,
                type: 'CONVERSION',
                visitorId: visitorId || null
            }
        });

        // 4. Update Underlying Lead Page (if exists)
        if (variant.leadPageId) {
            await tx.leadPage.update({
                where: { id: variant.leadPageId },
                data: { conversions: { increment: 1 } }
            });
        }
    });
    
    console.log(`✅ Beacon: Split test conversion recorded for ${splitTestId}/${variantId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track conversion error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
