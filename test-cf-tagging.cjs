require('dotenv').config();

const apiKey = process.env.CLICKFUNNELS_API_KEY;
const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID;
const testEmail = 'ayeshafomar786@gmail.com';
const testTag = 'UM-WebinarMostlyAttended';

const CLICKFUNNELS_API_BASE = 'https://api.clickfunnels.com/api/v2';

async function testTagging() {
  console.log('Testing ClickFunnels tagging...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('Workspace ID:', workspaceId || 'NOT SET');
  
  if (!apiKey || !workspaceId) {
    console.error('Missing API credentials!');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // 1. Find the contact
  console.log('\n1. Searching for contact:', testEmail);
  const searchUrl = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts?filter[email_address]=${encodeURIComponent(testEmail)}`;
  
  try {
    const contactRes = await fetch(searchUrl, { headers });
    console.log('Contact search status:', contactRes.status);
    
    if (!contactRes.ok) {
      console.error('Contact search failed:', await contactRes.text());
      return;
    }
    
    const contacts = await contactRes.json();
    console.log('Found contacts:', contacts.length || 0);
    
    if (!contacts.length) {
      console.log('Contact not found - would need to create');
      return;
    }
    
    const contact = contacts[0];
    console.log('Contact ID:', contact.id);
    console.log('Contact email:', contact.email_address);
    
    // 2. Find the tag
    console.log('\n2. Searching for tag:', testTag);
    const tagSearchUrl = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/tags?filter[name]=${encodeURIComponent(testTag)}`;
    const tagRes = await fetch(tagSearchUrl, { headers });
    console.log('Tag search status:', tagRes.status);
    
    if (!tagRes.ok) {
      console.error('Tag search failed:', await tagRes.text());
      return;
    }
    
    const tags = await tagRes.json();
    console.log('Found tags:', JSON.stringify(tags, null, 2));
    
    if (!tags.length) {
      console.log('Tag not found - would need to create');
      
      // Try to create the tag
      console.log('\n3. Creating tag...');
      const createTagRes = await fetch(`${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/tags`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contacts_tag: {
            name: testTag,
            color: '#EEEEEE'
          }
        })
      });
      console.log('Create tag status:', createTagRes.status);
      const createTagResult = await createTagRes.text();
      console.log('Create tag result:', createTagResult);
      return;
    }
    
    const tagId = tags[0].id;
    console.log('Tag ID:', tagId);
    
    // 3. Apply the tag
    console.log('\n3. Applying tag to contact...');
    const applyUrl = `${CLICKFUNNELS_API_BASE}/contacts/${contact.id}/applied_tags`;
    const applyRes = await fetch(applyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contacts_applied_tag: {
          tag_id: tagId
        }
      })
    });
    
    console.log('Apply tag status:', applyRes.status);
    const applyResult = await applyRes.text();
    console.log('Apply tag result:', applyResult);
    
    // 4. Check contact's tags
    console.log('\n4. Checking contact tags...');
    const checkUrl = `${CLICKFUNNELS_API_BASE}/contacts/${contact.id}/applied_tags`;
    const checkRes = await fetch(checkUrl, { headers });
    console.log('Check tags status:', checkRes.status);
    const appliedTags = await checkRes.json();
    console.log('Applied tags:', JSON.stringify(appliedTags.slice(0, 10), null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testTagging();
