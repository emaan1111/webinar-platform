/**
 * Script to update UM Webinar Link for specific contacts from CSV
 * 
 * Usage: node scripts/update-cf-webinar-links.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CLICKFUNNELS_API_BASE = 'https://api.myclickfunnels.com/api/v2';

// Contact IDs from the CSV file
const CONTACT_IDS = [
  21925497, 21976826, 22944785, 22978423, 164691370, 164693277, 164693868,
  164706042, 164711625, 164715764, 164718587, 164725209, 164732693, 164740608,
  164740762, 164756615, 164767304, 164773193, 164779234, 164794350, 164795611,
  164809074, 164810075, 164811740, 164811750, 164814094, 164819565, 164832414,
  164837952, 164843651, 164844035, 164853813, 164853894, 164856876, 234025903,
  243229192, 245633205, 335473053, 335491895, 335564153, 335780846, 336151953,
  336191285, 336349332, 336876892, 336882707, 336891652, 336906624, 447310333,
  450621020, 629716875, 679694244, 687745282, 700601571, 716123204, 716524720,
  718509454, 737589422, 773524252, 794840961, 795228839, 847426608, 864896890,
  892824276, 898493940, 898544561, 903552171, 928230419, 928230575, 1046677197,
  1046716635, 1064307284, 1067842171, 1067855959, 1067862656, 1067884092,
  1067899918, 1068008714, 1068029131, 1068031362, 1068040864, 1068141205,
  1068163257, 1068169556, 1068183062, 1068354274, 1068356103, 1068558401,
  1068661943, 1069193383, 1069408141, 1069775645, 1069888617
];

// Emails from CSV for lookup
const EMAILS = [
  'ariba.farheen@gmail.com', 'saimasif.khatoon@gmail.com', 'emaanpower@gmail.com',
  'farheen_2@hotmail.com', 'aafreenizam@gmail.com', 'adeela.ambar24@gmail.com',
  'afeerah.wahab@gmail.com', 'asmakhan1136@gmail.com', 'bintahmed246@gmail.com',
  'dockaty_q@yahoo.com', 'emaanpoweronline@gmail.com', 'farzbocus@hotmail.co.uk',
  'gina_msa@hotmail.com', 'hidaayah01@gmail.com', 'hilola09@gmail.com',
  'kaashiefataliep@gmail.com', 'lateefah.oloyede@yahoo.com', 'madiha.jamil14@gmail.com',
  'mariakutub7@gmail.com', 'nadia_r@hotmail.co.uk', 'naimahm49@yahoo.com',
  'presila86@hotmail.com', 'quratulain-aslam@hotmail.com', 'rahat_83@hotmail.com',
  'raheela.aftab@gmail.com', 'razveen@hotmail.com', 's.khan1987@live.com',
  'shabbisum@yahoo.co.uk', 'shiuly.iqbal@yahoo.com', 'sumeyaabderemane@gmail.com',
  'sunshine12f@hotmail.com', 'yashyooshau@gmail.com', 'yasinshaista@yahoo.com',
  'zawjahhussain@gmail.com', 'ayesha.yasser1@gmail.com', 'nura_85@yahoo.com',
  'aminabisola25@yahoo.com', 'maherajpathan@gmail.com', 'sumera_mary@hotmail.com',
  'sanaayaz30@yahoo.com', 'fawwax@yahoo.com', 'rahima892016@hotmail.com',
  'samforyou786@hotmail.com', 'zahedamiah@hotmail.co.uk', 'latifatmajeed@yahoo.com',
  'mumtaza76@yahoo.com', 'sadafkhan@hotmail.co.uk', 'zay_jaymali@hotmail.com',
  'rafiyahilmy@gmail.com', 'hameedakhan2016@gmai.com', 'ahmeraa@hotmail.com',
  'aleya21@hotmail.com', 'umberinzeeshan@gmail.com', 'usmajabeen05@hotmail.com',
  'sahly_nice@yahoo.com', 'ononoyahaya@yahoo.com', 'shamaizawaqas@gmail.com',
  'semaambi@gmail.com', 'info.rubeena@gmail.com', 'zinnatparvin@gmail.com',
  'rom_whatsoever@yahoo.com', 'nchaggouri@gmail.com', 'power@gmail.com',
  'tahminaamady@gmail.com', 'emadower@gmail.com', 'dnpower@gmail.com',
  'areen@gmail.com', 'asiyamohamoud571@gmail.com', 'mennattallah1986@gmail.com',
  'asheen@gmail.com', 'dpower@gmail.com', 's1rheen@gmail.com',
  'fowl.90.had@icloud.com', 'ueen@gmail.com', 'eml9power@gmail.com',
  'esnpower@gmail.com', '2ower@gmail.com', 's.farheen@gmail.com',
  'emrnpower@gmail.com', 'ar2heen@gmail.com', 'sudort@emaanpower.com',
  'arideen@gmail.com', 'dmaanpower@gmail.com', 'emagwer@gmail.com',
  'aridheen@gmail.com', 'afshanhewitt@gmail.com', 'r20254us@gmail.com',
  'mohid.ali.shah@gmail.com', 'ower@gmail.com', 'hayamaya65@yahoo.com',
  'fatimahumukhalid1436@gmail.com', 'hamza.javaid.0108@gmail.com', 'forsallyp@ail.com'
];

async function getContactDetails(contactId) {
  const apiKey = process.env.CLICKFUNNELS_API_KEY;

  const response = await fetch(`${CLICKFUNNELS_API_BASE}/contacts/${contactId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
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

  return true;
}

async function findRegistrationByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Try webinar registration first
  const webinarReg = await prisma.registration.findFirst({
    where: { email: normalizedEmail },
    include: {
      webinar: { select: { slug: true } },
    },
    orderBy: { registeredAt: 'desc' }
  });

  if (webinarReg) {
    return {
      type: 'webinar',
      id: webinarReg.id,
      slug: webinarReg.webinar?.slug,
      scheduleId: webinarReg.scheduleId
    };
  }

  // Try event registration
  const eventReg = await prisma.eventRegistration.findFirst({
    where: { email: normalizedEmail },
    include: {
      event: { select: { slug: true } },
    },
    orderBy: { registeredAt: 'desc' }
  });

  // Check if there's a webinar registration for this email
  if (eventReg) {
    const linkedWebinarReg = await prisma.registration.findFirst({
      where: { email: normalizedEmail },
      include: {
        webinar: { select: { slug: true } }
      },
      orderBy: { registeredAt: 'desc' }
    });
    
    if (linkedWebinarReg) {
      return {
        type: 'event-webinar',
        id: linkedWebinarReg.id,
        slug: linkedWebinarReg.webinar?.slug,
        scheduleId: linkedWebinarReg.scheduleId
      };
    }
    
    return {
      type: 'event',
      id: eventReg.id,
      slug: eventReg.event?.slug
    };
  }

  return null;
}

function buildCountdownLink(registration) {
  // ALWAYS use production URL - never localhost
  const baseUrl = 'https://emaanpowerclasses.com';
  
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
  console.log('🔧 Update UM Webinar Link for CSV Contacts');
  console.log('==========================================\n');

  const apiKey = process.env.CLICKFUNNELS_API_KEY;
  if (!apiKey) {
    console.log('❌ CLICKFUNNELS_API_KEY not set');
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  let needsUpdate = 0;
  let skipped = 0;
  let noIssue = 0;

  for (let i = 0; i < CONTACT_IDS.length; i++) {
    const contactId = CONTACT_IDS[i];
    const email = EMAILS[i];
    
    console.log(`\n[${i + 1}/${CONTACT_IDS.length}] 👤 ${email} (ID: ${contactId})`);

    // Get current contact details from ClickFunnels
    const contact = await getContactDetails(contactId);
    
    if (!contact) {
      console.log(`   ⚠️ Could not fetch contact details - skipping`);
      skipped++;
      continue;
    }

    // Check if UM Webinar Link contains "zoom" or "localhost"
    const customAttrs = contact.custom_attributes || {};
    const currentLink = customAttrs['UM Webinar Link'] || customAttrs['um_webinar_link'] || '';
    const linkLower = currentLink.toLowerCase();
    
    const hasZoom = linkLower.includes('zoom');
    const hasLocalhost = linkLower.includes('localhost');
    
    if (!hasZoom && !hasLocalhost) {
      console.log(`   ℹ️ No issue found (current: ${currentLink || 'empty'})`);
      noIssue++;
      continue;
    }

    const issueType = hasZoom ? 'Zoom' : 'localhost';
    console.log(`   🔗 Found ${issueType} link: ${currentLink}`);
    needsUpdate++;

    // Find registration in database
    const registration = await findRegistrationByEmail(email);
    
    if (!registration) {
      console.log(`   ⚠️ No registration found in database - skipping`);
      skipped++;
      continue;
    }

    console.log(`   📋 Found ${registration.type} registration: ${registration.id}`);

    // Build countdown link
    const newLink = buildCountdownLink(registration);
    
    if (!newLink) {
      console.log(`   ⚠️ Could not build countdown link - skipping`);
      skipped++;
      continue;
    }

    // Update the contact
    const success = await updateContactWebinarLink(contactId, email, newLink);
    
    if (success) {
      console.log(`   ✅ Updated to: ${newLink}`);
      updated++;
    } else {
      skipped++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n==========================================');
  console.log('📊 Summary:');
  console.log(`   📋 Total contacts: ${CONTACT_IDS.length}`);
  console.log(`   🔍 With Zoom/localhost links: ${needsUpdate}`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️ Skipped: ${skipped}`);
  console.log(`   ℹ️ No issue: ${noIssue}`);
  console.log('==========================================\n');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Script failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
