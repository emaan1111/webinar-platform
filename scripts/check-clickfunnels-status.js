/**
 * Report Script: Check ClickFunnels Tags and Post-Webinar SMS Status
 * 
 * This script ONLY reports issues, doesn't fix them automatically.
 * Use this first to see what needs fixing before running the fix script.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('📊 Generating ClickFunnels Tags & SMS Report...\n')
  
  const issues = {
    numericTags: [],
    missingSMS: []
  }

  // ============================================
  // Check for Numeric Tag IDs
  // ============================================
  console.log('🔍 Checking ClickFunnels Tags...\n')
  
  const allTags = await prisma.clickFunnelsReminderTag.findMany({
    where: {
      status: 'SENT',
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

  for (const tag of allTags) {
    const isNumericId = /^\d+$/.test(tag.tagName)
    
    if (isNumericId) {
      issues.numericTags.push({
        id: tag.id,
        tagName: tag.tagName,
        registrationId: tag.registrationId,
        email: tag.registration.email,
        name: tag.registration.name,
        webinar: tag.registration.webinar.title,
        appliedAt: tag.appliedAt,
        scheduledFor: tag.scheduledFor
      })
    }
  }

  console.log(`Found ${issues.numericTags.length} tags with numeric IDs\n`)

  // ============================================
  // Check for Missing Post-Webinar SMS
  // ============================================
  console.log('🔍 Checking Post-Webinar SMS...\n')
  
  const postWebinarReminders = await prisma.webinarReminderSent.findMany({
    where: {
      type: 'post_webinar',
      status: {
        in: ['PENDING', 'FAILED']
      },
      scheduledFor: {
        lte: new Date()
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
              title: true,
              duration: true
            }
          }
        }
      },
      template: {
        select: {
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

  for (const reminder of postWebinarReminders) {
    if (!reminder.registration.phone) continue
    
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

    if (meetsWatchCriteria && (reminder.template?.channel === 'SMS' || reminder.template?.channel === 'BOTH')) {
      issues.missingSMS.push({
        id: reminder.id,
        registrationId: reminder.registrationId,
        email: reminder.registration.email,
        name: reminder.registration.name,
        phone: reminder.registration.phone,
        webinar: reminder.registration.webinar.title,
        watchMinutes,
        watchPercentage,
        status: reminder.status,
        errorMessage: reminder.errorMessage,
        scheduledFor: reminder.scheduledFor,
        retryCount: reminder.retryCount,
        clickFunnelsTag: reminder.template.clickFunnelsTag,
        applyTag: reminder.template.applyClickFunnelsTag
      })
    }
  }

  console.log(`Found ${issues.missingSMS.length} post-webinar SMS that should be sent\n`)

  // ============================================
  // Generate Report
  // ============================================
  console.log('\n' + '='.repeat(80))
  console.log('📋 DETAILED REPORT')
  console.log('='.repeat(80) + '\n')

  if (issues.numericTags.length > 0) {
    console.log('❌ NUMERIC TAG IDs FOUND:')
    console.log('-'.repeat(80))
    issues.numericTags.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. Tag ID in DB: ${issue.id}`)
      console.log(`   Tag Name (WRONG): "${issue.tagName}" ← This is a numeric ID!`)
      console.log(`   Contact: ${issue.name} (${issue.email})`)
      console.log(`   Webinar: ${issue.webinar}`)
      console.log(`   Applied: ${issue.appliedAt?.toISOString() || 'N/A'}`)
      console.log(`   Registration ID: ${issue.registrationId}`)
      console.log(`   💡 Action Needed: Cannot determine intended tag from ID. Manual review required.`)
    })
    console.log('\n')
  } else {
    console.log('✅ No numeric tag IDs found!\n')
  }

  if (issues.missingSMS.length > 0) {
    console.log('📱 MISSING POST-WEBINAR SMS:')
    console.log('-'.repeat(80))
    issues.missingSMS.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. Reminder ID: ${issue.id}`)
      console.log(`   Contact: ${issue.name} (${issue.email})`)
      console.log(`   Phone: ${issue.phone}`)
      console.log(`   Webinar: ${issue.webinar}`)
      console.log(`   Watch Time: ${issue.watchMinutes} min (${issue.watchPercentage}%)`)
      console.log(`   Status: ${issue.status}`)
      console.log(`   Scheduled: ${issue.scheduledFor.toISOString()}`)
      console.log(`   Error: ${issue.errorMessage || 'None'}`)
      console.log(`   Retry Count: ${issue.retryCount}`)
      if (issue.applyTag && issue.clickFunnelsTag) {
        console.log(`   CF Tag: ${issue.clickFunnelsTag}`)
      }
    })
    console.log('\n')
  } else {
    console.log('✅ No missing post-webinar SMS found!\n')
  }

  // ============================================
  // Summary
  // ============================================
  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log(`\nTotal ClickFunnels Tags Checked: ${allTags.length}`)
  console.log(`  ❌ Numeric IDs Found: ${issues.numericTags.length}`)
  console.log(`  ✅ Valid Tags: ${allTags.length - issues.numericTags.length}`)
  console.log(`\nTotal Post-Webinar Reminders Checked: ${postWebinarReminders.length}`)
  console.log(`  ❌ Missing SMS: ${issues.missingSMS.length}`)
  console.log(`  ✅ Already Sent/Not Needed: ${postWebinarReminders.length - issues.missingSMS.length}`)

  console.log('\n' + '='.repeat(80))
  console.log('💡 NEXT STEPS')
  console.log('='.repeat(80) + '\n')

  if (issues.numericTags.length > 0) {
    console.log('For Numeric Tag IDs:')
    console.log('  1. Review the tags listed above')
    console.log('  2. Check your ClickFunnels account to see what tags exist')
    console.log('  3. Manually apply the correct tag names to these contacts')
    console.log('  4. Update the database records with the correct tag names')
    console.log('  OR')
    console.log('  5. Delete the incorrect tag records and let the system re-tag them\n')
  }

  if (issues.missingSMS.length > 0) {
    console.log('For Missing SMS:')
    console.log('  1. Review why they failed (check error messages)')
    console.log('  2. Run the fix script to retry sending: node scripts/fix-clickfunnels-tags.js')
    console.log('  OR')
    console.log('  3. Manually send them from the dashboard\n')
  }

  if (issues.numericTags.length === 0 && issues.missingSMS.length === 0) {
    console.log('✨ Everything looks good! No action needed.\n')
  }

  await prisma.$disconnect()
}

main()
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
