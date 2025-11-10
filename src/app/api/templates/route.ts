import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.template.findMany({
      orderBy: [
        { isSystem: 'desc' }, // System templates first
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        popupStyle: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
        // Don't include htmlCode in list view for performance
      }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, htmlCode, thumbnail, popupStyle, popupTheme } = body;

    // Validation
    if (!name || !htmlCode) {
      return NextResponse.json(
        { error: 'Name and HTML code are required' },
        { status: 400 }
      );
    }

    // Validate popupStyle if provided
    const validPopupStyles = ['center', 'slide-up', 'slide-right', 'fade'];
    if (popupStyle && !validPopupStyles.includes(popupStyle)) {
      return NextResponse.json(
        { error: 'Invalid popup style. Must be one of: center, slide-up, slide-right, fade' },
        { status: 400 }
      );
    }

    // Validate popupTheme if provided
    const validPopupThemes = ['purple', 'blue', 'green', 'red', 'orange', 'dark'];
    if (popupTheme && !validPopupThemes.includes(popupTheme)) {
      return NextResponse.json(
        { error: 'Invalid popup theme. Must be one of: purple, blue, green, red, orange, dark' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existing = await prisma.template.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        htmlCode,
        thumbnail,
        popupStyle: popupStyle || 'center',
        popupTheme: popupTheme || 'purple',
        isSystem: false, // User-created templates
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
