async function checkHealth() {
  console.log('Checking app health...');
  
  const response = await fetch('https://webinar-platform-production.up.railway.app/api/health');
  console.log('Health status:', response.status);
  
  if (response.ok) {
    const data = await response.json();
    console.log('Response:', data);
  }
}

checkHealth().catch(console.error);
