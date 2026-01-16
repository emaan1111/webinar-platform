const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function restoreTemplate() {
  try {
    // Read the original template from file
    const originalHtml = fs.readFileSync('./rh2-actual-template.html', 'utf8');

    // Update the database
    await prisma.registrationPage.update({
      where: { name: 'RH 2' },
      data: { htmlCode: originalHtml }
    });

    console.log('✅ Template restored successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreTemplate();
