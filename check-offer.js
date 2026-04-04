
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const webinarId = 'cmidlu9u700sxnx0fxdmvk4hp';
  const registrationId = 'cmn2if5932qlzn80fev7sq514';
  
  console.log(`Fetching offer data for webinar ${webinarId}...`);

  const webinar = await prisma.webinar.findUnique({
    where: {
      id: webinarId
    },
    include: {
      offers: true
    }
  });

  if (!webinar) {
    console.log('No webinar found.');
    return;
  }

  console.log('Webinar Offers:', JSON.stringify(webinar.offers, null, 2));
  
  console.log(`Fetching OfferAnalytics for registration ${registrationId}...`);
  const analytics = await prisma.offerAnalytics.findMany({
      where: {
          registrationId: registrationId
      }
  });

  console.log('User Offer Analytics:', JSON.stringify(analytics, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
