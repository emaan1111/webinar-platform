const { PrismaClient } = require('@prisma/client');
(async function(){
  const p = new PrismaClient();
  const webinar = await p.webinar.findUnique({ where: { slug: 'loveislam' } });
  if (!webinar) { console.log('Webinar not found'); await p.$disconnect(); return; }
  const future = new Date(); future.setDate(future.getDate() + 7); future.setHours(18, 0, 0, 0);
  const s = await p.webinarSchedule.create({ data: { webinarId: webinar.id, scheduleType: 'specific', scheduledAt: future.toISOString(), timezone: 'UTC', useUserTimezone: false } });
  console.log('Created schedule:', s);
  await p.$disconnect();
})();
