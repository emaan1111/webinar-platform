
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

// Simple fetch implementation for API calls
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getTagId(tagName, apiKey, workspaceId) {
  if (!tagName) return null;
  
  try {
    const url = `https://api.myclickfunnels.com/v2/workspaces/${workspaceId}/contacts/tags?filter[name]=${encodeURIComponent(tagName)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
        console.error(`Failed to fetch tag ${tagName}: ${response.status}`);
        return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      return data[0].id;
    }
    return null;
  } catch (error) {
    console.error(`Error resolving tag ${tagName}:`, error);
    return null;
  }
}

async function main() {
  const apiKey = process.env.CLICKFUNNELS_API_KEY;
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID;
  
  if (!apiKey || !workspaceId) {
    console.error('ClickFunnels API credentials missing!');
    process.exit(1);
  }

  const webinars = await prisma.webinar.findMany();
  
  console.log(`Found ${webinars.length} webinars. Migrating tags to IDs...`);
  
  for (const webinar of webinars) {
    console.log(`\nProcessing: ${webinar.title}`);
    const updates = {};
    
    // Mapping of Name Field -> ID Field
    const tagFields = [
      ['registrationTag', 'registrationTagId'],
      ['attendedTag', 'attendedTagId'],
      ['mostlyAttendedTag', 'mostlyAttendedTagId'],
      ['partlyAttendedTag', 'partlyAttendedTagId'],
      ['missedTag', 'missedTagId'],
      ['replayAttendedTag', 'replayAttendedTagId']
    ];
    
    for (const [nameField, idField] of tagFields) {
      const tagName = webinar[nameField];
      if (tagName) {
        console.log(`  Resolving "${tagName}"...`);
        const tagId = await getTagId(tagName, apiKey, workspaceId);
        
        if (tagId) {
          console.log(`    ✅ Found ID: ${tagId}`);
          updates[idField] = tagId;
        } else {
          console.log(`    ⚠️  Tag ID not found!`);
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.webinar.update({
        where: { id: webinar.id },
        data: updates
      });
      console.log('  Saved updates.');
    } else {
        console.log('  No updates needed.');
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
