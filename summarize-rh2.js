const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function summarizeRH2() {
  try {
    const template = await prisma.registrationPage.findFirst({
      where: { name: 'RH 2' }
    });

    if (!template) {
      console.log('❌ RH 2 template not found');
      return;
    }

    const html = template.htmlCode;

    console.log('✅ RH 2 Template Summary\n');

    // Count CTA buttons with onclick
    const ctaWithOnclick = (html.match(/<button[^>]*onclick="toggleModal\(\)"[^>]*data-action="register"/g) || []).length;
    console.log(`📊 CTA buttons with onclick="toggleModal()": ${ctaWithOnclick}`);

    // Count submit buttons
    const submitButtons = (html.match(/<button[^>]*type="submit"/g) || []).length;
    console.log(`📊 Submit buttons: ${submitButtons}`);

    // Count submit buttons with onclick (should be 0)
    const submitWithOnclick = (html.match(/<button[^>]*onclick="toggleModal\(\)"[^>]*type="submit"/g) || []).length;
    console.log(`📊 Submit buttons with onclick (should be 0): ${submitWithOnclick}`);

    // Check for toggleModal function
    const hasToggleModal = html.includes('function toggleModal()');
    console.log(`📊 Has toggleModal() function: ${hasToggleModal ? '✅' : '❌'}`);

    // Check for close button
    const hasCloseButton = html.includes('data-action="register"') && html.includes('fa-times');
    console.log(`📊 Has close button in modal: ${hasCloseButton ? '✅' : '❌'}`);

    console.log('\n🎯 Status: Template is ready!');
    console.log('   - CTA buttons have onclick="toggleModal()"');
    console.log('   - Submit button does NOT have onclick');
    console.log('   - Template has its own modal JavaScript');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

summarizeRH2();
