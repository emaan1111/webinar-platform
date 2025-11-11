import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/registration-pages/[id] - Get single registration page (with HTML code)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const registrationPage = await prisma.registrationPage.findUnique({
      where: { id: params.id }
    });

    if (!registrationPage) {
      return NextResponse.json(
        { error: 'Registration page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(registrationPage);
  } catch (error) {
    console.error('Error fetching registration page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration page' },
      { status: 500 }
    );
  }
}

// PUT /api/registration-pages/[id] - Update registration page
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, htmlCode, thumbnail } = body;

    // Check if registration page exists
    const existing = await prisma.registrationPage.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Registration page not found' },
        { status: 404 }
      );
    }

    // Prevent editing system registration pages
    if (existing.isSystem) {
      return NextResponse.json(
        { error: 'System registration pages cannot be edited. Create a copy instead.' },
        { status: 403 }
      );
    }

    // If name is changing, check for conflicts
    if (name && name !== existing.name) {
      const nameConflict = await prisma.registrationPage.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A registration page with this name already exists' },
          { status: 400 }
        );
      }
    }

    const registrationPage = await prisma.registrationPage.update({
      where: { id: params.id },
      data: {
        name,
        description,
        htmlCode,
        thumbnail,
      }
    });

    return NextResponse.json(registrationPage);
  } catch (error) {
    console.error('Error updating registration page:', error);
    return NextResponse.json(
      { error: 'Failed to update registration page' },
      { status: 500 }
    );
  }
}

// DELETE /api/registration-pages/[id] - Delete registration page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if registration page exists
    const existing = await prisma.registrationPage.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Registration page not found' },
        { status: 404 }
      );
    }

    // Prevent deleting system registration pages
    if (existing.isSystem) {
      return NextResponse.json(
        { error: 'System registration pages cannot be deleted' },
        { status: 403 }
      );
    }

    // Check if registration page is in use by any webinars
    const webinarsUsingPage = await prisma.webinar.count({
      where: {
        OR: [
          { registrationPageId: params.id },
          { regPageAId: params.id },
          { regPageBId: params.id },
        ]
      }
    });

    if (webinarsUsingPage > 0) {
      return NextResponse.json(
        { error: `Cannot delete registration page. It is currently being used by ${webinarsUsingPage} webinar(s).` },
        { status: 400 }
      );
    }

    await prisma.registrationPage.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Registration page deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration page:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration page' },
      { status: 500 }
    );
  }
}
