const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Checking what the app sees in the database...\n');
  
  // Check users
  const userCount = await prisma.user.count();
  console.log(`👤 Total Users: ${userCount}`);
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
  users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
  
  // Check webinars with details
  const webinarCount = await prisma.webinar.count();
  console.log(`\n🎥 Total Webinars: ${webinarCount}`);
  
  const webinars = await prisma.webinar.findMany({
    include: {
      _count: {
        select: {
          registrations: true,
          schedules: true
        }
      }
    }
  });
  
  if (webinars.length === 0) {
    console.log('   ⚠️  NO WEBINARS FOUND IN DATABASE!');
  } else {
    webinars.forEach(w => {
      console.log(`\n   📹 ${w.title}`);
      console.log(`      Slug: ${w.slug}`);
      console.log(`      Internal Name: ${w.internalName || 'N/A'}`);
      console.log(`      Host ID: ${w.hostId}`);
      console.log(`      Registrations: ${w._count.registrations}`);
      console.log(`      Schedules: ${w._count.schedules}`);
    });
  }
  
  // Check registrations
  const regCount = await prisma.registration.count();
  console.log(`\n✍️  Total Registrations: ${regCount}`);
  
  if (regCount > 0) {
    const sampleRegs = await prisma.registration.findMany({
      select: {
        email: true,
        name: true,
        webinarId: true
      },
      take: 3
    });
    console.log('   Sample:');
    sampleRegs.forEach(r => {
      console.log(`   - ${r.name} (${r.email}) - Webinar: ${r.webinarId}`);
    });
  }
  
  // Check schedules
  const scheduleCount = await prisma.webinarSchedule.count();
  console.log(`\n📅 Total Schedules: ${scheduleCount}`);
  
  if (scheduleCount > 0) {
    const schedules = await prisma.webinarSchedule.findMany({
      select: {
        id: true,
        webinarId: true,
        startTime: true,
        status: true
      },
      take: 3
    });
    console.log('   Sample:');
    schedules.forEach(s => {
      console.log(`   - ${s.startTime} (${s.status}) - Webinar: ${s.webinarId}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('DATABASE CONNECTION: Railway PostgreSQL');
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

checkData().catch(console.error);
