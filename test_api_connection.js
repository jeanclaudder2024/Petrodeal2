/**
 * Quick test script to verify React CMS can connect to Python API
 * Run this in browser console or Node.js
 */

const API_BASE_URL = process.env.VITE_DOCUMENT_API_URL || 
                     (typeof window !== 'undefined' ? 
                       (import.meta?.env?.VITE_DOCUMENT_API_URL || 'http://localhost:8000') : 
                       'http://localhost:8000');

async function testAPI() {
  console.log('='.repeat(60));
  console.log('Testing Python API Connection');
  console.log('='.repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/`, {
      credentials: 'include'
    });
    const healthData = await healthResponse.json();
    console.log('✓ Health Check:', healthData);
  } catch (error) {
    console.error('✗ Health Check Failed:', error.message);
    return false;
  }

  // Test 2: Auth Me (should fail without auth)
  console.log('\n2. Testing /auth/me (without auth)...');
  try {
    const authResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include'
    });
    if (authResponse.status === 401) {
      console.log('✓ Correctly returns 401 (not authenticated)');
    } else {
      const authData = await authResponse.json();
      console.log('✓ Already authenticated:', authData);
    }
  } catch (error) {
    console.error('✗ Auth Check Failed:', error.message);
  }

  // Test 3: Login
  console.log('\n3. Testing Login...');
  const username = prompt('Enter username (or cancel to skip):');
  if (username) {
    const password = prompt('Enter password:');
    try {
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✓ Login successful:', loginData);
        
        // Test 4: Auth Me (with auth)
        console.log('\n4. Testing /auth/me (with auth)...');
        const authMeResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include'
        });
        const authMeData = await authMeResponse.json();
        console.log('✓ Auth check:', authMeData);
        
        // Test 5: Get Templates
        console.log('\n5. Testing GET /templates...');
        const templatesResponse = await fetch(`${API_BASE_URL}/templates`, {
          credentials: 'include'
        });
        const templatesData = await templatesResponse.json();
        console.log(`✓ Templates: ${templatesData.templates?.length || 0} found`);
      } else {
        const errorData = await loginResponse.json();
        console.error('✗ Login failed:', errorData);
      }
    } catch (error) {
      console.error('✗ Login Failed:', error.message);
    }
  } else {
    console.log('Skipped login test');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testAPI = testAPI;
}

// Run if in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAPI, API_BASE_URL };
}
