import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { splitTestId, variantId, registrationId } = await req.json();

    if (!variantId) {
        return NextResponse.json({ error: 'Variant ID required' }, { status: 400 });
    }

    await prisma.splitTestVariant.update({
        where: { id: variantId },
        data: { conversions: { increment: 1 } }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track conversion error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
