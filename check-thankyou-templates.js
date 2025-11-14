const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Checking Thank You Templates...\n')
    
    const templates = await prisma.thankYouTemplate.findMany({
      select: {
        id: true,
        name: true,
        isSystem: true,
        createdAt: true
      }
    })
    
    console.log(`Found ${templates.length} templates:`)
    templates.forEach(t => {
      console.log(`- ${t.name} (${t.isSystem ? 'System' : 'Custom'})`)
    })
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
