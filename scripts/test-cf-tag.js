// Test ClickFunnels tag application directly
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CLICKFUNNELS_API_BASE = 'https://api.myclickfunnels.com/api/v2';

async function findContactByEmail(email, apiKey, workspaceId) {
  const url = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts?filter[email_address]=${encodeURIComponent(email)}`;
  console.log('🔍 Searching for contact:', url);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  console.log('📇 Contact search result:', JSON.stringify(data, null, 2));
  
  const contacts = Array.isArray(data) ? data : data?.contacts || [];
  return contacts[0] || null;
}

async function searchTag(tagName, apiKey, workspaceId) {
  const url = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/tags?filter[name]=${encodeURIComponent(tagName)}`;
  console.log('🔍 Searching for tag:', url);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  console.log('🏷️ Tag search result:', JSON.stringify(data, null, 2));
  
  const tags = Array.isArray(data) ? data : data?.data || [];
  return tags.find(t => t.name === tagName) || tags[0] || null;
}

async function applyTagToContact(contactId, tagId, apiKey, workspaceId) {
  const url = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/${contactId}/applied_tags`;
  console.log('📌 Applying tag:', { contactId, tagId, url });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      contacts_applied_tag: {
        tag_id: tagId
      }
    })
  });
  
  const text = await response.text();
  console.log('📬 Apply tag response:', response.status, text);
  return response.ok;
}

async function main() {
  const email = process.argv[2] || 'arfarheen43@gmail.com';
  const tagName = process.argv[3] || 'UM-WebinarMostlyAttended';
  
  const apiKey = process.env.CLICKFUNNELS_API_KEY;
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID;
  
  if (!apiKey || !workspaceId) {
    console.log('❌ CLICKFUNNELS_API_KEY or CLICKFUNNELS_WORKSPACE_ID not set');
    console.log('   API Key:', apiKey ? 'set' : 'NOT SET');
    console.log('   Workspace:', workspaceId ? 'set' : 'NOT SET');
    return;
  }
  
  console.log('\n📧 Email:', email);
  console.log('🏷️ Tag Name:', tagName);
  console.log('');
  
  // Step 1: Find contact
  console.log('\n=== STEP 1: Find Contact ===');
  const contact = await findContactByEmail(email, apiKey, workspaceId);
  if (!contact) {
    console.log('❌ Contact not found in ClickFunnels');
    return;
  }
  console.log('✅ Contact found:', contact.id, contact.email_address);
  console.log('   Current tags:', contact.tags?.map(t => t.name).join(', ') || 'none');
  
  // Step 2: Find tag
  console.log('\n=== STEP 2: Find Tag ===');
  const tag = await searchTag(tagName, apiKey, workspaceId);
  if (!tag) {
    console.log('❌ Tag not found in ClickFunnels:', tagName);
    console.log('   You may need to create this tag first');
    return;
  }
  console.log('✅ Tag found:', tag.id, tag.name);
  
  // Check if already has tag
  const hasTag = contact.tags?.some(t => String(t.id) === String(tag.id));
  if (hasTag) {
    console.log('\n✨ Contact already has this tag!');
    return;
  }
  
  // Step 3: Apply tag (optional - add --apply flag)
  if (process.argv.includes('--apply')) {
    console.log('\n=== STEP 3: Apply Tag ===');
    const success = await applyTagToContact(contact.id, tag.id, apiKey, workspaceId);
    if (success) {
      console.log('✅ Tag applied successfully!');
    } else {
      console.log('❌ Failed to apply tag');
    }
  } else {
    console.log('\n💡 Add --apply flag to actually apply the tag');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
