
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmn4v7cbc32tvn80fy3xj4mby'; // The ID from previous output
  console.log(`Fetching video events for session ${sessionId}...`);

  const events = await prisma.videoWatchEvent.findMany({
    where: {
      sessionId: sessionId
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (events.length === 0) {
    console.log('No video events found for this session.');
    return;
  }

  console.log(`Found ${events.length} events:`);
  console.log(JSON.stringify(events, null, 2));

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
