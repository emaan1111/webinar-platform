/**
 * Script to fix ClickFunnels contacts that have Zoom links in their UM Webinar Link field
 * Updates them to use the countdown page URL instead
 * 
 * Usage: node scripts/fix-zoom-webinar-links.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CLICKFUNNELS_API_BASE = 'https://api.myclickfunnels.com/api/v2';

async function fetchAllContacts(maxPages = 50) {
  const apiKey = process.env.CLICKFUNNELS_API_KEY;
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID;

  if (!apiKey || !workspaceId) {
    console.log('❌ CLICKFUNNELS_API_KEY or CLICKFUNNELS_WORKSPACE_ID not set');
    return [];
  }

  console.log('📋 Fetching contacts from ClickFunnels...');
  
  let allContacts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const url = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts?page=${page}&per_page=100`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch contacts:', response.status, errorText);
      break;
    }

    const data = await response.json();
    const contacts = data.data || data || [];
    
    if (contacts.length === 0) {
      hasMore = false;
    } else {
      allContacts = allContacts.concat(contacts);
      console.log(`   Fetched page ${page}: ${contacts.length} contacts (total: ${allContacts.length})`);
      page++;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`✅ Total contacts fetched: ${allContacts.length}`);
  return allContacts;
}

async function updateContactWebinarLink(contactId, email, newLink) {
  const apiKey = process.env.CLICKFUNNELS_API_KEY;

  const response = await fetch(`${CLICKFUNNELS_API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      contact: {
        custom_attributes: {
          'UM Webinar Link': newLink,
          'um_webinar_link': newLink,
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`   ❌ Failed to update ${email}:`, response.status, errorText);
    return false;
  }

  console.log(`   ✅ Updated ${email} with new link: ${newLink}`);
  return true;
}

async function findRegistrationByEmail(email) {
  // Try to find webinar registration first
  const webinarReg = await prisma.webinarRegistration.findFirst({
    where: { email: email.toLowerCase() },
    include: {
      webinar: { select: { slug: true } },
      schedule: { select: { id: true } },
    },
    orderBy: { registeredAt: 'desc' }
  });

  if (webinarReg) {
    return {
      type: 'webinar',
      id: webinarReg.id,
      slug: webinarReg.webinar?.slug,
      scheduleId: webinarReg.schedule?.id
    };
  }

  // Try event registration if no webinar registration
  const eventReg = await prisma.eventRegistration.findFirst({
    where: { email: email.toLowerCase() },
    include: {
      event: { select: { slug: true } },
      webinarRegistration: {
        include: {
          webinar: { select: { slug: true } }
        }
      }
    },
    orderBy: { registeredAt: 'desc' }
  });

  if (eventReg?.webinarRegistration) {
    return {
      type: 'event-webinar',
      id: eventReg.webinarRegistration.id,
      slug: eventReg.webinarRegistration.webinar?.slug,
      scheduleId: null
    };
  }

  if (eventReg) {
    return {
      type: 'event',
      id: eventReg.id,
      slug: eventReg.event?.slug
    };
  }

  return null;
}

function buildCountdownLink(registration) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com';
  
  if (registration.type === 'webinar' || registration.type === 'event-webinar') {
    let link = `${baseUrl}/countdown/${registration.slug}?r=${registration.id}`;
    if (registration.scheduleId) {
      link += `&s=${registration.scheduleId}`;
    }
    return link;
  }
  
  if (registration.type === 'event') {
    return `${baseUrl}/event/${registration.slug}`;
  }

  return null;
}

async function main() {
  console.log('🔧 Fix Zoom Webinar Links in ClickFunnels');
  console.log('=========================================\n');

  // Fetch all contacts from ClickFunnels
  const contacts = await fetchAllContacts();

  // Filter contacts that have "zoom" in their UM Webinar Link
  const zoomContacts = contacts.filter(contact => {
    const customAttrs = contact.custom_attributes || contact.attributes?.custom_attributes || {};
    const umWebinarLink = customAttrs['UM Webinar Link'] || customAttrs['um_webinar_link'] || '';
    return umWebinarLink.toLowerCase().includes('zoom');
  });

  console.log(`\n📋 Found ${zoomContacts.length} contacts with Zoom links\n`);

  if (zoomContacts.length === 0) {
    console.log('✅ No contacts need to be updated!');
    await prisma.$disconnect();
    return;
  }

  // Process each contact
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const contact of zoomContacts) {
    const email = contact.email_address || contact.email;
    const customAttrs = contact.custom_attributes || contact.attributes?.custom_attributes || {};
    const currentLink = customAttrs['UM Webinar Link'] || customAttrs['um_webinar_link'] || '';
    
    console.log(`\n👤 Processing: ${email}`);
    console.log(`   Current link: ${currentLink}`);

    // Find registration in database
    const registration = await findRegistrationByEmail(email);
    
    if (!registration) {
      console.log(`   ⚠️ No registration found in database - skipping`);
      skipped++;
      continue;
    }

    console.log(`   Found ${registration.type} registration: ${registration.id}`);

    // Build the new countdown link
    const newLink = buildCountdownLink(registration);
    
    if (!newLink) {
      console.log(`   ⚠️ Could not build countdown link - skipping`);
      skipped++;
      continue;
    }

    // Update the contact in ClickFunnels
    const success = await updateContactWebinarLink(contact.id, email, newLink);
    
    if (success) {
      updated++;
    } else {
      failed++;
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n=========================================');
  console.log('📊 Summary:');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️ Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('=========================================\n');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Script failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
