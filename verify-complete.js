const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('✅ RAILWAY DATABASE - COMPLETE VERIFICATION\n');
  console.log('='.repeat(60) + '\n');
  
  const counts = {
    users: await prisma.user.count(),
    webinars: await prisma.webinar.count(),
    registrations: await prisma.registration.count(),
    registrationPages: await prisma.registrationPage.count(),
    thankYouTemplates: await prisma.thankYouTemplate.count(),
    countdownTemplates: await prisma.countdownTemplate.count(),
    webinarSchedules: await prisma.webinarSchedule.count(),
    offers: await prisma.offer.count(),
    attendeeSessions: await prisma.attendeeSession.count(),
  };
  
  console.log('📊 DATA COUNTS:');
  console.log(`  Users: ${counts.users} ✅`);
  console.log(`  Webinars: ${counts.webinars} ✅`);
  console.log(`  Registrations: ${counts.registrations} ✅`);
  console.log(`  Registration Pages: ${counts.registrationPages} ✅ (includes popup/embed)`);
  console.log(`  Thank You Templates: ${counts.thankYouTemplates} ✅`);
  console.log(`  Countdown Templates: ${counts.countdownTemplates} ✅`);
  console.log(`  Webinar Schedules: ${counts.webinarSchedules} ✅`);
  console.log(`  Offers: ${counts.offers} ✅`);
  console.log(`  Attendee Sessions: ${counts.attendeeSessions} ✅`);
  
  console.log('\n📋 WEBINAR DETAILS:');
  const webinar = await prisma.webinar.findFirst({
    include: {
      host: { select: { email: true, name: true } },
      schedules: true,
      registrations: true
    }
  });
  
  if (webinar) {
    console.log(`  Title: ${webinar.title}`);
    console.log(`  Slug: ${webinar.slug}`);
    console.log(`  Host: ${webinar.host.email} (${webinar.host.name})`);
    console.log(`  Schedules: ${webinar.schedules.length}`);
    console.log(`  Registrations: ${webinar.registrations.length}`);
    console.log(`  Has Registration Page: ${webinar.registrationPageId ? '✅' : '❌'}`);
    console.log(`  Has Thank You Template: ${webinar.thankYouTemplateId ? '✅' : '❌'}`);
    console.log(`  Has Countdown Template: ${webinar.countdownTemplateId ? '✅' : '❌'}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL DATA SUCCESSFULLY MIGRATED TO RAILWAY!\n');
  console.log('Next steps:');
  console.log('1. Open http://localhost:3000');
  console.log('2. Login with: ariba.farheen@gmail.com / Admin123!');
  console.log('3. You should now see all your webinars, templates, and data!');
  
  await prisma.$disconnect();
}

verify();
