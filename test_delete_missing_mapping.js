/**
 * This script tests the DELETE endpoint for missing mappings to verify it's working correctly.
 */
import fetch from 'node-fetch';
import { parse } from 'cookie';

async function login() {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  // Extract the cookie from the response
  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('No cookies returned from login');
  }

  // Parse the cookie to get the session ID
  const cookieObj = parse(cookies);
  const sessionCookie = cookies;
  
  console.log('Successfully logged in');
  return sessionCookie;
}

async function getMissingMappings(sessionCookie) {
  const response = await fetch('http://localhost:5000/api/missing-mappings', {
    method: 'GET',
    headers: {
      'Cookie': sessionCookie
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get missing mappings: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`Found ${data.length} missing mappings`);
  return data;
}

async function deleteMissingMapping(id, sessionCookie) {
  console.log(`Testing DELETE for missing mapping ID: ${id}`);
  
  try {
    // First, verify the mapping exists
    const getResponse = await fetch(`http://localhost:5000/api/missing-mappings/${id}`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log(`GET check status: ${getResponse.status}`);
    
    if (getResponse.status === 404) {
      console.log(`Missing mapping ${id} does not exist`);
      return false;
    }
    
    // Attempt to delete the mapping
    const deleteResponse = await fetch(`http://localhost:5000/api/missing-mappings/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      }
    });
    
    console.log(`DELETE response status: ${deleteResponse.status}`);
    
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error(`Error deleting mapping ${id}: ${errorText}`);
      return false;
    }
    
    const result = await deleteResponse.json();
    console.log(`Delete response:`, result);
    
    // Verify it was deleted by trying to fetch it again
    const verifyResponse = await fetch(`http://localhost:5000/api/missing-mappings/${id}`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log(`Verification GET status: ${verifyResponse.status}`);
    
    if (verifyResponse.status === 404) {
      console.log(`Success: Missing mapping ${id} was deleted`);
      return true;
    } else {
      console.log(`Failure: Missing mapping ${id} still exists after deletion`);
      return false;
    }
  } catch (error) {
    console.error(`Error testing deletion:`, error);
    return false;
  }
}

async function main() {
  try {
    const sessionCookie = await login();
    const mappings = await getMissingMappings(sessionCookie);
    
    if (mappings.length === 0) {
      console.log('No missing mappings found to test deletion');
      return;
    }
    
    // Test deleting the first mapping
    const testId = mappings[0].id;
    const success = await deleteMissingMapping(testId, sessionCookie);
    
    console.log(`Test result: ${success ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();