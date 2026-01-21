// const { tagClickFunnelsContact } = require('./src/lib/clickfunnels'); // cannot require ts
// We will mimic the tagClickFunnelsContact logic here to debug it fully

require('dotenv').config();

const CLICKFUNNELS_API_BASE = 'https://api.myclickfunnels.com/api/v2';
const apiKey = process.env.CLICKFUNNELS_API_KEY;
const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID;
const TEST_EMAIL = 'aribaqazi@gmail.com'; // Mixed case test
const TAG_NAME = 'RH26-APPROVED';

async function findContact(email) {
    const url = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts?filter[email_address]=${encodeURIComponent(email)}`;
    console.log('Finding contact:', url);
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });
    const data = await res.json();
    const contacts = Array.isArray(data) ? data : (data.data || []);
    return contacts[0];
}

async function findGenericContact() {
    const url = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts?page[size]=1`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' } });
    const data = await res.json();
    return (data.data || [])[0];
}

async function getTagId(name) {
    const url = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/tags?filter[name]=${encodeURIComponent(name)}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' } });
    const data = await res.json();
    const tags = Array.isArray(data) ? data : (data.data || []);
    return tags[0]?.id;
}

async function applyTag(contactId, tagId) {
    console.log(`Applying tag ${tagId} to contact ${contactId}`);
    const url = `${CLICKFUNNELS_API_BASE}/contacts/${contactId}/applied_tags`;
    const res = await fetch(url, {
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
    
    if (res.ok) {
        console.log('✅ Tag applied successfully!');
    } else {
        const text = await res.text();
        if (res.status === 422 && text.includes('already been taken')) {
            console.log('✅ Tag already applied (API returned 422 taken)');
        } else {
            console.log('❌ Apply response error:', res.status, text);
        }
    }
}

async function run() {
    console.log('1. Resolving Tag ID...');
    const tagId = await getTagId(TAG_NAME);
    console.log('Tag ID:', tagId);
    if (!tagId) return console.error('Tag not found');

    console.log('2. Finding a real contact to test on...');
    // Try to find specific email or create
    let contact = await findContact(TEST_EMAIL);
    
    if (!contact) {
        console.log('Creating test contact...');
        const createUrl = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts`;
        const res = await fetch(createUrl, {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
             body: JSON.stringify({ contact: { email_address: TEST_EMAIL } })
        });
        contact = await res.json();
    }
    
    // const contact = await findGenericContact(); 
    if (!contact || !contact.id) return console.error('No contacts found/created', contact);
    console.log(`Using contact: ${contact.email_address} (ID: ${contact.id})`);

    console.log('3. Attempting to apply tag...');
    await applyTag(contact.id, tagId);
}

run();
