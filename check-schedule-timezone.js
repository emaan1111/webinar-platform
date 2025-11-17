const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSchedules() {
  try {
    const schedules = await prisma.webinarSchedule.findMany({
      where: {
        scheduleType: 'specific'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
    
    console.log('\n📊 Recent Specific Schedules:\n')
    
    for (const schedule of schedules) {
      console.log('---')
      console.log('ID:', schedule.id)
      console.log('Webinar ID:', schedule.webinarId)
      console.log('Schedule Type:', schedule.scheduleType)
      console.log('Scheduled At (UTC in DB):', schedule.scheduledAt)
      console.log('Timezone Field:', schedule.timezone)
      console.log('Use User Timezone:', schedule.useUserTimezone)
      console.log('Created At:', schedule.createdAt)
      console.log('')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchedules()
