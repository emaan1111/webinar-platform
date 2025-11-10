import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getWebinar() {
  const webinar = await prisma.webinar.findFirst({
    where: { slug: { not: null } },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  console.log('\n📊 Webinar Info:');
  console.log('================');
  console.log(`ID: ${webinar?.id}`);
  console.log(`Title: ${webinar?.title}`);
  console.log(`Slug: ${webinar?.slug}`);
  console.log('\n🔗 Admin Chat URL:');
  console.log(`http://localhost:3000/dashboard/webinars/${webinar?.id}/chat`);
  console.log('\n🎬 Test Room URL:');
  console.log(`http://localhost:3000/room/${webinar?.slug}`);

  await prisma.$disconnect();
}

getWebinar();
