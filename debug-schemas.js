
// Script to debug reference data type schemas
import fetch from 'node-fetch';
import fs from 'fs';

// Get auth cookie if exists
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
      // Extract just the session cookie part
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

async function getAllReferenceTypes() {
  try {
    console.log('Fetching all reference data types...');
    
    // Use the correct API URL
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (cookie && typeof cookie === 'string' && cookie.trim() !== '') {
      // Sanitize cookie
      const sanitizedCookie = cookie.replace(/[^\x20-\x7E]/g, '').trim();
      if (sanitizedCookie) {
        headers['Cookie'] = sanitizedCookie;
      }
    }
    
    const response = await fetch('http://0.0.0.0:5000/api/reference-types', {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch reference types: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const types = await response.json();
    console.log(`Found ${types.length} reference data types`);
    return types;
  } catch (error) {
    console.error('Error fetching reference types:', error);
    throw error;
  }
}

async function getSchemasByTypeId(typeId) {
  try {
    console.log(`Fetching schemas for reference type ID: ${typeId}`);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (cookie && typeof cookie === 'string' && cookie.trim() !== '') {
      const sanitizedCookie = cookie.replace(/[^\x20-\x7E]/g, '').trim();
      if (sanitizedCookie) {
        headers['Cookie'] = sanitizedCookie;
      }
    }
    
    const response = await fetch(`http://0.0.0.0:5000/api/reference-types/${typeId}/schemas`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch schemas: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const schemas = await response.json();
    return schemas;
  } catch (error) {
    console.error(`Error fetching schemas for type ${typeId}:`, error);
    return [];
  }
}

async function main() {
  try {
    // First ensure we're logged in
    await login();
    
    // Get all reference types
    const types = await getAllReferenceTypes();
    
    console.log('\n=== REFERENCE TYPES AND SCHEMAS ===\n');
    
    // For each type, get its schemas
    for (const type of types) {
      console.log(`\n== Type: ${type.name} (ID: ${type.id}) ==`);
      console.log(`Description: ${type.description}`);
      console.log(`Created: ${new Date(type.createdAt).toLocaleString()}`);
      
      const schemas = await getSchemasByTypeId(type.id);
      
      if (schemas.length > 0) {
        console.log('\nSchemas:');
        schemas.forEach((schema, index) => {
          console.log(`${index + 1}. ${schema.name} (${schema.dataType})`);
        });
      } else {
        console.log('\nWARNING: No schemas found for this type!');
      }
      
      console.log('\n' + '-'.repeat(50));
    }
    
    console.log('\nDebug complete!');
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

main();
