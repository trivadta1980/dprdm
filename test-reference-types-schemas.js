
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
    // Get total schema count
    const totalSchemasResult = await pool.query('SELECT COUNT(*) FROM reference_data_type_schemas');
    const totalSchemas = parseInt(totalSchemasResult.rows[0].count, 10);
    console.log(`Total schemas in database: ${totalSchemas}`);
    
    // Get all reference types to test with
    const typesResult = await pool.query('SELECT id, name FROM reference_data_types ORDER BY id');
    console.log(`Found ${typesResult.rows.length} reference types in database`);
    
    let totalSchemasFetched = 0;
    
    // Test all reference types
    for (const type of typesResult.rows) {
      console.log(`\n------ Testing reference type: ${type.name} (ID: ${type.id}) ------`);
      
      // Check schemas directly in database
      const dbSchemasResult = await pool.query(
        'SELECT * FROM reference_data_type_schemas WHERE reference_data_type_id = $1', 
        [type.id]
      );
      console.log(`Database has ${dbSchemasResult.rows.length} schemas for this type`);
      
      // Test the API endpoint
      const response = await fetch(`http://0.0.0.0:5000/api/reference-types/${type.id}/schemas`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const schemas = await response.json();
        console.log(`API returned ${schemas.length} schemas`);
        totalSchemasFetched += schemas.length;
        
        // Compare with database results
        if (schemas.length === dbSchemasResult.rows.length) {
          console.log('✅ Success! API response matches database record count.');
        } else {
          console.log('❌ Error: API response count does not match database record count.');
          console.log(`   API: ${schemas.length}, Database: ${dbSchemasResult.rows.length}`);
        }
        
        // Show schema details
        if (schemas.length > 0) {
          console.log('Schema names:');
          schemas.forEach(schema => {
            console.log(`- ${schema.name} (${schema.dataType})`);
          });
        }
      } else {
        console.error('❌ API returned error:', response.status, await response.text());
      }
    }
    
    console.log(`\n===== Summary =====`);
    console.log(`Total schemas in database: ${totalSchemas}`);
    console.log(`Total schemas fetched via API: ${totalSchemasFetched}`);
    if (totalSchemas === totalSchemasFetched) {
      console.log('✅ All schemas successfully retrieved via API');
    } else {
      console.log('❌ Missing schemas: API returned fewer schemas than exist in database');
      console.log(`   Missing count: ${totalSchemas - totalSchemasFetched}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testReferenceTypeSchemas();
