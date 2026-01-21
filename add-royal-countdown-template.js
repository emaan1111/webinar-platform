const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  try {
    // Read the HTML template
    const templatePath = path.join(__dirname, 'templates', 'emaan-power-royal-countdown.html')
    const htmlCode = fs.readFileSync(templatePath, 'utf-8')

    // Create the countdown template in the database
    // Note: 'name' must be unique in CountdownTemplate table
    const countdownTemplate = await prisma.countdownTemplate.upsert({
      where: { name: 'Emaan Power Royal' },
      update: {
        htmlCode: htmlCode,
        description: 'Royal & rose themed waiting room with countdown and referral sharing',
        thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        isSystem: true // Mark as system to prevent deletion
      },
      create: {
        name: 'Emaan Power Royal',
        description: 'Royal & rose themed waiting room with countdown and referral sharing',
        htmlCode: htmlCode,
        thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        isSystem: true
      },
    })

    console.log('✅ Successfully created/updated countdown template:', countdownTemplate.name)
    console.log('📄 Template ID:', countdownTemplate.id)
    console.log('')
    console.log('You can now use this template when creating webinars!')
    
    // Also list all existing countdown templates
    console.log('\n📋 All Countdown Templates:')
    const allTemplates = await prisma.countdownTemplate.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    allTemplates.forEach(t => {
      console.log(`  - ${t.name} (ID: ${t.id})`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
