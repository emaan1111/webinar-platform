const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const template = await prisma.registrationPage.findUnique({
      where: { id: 'cmkg7zkex000ds10f0urrs4ci' }
    })
    
    if (!template) {
      console.log('❌ Template not found')
      return
    }
    
    console.log('📄 Template Name:', template.name)
    console.log('📝 Description:', template.description)
    console.log('\n🔍 Checking for registration button triggers...\n')
    
    // Check if HTML has data-action="register" attributes
    const hasDataAction = template.htmlCode.includes('data-action="register"')
    const hasOnclick = template.htmlCode.includes('onclick')
    
    console.log('✓ Has data-action="register":', hasDataAction)
    console.log('✓ Has onclick handlers:', hasOnclick)
    
    // Count CTAs
    const ctaMatches = template.htmlCode.match(/CLAIM MY FREE PLACE|Register Now|Sign Up|Join Now/gi)
    console.log('\n📊 Found', ctaMatches ? ctaMatches.length : 0, 'CTA text instances')
    
    // Show first 1000 chars to see structure
    console.log('\n📋 First 1000 characters of HTML:')
    console.log(template.htmlCode.substring(0, 1000))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
