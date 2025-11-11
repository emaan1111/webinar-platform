import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/webinars/[id]/reactions - Save a user reaction
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, videoTimestamp, registrationId } = body;

    if (!type || !['heart', 'clap', 'thumbsUp'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reaction type. Must be: heart, clap, or thumbsUp' },
        { status: 400 }
      );
    }

    if (typeof videoTimestamp !== 'number' || videoTimestamp < 0) {
      return NextResponse.json(
        { error: 'Invalid videoTimestamp' },
        { status: 400 }
      );
    }

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    // Check if user is authenticated OR has a valid registration
    const session = await getServerSession(authOptions);
    
    let userId: string | null = null;
    let userName: string | null = null;
    let regId: string | null = null;

    // Priority 1: Authenticated user
    if (session?.user) {
      userId = (session.user as any).id;
      userName = session.user.name || session.user.email?.split('@')[0] || 'User';
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

    // Save reaction
    const reaction = await prisma.reaction.create({
      data: {
        webinarId: params.id,
        userId,
        registrationId: regId,
        userName,
        type,
        videoTimestamp,
        isScripted: false,
        isHidden: false,
      },
      include: {
        user: userId ? {
          select: {
            name: true,
            email: true,
          },
        } : undefined,
        registration: regId ? {
          select: {
            name: true,
            email: true,
          },
        } : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      reaction: {
        id: reaction.id,
        type: reaction.type,
        videoTimestamp: reaction.videoTimestamp,
        userName: reaction.userName || userName,
        createdAt: reaction.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error saving reaction:', error);
    return NextResponse.json(
      { error: 'Failed to save reaction' },
      { status: 500 }
    );
  }
}
