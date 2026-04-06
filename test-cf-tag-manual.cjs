// Test script to manually try tagging a contact
require('dotenv').config();

const apiKey = process.env.CLICKFUNNELS_API_KEY;
const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID;
const CLICKFUNNELS_API_BASE = 'https://api.clickfunnels.com/api/v2';

// Test email and tag
const testEmail = 'ayeshafomar786@gmail.com';
const testTagName = 'UM-WebinarMostlyAttended';

async function testTagging() {
  console.log('='.repeat(60));
  console.log('Testing ClickFunnels Tagging');
  console.log('='.repeat(60));
  console.log('API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
  console.log('Workspace ID:', workspaceId);
  console.log('Test Email:', testEmail);
  console.log('Test Tag:', testTagName);
  console.log('');

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    // Step 1: Find contact
    console.log('Step 1: Finding contact...');
    const searchUrl = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts?filter[email_address]=${encodeURIComponent(testEmail)}`;
    const contactRes = await fetch(searchUrl, { headers });
    
    if (!contactRes.ok) {
      console.error('Contact search failed:', contactRes.status, await contactRes.text());
      return;
    }
    
    const contacts = await contactRes.json();
    if (!contacts || contacts.length === 0) {
      console.error('Contact not found!');
      return;
    }
    
    const contact = contacts[0];
    console.log('✅ Found contact ID:', contact.id);
    
    // Step 2: Find or create tag
    console.log('\nStep 2: Finding tag...');
    const tagSearchUrl = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/tags?filter[name]=${encodeURIComponent(testTagName)}`;
    const tagRes = await fetch(tagSearchUrl, { headers });
    
    if (!tagRes.ok) {
      console.error('Tag search failed:', tagRes.status, await tagRes.text());
      return;
    }
    
    const tags = await tagRes.json();
    let tagId;
    
    if (tags && tags.length > 0) {
      tagId = tags[0].id;
      console.log('✅ Found tag ID:', tagId);
    } else {
      console.log('Tag not found, creating...');
      const createTagRes = await fetch(`${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/tags`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contacts_tag: { name: testTagName, color: '#EEEEEE' }
        })
      });
      
      if (!createTagRes.ok) {
        console.error('Tag creation failed:', createTagRes.status, await createTagRes.text());
        return;
      }
      
      const newTag = await createTagRes.json();
      tagId = newTag.id;
      console.log('✅ Created tag ID:', tagId);
    }
    
    // Step 3: Apply tag
    console.log('\nStep 3: Applying tag to contact...');
    const applyUrl = `${CLICKFUNNELS_API_BASE}/contacts/${contact.id}/applied_tags`;
    const applyRes = await fetch(applyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contacts_applied_tag: { tag_id: tagId }
      })
    });
    
    console.log('Apply response status:', applyRes.status);
    const applyResult = await applyRes.text();
    console.log('Apply response:', applyResult);
    
    if (applyRes.ok || (applyRes.status === 422 && applyResult.includes('already been taken'))) {
      console.log('\n✅ Tag applied successfully (or already exists)!');
    } else {
      console.error('\n❌ Failed to apply tag');
    }
    
    // Step 4: Verify by getting contact's tags
    console.log('\nStep 4: Verifying contact tags...');
    const verifyUrl = `${CLICKFUNNELS_API_BASE}/contacts/${contact.id}/applied_tags`;
    const verifyRes = await fetch(verifyUrl, { headers });
    
    if (verifyRes.ok) {
      const appliedTags = await verifyRes.json();
      console.log('Applied tags on contact:');
      for (const at of appliedTags.slice(0, 15)) {
        console.log(`  - ${at.tag?.name || 'Unknown'} (ID: ${at.tag_id})`);
      }
      
      const hasOurTag = appliedTags.some(t => t.tag?.name === testTagName || t.tag_id === tagId);
      console.log(`\n${hasOurTag ? '✅' : '❌'} Tag "${testTagName}" is ${hasOurTag ? 'PRESENT' : 'NOT FOUND'} on contact`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.cause) console.error('Cause:', error.cause);
  }
}

testTagging();
