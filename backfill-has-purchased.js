const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfillHasPurchased() {
  console.log('🔍 Finding registrations with sales...');

  // Find all registrations that have at least one sale
  const registrationsWithSales = await prisma.registration.findMany({
    where: {
      sales: {
        some: {},
      },
      hasPurchased: false, // Only update those not already marked
    },
    include: {
      sales: true,
    },
  });

  console.log(`📊 Found ${registrationsWithSales.length} registrations with sales to update`);

  if (registrationsWithSales.length === 0) {
    console.log('✅ No registrations need updating');
    return;
  }

  // Update each registration to set hasPurchased = true
  let updated = 0;
  for (const registration of registrationsWithSales) {
    try {
      await prisma.registration.update({
        where: { id: registration.id },
        data: { hasPurchased: true },
      });
      updated++;
      console.log(`✅ Updated ${registration.email} (${registration.sales.length} sales)`);
    } catch (error) {
      console.error(`❌ Failed to update ${registration.email}:`, error.message);
    }
  }

  console.log(`\n✅ Successfully updated ${updated} out of ${registrationsWithSales.length} registrations`);
}

backfillHasPurchased()
  .catch((error) => {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
