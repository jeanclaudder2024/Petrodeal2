// Test Supabase API Key
// Run this with: node test-supabase-key.js

const SUPABASE_URL = 'https://ozjhdxvwqbzcvcywhwjg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q';

console.log('Testing Supabase API Key...\n');
console.log('URL:', SUPABASE_URL);
console.log('Key (first 50 chars):', SUPABASE_KEY.substring(0, 50) + '...\n');

// Test 1: Check if URL is reachable
fetch(SUPABASE_URL + '/rest/v1/', {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
})
.then(response => {
  console.log('Test 1 - API Endpoint:');
  console.log('Status:', response.status, response.status === 200 ? '✅' : '❌');
  if (response.status !== 200) {
    return response.text().then(text => {
      console.log('Error:', text);
    });
    }
})
.catch(error => {
  console.log('❌ Connection failed:', error.message);
})
.then(() => {
  // Test 2: Try auth endpoint
  return fetch(SUPABASE_URL + '/auth/v1/health', {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
})
.then(response => {
  console.log('\nTest 2 - Auth Endpoint:');
  console.log('Status:', response.status, response.status === 200 ? '✅' : '❌');
  return response.text();
})
.then(text => {
  if (text) console.log('Response:', text);
})
.catch(error => {
  console.log('❌ Auth test failed:', error.message);
})
.then(() => {
  console.log('\n=== Summary ===');
  console.log('If both tests show 401, the API key is WRONG or EXPIRED.');
  console.log('Get a fresh key from: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api');
});

