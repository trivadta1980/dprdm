
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { promisify } from 'util';
import { scrypt, timingSafeEqual } from 'crypto';

// Load environment variables
dotenv.config();
neonConfig.webSocketConstructor = ws;
const scryptAsync = promisify(scrypt);

// Helper functions
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Login and get session cookie
async function login() {
  try {
    const response = await fetch('http://0.0.0.0:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!'
      }),
      redirect: 'manual'
    });
    
    const cookies = response.headers.get('set-cookie');
    console.log('Login response status:', response.status);
    return cookies;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

async function testReferenceTypeSchemas() {
  console.log('Testing reference types schemas endpoint...');
  
  // First login to get session cookie
  const cookies = await login();
  if (!cookies) {
    console.error('Failed to login. Cannot proceed with tests.');
    return;
  }
  
  // Connect to database to get a valid reference type ID
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });
  
  try {
    // Get all reference types to find a valid ID
    const typesResult = await pool.query('SELECT id, name FROM reference_data_types LIMIT 1');
    
    if (typesResult.rows.length === 0) {
      console.log('No reference types found in database. Creating a test reference type...');
      
      // Create a test reference type if none exists
      const createTypeResponse = await fetch('http://0.0.0.0:5000/api/reference-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          name: 'Test Type',
          description: 'Created for testing',
          schemas: [
            { name: 'code', dataType: 'string', description: 'Test code' },
            { name: 'name', dataType: 'string', description: 'Test name' }
          ]
        })
      });
      
      if (!createTypeResponse.ok) {
        console.error('Failed to create test reference type:', await createTypeResponse.text());
        return;
      }
      
      const createdType = await createTypeResponse.json();
      console.log('Created test reference type:', createdType);
      var typeId = createdType.id;
      var typeName = createdType.name;
    } else {
      var typeId = typesResult.rows[0].id;
      var typeName = typesResult.rows[0].name;
    }
    
    console.log(`Testing endpoint for reference type: ${typeName} (ID: ${typeId})`);
    
    // Check schemas directly in database
    const dbSchemasResult = await pool.query(
      'SELECT * FROM reference_data_type_schemas WHERE reference_data_type_id = $1', 
      [typeId]
    );
    console.log(`Found ${dbSchemasResult.rows.length} schemas in database for this type`);
    
    // Test the API endpoint
    const response = await fetch(`http://0.0.0.0:5000/api/reference-types/${typeId}/schemas`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    console.log('API Response status:', response.status);
    
    if (response.ok) {
      const schemas = await response.json();
      console.log(`API returned ${schemas.length} schemas`);
      console.log('Schemas from API:', JSON.stringify(schemas, null, 2));
      
      // Compare with database results
      if (schemas.length === dbSchemasResult.rows.length) {
        console.log('✅ Success! API response matches database record count.');
      } else {
        console.log('❌ Error: API response count does not match database record count.');
        console.log(`   API: ${schemas.length}, Database: ${dbSchemasResult.rows.length}`);
      }
    } else {
      console.error('❌ API returned error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testReferenceTypeSchemas();
