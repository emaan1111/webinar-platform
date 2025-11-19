import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/webinars/[id]/faq - Get all FAQs for a webinar
export async function GET(
  request: NextRequest,
  { params }: RouteParams
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

    // Verify the webinar exists (removed hostId check so all admins can access)
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    // Fetch all FAQs for this webinar
    const faqs = await prisma.webinarFaq.findMany({
      where: { webinarId: params.id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, faqs });
  } catch (error) {
    console.error('Error fetching webinar FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

// POST /api/webinars/[id]/faq - Create a new FAQ
export async function POST(
  request: NextRequest,
  { params }: RouteParams
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

    // Verify the webinar exists (removed hostId check so all admins can access)
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { question, answer } = body;

    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    // Get the next sort order
    const lastFaq = await prisma.webinarFaq.findFirst({
      where: { webinarId: params.id },
      orderBy: { sortOrder: 'desc' },
    });

    const sortOrder = (lastFaq?.sortOrder ?? -1) + 1;

    // Create the FAQ
    const faq = await prisma.webinarFaq.create({
      data: {
        webinarId: params.id,
        question: question.trim(),
        answer: answer.trim(),
        sortOrder,
      },
    });

    return NextResponse.json({ success: true, faq }, { status: 201 });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}
