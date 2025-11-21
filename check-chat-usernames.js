const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkChatUserNames() {
  console.log('🔍 Checking chat message userNames...\n');
  
  const messages = await prisma.chatMessage.findMany({
    take: 20,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      registration: {
        select: {
          name: true,
          email: true
        }
      },
      webinar: {
        select: {
          title: true
        }
      }
    }
  });
  
  console.log(`Found ${messages.length} recent messages:\n`);
  
  messages.forEach((msg, i) => {
    console.log(`${i + 1}. Message ID: ${msg.id}`);
    console.log(`   Message: ${msg.message.substring(0, 50)}...`);
    console.log(`   userName field: ${msg.userName || 'NULL ❌'}`);
    console.log(`   userId: ${msg.userId || 'NULL'}`);
    console.log(`   registrationId: ${msg.registrationId || 'NULL'}`);
    console.log(`   user.name: ${msg.user?.name || 'NULL'}`);
    console.log(`   registration.name: ${msg.registration?.name || 'NULL'}`);
    console.log(`   isScripted: ${msg.isScripted}`);
    console.log(`   isAI: ${msg.isAI}`);
    console.log(`   Webinar: ${msg.webinar.title.substring(0, 40)}...`);
    console.log('');
  });
  
  const nullUserNames = messages.filter(m => !m.userName && !m.isScripted && !m.isAI);
  console.log(`\n📊 Summary:`);
  console.log(`   Total messages checked: ${messages.length}`);
  console.log(`   Messages with NULL userName: ${nullUserNames.length}`);
  console.log(`   Scripted messages: ${messages.filter(m => m.isScripted).length}`);
  console.log(`   AI messages: ${messages.filter(m => m.isAI).length}`);
  
  if (nullUserNames.length > 0) {
    console.log(`\n⚠️ Found ${nullUserNames.length} non-scripted messages with NULL userName!`);
    console.log('These will show as "Anonymous" in the moderation screen.');
  }
  
  await prisma.$disconnect();
}

checkChatUserNames().catch(console.error);
