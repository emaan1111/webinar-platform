import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateWebinarWithCountdownPage() {
  // Get all webinars with slugs
  const webinars = await prisma.webinar.findMany({
    where: {
      slug: { not: null },
    },
    include: {
      schedules: true,
    },
  });

  if (webinars.length === 0) {
    console.log('❌ No webinars with slugs found in database');
    return;
  }

  console.log(`✅ Found ${webinars.length} webinar(s) with slugs`);

  // Get both countdown pages
  const islamicPage = await prisma.countdownPage.findFirst({
    where: { name: 'Islamic Mothers' },
  });
  
  const defaultPage = await prisma.countdownPage.findFirst({
    where: { name: 'Default' },
  });

  if (!islamicPage || !defaultPage) {
    console.log('❌ Countdown pages not found');
    return;
  }

  console.log(`✅ Found countdown pages: Islamic Mothers & Default`);

  // Update each webinar
  for (const webinar of webinars) {
    const updated = await prisma.webinar.update({
      where: { id: webinar.id },
      data: {
        countdownPageId: islamicPage.id,
      },
    });

    console.log(`\n🎉 Updated webinar: "${updated.title}"`);
    console.log(`   Slug: ${webinar.slug}`);
    console.log(`   📍 Countdown URL: http://localhost:3000/countdown/${webinar.slug}`);
    
    if (webinar.schedules && webinar.schedules.length > 0) {
      console.log(`   📍 With schedule: http://localhost:3000/countdown/${webinar.slug}?s=${webinar.schedules[0].id}`);
    }
  }
  
  console.log(`\n✨ All webinars updated successfully!`);
}

updateWebinarWithCountdownPage()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
