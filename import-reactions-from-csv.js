/**
 * Import Reactions from CSV to Railway Database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function parseTimestamp(timestamp) {
  const parts = timestamp.split(':');
  const minutes = parseInt(parts[0]) || 0;
  const seconds = parseInt(parts[1]) || 0;
  return minutes * 60 + seconds;
}

async function importReactions() {
  try {
    console.log('❤️  IMPORTING REACTIONS FROM CSV\n');
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
    const csvPath = path.join(__dirname, 'sample-webinar-reactions.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    console.log(`📄 CSV File: ${lines.length - 1} reactions found\n`);

    let imported = 0;
    let skipped = 0;

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const [timestamp, username, type] = line.split(',').map(s => s.trim());
        
        if (!timestamp || !username || !type) {
          skipped++;
          continue;
        }

        const videoTimestamp = parseTimestamp(timestamp);
        
        await prisma.reaction.create({
          data: {
            webinarId: webinar.id,
            userName: username,
            type: type,
            videoTimestamp: videoTimestamp,
            isScripted: true,
            isHidden: false,
            createdAt: new Date(Date.now() + videoTimestamp * 1000)
          }
        });

        imported++;
        
        if (imported % 10 === 0) {
          console.log(`   ✅ Imported ${imported} reactions...`);
        }
      } catch (error) {
        console.log(`❌ Error on line ${i}: ${error.message}`);
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ IMPORT COMPLETE!\n`);
    console.log(`   Total Reactions: ${imported + skipped}`);
    console.log(`   Imported: ${imported} ✅`);
    console.log(`   Skipped: ${skipped}`);

    // Verify in database
    const totalInDB = await prisma.reaction.count({
      where: { webinarId: webinar.id }
    });
    console.log(`\n📊 Total reactions in database: ${totalInDB}`);

  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importReactions();
