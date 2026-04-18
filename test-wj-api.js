const apiKey = '8f4aced3-0608-488c-9be8-767726fda688';

async function testAPI() {
  // Test with EverWebinar API (both external webinars are everwebinar platform)
  const params = new URLSearchParams({
    api_key: apiKey,
    webinar_id: '162',  // UM - UM-PICBIG
    date_range: '0',
  });

  console.log('Testing EverWebinar API for webinar 162...');
  const res = await fetch('https://api.webinarjam.com/everwebinar/registrants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response status:', data.status);
  const registrants = data.users || data.user || [];
  console.log('Registrants found:', registrants.length);
  if (registrants.length > 0) {
    console.log('First registrant:', JSON.stringify(registrants[0], null, 2));
  } else {
    console.log('Full response:', JSON.stringify(data, null, 2));
  }

  // Test webinar 149 too
  console.log('\nTesting EverWebinar API for webinar 149...');
  const params2 = new URLSearchParams({
    api_key: apiKey,
    webinar_id: '149',
    date_range: '0',
  });
  const res2 = await fetch('https://api.webinarjam.com/everwebinar/registrants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params2,
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Response status:', data2.status);
  const registrants2 = data2.users || data2.user || [];
  console.log('Registrants found:', registrants2.length);
  if (registrants2.length > 0) {
    console.log('First registrant:', JSON.stringify(registrants2[0], null, 2));
  } else {
    console.log('Full response:', JSON.stringify(data2, null, 2));
  }
}
testAPI().catch(console.error);
