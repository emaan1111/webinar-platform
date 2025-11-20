/**
 * Cleanup Script: Fix ClickFunnels Tags and Missing Post-Webinar SMS
 * 
 * This script:
 * 1. Finds all ClickFunnels reminder tags that were applied with numeric IDs
 * 2. Re-applies them with proper tag names
 * 3. Checks for post-webinar SMS that should have been sent but weren't
 * 4. Sends any missing post-webinar SMS
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import the fixed function
const { applyReminderTagToContact } = require('../src/lib/clickfunnels')

async function main() {
  console.log('🔧 Starting ClickFunnels Tag Cleanup...\n')
  
  const stats = {
    tagsChecked: 0,
    tagsFixed: 0,
    tagsFailed: 0,
    smsChecked: 0,
    smsSent: 0,
    smsFailed: 0
  }

  // ============================================
  // PART 1: Fix Numeric Tag IDs
  // ============================================
  console.log('📋 PART 1: Checking ClickFunnels Reminder Tags for Numeric IDs...\n')
  
  const allTags = await prisma.clickFunnelsReminderTag.findMany({
    where: {
      status: 'SENT', // Only check tags that were "successfully" applied
    },
    include: {
      registration: {
        select: {
          email: true,
          name: true,
          webinar: {
            select: {
              title: true
            }
          }
        }
      }
    },
    orderBy: {
      appliedAt: 'desc'
    }
  })

  console.log(`Found ${allTags.length} applied tags to check\n`)

  for (const tag of allTags) {
    stats.tagsChecked++
    
    // Check if tagName is numeric (the bug)
    const isNumericId = /^\d+$/.test(tag.tagName)
    
    if (isNumericId) {
      console.log(`❌ Found numeric tag ID: ${tag.tagName}`)
      console.log(`   Contact: ${tag.registration.name} (${tag.registration.email})`)
      console.log(`   Webinar: ${tag.registration.webinar.title}`)
      console.log(`   Applied: ${tag.appliedAt ? tag.appliedAt.toISOString() : 'N/A'}`)
      
      // Try to determine what the tag SHOULD have been
      // Common post-webinar tags: ATTENDED, MOSTLY_ATTENDED, PARTLY_ATTENDED, MISSED
      console.log(`   ⚠️  Cannot automatically determine intended tag name from ID "${tag.tagName}"`)
      console.log(`   💡 Please manually update this tag in ClickFunnels or the database`)
      console.log(`   📝 Tag ID in database: ${tag.id}`)
      console.log(`   🔗 Registration ID: ${tag.registrationId}\n`)
      
      stats.tagsFailed++
      
      // Log to a file for manual review
      await prisma.clickFunnelsReminderTag.update({
        where: { id: tag.id },
        data: {
          errorMessage: `Tag was applied with numeric ID "${tag.tagName}" instead of tag name. Needs manual review.`
        }
      })
    } else {
      // Tag looks good
      if (stats.tagsChecked % 50 === 0) {
        console.log(`✓ Checked ${stats.tagsChecked} tags...`)
      }
    }
  }

  console.log(`\n✅ Tag Check Complete:`)
  console.log(`   Total Checked: ${stats.tagsChecked}`)
  console.log(`   Numeric IDs Found: ${stats.tagsFailed}`)
  console.log(`   Valid Tags: ${stats.tagsChecked - stats.tagsFailed}\n`)

  // ============================================
  // PART 2: Check Missing Post-Webinar SMS
  // ============================================
  console.log('📱 PART 2: Checking for Missing Post-Webinar SMS...\n')
  
  // Find all post-webinar reminders that should have been sent
  const postWebinarReminders = await prisma.webinarReminderSent.findMany({
    where: {
      type: 'post_webinar',
      OR: [
        { status: 'PENDING' }, // Never processed
        { status: 'FAILED' }   // Failed to send
      ],
      scheduledFor: {
        lte: new Date() // Should have been sent by now
      }
    },
    include: {
      registration: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          lastWatchedPosition: true,
          attended: true,
          webinar: {
            select: {
              id: true,
              title: true,
              duration: true
            }
          }
        }
      },
      template: {
        select: {
          id: true,
          smsBody: true,
          channel: true,
          minWatchedMinutes: true,
          minWatchedPercentage: true,
          applyClickFunnelsTag: true,
          clickFunnelsTag: true
        }
      }
    },
    orderBy: {
      scheduledFor: 'asc'
    }
  })

  console.log(`Found ${postWebinarReminders.length} post-webinar reminders to check\n`)

  for (const reminder of postWebinarReminders) {
    stats.smsChecked++
    
    // Check if contact has phone number
    if (!reminder.registration.phone) {
      console.log(`⏭️  Skipping ${reminder.registration.name} - no phone number`)
      continue
    }

    // Check if they meet the watch criteria
    const watchMinutes = Math.floor((reminder.registration.lastWatchedPosition || 0) / 60)
    const webinarDuration = reminder.registration.webinar.duration || 60
    const watchPercentage = Math.round((watchMinutes / webinarDuration) * 100)
    
    let meetsWatchCriteria = false
    
    if (reminder.template?.minWatchedMinutes) {
      meetsWatchCriteria = watchMinutes >= reminder.template.minWatchedMinutes
    } else if (reminder.template?.minWatchedPercentage) {
      meetsWatchCriteria = watchPercentage >= reminder.template.minWatchedPercentage
    } else {
      meetsWatchCriteria = reminder.registration.attended
    }

    if (!meetsWatchCriteria) {
      console.log(`⏭️  Skipping ${reminder.registration.name} - doesn't meet watch criteria (${watchMinutes}min / ${watchPercentage}%)`)
      continue
    }

    console.log(`\n📤 Processing post-webinar reminder for ${reminder.registration.name}`)
    console.log(`   Email: ${reminder.registration.email}`)
    console.log(`   Phone: ${reminder.registration.phone}`)
    console.log(`   Webinar: ${reminder.registration.webinar.title}`)
    console.log(`   Watch Time: ${watchMinutes} min (${watchPercentage}%)`)
    console.log(`   Status: ${reminder.status}`)
    console.log(`   Scheduled For: ${reminder.scheduledFor.toISOString()}`)

    // Try to send via the reminders API
    try {
      // Import the SMS sending function
      const { sendSMS } = await import('../src/lib/twilio')
      
      if (!reminder.template?.smsBody) {
        console.log(`   ⚠️  No SMS template body found, skipping SMS`)
      } else if (reminder.template.channel === 'SMS' || reminder.template.channel === 'BOTH') {
        // Replace placeholders in SMS
        let smsMessage = reminder.template.smsBody
        smsMessage = smsMessage.replace(/\{name\}/g, reminder.registration.name)
        smsMessage = smsMessage.replace(/\{webinar_title\}/g, reminder.registration.webinar.title)
        
        console.log(`   💬 Sending SMS: "${smsMessage.substring(0, 60)}${smsMessage.length > 60 ? '...' : ''}"`)
        
        const smsResult = await sendSMS(reminder.registration.phone, smsMessage)
        
        if (smsResult.success) {
          console.log(`   ✅ SMS sent successfully`)
          stats.smsSent++
          
          // Update reminder status
          await prisma.webinarReminderSent.update({
            where: { id: reminder.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              smsSentTo: reminder.registration.phone,
              errorMessage: null
            }
          })
          
          // Apply ClickFunnels tag if needed
          if (reminder.template.applyClickFunnelsTag && reminder.template.clickFunnelsTag) {
            console.log(`   🏷️  Applying ClickFunnels tag: ${reminder.template.clickFunnelsTag}`)
            const tagSuccess = await applyReminderTagToContact(
              reminder.registration.email,
              reminder.template.clickFunnelsTag
            )
            if (tagSuccess) {
              console.log(`   ✅ Tag applied successfully`)
            } else {
              console.log(`   ⚠️  Tag application failed`)
            }
          }
        } else {
          console.log(`   ❌ SMS failed: ${smsResult.error}`)
          stats.smsFailed++
          
          await prisma.webinarReminderSent.update({
            where: { id: reminder.id },
            data: {
              status: 'FAILED',
              errorMessage: smsResult.error || 'SMS sending failed',
              retryCount: { increment: 1 },
              lastRetryAt: new Date()
            }
          })
        }
      }
    } catch (error) {
      console.log(`   ❌ Error processing reminder: ${error.message}`)
      stats.smsFailed++
      
      await prisma.webinarReminderSent.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          retryCount: { increment: 1 },
          lastRetryAt: new Date()
        }
      })
    }
  }

  console.log(`\n✅ SMS Check Complete:`)
  console.log(`   Total Checked: ${stats.smsChecked}`)
  console.log(`   SMS Sent: ${stats.smsSent}`)
  console.log(`   SMS Failed: ${stats.smsFailed}`)
  console.log(`   Skipped: ${stats.smsChecked - stats.smsSent - stats.smsFailed}\n`)

  // ============================================
  // Summary
  // ============================================
  console.log('📊 FINAL SUMMARY')
  console.log('================')
  console.log(`\nClickFunnels Tags:`)
  console.log(`  ✓ Total Checked: ${stats.tagsChecked}`)
  console.log(`  ❌ Numeric IDs Found: ${stats.tagsFailed}`)
  console.log(`  ✓ Valid Tags: ${stats.tagsChecked - stats.tagsFailed}`)
  console.log(`\nPost-Webinar SMS:`)
  console.log(`  ✓ Total Checked: ${stats.smsChecked}`)
  console.log(`  ✓ SMS Sent: ${stats.smsSent}`)
  console.log(`  ❌ SMS Failed: ${stats.smsFailed}`)
  console.log(`\n✨ Cleanup Complete!\n`)

  if (stats.tagsFailed > 0) {
    console.log(`⚠️  WARNING: Found ${stats.tagsFailed} tags with numeric IDs`)
    console.log(`   These have been marked with error messages in the database`)
    console.log(`   Review them at: /dashboard/clickfunnels/tag-queue\n`)
  }

  await prisma.$disconnect()
}

main()
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
