const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeToggleModal() {
  try {
    // Find the RH 2 template
    const template = await prisma.registrationPage.findFirst({
      where: { name: 'RH 2' }
    });

    if (!template) {
      console.log('❌ RH 2 template not found');
      return;
    }

    console.log('✅ Found template: RH 2');
    console.log('📄 Page ID:', template.id);

    let html = template.htmlCode;

    // Remove the toggleModal function and its script tag
    // Find the script block that contains toggleModal
    const scriptStart = html.indexOf('function toggleModal()');
    
    if (scriptStart === -1) {
      console.log('⚠️  toggleModal function not found in template');
      console.log('Template might already be fixed or structure is different');
      return;
    }

    // Find the script tag that contains this function
    // Go backwards to find <script>
    let scriptTagStart = html.lastIndexOf('<script>', scriptStart);
    // Go forwards to find </script>
    let scriptTagEnd = html.indexOf('</script>', scriptStart) + '</script>'.length;

    if (scriptTagStart === -1 || scriptTagEnd === -1) {
      console.log('❌ Could not find script tag boundaries');
      return;
    }

    console.log('📍 Found toggleModal function at position:', scriptStart);
    console.log('📍 Script tag starts at:', scriptTagStart);
    console.log('📍 Script tag ends at:', scriptTagEnd);

    // Extract the script content to verify
    const scriptContent = html.substring(scriptTagStart, scriptTagEnd);
    console.log('\n📝 Script content to remove (first 200 chars):');
    console.log(scriptContent.substring(0, 200) + '...');

    // Remove the entire script block
    const updatedHtml = html.substring(0, scriptTagStart) + html.substring(scriptTagEnd);

    console.log('\n🔧 Updating template...');
    
    await prisma.registrationPage.update({
      where: { id: template.id },
      data: { htmlCode: updatedHtml }
    });

    console.log('✅ Template updated successfully!');
    console.log('📊 Original length:', html.length);
    console.log('📊 New length:', updatedHtml.length);
    console.log('📊 Removed:', html.length - updatedHtml.length, 'characters');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeToggleModal();
