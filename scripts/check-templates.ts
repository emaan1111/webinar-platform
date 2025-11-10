import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🔍 Checking Thank You Templates...\n')
  
  const templates = await prisma.thankYouTemplate.findMany({
    select: {
      id: true,
      name: true,
      isSystem: true,
      description: true
    }
  })
  
  if (templates.length === 0) {
    console.log('❌ No templates found in database!')
    console.log('\nRun this command to seed templates:')
    console.log('npx tsx prisma/seed-thank-you-templates.ts\n')
  } else {
    console.log(`✅ Found ${templates.length} template(s):\n`)
    templates.forEach(t => {
      console.log(`  - ${t.name}${t.isSystem ? ' (System)' : ''}`)
      console.log(`    ID: ${t.id}`)
      if (t.description) {
        console.log(`    ${t.description}`)
      }
      console.log()
    })
  }
  
  // Check webinars
  console.log('🔍 Checking Webinars...\n')
  const webinars = await prisma.webinar.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      thankYouTemplateId: true
    },
    take: 5
  })
  
  if (webinars.length === 0) {
    console.log('❌ No webinars found\n')
  } else {
    console.log(`✅ Found ${webinars.length} webinar(s):\n`)
    webinars.forEach(w => {
      console.log(`  - ${w.title}`)
      console.log(`    Slug: ${w.slug}`)
      console.log(`    Thank You Template: ${w.thankYouTemplateId || 'None (will use default)'}`)
      console.log()
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
