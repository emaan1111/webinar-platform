import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface ChatLogRow {
  Hour: string;
  Minute: string;
  Second: string;
  Name: string;
  Role: string;
  Message: string;
  Mode: string;
}

function parseTimeToSeconds(hour: string, minute: string, second: string): number {
  const h = parseInt(hour) || 0;
  const m = parseInt(minute) || 0;
  const s = parseInt(second) || 0;
  return h * 3600 + m * 60 + s;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function importChatLog() {
  try {
    console.log('🔍 Finding webinar in database...')
    
    // Get the first (and only) webinar
    const webinar = await prisma.webinar.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!webinar) {
      console.error('❌ No webinar found in database!')
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

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'chat_log_141.csv')
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`)
      console.log('   Please place chat_log_141.csv in the project root directory')
      process.exit(1)
    }

    console.log(`📖 Reading CSV file: ${csvPath}`)

    const messages: ChatLogRow[] = []

    // Parse CSV
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: ChatLogRow) => {
          messages.push(row)
        })
        .on('end', () => {
          resolve()
        })
        .on('error', (error: Error) => {
          reject(error)
        })
    })

    console.log(`📊 Found ${messages.length} messages in CSV`)

    // Import messages
    console.log('💾 Importing messages to database...')
    let imported = 0

    for (const msg of messages) {
      try {
        const timestamp = parseTimeToSeconds(msg.Hour, msg.Minute, msg.Second)
        
        await prisma.chatMessage.create({
          data: {
            webinarId: webinar.id,
            userName: msg.Name.trim(),
            message: msg.Message.trim(),
            isScripted: true,
            videoTimestamp: timestamp,
            isApproved: true,
            createdAt: new Date()
          }
        })
        
        imported++
        
        // Show progress every 50 messages
        if (imported % 50 === 0) {
          console.log(`   📝 Imported ${imported}/${messages.length} messages...`)
        }
      } catch (error) {
        console.error(`   ⚠️  Failed to import message from ${msg.Name}:`, error)
      }
    }

    console.log(`✅ Successfully imported ${imported} messages!`)
    console.log(`\n📊 Summary:`)
    console.log(`   Webinar: ${webinar.title}`)
    console.log(`   Total messages: ${imported}`)
    
    if (messages.length > 0) {
      const firstTime = parseTimeToSeconds(messages[0].Hour, messages[0].Minute, messages[0].Second);
      const lastTime = parseTimeToSeconds(
        messages[messages.length - 1].Hour, 
        messages[messages.length - 1].Minute, 
        messages[messages.length - 1].Second
      );
      console.log(`   Time range: ${formatTime(firstTime)} - ${formatTime(lastTime)}`)
    }

  } catch (error) {
    console.error('❌ Error importing chat log:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importChatLog()
