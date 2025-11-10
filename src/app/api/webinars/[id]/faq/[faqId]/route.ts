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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; faqId: string } }
) {
  try {
    const access = await verifyHost(params.id);
    if ('error' in access) {
      return access.error;
    }

    const existing = await prisma.webinarFaq.findFirst({
      where: {
        id: params.faqId,
        webinarId: params.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, any> = {};

    if (typeof body.question === 'string') {
      const value = body.question.trim();
      if (!value) {
        return NextResponse.json(
          { error: 'Question cannot be empty' },
          { status: 400 }
        );
      }
      data.question = value;
    }

    if (typeof body.answer === 'string') {
      const value = body.answer.trim();
      if (!value) {
        return NextResponse.json(
          { error: 'Answer cannot be empty' },
          { status: 400 }
        );
      }
      data.answer = value;
    }

    if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)) {
      data.sortOrder = body.sortOrder;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const faq = await prisma.webinarFaq.update({
      where: { id: params.faqId },
      data,
    });

    return NextResponse.json({ faq });
  } catch (error) {
    console.error('Error updating webinar FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; faqId: string } }
) {
  try {
    const access = await verifyHost(params.id);
    if ('error' in access) {
      return access.error;
    }

    const existing = await prisma.webinarFaq.findFirst({
      where: {
        id: params.faqId,
        webinarId: params.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    await prisma.webinarFaq.delete({
      where: { id: params.faqId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting webinar FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
