const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function addRoyalTemplate() {
  try {
    // Read the template file
    const templatePath = path.join(__dirname, '..', 'templates', 'emaan-power-royal.html');
    const htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Check if template already exists
    const existing = await prisma.registrationPageTemplate.findFirst({
      where: { name: 'Emaan Power Royal' }
    });

    if (existing) {
      console.log('Template already exists, updating...');
      await prisma.registrationPageTemplate.update({
        where: { id: existing.id },
        data: {
          htmlContent,
          description: 'Premium royal and rose themed registration page with schedule modal, social proof, and elegant design',
        }
      });
      console.log('✅ Template updated successfully!');
    } else {
      console.log('Creating new template...');
      await prisma.registrationPageTemplate.create({
        data: {
          name: 'Emaan Power Royal',
          slug: 'emaan-power-royal',
          htmlContent,
          description: 'Premium royal and rose themed registration page with schedule modal, social proof, and elegant design',
          category: 'premium',
        }
      });
      console.log('✅ Template created successfully!');
    }

    console.log('\n📋 Template Details:');
    console.log('Name: Emaan Power Royal');
    console.log('Slug: emaan-power-royal');
    console.log('Features: Schedule modal, social proof, animations, responsive design');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRoyalTemplate();
