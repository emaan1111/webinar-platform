const { PrismaClient } = require('@prisma/client');

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://aribafarheen@localhost:5432/webinar_db'
    }
  }
});

async function checkAllData() {
  console.log('📊 LOCAL DATABASE INVENTORY:\n');
  
  const counts = {
    users: await localPrisma.user.count(),
    webinars: await localPrisma.webinar.count(),
    registrations: await localPrisma.registration.count(),
    registrationPages: await localPrisma.registrationPage.count(),
    thankYouTemplates: await localPrisma.thankYouTemplate.count(),
    countdownTemplates: await localPrisma.countdownTemplate.count(),
    webinarSchedules: await localPrisma.webinarSchedule.count(),
    chatMessages: await localPrisma.chatMessage.count(),
    reactions: await localPrisma.reaction.count(),
    offers: await localPrisma.offer.count(),
    webinarFaqs: await localPrisma.webinarFaq.count(),
    analytics: await localPrisma.analytics.count(),
    attendeeSessions: await localPrisma.attendeeSession.count(),
    abTestMetrics: await localPrisma.aBTestMetric.count(),
  };
  
  console.log('Core Data:');
  console.log(`  Users: ${counts.users}`);
  console.log(`  Webinars: ${counts.webinars}`);
  console.log(`  Registrations: ${counts.registrations}`);
  
  console.log('\nTemplates & Pages:');
  console.log(`  Registration Pages: ${counts.registrationPages}`);
  console.log(`  Thank You Templates: ${counts.thankYouTemplates}`);
  console.log(`  Countdown Templates: ${counts.countdownTemplates}`);
  
  console.log('\nScheduling:');
  console.log(`  Webinar Schedules: ${counts.webinarSchedules}`);
  
  console.log('\nContent:');
  console.log(`  Chat Messages: ${counts.chatMessages}`);
  console.log(`  Reactions: ${counts.reactions}`);
  console.log(`  Offers: ${counts.offers}`);
  console.log(`  FAQs: ${counts.webinarFaqs}`);
  
  console.log('\nAnalytics:');
  console.log(`  Analytics Events: ${counts.analytics}`);
  console.log(`  Attendee Sessions: ${counts.attendeeSessions}`);
  console.log(`  A/B Test Metrics: ${counts.abTestMetrics}`);
  
  // Check for registration pages with embed settings
  const regPages = await localPrisma.registrationPage.findMany({
    select: {
      id: true,
      name: true,
      embedSettings: true
    }
  });
  
  console.log('\n📋 Registration Pages Details:');
  regPages.forEach(page => {
    console.log(`  - ${page.name} (${page.id})`);
    if (page.embedSettings) {
      console.log(`    Has embed settings: ✅`);
    }
  });
  
  await localPrisma.$disconnect();
}

checkAllData().catch(console.error);
