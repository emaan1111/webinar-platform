import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/webinars/[id]/ai-config - Get AI configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get webinar (removed hostId check so all admins can access)
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
      include: {
        aiChatConfig: true,
        programDocuments: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    return NextResponse.json({
      config: webinar.aiChatConfig,
      documents: webinar.programDocuments,
    });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI configuration' },
      { status: 500 }
    );
  }
}

// POST /api/webinars/[id]/ai-config - Create or update AI configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get webinar (removed hostId check so all admins can access)
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      enabled,
      activateAfterOffer,
      systemPrompt,
      temperature,
      maxTokens,
      autoRespond,
      requireApproval,
    } = body;

    // Create or update AI config
    const config = await prisma.aIChatConfig.upsert({
      where: { webinarId: params.id },
      update: {
        enabled: enabled ?? true,
        activateAfterOffer: activateAfterOffer ?? true,
        systemPrompt,
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 500,
        autoRespond: autoRespond ?? true,
        requireApproval: requireApproval ?? false,
      },
      create: {
        webinarId: params.id,
        enabled: enabled ?? true,
        activateAfterOffer: activateAfterOffer ?? true,
        systemPrompt,
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 500,
        autoRespond: autoRespond ?? true,
        requireApproval: requireApproval ?? false,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error saving AI config:', error);
    return NextResponse.json(
      { error: 'Failed to save AI configuration' },
      { status: 500 }
    );
  }
}
