const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeOnclickFromSubmit() {
  try {
    const template = await prisma.registrationPage.findFirst({
      where: { name: 'RH 2' }
    });

    if (!template) {
      console.log('❌ RH 2 template not found');
      return;
    }

    let html = template.htmlCode;

    // Remove onclick from submit buttons
    // Pattern: <button onclick="toggleModal()" type="submit"
    const updatedHtml = html.replace(
      /<button onclick="toggleModal\(\)"\s+type="submit"/g,
      '<button type="submit"'
    );

    const changes = html.length - updatedHtml.length;
    
    if (changes === 0) {
      console.log('⚠️  No submit buttons found with onclick');
      return;
    }

    console.log(`✅ Removed onclick from submit button(s)`);
    console.log(`📊 Changes: ${changes} characters`);

    await prisma.registrationPage.update({
      where: { id: template.id },
      data: { htmlCode: updatedHtml }
    });

    console.log('✅ Template updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeOnclickFromSubmit();
