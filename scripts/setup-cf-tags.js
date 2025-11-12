#!/usr/bin/env node

/**
 * Helper script to create tags in ClickFunnels and get their IDs
 * Usage: node scripts/setup-cf-tags.js
 */

const CLICKFUNNELS_API_KEY = process.env.CLICKFUNNELS_API_KEY;
const CLICKFUNNELS_WORKSPACE_ID = process.env.CLICKFUNNELS_WORKSPACE_ID;

const TAGS_TO_CREATE = [
  { name: 'UM-Webinar-Registered', color: '#3B82F6', description: 'User registered for webinar' },
  { name: 'UM-Webinar-Attended', color: '#10B981', description: 'User attended webinar' },
  { name: 'UM-Webinar-MostlyAttended', color: '#8B5CF6', description: 'User watched until offer/CTA' },
  { name: 'UM-Webinar-PartlyAttended', color: '#F59E0B', description: 'User watched 40+ minutes' },
  { name: 'UM-Webinar-Missed', color: '#EF4444', description: 'User did not attend' },
  { name: 'UM-Webinar-ReplayAttended', color: '#6366F1', description: 'User watched replay' },
];

async function getExistingTags() {
  console.log('📋 Fetching existing tags from ClickFunnels...\n');
  
  const url = `https://api.myclickfunnels.com/api/v2/workspaces/${CLICKFUNNELS_WORKSPACE_ID}/contacts/tags`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CLICKFUNNELS_API_KEY}`,
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    console.error('❌ Failed to fetch tags:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('Error:', errorText);
    return [];
  }

  const result = await response.json();
  return result.data || result || [];
}

async function createTag(tagData) {
  console.log(`Creating tag: ${tagData.name}...`);
  
  const url = `https://api.myclickfunnels.com/api/v2/workspaces/${CLICKFUNNELS_WORKSPACE_ID}/contacts/tags`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLICKFUNNELS_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      contacts_tag: {
        name: tagData.name,
        color: tagData.color || '#EEEEEE',
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // If tag already exists, it's okay
    if (response.status === 422 && errorText.includes('already been taken')) {
      console.log(`   ⚠️ Tag "${tagData.name}" already exists`);
      return null;
    }
    
    console.error(`   ❌ Failed to create tag:`, response.status, errorText);
    return null;
  }

  const result = await response.json();
  console.log(`   ✅ Created with ID: ${result.id}`);
  return result;
}

async function main() {
  console.log('🏷️  ClickFunnels Tag Setup\n');
  console.log('=' .repeat(50));
  console.log('');

  if (!CLICKFUNNELS_API_KEY || !CLICKFUNNELS_WORKSPACE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   CLICKFUNNELS_API_KEY');
    console.error('   CLICKFUNNELS_WORKSPACE_ID');
    console.error('\nPlease set these in your .env file');
    process.exit(1);
  }

  try {
    // Get existing tags
    const existingTags = await getExistingTags();
    const existingTagNames = existingTags.map(t => t.name);
    
    console.log(`Found ${existingTags.length} existing tags\n`);
    console.log('=' .repeat(50));
    console.log('');

    // Create or find each tag
    const tagMapping = {};
    
    for (const tagData of TAGS_TO_CREATE) {
      const existing = existingTags.find(t => t.name === tagData.name);
      
      if (existing) {
        console.log(`✅ ${tagData.name}`);
        console.log(`   Already exists with ID: ${existing.id}\n`);
        tagMapping[tagData.name] = existing.id;
      } else {
        const created = await createTag(tagData);
        if (created) {
          tagMapping[tagData.name] = created.id;
        }
        console.log('');
      }
    }

    // Print summary
    console.log('=' .repeat(50));
    console.log('\n📝 Add these to your .env file:\n');
    console.log('# ClickFunnels Tag IDs');
    console.log(`CLICKFUNNELS_TAG_REGISTERED="${tagMapping['UM-Webinar-Registered'] || ''}"`);
    console.log(`CLICKFUNNELS_TAG_ATTENDED="${tagMapping['UM-Webinar-Attended'] || ''}"`);
    console.log(`CLICKFUNNELS_TAG_MOSTLY_ATTENDED="${tagMapping['UM-Webinar-MostlyAttended'] || ''}"`);
    console.log(`CLICKFUNNELS_TAG_PARTLY_ATTENDED="${tagMapping['UM-Webinar-PartlyAttended'] || ''}"`);
    console.log(`CLICKFUNNELS_TAG_MISSED="${tagMapping['UM-Webinar-Missed'] || ''}"`);
    console.log(`CLICKFUNNELS_TAG_REPLAY_ATTENDED="${tagMapping['UM-Webinar-ReplayAttended'] || ''}"`);
    console.log('');

    console.log('✅ Setup complete! Copy the above lines to your .env file\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
