require('dotenv').config();

const CRON_SECRET = process.env.CRON_SECRET?.replace(/"/g, '') || 'F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=';

async function triggerCron() {
  console.log('Triggering attendance tagging cron...');
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min timeout
  
  try {
    const response = await fetch('https://webinar-platform-production.up.railway.app/api/cron/process-attendance-tags', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Request timed out after 5 minutes');
    } else {
      throw err;
    }
  }
}

triggerCron().catch(console.error);
