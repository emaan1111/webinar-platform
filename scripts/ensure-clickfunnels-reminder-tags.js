#!/usr/bin/env node
'use strict'

require('dotenv').config()

const TAGS = ['24HRREMINDER', '2HRREMINDER', '1HRREMINDER', '15MINREMINDER', 'WESTARTED']
const API_BASE = 'https://api.myclickfunnels.com/api/v2'

const apiKey = process.env.CLICKFUNNELS_API_KEY
const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

if (!apiKey || !workspaceId) {
  console.error('❌ Missing CLICKFUNNELS_API_KEY or CLICKFUNNELS_WORKSPACE_ID in environment')
  process.exit(1)
}

async function fetchTagByName(tagName) {
  const url = `${API_BASE}/workspaces/${workspaceId}/contacts/tags?filter[name]=${encodeURIComponent(tagName)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch tag ${tagName}: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const tags = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : data.tags || []

  const tag = tags.find((t) => t.name?.toUpperCase() === tagName)
  return tag ? Number(tag.id) : null
}

async function createTag(tagName) {
  const url = `${API_BASE}/workspaces/${workspaceId}/contacts/tags`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contacts_tag: {
        name: tagName,
        color: '#FFD966'
      }
    })
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to create tag ${tagName}: ${response.status} ${body}`)
  }

  const data = await response.json()
  const id = Number(data?.id)
  if (Number.isNaN(id)) {
    throw new Error(`Unexpected response when creating tag ${tagName}: ${JSON.stringify(data)}`)
  }
  return id
}

async function ensureTag(tagName) {
  const existing = await fetchTagByName(tagName)
  if (existing) {
    console.log(`✅ ${tagName} already exists (ID ${existing})`)
    return existing
  }
  console.log(`➕ Creating tag ${tagName}...`)
  const id = await createTag(tagName)
  console.log(`✅ Created ${tagName} with ID ${id}`)
  return id
}

async function main() {
  try {
    const results = {}
    for (const tag of TAGS) {
      results[tag] = await ensureTag(tag)
    }

    console.log('\n🔑 Use these in your .env:')
    Object.entries(results).forEach(([name, id]) => {
      console.log(`CLICKFUNNELS_TAG_${name}=${id}`)
    })
  } catch (error) {
    console.error('❌ Error ensuring tags:', error.message)
    process.exit(1)
  }
}

main()
