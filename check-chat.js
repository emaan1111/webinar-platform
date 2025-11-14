const { PrismaClient } = require('@prisma/client');

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://aribafarheen@localhost:5432/webinar_db'
    }
  }
});

async function checkChat() {
  console.log('💬 Checking Chat Messages in Local DB...\n');
  
  const chatCount = await localPrisma.chatMessage.count();
  console.log(`Total Chat Messages: ${chatCount}`);
  
  if (chatCount > 0) {
    const messages = await localPrisma.chatMessage.findMany({
      take: 10,
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { name: true, email: true } },
        registration: { select: { name: true, email: true } }
      }
    });
    
    console.log('\nFirst 10 messages:');
    messages.forEach(msg => {
      const sender = msg.userName || msg.user?.name || msg.registration?.name || 'Unknown';
      const timestamp = msg.videoTimestamp ? `[${msg.videoTimestamp}s]` : '';
      const scripted = msg.isScripted ? '📝' : '👤';
      console.log(`  ${scripted} ${timestamp} ${sender}: ${msg.message.substring(0, 50)}...`);
    });
  } else {
    console.log('\n⚠️  No chat messages found in local database!');
  }
  
  await localPrisma.$disconnect();
}

checkChat();
