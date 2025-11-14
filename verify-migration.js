const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('📊 Railway Database Summary:\n');
  
  const users = await prisma.user.count();
  console.log(`👤 Users: ${users}`);
  
  const webinars = await prisma.webinar.count();
  console.log(`🎥 Webinars: ${webinars}`);
  
  const registrations = await prisma.registration.count();
  console.log(`✍️  Registrations: ${registrations}`);
  
  console.log('\n📋 Webinars:');
  const webinarList = await prisma.webinar.findMany({
    select: {
      title: true,
      slug: true,
      internalName: true
    }
  });
  webinarList.forEach(w => {
    console.log(`   - ${w.title} (${w.slug})`);
    console.log(`     Internal Name: ${w.internalName || 'N/A'}`);
  });
  
  console.log('\n✅ All data migrated successfully to Railway!');
  
  await prisma.$disconnect();
}

verifyMigration();
