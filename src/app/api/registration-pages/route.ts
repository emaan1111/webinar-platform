import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/registration-pages - List all registration pages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const registrationPages = await prisma.registrationPage.findMany({
      orderBy: [
        { isSystem: 'desc' }, // System pages first
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
        // Don't include htmlCode in list view for performance
      }
    });

    const activeTestWebinars = await prisma.webinar.findMany({
      where: {
        enableABTesting: true,
        testRegistrationPage: true,
      },
      select: { regPageAId: true, regPageBId: true }
    });
    
    const activeTestPageIds = new Set<string>();
    activeTestWebinars.forEach((w: any) => {
      if (w.regPageAId) activeTestPageIds.add(w.regPageAId);
      if (w.regPageBId) activeTestPageIds.add(w.regPageBId);
    });

    const enrichedRegistrationPages = registrationPages.map((page: any) => ({
      ...page,
      isActiveABTest: activeTestPageIds.has(page.id)
    }));

    return NextResponse.json(enrichedRegistrationPages);
  } catch (error) {
    console.error('Error fetching registration pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration pages' },
      { status: 500 }
    );
  }
}

// POST /api/registration-pages - Create new registration page
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, htmlCode, thumbnail, popupStyle, popupTheme, ...otherFields } = body;

    // Validation
    if (!name || !htmlCode) {
      return NextResponse.json(
        { error: 'Name and HTML code are required' },
        { status: 400 }
      );
    }

    // Note: popupStyle and popupTheme are legacy fields from Template model
    // They are not used in RegistrationPage model, so we ignore them

    // Check if name already exists
    const existing = await prisma.registrationPage.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A registration page with this name already exists' },
        { status: 400 }
      );
    }

    const registrationPage = await prisma.registrationPage.create({
      data: {
        name,
        description,
        htmlCode,
        thumbnail,
        isSystem: false, // User-created registration pages
      }
    });

    return NextResponse.json(registrationPage, { status: 201 });
  } catch (error) {
    console.error('Error creating registration page:', error);
    return NextResponse.json(
      { error: 'Failed to create registration page' },
      { status: 500 }
    );
  }
}
