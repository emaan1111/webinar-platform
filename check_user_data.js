
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'chokrio@yahoo.com';
  console.log(`Fetching data for ${email}...`);

  const registration = await prisma.registration.findFirst({
    where: {
      email: email
    },
    include: {
      sessions: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      webinar: true
    }
  });

  if (!registration) {
    console.log('No registration found for this email.');
    return;
  }

  console.log('Registration Data:');
  console.log(JSON.stringify(registration, null, 2));

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
