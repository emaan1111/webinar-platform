import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function verifyHost(webinarId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  const webinar = await prisma.webinar.findFirst({
    where: {
      id: webinarId,
      hostId: user.id,
    },
    select: { id: true },
  });

  if (!webinar) {
    return { error: NextResponse.json({ error: 'Not authorized to manage this webinar' }, { status: 403 }) };
  }

  return { user };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const access = await verifyHost(params.id);
    if ('error' in access) {
      return access.error;
    }

    const faqs = await prisma.webinarFaq.findMany({
      where: { webinarId: params.id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Error fetching webinar FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to load FAQs' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const access = await verifyHost(params.id);
    if ('error' in access) {
      return access.error;
    }

    const body = await request.json();
    const question = (body.question ?? '').trim();
    const answer = (body.answer ?? '').trim();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const previous = await prisma.webinarFaq.findFirst({
      where: { webinarId: params.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const nextSortOrder = (previous?.sortOrder ?? -1) + 1;

    const faq = await prisma.webinarFaq.create({
      data: {
        webinarId: params.id,
        question,
        answer,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error) {
    console.error('Error creating webinar FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}
