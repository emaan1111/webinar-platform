const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function removeVideoFromCountdownTemplate() {
  console.log('🎬 Removing video section from countdown template...')

  try {
    // Get all countdown templates
    const templates = await prisma.countdownTemplate.findMany()
    
    console.log(`📋 Found ${templates.length} countdown templates`)

    for (const template of templates) {
      console.log(`\n🔍 Processing: ${template.name}`)
      
      let htmlCode = template.htmlCode
      let modified = false

      // Remove video container section (matches the pattern from the screenshot)
      const videoSectionRegex = /<div class="video-container">[\s\S]*?<\/div>\s*<\/div>\s*(?=<div class="bonus-card">|<\/div>\s*<\/div>\s*<\/section>)/gi
      
      if (htmlCode.match(videoSectionRegex)) {
        htmlCode = htmlCode.replace(videoSectionRegex, '')
        modified = true
        console.log('  ✅ Removed video-container section')
      }

      // Also remove if it's wrapped differently
      const videoContainerAlt = /<div class="video-container">[\s\S]*?<\/div>\s*<\/div>/gi
      if (htmlCode.match(videoContainerAlt)) {
        htmlCode = htmlCode.replace(videoContainerAlt, '')
        modified = true
        console.log('  ✅ Removed video-container (alternative pattern)')
      }

      // Remove video-related CSS
      const videoCssRegex = /\.video-container[\s\S]*?(?=\.|\n\s*<\/style>)/gi
      if (htmlCode.match(videoCssRegex)) {
        htmlCode = htmlCode.replace(videoCssRegex, '')
        modified = true
        console.log('  ✅ Removed video CSS')
      }

      // Remove video wrapper CSS
      const videoWrapperCss = /\.video-wrapper[\s\S]*?(?=\.|\n\s*<\/style>)/gi
      if (htmlCode.match(videoWrapperCss)) {
        htmlCode = htmlCode.replace(videoWrapperCss, '')
        modified = true
        console.log('  ✅ Removed video-wrapper CSS')
      }

      // Remove video player CSS
      const videoPlayerCss = /\.video-player[\s\S]*?(?=\.|\n\s*<\/style>)/gi
      if (htmlCode.match(videoPlayerCss)) {
        htmlCode = htmlCode.replace(videoPlayerCss, '')
        modified = true
        console.log('  ✅ Removed video-player CSS')
      }

      // Remove video controls CSS
      const videoControlsCss = /\.video-controls[\s\S]*?(?=\.|\n\s*<\/style>)/gi
      if (htmlCode.match(videoControlsCss)) {
        htmlCode = htmlCode.replace(videoControlsCss, '')
        modified = true
        console.log('  ✅ Removed video-controls CSS')
      }

      // Remove unmute prompt CSS
      const unmutePromptCss = /\.unmute-prompt[\s\S]*?(?=\.|\n\s*<\/style>)/gi
      if (htmlCode.match(unmutePromptCss)) {
        htmlCode = htmlCode.replace(unmutePromptCss, '')
        modified = true
        console.log('  ✅ Removed unmute-prompt CSS')
      }

      // Remove video placeholder CSS if exists
      const videoPlaceholderCss = /\.video-placeholder[\s\S]*?(?=\.|\n\s*<\/style>)/gi
      if (htmlCode.match(videoPlaceholderCss)) {
        htmlCode = htmlCode.replace(videoPlaceholderCss, '')
        modified = true
        console.log('  ✅ Removed video-placeholder CSS')
      }

      // Remove video-related JavaScript
      const videoJsRegex = /(const|var|let)\s+(video|playPauseBtn|muteBtn|unmutePrompt|videoProgress)[\s\S]*?(?=<\/script>|const |var |let |function )/gi
      if (htmlCode.match(videoJsRegex)) {
        htmlCode = htmlCode.replace(videoJsRegex, '')
        modified = true
        console.log('  ✅ Removed video JavaScript')
      }

      // Update grid layout to single column (remove video column)
      if (htmlCode.includes('grid-template-columns: 1fr 1fr') || htmlCode.includes('grid-template-columns:1fr 1fr')) {
        htmlCode = htmlCode.replace(/grid-template-columns:\s*1fr\s+1fr/gi, 'grid-template-columns: 1fr')
        modified = true
        console.log('  ✅ Updated grid to single column')
      }

      if (modified) {
        await prisma.countdownTemplate.update({
          where: { id: template.id },
          data: { htmlCode }
        })
        console.log(`  ✅ Updated template: ${template.name}`)
      } else {
        console.log(`  ℹ️  No video section found in: ${template.name}`)
      }
    }

    console.log('\n✅ Video removal complete!')
    console.log('🔄 Please restart your dev server for changes to take effect')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeVideoFromCountdownTemplate()
