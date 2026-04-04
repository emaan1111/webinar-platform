
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmn4v7cbc32tvn80fy3xj4mby'; 
  console.log(`Fetching engagement events for session ${sessionId}...`);

  const events = await prisma.engagementEvent.findMany({
    where: {
      sessionId: sessionId
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  
  const chatMessages = await prisma.chatMessage.findMany({
    where: {
      userId: 'cmn4mp07q31con80fb30mlabn' // Wait, the session has registrationId. I should use registrationId or userId if linked.
      // The session has NO userId, only registrationId.
      // The Registration has userId: null.
      // The ChatMessage can link to registrationId.
    }
  });

  // Let's modify query to use Registration ID correctly
  const regId = 'cmn4mp07q31con80fb30mlabn';
  const chats = await prisma.chatMessage.findMany({
    where: {
      registrationId: regId
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log(`Found ${events.length} engagement events and ${chats.length} chat messages.`);
  
  if (events.length > 0) console.log('Engagements:', JSON.stringify(events, null, 2));
  if (chats.length > 0) console.log('Chats:', JSON.stringify(chats, null, 2));

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
