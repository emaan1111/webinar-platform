const { PrismaClient } = require('@prisma/client');
(async function(){
  const p = new PrismaClient();
  const webinar = await p.webinar.findUnique({ where: { slug: 'loveislam' }, select: { id: true, title: true } });
  if (!webinar) { console.log('Webinar not found'); await p.$disconnect(); return; }
  console.log('Webinar:', webinar);
  const schedules = await p.schedule.findMany({ where: { webinarId: webinar.id }, select: { id: true, scheduleType: true, scheduledAt: true, isActive: true, minutesFromReg: true, recurringPattern: true } });
  console.log('Schedules:', schedules);
  await p.$disconnect();
})();
