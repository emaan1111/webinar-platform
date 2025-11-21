import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if webinar already exists
    const existing = await prisma.webinars.findFirst({
      where: { slug: 'loveislam' }
    })

    if (existing) {
      console.log('✅ Webinar already exists!')
      console.log('   URL: https://emaanpowerclasses.com/w/loveislam')
      return
    }

    // Create the webinar with a schedule
    const webinar = await prisma.webinars.create({
      data: {
        title: 'Help Your Child Love Islam Without Force',
        slug: 'loveislam',
        description: 'Free Class for Mothers - Discover how to help your child love Islam deeply, even when the whole world is pulling them away.',
        duration: 60,
        hostName: 'Ustadha Ariba Farheen',
        vimeoVideoId: '1040853157',
        userId: 'cmi9443ir0001jw9or4g2n6fd', // Your admin user
        status: 'scheduled',
        schedules: {
          create: {
            startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            timezone: 'America/New_York',
            isRecurring: false
          }
        }
      },
      include: { schedules: true }
    })

    console.log('✅ Webinar created successfully!')
    console.log('   ID:', webinar.id)
    console.log('   Slug:', webinar.slug)
    console.log('   Title:', webinar.title)
    console.log('   URL: https://emaanpowerclasses.com/w/' + webinar.slug)
    console.log('   Schedules:', webinar.schedules.length)
    console.log('\n📝 Next steps:')
    console.log('   1. Go to dashboard and create/assign a registration page')
    console.log('   2. Add more schedules if needed')
    console.log('   3. Test the registration popup')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

main()
  .finally(() => prisma.$disconnect())
