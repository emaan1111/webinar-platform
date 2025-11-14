const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Checking Railway Database...\n');
  
  // Check users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
  console.log('👤 Users:');
  users.forEach(u => console.log(`   - ${u.email} (${u.role}) - ID: ${u.id}`));
  
  // Check webinars
  const webinars = await prisma.webinar.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      internalName: true,
      hostId: true,
      _count: {
        select: {
          registrations: true
        }
      }
    }
  });
  console.log('\n🎥 Webinars:');
  if (webinars.length === 0) {
    console.log('   ⚠️  No webinars found!');
  } else {
    webinars.forEach(w => {
      console.log(`   - ${w.title}`);
      console.log(`     Slug: ${w.slug}`);
      console.log(`     Internal Name: ${w.internalName}`);
      console.log(`     Host ID: ${w.hostId}`);
      console.log(`     Registrations: ${w._count.registrations}`);
    });
  }
  
  // Check registrations
  const registrations = await prisma.registration.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      webinarId: true
    },
    take: 5
  });
  console.log(`\n✍️  Sample Registrations (showing 5 of ${await prisma.registration.count()}):`);
  registrations.forEach(r => {
    console.log(`   - ${r.name} (${r.email})`);
  });
  
  await prisma.$disconnect();
}

checkData().catch(console.error);
