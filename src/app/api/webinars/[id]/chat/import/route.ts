import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/webinars/[id]/chat/import - Import chat messages from CSV
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { csvData, clearExisting = false } = body;

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
      select: { id: true, title: true },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    // Clear existing scripted messages if requested
    if (clearExisting) {
      await prisma.chatMessage.deleteMany({
        where: {
          webinarId: params.id,
          isScripted: true,
        },
      });
    }

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    // Find column indices - support multiple formats
    // Format 1: Single timestamp column (MM:SS or seconds)
    let timestampIndex = headers.findIndex((h: string) => 
      h.includes('timestamp') || h === 'time'
    );
    
    // Format 2: Separate Hour, Minute, Second columns
    const hourIndex = headers.findIndex((h: string) => h === 'hour');
    const minuteIndex = headers.findIndex((h: string) => h === 'minute');
    const secondIndex = headers.findIndex((h: string) => h === 'second');
    const hasHMS = hourIndex !== -1 && minuteIndex !== -1 && secondIndex !== -1;
    
    const usernameIndex = headers.findIndex((h: string) => 
      h.includes('username') || h.includes('user') || h.includes('name')
    );
    const messageIndex = headers.findIndex((h: string) => 
      h.includes('message') || h.includes('comment') || h.includes('text')
    );

    if ((timestampIndex === -1 && !hasHMS) || usernameIndex === -1 || messageIndex === -1) {
      return NextResponse.json(
        { 
          error: 'CSV must have columns for timestamp/time (or Hour,Minute,Second), username/name, and message',
          found: { timestampIndex, hasHMS, usernameIndex, messageIndex, headers }
        },
        { status: 400 }
      );
    }

    // Get or create dummy user for scripted messages
    let scriptedUser = await prisma.user.findFirst({
      where: { email: 'scripted@system.internal' },
    });

    if (!scriptedUser) {
      scriptedUser = await prisma.user.create({
        data: {
          email: 'scripted@system.internal',
          name: 'System',
          password: 'N/A', // Not used
          role: 'ATTENDEE',
        },
      });
    }

    // Parse and create messages
    const messages = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with quoted values
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map((v: string) => v.replace(/^"|"$/g, '').trim());

      if (cleanValues.length < 3) continue;

      const username = cleanValues[usernameIndex];
      const message = cleanValues[messageIndex];

      // Parse timestamp - support multiple formats
      let timestamp = 0;
      
      if (hasHMS) {
        // Format: Hour, Minute, Second columns
        const hour = parseInt(cleanValues[hourIndex]) || 0;
        const minute = parseInt(cleanValues[minuteIndex]) || 0;
        const second = parseInt(cleanValues[secondIndex]) || 0;
        timestamp = hour * 3600 + minute * 60 + second;
      } else {
        // Format: Single timestamp column
        const timestampStr = cleanValues[timestampIndex];
        if (timestampStr.includes(':')) {
          const parts = timestampStr.split(':');
          if (parts.length === 2) {
            // MM:SS format
            timestamp = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          } else if (parts.length === 3) {
            // HH:MM:SS format
            timestamp = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
          }
        } else {
          timestamp = parseInt(timestampStr);
        }
      }

      if (isNaN(timestamp) || timestamp < 0) {
        console.warn(`Skipping invalid timestamp at line ${i + 1}`);
        continue;
      }

      messages.push({
        webinarId: params.id,
        userId: scriptedUser.id,
        message: message,
        isScripted: true,
        videoTimestamp: timestamp,
        isHidden: false,
      });
    }

    // Bulk create messages
    const created = await prisma.chatMessage.createMany({
      data: messages,
    });

    return NextResponse.json({
      success: true,
      imported: created.count,
      messages: `Successfully imported ${created.count} chat messages`,
    });
  } catch (error) {
    console.error('Error importing chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to import chat messages', details: String(error) },
      { status: 500 }
    );
  }
}
