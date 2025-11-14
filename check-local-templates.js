const { PrismaClient } = require('@prisma/client');

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://aribafarheen@localhost:5432/webinar_db'
    }
  }
});

(async function(){
  console.log('📊 LOCAL Database Template Data:\n');
  
  try {
    const regPages = await localPrisma.registrationPage.count();
    console.log(`📝 Registration Pages: ${regPages}`);
    if (regPages > 0) {
      const pages = await localPrisma.registrationPage.findMany({ take: 5 });
      pages.forEach(pg => console.log(`   - ${pg.name} (ID: ${pg.id})`));
    }
    
    const tyTemplates = await localPrisma.thankYouTemplate.count();
    console.log(`\n🎉 Thank You Templates: ${tyTemplates}`);
    if (tyTemplates > 0) {
      const templates = await localPrisma.thankYouTemplate.findMany({ take: 5 });
      templates.forEach(t => console.log(`   - ${t.name} (ID: ${t.id})`));
    }
    
    const cdTemplates = await localPrisma.countdownTemplate.count();
    console.log(`\n⏰ Countdown Templates: ${cdTemplates}`);
    if (cdTemplates > 0) {
      const templates = await localPrisma.countdownTemplate.findMany({ take: 5 });
      templates.forEach(t => console.log(`   - ${t.name} (ID: ${t.id})`));
    }
    
    const cdPages = await localPrisma.countdownPage.count();
    console.log(`\n⏱️  Countdown Pages: ${cdPages}`);
    if (cdPages > 0) {
      const pages = await localPrisma.countdownPage.findMany({ take: 5 });
      pages.forEach(pg => console.log(`   - ${pg.name} (ID: ${pg.id})`));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await localPrisma.$disconnect();
})();
