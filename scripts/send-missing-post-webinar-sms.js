/**
 * Send Missing Post-Webinar SMS
 * 
 * This script finds all attendees who should have received post-webinar SMS
 * based on configured criteria (watch time, percentage) but didn't, and sends them now.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting Post-Webinar SMS Send Process...\n')
  
  const stats = {
    webinarsChecked: 0,
    templatesFound: 0,
    attendeesEligible: 0,
    smsSent: 0,
    smsFailed: 0,
    smsSkipped: 0,
    tagsFailed: 0
  }

  // Find all ENDED webinars
  const endedWebinars = await prisma.webinar.findMany({
    where: {
      status: 'ENDED'
    },
    include: {
      reminderTemplates: {
        where: {
          type: 'post_webinar',
          isActive: true,
          channel: {
            in: ['SMS', 'BOTH']
          }
        }
      },
      registrations: {
        where: {
          attended: true
        },
        include: {
          reminders: {
            where: {
              type: 'post_webinar'
            }
          },
          sessions: true
        }
      }
    }
  })

  console.log(`📊 Found ${endedWebinars.length} ended webinars\n`)
  stats.webinarsChecked = endedWebinars.length

  for (const webinar of endedWebinars) {
    if (webinar.reminderTemplates.length === 0) {
      console.log(`⏭️  Skipping "${webinar.title}" - no post-webinar SMS templates configured`)
      continue
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log(`📌 Processing: ${webinar.title}`)
    console.log(`   Webinar ID: ${webinar.id}`)
    console.log(`   Duration: ${webinar.duration || 60} minutes`)
    console.log(`   Attendees: ${webinar.registrations.length}`)
    console.log(`   Post-Webinar Templates: ${webinar.reminderTemplates.length}`)

    for (const template of webinar.reminderTemplates) {
      stats.templatesFound++
      
      console.log(`\n   📱 Template: ${template.id}`)
      console.log(`      Channel: ${template.channel}`)
      console.log(`      Timing: ${template.minutesAfter || 0} minutes after`)
      
      if (template.minWatchedMinutes) {
        console.log(`      Criteria: Watched ${template.minWatchedMinutes}+ minutes`)
      } else if (template.minWatchedPercentage) {
        console.log(`      Criteria: Watched ${template.minWatchedPercentage}%+`)
      } else {
        console.log(`      Criteria: Just attended`)
      }
      
      if (template.applyClickFunnelsTag && template.clickFunnelsTag) {
        console.log(`      CF Tag: ${template.clickFunnelsTag}`)
      }

      if (!template.smsBody || !template.smsBody.trim()) {
        console.log(`      ⚠️  No SMS message configured, skipping`)
        continue
      }

      // Find eligible attendees who haven't received this template
      for (const registration of webinar.registrations) {
        // Check if they already received a post-webinar reminder
        const alreadySent = registration.reminders.some(r => 
          r.status === 'SENT' && r.templateId === template.id
        )

        if (alreadySent) {
          continue // Skip, already sent
        }

        // Check if they have a phone number
        if (!registration.phone || !registration.phone.trim()) {
          stats.smsSkipped++
          continue
        }

        // Check if they meet watch criteria
        const watchMinutes = Math.floor((registration.lastWatchedPosition || 0) / 60)
        const webinarDuration = webinar.duration || 60
        const watchPercentage = Math.round((watchMinutes / webinarDuration) * 100)
        
        let meetsWatchCriteria = false
        
        if (template.minWatchedMinutes) {
          meetsWatchCriteria = watchMinutes >= template.minWatchedMinutes
        } else if (template.minWatchedPercentage) {
          meetsWatchCriteria = watchPercentage >= template.minWatchedPercentage
        } else {
          meetsWatchCriteria = registration.attended
        }

        if (!meetsWatchCriteria) {
          stats.smsSkipped++
          continue
        }

        // Eligible! Send SMS
        stats.attendeesEligible++
        
        console.log(`\n      📤 Sending to: ${registration.name} (${registration.email})`)
        console.log(`         Phone: ${registration.phone}`)
        console.log(`         Watch Time: ${watchMinutes} min (${watchPercentage}%)`)

        try {
          // Import SMS sending function
          const { sendSMS } = await import('../src/lib/twilio')
          
          // Replace placeholders in SMS message
          let smsMessage = template.smsBody
          smsMessage = smsMessage.replace(/\{name\}/g, registration.name)
          smsMessage = smsMessage.replace(/\{first_name\}/g, registration.name.split(' ')[0])
          smsMessage = smsMessage.replace(/\{webinar_title\}/g, webinar.title)
          smsMessage = smsMessage.replace(/\{email\}/g, registration.email)
          
          console.log(`         Message: "${smsMessage.substring(0, 60)}${smsMessage.length > 60 ? '...' : ''}"`)
          
          // Send SMS
          const smsResult = await sendSMS(registration.phone, smsMessage)
          
          if (smsResult.success) {
            console.log(`         ✅ SMS sent successfully!`)
            stats.smsSent++
            
            // Create a reminder record
            await prisma.webinarReminderSent.create({
              data: {
                registrationId: registration.id,
                templateId: template.id,
                type: 'post_webinar',
                channel: template.channel,
                status: 'SENT',
                sentAt: new Date(),
                scheduledFor: new Date(), // Already past
                smsSentTo: registration.phone
              }
            })
            
            // Apply ClickFunnels tag if configured
            if (template.applyClickFunnelsTag && template.clickFunnelsTag) {
              console.log(`         🏷️  Applying CF tag: ${template.clickFunnelsTag}`)
              
              const { applyReminderTagToContact } = await import('../src/lib/clickfunnels')
              const tagSuccess = await applyReminderTagToContact(
                registration.email,
                template.clickFunnelsTag
              )
              
              if (tagSuccess) {
                console.log(`         ✅ Tag applied successfully`)
              } else {
                console.log(`         ⚠️  Tag application failed`)
                stats.tagsFailed++
              }
            }
            
          } else {
            console.log(`         ❌ SMS failed: ${smsResult.error}`)
            stats.smsFailed++
            
            // Create a failed reminder record
            await prisma.webinarReminderSent.create({
              data: {
                registrationId: registration.id,
                templateId: template.id,
                type: 'post_webinar',
                channel: template.channel,
                status: 'FAILED',
                scheduledFor: new Date(),
                errorMessage: smsResult.error || 'SMS sending failed',
                retryCount: 1
              }
            })
          }
          
        } catch (error) {
          console.log(`         ❌ Error: ${error.message}`)
          stats.smsFailed++
          
          // Create a failed reminder record
          await prisma.webinarReminderSent.create({
            data: {
              registrationId: registration.id,
              templateId: template.id,
              type: 'post_webinar',
              channel: template.channel,
              status: 'FAILED',
              scheduledFor: new Date(),
              errorMessage: error.message,
              retryCount: 1
            }
          }).catch(err => {
            console.log(`         ⚠️  Could not create reminder record: ${err.message}`)
          })
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`)
  console.log(`📊 FINAL SUMMARY`)
  console.log(`${'='.repeat(80)}`)
  console.log(`\nWebinars:`)
  console.log(`  ✓ Total Checked: ${stats.webinarsChecked}`)
  console.log(`  ✓ Templates Found: ${stats.templatesFound}`)
  console.log(`\nAttendees:`)
  console.log(`  ✓ Eligible for SMS: ${stats.attendeesEligible}`)
  console.log(`  ✓ SMS Sent: ${stats.smsSent}`)
  console.log(`  ✗ SMS Failed: ${stats.smsFailed}`)
  console.log(`  ⏭  SMS Skipped: ${stats.smsSkipped}`)
  console.log(`\nClickFunnels Tags:`)
  console.log(`  ✗ Tag Failures: ${stats.tagsFailed}`)
  console.log(`\n✨ Process Complete!\n`)

  if (stats.smsFailed > 0) {
    console.log(`⚠️  WARNING: ${stats.smsFailed} SMS messages failed to send`)
    console.log(`   Check the errors above and the database for details\n`)
  }

  if (stats.smsSent === 0 && stats.attendeesEligible === 0) {
    console.log(`ℹ️  INFO: No eligible attendees found`)
    console.log(`   This could mean:`)
    console.log(`   1. All attendees already received their SMS`)
    console.log(`   2. No attendees met the watch criteria`)
    console.log(`   3. No attendees have phone numbers`)
    console.log(`   4. No post-webinar SMS templates are configured\n`)
  }

  await prisma.$disconnect()
}

main()
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
