/**
 * Delete all fake/scripted reactions from the database
 * Run with: node delete-fake-reactions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteFakeReactions() {
  try {
    console.log('🔍 Checking for fake/scripted reactions...\n');

    // Count fake reactions
    const count = await prisma.reaction.count({
      where: {
        isScripted: true
      }
    });

    console.log(`Found ${count} fake/scripted reactions\n`);

    if (count === 0) {
      console.log('✅ No fake reactions to delete!');
      await prisma.$disconnect();
      process.exit(0);
    }

    // Show some examples
    const examples = await prisma.reaction.findMany({
      where: {
        isScripted: true
      },
      take: 5,
      include: {
        webinar: {
          select: {
            title: true
          }
        }
      }
    });

    console.log('📝 Example fake reactions:');
    examples.forEach((reaction, i) => {
      console.log(`  ${i + 1}. Type: ${reaction.type}, Webinar: ${reaction.webinar?.title || 'Unknown'}, Time: ${reaction.videoTimestamp}s`);
    });

    console.log('\n⚠️  This will permanently delete all fake reactions!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Deleting fake reactions...');

    // Delete all fake reactions
    const result = await prisma.reaction.deleteMany({
      where: {
        isScripted: true
      }
    });

    console.log(`\n✅ Successfully deleted ${result.count} fake reactions!`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

deleteFakeReactions();
