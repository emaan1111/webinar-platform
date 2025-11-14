const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixHostId() {
  console.log('🔧 Fixing webinar host IDs...\n');
  
  // Get the admin user (the one you log in with)
  const adminUser = await prisma.user.findUnique({
    where: { email: 'ariba.farheen@gmail.com' }
  });
  
  if (!adminUser) {
    console.error('❌ Admin user not found!');
    return;
  }
  
  console.log(`✅ Admin user found: ${adminUser.email} (ID: ${adminUser.id})`);
  
  // Get all webinars
  const webinars = await prisma.webinar.findMany({
    select: {
      id: true,
      title: true,
      hostId: true,
      host: {
        select: {
          email: true
        }
      }
    }
  });
  
  console.log(`\n📹 Found ${webinars.length} webinar(s):\n`);
  
  for (const webinar of webinars) {
    console.log(`   - ${webinar.title}`);
    console.log(`     Current Host: ${webinar.host.email} (ID: ${webinar.hostId})`);
    
    if (webinar.hostId !== adminUser.id) {
      console.log(`     ⚠️  Updating to: ${adminUser.email} (ID: ${adminUser.id})`);
      
      await prisma.webinar.update({
        where: { id: webinar.id },
        data: { hostId: adminUser.id }
      });
      
      console.log(`     ✅ Updated!`);
    } else {
      console.log(`     ✅ Already correct`);
    }
    console.log();
  }
  
  console.log('🎉 Done! All webinars now belong to your admin account.');
  console.log('Refresh your dashboard to see them!');
  
  await prisma.$disconnect();
}

fixHostId().catch(console.error);
