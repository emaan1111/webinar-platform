
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ChatMessageMeta {
  timestamp: string;
  name: string;
  message: string;
}

interface ChatLogData {
  messages: ChatMessageMeta[];
}

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(str => parseInt(str, 10));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

async function importChatLog() {
  try {
    console.log('🔍 Finding webinar in database...')
    
    // Find webinar with 'courage' in title
    const webinar = await prisma.webinar.findFirst({
      where: {
        title: {
          contains: 'courage',
          mode: 'insensitive'
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!webinar) {
      console.error('❌ No webinar found with "courage" in title!')
      process.exit(1)
    }

    console.log(`✅ Found webinar: "${webinar.title}" (ID: ${webinar.id})`)

    // Delete existing scripted messages for this webinar
    console.log('🗑️  Deleting existing scripted messages...')
    const deleted = await prisma.chatMessage.deleteMany({
      where: {
        webinarId: webinar.id,
        isScripted: true
      }
    })
    console.log(`   Deleted ${deleted.count} existing scripted messages`)

    // Read JSON file
    const jsonPath = path.join(process.cwd(), 'chat_log_data.json')
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`❌ JSON file not found: ${jsonPath}`)
      process.exit(1)
    }

    console.log(`📖 Reading JSON file: ${jsonPath}`)
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const data: ChatLogData = JSON.parse(fileContent);

    if (!data.messages || !Array.isArray(data.messages)) {
      console.error('❌ Invalid JSON format: messages array missing');
      process.exit(1);
    }

    console.log(`📊 Found ${data.messages.length} messages in JSON`)

    // Import messages
    console.log('💾 Importing messages to database...')
    let imported = 0

    for (const msg of data.messages) {
      try {
        const timestamp = parseTimeToSeconds(msg.timestamp)
        
        await prisma.chatMessage.create({
          data: {
            webinarId: webinar.id,
            userName: msg.name.trim(),
            message: msg.message.trim(),
            videoTimestamp: timestamp,
            isScripted: true,
            isApproved: true
          }
        })
        imported++
        
        if (imported % 50 === 0) {
          console.log(`   Imported ${imported} messages...`)
        }
      } catch (err) {
        console.error(`   ❌ Failed to import message: ${msg.message}`, err)
      }
    }

    console.log(`✨ Successfully imported ${imported} messages!`)

  } catch (error) {
    console.error('FATAL ERROR:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importChatLog();
