const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  try {
    // Read the HTML template
    const templatePath = path.join(__dirname, 'templates', 'emaan-power-royal.html')
    const htmlCode = fs.readFileSync(templatePath, 'utf-8')

    // Create the registration page in the database
    const registrationPage = await prisma.registrationPage.create({
      data: {
        name: 'Emaan Power Royal',
        description: 'Premium royal & rose themed registration page with schedule selection modal',
        htmlCode: htmlCode,
        thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      },
    })

    console.log('✅ Successfully created registration page:', registrationPage.name)
    console.log('📄 Page ID:', registrationPage.id)
    console.log('')
    console.log('You can now use this template when creating webinars!')
    
    // Also list all existing registration pages
    console.log('\n📋 All Registration Pages:')
    const allPages = await prisma.registrationPage.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    allPages.forEach(page => {
      console.log(`  - ${page.name} (ID: ${page.id})`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
