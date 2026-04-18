const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // Check external webinars and their registration counts
  const ews = await prisma.externalWebinar.findMany({
    include: { 
      _count: { select: { registrations: true, leadPages: true } },
      leadPages: { select: { id: true, name: true, slug: true, views: true, conversions: true } }
    }
  });
  ews.forEach(e => {
    console.log(`\n=== ${e.name} (${e.platform}) ===`);
    console.log(`  Active: ${e.isActive}`);
    console.log(`  Registrations: ${e._count.registrations}`);
    console.log(`  Lead Pages: ${e._count.leadPages}`);
    console.log(`  Last Sync: ${e.lastSyncAt}`);
    console.log(`  CRM: ${e.crmIntegration}`);
    e.leadPages.forEach(lp => {
      console.log(`  Lead Page: ${lp.name} (slug: ${lp.slug}) - ${lp.views} views, ${lp.conversions} conversions`);
    });
  });

  // Show recent registrations
  const regs = await prisma.externalWebinarRegistration.findMany({
    orderBy: { registeredAt: 'desc' },
    take: 10,
    select: { email: true, name: true, registeredAt: true, registrationSource: true, leadPageId: true, attended: true, watchTimeMinutes: true, attendanceTagsApplied: true }
  });
  console.log('\n=== Recent Registrations ===');
  regs.forEach(r => {
    console.log(`  ${r.email} | source: ${r.registrationSource} | leadPageId: ${r.leadPageId || 'none'} | attended: ${r.attended} | ${r.registeredAt.toISOString()}`);
  });

  await prisma.$disconnect();
}
main();
