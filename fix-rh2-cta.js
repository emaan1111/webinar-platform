const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Find the RH 2 template
    const rhTemplate = await prisma.registrationPage.findFirst({
      where: {
        name: {
          contains: 'RH 2',
          mode: 'insensitive'
        },
      },
    })

    if (!rhTemplate) {
      console.log('❌ Could not find RH 2 template')
      return
    }

    console.log('✅ Found template:', rhTemplate.name)
    console.log('📄 Page ID:', rhTemplate.id)
    console.log('\n🔧 Removing onclick handlers from buttons...\n')

    // Remove onclick="toggleModal()" from buttons, keeping data-action="register"
    let updatedHtml = rhTemplate.htmlCode
    
    // Remove onclick="toggleModal()" but keep the button element intact
    updatedHtml = updatedHtml.replace(/onclick="toggleModal\(\)"\s*/g, '')
    
    // Count how many were removed
    const originalMatches = (rhTemplate.htmlCode.match(/onclick="toggleModal\(\)"/g) || []).length
    const remainingMatches = (updatedHtml.match(/onclick="toggleModal\(\)"/g) || []).length
    
    console.log(`Removed ${originalMatches - remainingMatches} onclick handlers`)

    // Update the template
    await prisma.registrationPage.update({
      where: { id: rhTemplate.id },
      data: { htmlCode: updatedHtml },
    })

    console.log('\n✅ Template updated successfully!')
    console.log('🎉 CTA buttons should now work correctly with the schedule modal')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
