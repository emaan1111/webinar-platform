require('dotenv').config();
const apiKey = process.env.CLICKFUNNELS_API_KEY;
const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID;

const email = 'ayeshafomar786@gmail.com';

async function checkContact() {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // 1. Find the contact
  console.log('Searching for contact:', email);
  const searchUrl = `https://api.clickfunnels.com/api/v2/workspaces/${workspaceId}/contacts?filter[email_address]=${encodeURIComponent(email)}`;
  
  const contactRes = await fetch(searchUrl, { headers });
  const contacts = await contactRes.json();
  
  if (!contacts.length && !contacts[0]?.id) {
    console.log('Contact NOT found in ClickFunnels!');
    console.log('Response:', JSON.stringify(contacts, null, 2));
    return;
  }
  
  const contact = contacts[0];
  console.log('\nContact found:', {
    id: contact.id,
    email: contact.email_address,
    first_name: contact.first_name,
    last_name: contact.last_name
  });
  
  // 2. Get contact's applied tags
  console.log('\nFetching applied tags...');
  const tagsUrl = `https://api.clickfunnels.com/api/v2/contacts/${contact.id}/applied_tags`;
  const tagsRes = await fetch(tagsUrl, { headers });
  const appliedTags = await tagsRes.json();
  
  console.log('\nApplied tags:');
  if (Array.isArray(appliedTags)) {
    for (const tag of appliedTags) {
      console.log(`  - ${tag.tag?.name || tag.name || 'unknown'} (ID: ${tag.tag_id || tag.id})`);
    }
    if (appliedTags.length === 0) {
      console.log('  (No tags applied)');
    }
  } else {
    console.log('Tags response:', JSON.stringify(appliedTags, null, 2));
  }
  
  // 3. Check if the specific tag exists in the workspace
  console.log('\nSearching for tag "UM-WebinarMostlyAttended"...');
  const tagSearchUrl = `https://api.clickfunnels.com/api/v2/workspaces/${workspaceId}/contacts/tags?filter[name]=UM-WebinarMostlyAttended`;
  const tagSearchRes = await fetch(tagSearchUrl, { headers });
  const tagResults = await tagSearchRes.json();
  
  console.log('Tag search results:', JSON.stringify(tagResults, null, 2));
}

checkContact().catch(console.error);
