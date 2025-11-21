const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const reg = await prisma.registration.findFirst({
    where: { email: 'humera_naz@hotmail.co.uk' },
    include: {
      webinar: { select: { title: true, duration: true } }
    }
  });
  
  if (!reg) {
    console.log('❌ Not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log('\n📊 Registration Data:');
  console.log('Email:', reg.email);
  console.log('Name:', reg.name);
  console.log('Phone:', reg.phone || 'NO PHONE');
  console.log('Attended:', reg.attended ? 'YES' : 'NO');
  console.log('Last Watched:', reg.lastWatchedPosition, 'seconds');
  console.log('Webinar:', reg.webinar.title);
  console.log('Duration:', reg.webinar.duration, 'minutes');
  
  const watchMinutes = Math.floor(reg.lastWatchedPosition / 60);
  console.log('\n✅ Watch Minutes:', watchMinutes);
  console.log('✅ Meets 30+ min criteria?', watchMinutes >= 30 ? 'YES' : 'NO');
  console.log('✅ Has phone?', reg.phone ? 'YES' : 'NO');
  console.log('✅ Attended?', reg.attended ? 'YES' : 'NO');
  
  console.log('\n📱 Should receive SMS?', 
    reg.attended && reg.phone && watchMinutes >= 30 ? '✅ YES' : '❌ NO'
  );
  
  await prisma.$disconnect();
}

check().catch(console.error);
