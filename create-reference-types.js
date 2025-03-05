
// Script to create reference data types using the API
import fetch from 'node-fetch';

async function createReferenceType(typeData) {
  try {
    console.log(`Creating reference type: ${typeData.name}`);
    
    // Use the correct API URL
    const response = await fetch('http://0.0.0.0:5000/api/reference-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
