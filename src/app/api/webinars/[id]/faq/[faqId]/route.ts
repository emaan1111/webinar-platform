import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
    faqId: string;
  };
}

// PUT /api/webinars/[id]/faq/[faqId] - Update an FAQ
export async function PUT(
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

    // Verify the webinar belongs to the user
    const webinar = await prisma.webinar.findFirst({
      where: {
        id: params.id,
        hostId: user.id,
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found or access denied' },
        { status: 404 }
      );
    }

    // Verify the FAQ exists and belongs to this webinar
    const existingFaq = await prisma.webinarFaq.findFirst({
      where: {
        id: params.faqId,
        webinarId: params.id,
      },
    });

    if (!existingFaq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    const body = await request.json();
    const { question, answer, sortOrder } = body;

    // Build update data
    const updateData: any = {};
    if (question !== undefined) {
      if (!question?.trim()) {
        return NextResponse.json(
          { error: 'Question cannot be empty' },
          { status: 400 }
        );
      }
      updateData.question = question.trim();
    }
    if (answer !== undefined) {
      if (!answer?.trim()) {
        return NextResponse.json(
          { error: 'Answer cannot be empty' },
          { status: 400 }
        );
      }
      updateData.answer = answer.trim();
    }
    if (sortOrder !== undefined && typeof sortOrder === 'number') {
      updateData.sortOrder = sortOrder;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update the FAQ
    const faq = await prisma.webinarFaq.update({
      where: { id: params.faqId },
      data: updateData,
    });

    return NextResponse.json({ success: true, faq });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

// DELETE /api/webinars/[id]/faq/[faqId] - Delete an FAQ
export async function DELETE(
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

    // Verify the webinar belongs to the user
    const webinar = await prisma.webinar.findFirst({
      where: {
        id: params.id,
        hostId: user.id,
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found or access denied' },
        { status: 404 }
      );
    }

    // Verify the FAQ exists and belongs to this webinar
    const existingFaq = await prisma.webinarFaq.findFirst({
      where: {
        id: params.faqId,
        webinarId: params.id,
      },
    });

    if (!existingFaq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    // Delete the FAQ
    await prisma.webinarFaq.delete({
      where: { id: params.faqId },
    });

    return NextResponse.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
