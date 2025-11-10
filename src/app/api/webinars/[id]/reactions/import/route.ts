import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/webinars/[id]/reactions/import - Import reactions from CSV
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

    // Clear existing scripted reactions if requested
    if (clearExisting) {
      await prisma.reaction.deleteMany({
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
    const typeIndex = headers.findIndex((h: string) => 
      h.includes('type') || h.includes('reaction') || h.includes('emoji')
    );

    if (timestampIndex === -1 || usernameIndex === -1 || typeIndex === -1) {
      return NextResponse.json(
        { 
          error: 'CSV must have columns for timestamp, username, and type',
          found: { timestampIndex, usernameIndex, typeIndex }
        },
        { status: 400 }
      );
    }

    // Get or create dummy user for scripted reactions
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

    // Valid reaction types
    const validTypes = ['heart', 'clap', 'thumbsUp'];

    // Parse and create reactions
    const reactions = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with quoted values
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map((v: string) => v.replace(/^"|"$/g, '').trim());

      if (cleanValues.length < 3) continue;

      const timestampStr = cleanValues[timestampIndex];
      const username = cleanValues[usernameIndex];
      const type = cleanValues[typeIndex];

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

      // Validate reaction type
      if (!validTypes.includes(type)) {
        console.warn(`Skipping invalid reaction type: ${type}. Valid types: ${validTypes.join(', ')}`);
        continue;
      }

      reactions.push({
        webinarId: params.id,
        userId: scriptedUser.id,
        type: type,
        isScripted: true,
        videoTimestamp: timestamp,
        isHidden: false,
      });
    }

    // Bulk create reactions
    const created = await prisma.reaction.createMany({
      data: reactions,
    });

    return NextResponse.json({
      success: true,
      imported: created.count,
      messages: `Successfully imported ${created.count} reactions`,
    });
  } catch (error) {
    console.error('Error importing reactions:', error);
    return NextResponse.json(
      { error: 'Failed to import reactions', details: String(error) },
      { status: 500 }
    );
  }
}
