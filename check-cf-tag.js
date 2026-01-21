// const { fetchAllClickFunnelsTags } = require('./src/lib/clickfunnels');

// Mock process.env for the script since it runs in node
require('dotenv').config();

async function checkTags() {
  console.log('Checking tags in ClickFunnels...');
  try {
      // We need to import the transpiled version or use ts-node, but since we are in a dev environment with nextjs,
      // direct node execution of TS files is tricky without ts-node.
      // I will read the file manually or use a simpler fetch script that mimics the logic.
      
      const apiKey = process.env.CLICKFUNNELS_API_KEY;
      const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID;
      
      if (!apiKey || !workspaceId) {
          console.error('Missing env vars');
          return;
      }
      
      const url = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts/tags`;
      const response = await fetch(url, {
          headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json'
          }
      });
      
      if (!response.ok) {
          console.error('Failed', response.status, await response.text());
          return;
      }
      
      const data = await response.json();
      const tags = data.tags || data;
      console.log('Total Tags (Page 1):', tags.length);
      
      // Let's try the SEARCH endpoint specifically
      console.log('Testing Search API...');
      const searchUrl = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts/tags?filter[name]=${encodeURIComponent('RH26-APPROVED')}`;
      const searchRes = await fetch(searchUrl, {
          headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json'
          }
      });
      const searchData = await searchRes.json();
      console.log('Search Result:', JSON.stringify(searchData, null, 2));

      /*
      const targetTag = tags.find(t => t.name === 'RH26-APPROVED');
      // ... existing code ...
      */
      
  } catch (e) {
      console.error(e);
  }
}

checkTags();
