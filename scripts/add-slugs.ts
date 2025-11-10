import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

async function addSlugsToExistingWebinars() {
  try {
    // Get all webinars without slugs
    const webinars = await prisma.webinar.findMany({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true
      }
    })

    console.log(`Found ${webinars.length} webinars without slugs\n`)

    if (webinars.length === 0) {
      console.log('✅ All webinars already have slugs!')
      return
    }

    // Update each webinar with a slug
    for (const webinar of webinars) {
      let slug = generateSlug(webinar.title)
      
      // Check if slug already exists
      let counter = 1
      let uniqueSlug = slug
      while (await prisma.webinar.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      // Update webinar
      await prisma.webinar.update({
        where: { id: webinar.id },
        data: { slug: uniqueSlug }
      })

      console.log(`✅ Updated "${webinar.title}"`)
      console.log(`   Slug: ${uniqueSlug}`)
      console.log(`   URL: http://localhost:3002/w/${uniqueSlug}\n`)
    }

    console.log(`\n🎉 Successfully added slugs to ${webinars.length} webinars!`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
addSlugsToExistingWebinars()
