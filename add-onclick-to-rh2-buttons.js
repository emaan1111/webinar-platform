const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addOnclickToButtons() {
  try {
    const template = await prisma.registrationPage.findFirst({
      where: { name: 'RH 2' }
    });

    if (!template) {
      console.log('❌ RH 2 template not found');
      return;
    }

    let html = template.htmlCode;

    // Find all buttons with data-action="register" or data-webinar-trigger that DON'T have onclick
    // and add onclick="toggleModal()"
    
    // Pattern: <button ... data-action="register" ... > (without onclick)
    // Replace with: <button ... onclick="toggleModal()" data-action="register" ... >
    
    let updatedHtml = html;
    let replacements = 0;

    // Strategy: Find buttons with data-action="register" that don't have onclick
    const buttonPattern = /<button([^>]*data-action="register"[^>]*)>/gi;
    
    updatedHtml = updatedHtml.replace(buttonPattern, (match, attributes) => {
      // Check if this button already has onclick
      if (attributes.includes('onclick=')) {
        console.log('⏭️  Skipping button (already has onclick):', match.substring(0, 80));
        return match;
      }
      
      replacements++;
      // Add onclick at the beginning of attributes
      return `<button onclick="toggleModal()" ${attributes}>`;
    });

    if (replacements === 0) {
      console.log('⚠️  No buttons found to update');
      return;
    }

    console.log(`✅ Added onclick to ${replacements} buttons`);

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

addOnclickToButtons();
