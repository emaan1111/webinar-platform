import 'dotenv/config'
import { syncWebinarRegistrationToClickFunnels } from '../src/lib/clickfunnels'

async function main() {
  const scheduledStartTime = new Date(Date.now() + 2 * 60 * 60 * 1000)

  const success = await syncWebinarRegistrationToClickFunnels({
    name: 'Existing Contact',
    email: 'arFarheen43@gmail.com',
    phone: '+1 555-111-2222',
    timezone: 'America/Los_Angeles',
    country: 'US',
    webinarId: 'cmhwvknlm0001jwauzd8qop5g',
    webinarTitle: 'How to Help Your Child Love Islam Without Force - Even When the Whole World is Pulling Them Away',
    scheduledStartTime,
    countdownLink: 'https://example.com/countdown/loveislam',
    referralLink: 'https://example.com/w/loveislam?ref=test',
    formattedWebinarTime: scheduledStartTime.toISOString(),
    formattedWebinarTimeLocal: scheduledStartTime.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      dateStyle: 'full',
      timeStyle: 'short'
    }),
    attendeeTimezoneLabel: 'Los Angeles, America'
  })

  console.log('Sync result:', success)
  process.exit(success ? 0 : 1)
}

main().catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})
