import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/webinars/[id]/chat/messages - Save a user chat message
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { message, videoTimestamp, registrationId } = body;

    if (!message || typeof videoTimestamp !== 'number') {
      return NextResponse.json(
        { error: 'Message and videoTimestamp are required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated OR has a valid registration
    const session = await getServerSession(authOptions);
    
    let userId: string | null = null;
    let userName: string | null = null;
    let regId: string | null = null;

    // Priority 1: Authenticated user
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (user) {
        userId = user.id;
        userName = user.name || user.email.split('@')[0];
      }
    }
    
    // Priority 2: Registered attendee (if no authenticated user)
    if (!userId && registrationId) {
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId }
      });

      if (!registration) {
        return NextResponse.json(
          { error: 'Invalid registration' },
          { status: 404 }
        );
      }

      // Verify registration is for this webinar
      if (registration.webinarId !== params.id) {
        return NextResponse.json(
          { error: 'Registration does not match webinar' },
          { status: 403 }
        );
      }

      regId = registration.id;
      userName = registration.name;
    }

    // If neither authenticated user nor valid registration, deny access
    if (!userId && !regId) {
      return NextResponse.json(
        { error: 'Must be authenticated or have a valid registration' },
        { status: 401 }
      );
    }

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    // Create the chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        webinarId: params.id,
        userId,
        registrationId: regId,
        userName,
        message,
        videoTimestamp,
        isScripted: false,
        isHidden: true, // Hidden by default until approved
        isApproved: false, // Needs admin approval
      },
      include: {
        user: userId ? {
          select: {
            id: true,
            name: true,
            email: true,
          },
        } : undefined,
        registration: regId ? {
          select: {
            id: true,
            name: true,
            email: true,
          },
        } : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: chatMessage,
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json(
      { error: 'Failed to save chat message' },
      { status: 500 }
    );
  }
}
