// Test script to verify watch position API
// Run this in browser console while on the replay page

// Get the registration ID from the viewer object
const registrationId = 'cmi3hb9kt000ajwayeosvh4mf'; // Replace with actual ID

// Test saving a position
async function testSavePosition(position) {
  console.log(`🧪 Testing save position: ${position}s`);
  
  try {
    const response = await fetch(`/api/registrations/${registrationId}/watch-position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: position })
    });
    
    const data = await response.json();
    console.log('✅ Response:', data);
    
    if (response.ok) {
      console.log('✅ Position saved successfully!');
    } else {
      console.error('❌ Failed to save:', data);
    }
    
    return data;
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

// Test with position 123
testSavePosition(123);

// After running this, refresh the page and check if it resumes from 123 seconds
