/**
 * Test script to fetch ClickFunnels tag IDs
 * Run with: node test-clickfunnels-tags.js
 */

// Load environment variables
require('dotenv').config()

async function testFetchTags() {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  if (!apiKey || !workspaceId) {
    console.error('❌ Missing ClickFunnels credentials!')
    console.log('Please set CLICKFUNNELS_API_KEY and CLICKFUNNELS_WORKSPACE_ID in .env')
    process.exit(1)
  }

  console.log('🔍 Fetching tags from ClickFunnels...')
  console.log(`   Workspace ID: ${workspaceId}`)
  console.log(`   API Key: ${apiKey.substring(0, 10)}...`)
  console.log('')

  try {
    // Try different possible endpoints
    const allTags = []
    let page = 1
    const pageSize = 100
    let hasMore = true

    while (hasMore) {
      const listUrl = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts/tags?page[number]=${page}&page[size]=${pageSize}`
      console.log(`Calling: ${listUrl}`)

      const response = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, response.statusText)
        console.error('   Details:', errorText)
        process.exit(1)
      }

      const data = await response.json()
      const tags = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : data.tags || []

      allTags.push(...tags)

      const meta = data?.meta || {}
      const total = meta?.total ?? allTags.length
      const fetchedSoFar = allTags.length

      if (fetchedSoFar >= total || tags.length === 0) {
        hasMore = false
      } else {
        page += 1
      }
    }

    console.log(`✅ Found ${allTags.length} tags:\n`)

    // Look for registration timing tags specifically
    const timingTags = ['24HRREMINDER', '2HRREMINDER', '1HRREMINDER', '15MINREMINDER', 'WESTARTED']
    const foundTimingTags = {}
    const envTimingTags = timingTags.reduce((acc, tag) => {
      const envKey = `CLICKFUNNELS_TAG_${tag}`
      if (process.env[envKey]) {
        acc[tag] = process.env[envKey]
      }
      return acc
    }, {})

    console.log('📋 ALL TAGS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    allTags.forEach(tag => {
      const isTimingTag = timingTags.includes(tag.name)
      const marker = isTimingTag ? '🎯' : '  '
      console.log(`${marker} ${tag.name.padEnd(30)} (ID: ${tag.id})`)
      
      if (isTimingTag) {
        foundTimingTags[tag.name] = tag.id
      }
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Show registration timing tags
    console.log('🏷️  REGISTRATION TIMING TAGS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    timingTags.forEach(tagName => {
      const id = foundTimingTags[tagName]
      if (id) {
        console.log(`✅ ${tagName.padEnd(20)} → ID: ${id}`)
      } else if (envTimingTags[tagName]) {
        console.log(`⚠️ ${tagName.padEnd(20)} → Not discovered via API, but .env override is set to ${envTimingTags[tagName]}`)
      } else {
        console.log(`❌ ${tagName.padEnd(20)} → NOT FOUND (create this tag!)`)
      }
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Generate environment variables suggestion
    if (Object.keys(foundTimingTags).length > 0) {
      console.log('💡 Add these to your .env file:\n')
      Object.entries(foundTimingTags).forEach(([name, id]) => {
        const envKey = `CLICKFUNNELS_TAG_${name.replace('HRREMINDER', 'HR').replace('MINREMINDER', 'MIN')}`
        console.log(`${envKey}=${id}`)
      })
      console.log('')
    }

    // Check for missing tags
    const missingTags = timingTags.filter(name => !foundTimingTags[name])
    if (missingTags.length > 0) {
      console.log('⚠️  Missing Tags:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('Please create these tags in ClickFunnels:')
      missingTags.forEach(name => {
        console.log(`   - ${name}`)
      })
      console.log('\nGo to: ClickFunnels → Settings → Tags → Create Tag')
      console.log('')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testFetchTags()
