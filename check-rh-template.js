const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  try {
    // Find the Registration RH A template (or any template with "RH" in name)
    const rhTemplate = await prisma.registrationPage.findFirst({
      where: {
        OR: [
          { name: { contains: 'RH', mode: 'insensitive' } },
          { name: { contains: 'Registration RH', mode: 'insensitive' } },
        ],
      },
    })

    if (!rhTemplate) {
      console.log('❌ Could not find Registration RH template')
      return
    }

    console.log('✅ Found template:', rhTemplate.name)
    console.log('📄 Page ID:', rhTemplate.id)
    console.log('\n🔍 Checking for CTA buttons in HTML...\n')

    // Check for onclick handlers
    const hasOnclick = rhTemplate.htmlCode.includes('onclick=')
    const hasDataAction = rhTemplate.htmlCode.includes('data-action="register"')
    const hasToggleModal = rhTemplate.htmlCode.includes('toggleModal')
    const hasOpenModal = rhTemplate.htmlCode.includes('openModal')

    console.log('Button Check:')
    console.log('  onclick attributes:', hasOnclick ? '✅ Found' : '❌ Not found')
    console.log('  data-action="register":', hasDataAction ? '✅ Found' : '❌ Not found')
    console.log('  toggleModal function:', hasToggleModal ? '✅ Found' : '❌ Not found')
    console.log('  openModal function:', hasOpenModal ? '✅ Found' : '❌ Not found')

    // Save the HTML to a file for inspection
    const outputPath = path.join(__dirname, 'rh2-actual-template.html')
    fs.writeFileSync(outputPath, rhTemplate.htmlCode)
    console.log('\n📝 Template HTML saved to:', outputPath)
    
    // Also check for buttons without proper attributes
    const buttons = rhTemplate.htmlCode.match(/<button[^>]*>/gi) || []
    console.log('\n🔍 Button Analysis:')
    console.log(`Total <button> tags found: ${buttons.length}`)
    
    buttons.slice(0, 5).forEach((btn, i) => {
      console.log(`\nButton ${i + 1}:`)
      console.log(btn.substring(0, 150) + (btn.length > 150 ? '...' : ''))
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
