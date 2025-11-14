const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnostics() {
  console.log('🔍 DIAGNOSTIC REPORT\n');
  console.log('='.repeat(60));
  
  // All users
  console.log('\n👥 ALL USERS:');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, name: true }
  });
  users.forEach(u => {
    console.log(`   ${u.email}`);
    console.log(`      ID: ${u.id}`);
    console.log(`      Role: ${u.role}`);
    console.log(`      Name: ${u.name}`);
    console.log();
  });
  
  // All webinars with host info
  console.log('📹 ALL WEBINARS:');
  const webinars = await prisma.webinar.findMany({
    include: {
      host: {
        select: { id: true, email: true }
      },
      _count: {
        select: { registrations: true, schedules: true }
      }
    }
  });
  
  webinars.forEach(w => {
    console.log(`   ${w.title}`);
    console.log(`      ID: ${w.id}`);
    console.log(`      Slug: ${w.slug}`);
    console.log(`      Host: ${w.host.email} (ID: ${w.hostId})`);
    console.log(`      Registrations: ${w._count.registrations}`);
    console.log(`      Schedules: ${w._count.schedules}`);
    console.log();
  });
  
  console.log('='.repeat(60));
  console.log('\n💡 SOLUTION:');
  console.log('   1. Log out of your app');
  console.log('   2. Log back in with: ariba.farheen@gmail.com / Admin123!');
  console.log('   3. Your webinar should now appear!\n');
  console.log('   The issue: Your browser session was created BEFORE');
  console.log('   the migration, so it has an outdated user ID.');
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

diagnostics().catch(console.error);
