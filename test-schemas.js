
// Script to test schema API
import fetch from 'node-fetch';
import fs from 'fs';

// Get auth cookie
let cookie = '';
if (fs.existsSync('cookies.txt')) {
  cookie = fs.readFileSync('cookies.txt', 'utf8');
}

async function login() {
  try {
    console.log('Attempting to login...');
    
    const response = await fetch('http://0.0.0.0:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Extract the set-cookie header
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      const sessionCookie = cookies.split(';')[0].trim();
      cookie = sessionCookie;
      console.log('Login successful, session cookie obtained');
      fs.writeFileSync('cookies.txt', cookie);
      return await response.json();
    } else {
      throw new Error('No cookies returned from login');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

async function getSchemas(typeId) {
  try {
    console.log(`Testing schema API for reference type ID: ${typeId}`);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (cookie && typeof cookie === 'string' && cookie.trim() !== '') {
      const sanitizedCookie = cookie.replace(/[^\x20-\x7E]/g, '').trim();
      if (sanitizedCookie) {
        headers['Cookie'] = sanitizedCookie;
      }
    }
    
    console.log('Using headers:', headers);
    
    const response = await fetch(`http://0.0.0.0:5000/api/reference-types/${typeId}/schemas`, {
      method: 'GET',
      headers
    });

    const statusText = response.statusText || '';
    console.log(`Response status: ${response.status} ${statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch schemas: ${response.status} ${statusText} - ${errorText}`);
    }

    const schemas = await response.json();
    console.log(`Found ${schemas.length} schemas:`);
    console.log(JSON.stringify(schemas, null, 2));
    return schemas;
  } catch (error) {
    console.error(`Error testing schema API:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Make sure we're logged in
    if (!cookie) {
      await login();
    }
    
    // Test schema API for Manufacturer type (ID 6)
    await getSchemas(6);
    
    console.log('\nTesting another reference type:');
    // Test schema API for another type
    await getSchemas(1);
    
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

main();
