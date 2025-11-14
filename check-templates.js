const { PrismaClient } = require('@prisma/client');
(async function(){
  const p = new PrismaClient();
  
  console.log('📊 Template Data Summary:\n');
  
  // Registration Pages
  const regPages = await p.registrationPage.count();
  console.log(`📝 Registration Pages: ${regPages}`);
  if (regPages > 0) {
    const pages = await p.registrationPage.findMany({ select: { id: true, name: true, userId: true } });
    pages.forEach(pg => console.log(`   - ${pg.name} (userId: ${pg.userId})`));
  }
  
  // Thank You Templates
  const tyTemplates = await p.thankYouTemplate.count();
  console.log(`\n🎉 Thank You Templates: ${tyTemplates}`);
  if (tyTemplates > 0) {
    const templates = await p.thankYouTemplate.findMany({ select: { id: true, name: true, userId: true } });
    templates.forEach(t => console.log(`   - ${t.name} (userId: ${t.userId})`));
  }
  
  // Countdown Templates
  const cdTemplates = await p.countdownTemplate.count();
  console.log(`\n⏰ Countdown Templates: ${cdTemplates}`);
  if (cdTemplates > 0) {
    const templates = await p.countdownTemplate.findMany({ select: { id: true, name: true, userId: true } });
    templates.forEach(t => console.log(`   - ${t.name} (userId: ${t.userId})`));
  }
  
  // Countdown Pages
  const cdPages = await p.countdownPage.count();
  console.log(`\n⏱️  Countdown Pages: ${cdPages}`);
  if (cdPages > 0) {
    const pages = await p.countdownPage.findMany({ select: { id: true, name: true, userId: true } });
    pages.forEach(pg => console.log(`   - ${pg.name} (userId: ${pg.userId})`));
  }
  
  // Check users
  console.log('\n\n👤 Users:');
  const users = await p.user.findMany({ select: { id: true, email: true, name: true } });
  users.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));
  
  await p.$disconnect();
})();
