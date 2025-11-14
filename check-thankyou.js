const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const templates = await prisma.thankYouTemplate.findMany();
    console.log('Thank You Templates count:', templates.length);
    if (templates.length > 0) {
      templates.forEach(t => {
        console.log(`- ${t.name} (${t.isSystem ? 'System' : 'Custom'})`);
      });
    } else {
      console.log('No thank you templates found in database!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
check();
