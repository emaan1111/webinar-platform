import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/webinars/[id]/chat/import - Import chat messages from CSV
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
    
    // Find column indices
    const timestampIndex = headers.findIndex((h: string) => 
      h.includes('timestamp') || h.includes('time') || h.includes('second')
    );
    const usernameIndex = headers.findIndex((h: string) => 
      h.includes('username') || h.includes('user') || h.includes('name')
    );
    const messageIndex = headers.findIndex((h: string) => 
      h.includes('message') || h.includes('comment') || h.includes('text')
    );

    if (timestampIndex === -1 || usernameIndex === -1 || messageIndex === -1) {
      return NextResponse.json(
        { 
          error: 'CSV must have columns for timestamp, username, and message',
          found: { timestampIndex, usernameIndex, messageIndex }
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

      const timestampStr = cleanValues[timestampIndex];
      const username = cleanValues[usernameIndex];
      const message = cleanValues[messageIndex];

      // Parse timestamp (supports MM:SS, M:SS, or just seconds)
      let timestamp = 0;
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

      if (isNaN(timestamp) || timestamp < 0) {
        console.warn(`Skipping invalid timestamp: ${timestampStr}`);
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
