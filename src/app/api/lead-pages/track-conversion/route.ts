import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadPageId, registrationId } = body;

    if (!leadPageId) {
        return NextResponse.json({ error: 'Lead Page ID required' }, { status: 400 });
    }
    
    // Record conversion for the standalone lead page
    await prisma.leadPage.update({
        where: { id: leadPageId },
        data: { conversions: { increment: 1 } }
    });
    
    console.log(`✅ Beacon: Lead page conversion recorded for ${leadPageId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track lead page conversion error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
