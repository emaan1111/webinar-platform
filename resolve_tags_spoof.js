
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');
require('dotenv').config();

const WEBINAR_ID = 'cmkf76kdp00ixjw83w77brbdp';
// Hardcoded because .env loading might be tricky in some environments
const API_KEY = process.env.CLICKFUNNELS_API_KEY;
const WORKSPACE_ID = process.env.CLICKFUNNELS_WORKSPACE_ID;

if (!API_KEY || !WORKSPACE_ID) {
  console.error('ClickFunnels API credentials missing!');
  process.exit(1);
}

function fetchTagId(tagName) {
  return new Promise((resolve, reject) => {
    if (!tagName) {
      resolve(null);
      return;
    }

    const url = `https://api.myclickfunnels.com/v2/workspaces/${WORKSPACE_ID}/contacts/tags?filter[name]=${encodeURIComponent(tagName)}`;
    const options = {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://myclickfunnels.com/',
        'Origin': 'https://myclickfunnels.com'
      },
      timeout: 30000
    };

    const req = https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            if (json && json.length > 0) {
              resolve(json[0].id);
            } else {
              console.log(`Tag not found in search results: ${tagName}`);
              resolve(null);
            }
          } catch (e) {
            console.log(`Response dump for ${tagName}:`, data.substring(0, 200));
            reject(new Error(`Failed to parse JSON for ${tagName}`));
          }
        } else {
          console.log(`Response dump for ${tagName}:`, data.substring(0, 200));
          reject(new Error(`API Error ${res.statusCode} for ${tagName}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Network error for ${tagName}: ${e.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${tagName}`));
    });
  });
}

async function main() {
  console.log(`Fetching webinar config for ID: ${WEBINAR_ID}...`);
  const webinar = await prisma.webinar.findUnique({
    where: { id: WEBINAR_ID }
  });

  if (!webinar) {
    console.error('Webinar not found!');
    return;
  }

  console.log(`Processing tags for: ${webinar.title}`);

  const tagsToResolve = [
    { name: webinar.registrationTag, field: 'registrationTagId', label: 'Registration' },
    { name: webinar.attendedTag, field: 'attendedTagId', label: 'Attended' },
    { name: webinar.missedTag, field: 'missedTagId', label: 'Missed' },
    { name: webinar.mostlyAttendedTag, field: 'mostlyAttendedTagId', label: 'Mostly Attended' },
    { name: webinar.partlyAttendedTag, field: 'partlyAttendedTagId', label: 'Partly Attended' },
    { name: webinar.replayAttendedTag, field: 'replayAttendedTagId', label: 'Replay Attended' }
  ];

  const updates = {};

  for (const tag of tagsToResolve) {
    if (tag.name) {
      process.stdout.write(`Resolving ${tag.label} tag "${tag.name}"... `);
      try {
        const id = await fetchTagId(tag.name);
        if (id) {
          console.log(`✅ ID: ${id}`);
          updates[tag.field] = id;
        } else {
          console.log(`❌ Not found via API`);
        }
      } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
      }
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log(`Skipping ${tag.label} (not configured)`);
    }
  }

  if (Object.keys(updates).length > 0) {
    console.log('\nSaving updates to database...');
    await prisma.webinar.update({
      where: { id: WEBINAR_ID },
      data: updates
    });
    console.log('✅ Changes saved successfully!');
  } else {
    console.log('\nNo updates to save.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
