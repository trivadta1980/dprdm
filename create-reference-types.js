
// Script to create reference data types using the API
import fetch from 'node-fetch';
import fs from 'fs';

// Get auth cookie
let cookie = '';

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
      // Extract just the session cookie part - format should be "connect.sid=s%3A..."
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

async function createReferenceType(typeData) {
  try {
    console.log(`Creating reference type: ${typeData.name}`);
    
    // Read cookie from file (in case we're running the script multiple times)
    if (!cookie && fs.existsSync('cookies.txt')) {
      cookie = fs.readFileSync('cookies.txt', 'utf8');
    }
    
    // Use the correct API URL
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Only add cookie if it exists and is valid
    if (cookie && typeof cookie === 'string' && cookie.trim() !== '') {
      // Make sure the cookie doesn't have any invalid characters
      const sanitizedCookie = cookie.replace(/[^\x20-\x7E]/g, '').trim();
      if (sanitizedCookie) {
        headers['Cookie'] = sanitizedCookie;
      }
    }
    
    const response = await fetch('http://0.0.0.0:5000/api/reference-types', {
      method: 'POST',
      headers,
      body: JSON.stringify(typeData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create reference type: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Successfully created reference type: ${data.name} with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`Error creating reference type:`, error);
    throw error;
  }
}

// Define reference types
const referenceTypes = [
  {
    name: "Manufacturer",
    description: "Manufacturer reference data type",
    schemas: [
      { name: "CMO_ID", dataType: "string" },
      { name: "Name", dataType: "string" },
      { name: "Sponsor_ID", dataType: "string" },
      { name: "GMP Status", dataType: "string" }
    ]
  },
  {
    name: "Distributor",
    description: "Distributor reference data type",
    schemas: [
      { name: "Depot_ID", dataType: "string" },
      { name: "Name", dataType: "string" },
      { name: "Location", dataType: "string" },
      { name: "GDP Compliance", dataType: "string" }
    ]
  },
  {
    name: "Site",
    description: "Site reference data type",
    schemas: [
      { name: "Site_ID", dataType: "string" },
      { name: "Name", dataType: "string" },
      { name: "Region", dataType: "string" },
      { name: "GDP/GMP Compliance", dataType: "string" }
    ]
  }
];

async function main() {
  console.log("Starting to create reference data types");
  
  // Login first to get authentication
  try {
    await login();
  } catch (error) {
    console.error('Authentication failed, will try to use existing cookie if available');
  }
  
  // Create each type sequentially
  for (const typeData of referenceTypes) {
    try {
      await createReferenceType(typeData);
    } catch (error) {
      // If the reference type already exists, continue with the next one
      if (error.message && error.message.includes("duplicate key value")) {
        console.log(`Reference type ${typeData.name} already exists. Skipping.`);
        continue;
      }
      console.error(`Failed to create ${typeData.name}:`, error);
    }
  }
  
  console.log("Finished creating reference data types");
}

main().catch(error => {
  console.error("Script execution failed:", error);
  process.exit(1);
});
