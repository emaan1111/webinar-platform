/**
 * Import Chat Messages from CSV to Railway Database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse CSV line handling quoted fields with commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

async function importChat() {
  try {
    console.log('💬 IMPORTING CHAT MESSAGES FROM CSV\n');
    console.log('='.repeat(60) + '\n');

    // Get the webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug: 'loveislam' }
    });

    if (!webinar) {
      console.log('❌ Webinar not found!');
      return;
    }

    console.log(`📺 Webinar: ${webinar.title}`);
    console.log(`   ID: ${webinar.id}\n`);

    // Read CSV file
    const csvPath = path.join(__dirname, 'chat_log_141.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    console.log(`📄 CSV File: ${lines.length - 1} messages found\n`);

    // Skip header
    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const fields = parseCSVLine(line);
        
        if (fields.length < 6) {
          console.log(`⚠️  Skipping malformed line ${i}: ${fields.length} fields`);
          skipped++;
          continue;
        }

        const [hour, minute, second, name, role, message, mode] = fields;
        
        // Calculate video timestamp in seconds
        const videoTimestamp = (parseInt(hour) || 0) * 3600 + 
                              (parseInt(minute) || 0) * 60 + 
                              (parseInt(second) || 0);
        
        // Create chat message
        await prisma.chatMessage.create({
          data: {
            webinarId: webinar.id,
            userName: name.replace(/"/g, '').trim(),
            message: message.replace(/"/g, '').trim(),
            videoTimestamp: videoTimestamp,
            isScripted: true, // These are pre-scripted messages
            isHidden: false,
            isApproved: true,
            createdAt: new Date(Date.now() + videoTimestamp * 1000) // Offset by timestamp
          }
        });

        imported++;
        
        if (imported % 100 === 0) {
          console.log(`   ✅ Imported ${imported} messages...`);
        }
      } catch (error) {
        console.log(`❌ Error on line ${i}: ${error.message}`);
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ IMPORT COMPLETE!\n`);
    console.log(`   Total Messages: ${imported + skipped}`);
    console.log(`   Imported: ${imported} ✅`);
    console.log(`   Skipped: ${skipped}`);

    // Verify in database
    const totalInDB = await prisma.chatMessage.count({
      where: { webinarId: webinar.id }
    });
    console.log(`\n📊 Total chat messages in database: ${totalInDB}`);

  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importChat();
