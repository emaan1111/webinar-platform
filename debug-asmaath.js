
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'asmaath@gmail.com';
  console.log(`Fetching data for ${email}...`);

  // Try finding by email directly
  const registration = await prisma.registration.findFirst({
    where: {
      email: {
        mode: 'insensitive', // Search case-insensitive just in case
        equals: email
      }
    },
    include: {
      sessions: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      webinar: true,
      offerAnalytics: true
    }
  });

  if (registration) {
      console.log('Registration Data:');
      console.log(JSON.stringify(registration, null, 2));
  } else {
    console.log('No exact registration found for this email.');
  }
    
    // Always search for similar to check for duplicates
    console.log('Searching for similar registrations...');
    const similar = await prisma.registration.findMany({
        where: {
            OR: [
                { email: { contains: 'asmaath', mode: 'insensitive' } },
                { name: { contains: 'asmaath', mode: 'insensitive' } }
            ],
            NOT: {
                id: registration?.id // Exclude the one we already found
            }
        },
        include: {
            sessions: true
        }
    });
    
    if (similar.length > 0) {
        console.log('Found similar registrations:', JSON.stringify(similar, null, 2));
    } else {
        console.log('No similar registrations found.');
    }


}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
