import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/webinars/[id]/program-documents - Get all program documents
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

    // Verify ownership
    const webinar = await prisma.webinar.findFirst({
      where: {
        id: params.id,
        hostId: user.id,
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    const documents = await prisma.programDocument.findMany({
      where: { webinarId: params.id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching program documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program documents' },
      { status: 500 }
    );
  }
}

// POST /api/webinars/[id]/program-documents - Create a new program document
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

    // Verify ownership
    const webinar = await prisma.webinar.findFirst({
      where: {
        id: params.id,
        hostId: user.id,
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, category, isActive, sortOrder } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }

    const document = await prisma.programDocument.create({
      data: {
        webinarId: params.id,
        title,
        content,
        category: category || 'general',
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating program document:', error);
    return NextResponse.json(
      { error: 'Failed to create program document' },
      { status: 500 }
    );
  }
}

// PATCH /api/webinars/[id]/program-documents/[docId] - Update a program document
export async function PATCH(
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

    const body = await request.json();
    const { documentId, title, content, category, isActive, sortOrder } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const document = await prisma.programDocument.findFirst({
      where: {
        id: documentId,
        webinar: {
          hostId: user.id,
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updated = await prisma.programDocument.update({
      where: { id: documentId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(typeof sortOrder === 'number' && { sortOrder }),
      },
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error('Error updating program document:', error);
    return NextResponse.json(
      { error: 'Failed to update program document' },
      { status: 500 }
    );
  }
}

// DELETE /api/webinars/[id]/program-documents/[docId] - Delete a program document
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const document = await prisma.programDocument.findFirst({
      where: {
        id: documentId,
        webinar: {
          hostId: user.id,
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.programDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting program document:', error);
    return NextResponse.json(
      { error: 'Failed to delete program document' },
      { status: 500 }
    );
  }
}
