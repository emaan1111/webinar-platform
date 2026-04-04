
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmn4v7cbc32tvn80fy3xj4mby'; 
  console.log(`Fetching page visits for session ${sessionId}...`);

  const visits = await prisma.pageVisit.findMany({
    where: {
      sessionId: sessionId
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (visits.length === 0) {
    console.log('No page visits found for this session.');
    return;
  }

  console.log(`Found ${visits.length} visits:`);
  console.log(JSON.stringify(visits, null, 2));

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
