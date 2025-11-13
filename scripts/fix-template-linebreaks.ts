/**
 * Fix Template Line Breaks Script
 * 
 * This script fixes JavaScript syntax errors in thank-you templates stored in the database.
 * It removes line breaks from string literals that break JavaScript syntax.
 * 
 * Run with: npx tsx scripts/fix-template-linebreaks.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTemplateLineBreaks() {
  console.log('🔧 Starting template line break fix...\n')

  try {
    // Get all templates
    const templates = await prisma.thankYouTemplate.findMany()
    console.log(`📋 Found ${templates.length} templates to check\n`)

    let fixedCount = 0

    for (const template of templates) {
      let htmlContent = template.htmlCode
      let wasFixed = false

      // Fix 1: Remove line breaks in string literals with {{referralLink}}
      // Pattern: "text\n" + "{{referralLink}}" -> "text " + "{{referralLink}}"
      const pattern1 = /(".*?)\n\s*("\s*\+\s*"{{referralLink}}")/g
      if (htmlContent.match(pattern1)) {
        htmlContent = htmlContent.replace(pattern1, '$1 $2')
        wasFixed = true
        console.log(`  ✓ Fixed pattern 1 in template: ${template.name}`)
      }

      // Fix 2: Remove line breaks in string literals with {{referralLink}} (without +)
      // Pattern: "text\n{{referralLink}}" -> "text {{referralLink}}"
      const pattern2 = /(".*?)\n\s*({{referralLink}}")/g
      if (htmlContent.match(pattern2)) {
        htmlContent = htmlContent.replace(pattern2, '$1 $2')
        wasFixed = true
        console.log(`  ✓ Fixed pattern 2 in template: ${template.name}`)
      }

      // Fix 3: General fix for line breaks in shareOnWhatsApp function
      // Look for the specific problematic pattern
      const shareOnWhatsAppPattern = /const shareText = "((?:[^"]|\\")*?)\n\s*(".*?"{{referralLink}}")/g
      if (htmlContent.match(shareOnWhatsAppPattern)) {
        htmlContent = htmlContent.replace(shareOnWhatsAppPattern, 'const shareText = "$1 $2')
        wasFixed = true
        console.log(`  ✓ Fixed shareOnWhatsApp in template: ${template.name}`)
      }

      // Update the template if it was fixed
      if (wasFixed) {
        await prisma.thankYouTemplate.update({
          where: { id: template.id },
          data: { htmlCode: htmlContent },
        })
        fixedCount++
        console.log(`✅ Updated template: ${template.name}\n`)
      } else {
        console.log(`✓ Template OK: ${template.name}`)
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} out of ${templates.length} templates`)
    console.log('✅ Done!')

  } catch (error) {
    console.error('❌ Error fixing templates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixTemplateLineBreaks()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
