const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testChatAPI() {
  console.log('🧪 Testing Chat API Response Format...\n');
  
  // Simulate what the API does
  const messages = await prisma.chatMessage.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      userId: true,
      registrationId: true,
      userName: true,
      message: true,
      isHidden: true,
      isApproved: true,
      isScripted: true,
      isAI: true,
      videoTimestamp: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      webinar: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
  
  console.log(`📨 API will return ${messages.length} messages:\n`);
  
  messages.forEach((msg, i) => {
    const displayName = msg.userName || msg.user?.name || msg.user?.email || 'Anonymous';
    console.log(`${i + 1}. ${msg.isScripted ? '📝 SCRIPTED' : '💬 USER'}`);
    console.log(`   Message: ${msg.message.substring(0, 40)}...`);
    console.log(`   userName field: ${msg.userName || 'NULL'}`);
    console.log(`   user.name: ${msg.user?.name || 'NULL'}`);
    console.log(`   ✅ Display name: "${displayName}"`);
    console.log('');
  });
  
  const willShowAnonymous = messages.filter(msg => {
    const displayName = msg.userName || msg.user?.name || msg.user?.email || 'Anonymous';
    return displayName === 'Anonymous';
  });
  
  console.log(`\n📊 Result:`);
  console.log(`   Messages that will show proper names: ${messages.length - willShowAnonymous.length}`);
  console.log(`   Messages that will show "Anonymous": ${willShowAnonymous.length}`);
  
  if (willShowAnonymous.length === 0) {
    console.log('\n✅ SUCCESS! All messages will show proper names in moderation screen!');
  } else {
    console.log('\n❌ PROBLEM! Some messages will still show as Anonymous:');
    willShowAnonymous.forEach(msg => {
      console.log(`   - Message ID: ${msg.id}`);
      console.log(`     Message: ${msg.message.substring(0, 40)}...`);
    });
  }
  
  await prisma.$disconnect();
}

testChatAPI().catch(console.error);
