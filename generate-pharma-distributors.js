
import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generatePharmaDistributors(count = 1000) {
  console.log(`Generating ${count} pharmaceutical distributors...`);
  
  const prefixes = ['Global', 'United', 'Prime', 'Vital', 'Direct', 'Med', 'Care', 'Allied', 'Pro', 'Total', 'Rapid', 'National', 'Inter', 'Apex', 'Metro'];
  const middles = ['Pharma', 'Health', 'Medical', 'Drug', 'Care', 'Life', 'Supply', 'Meds', 'Rx', 'Medicine', 'Therapeutic', 'Wellness', 'Logistics', 'Healthcare', 'Pharmacy'];
  const suffixes = ['Distributors', 'Distribution', 'Logistics', 'Supply Chain', 'Network', 'Partners', 'Alliance', 'Group', 'Inc', 'LLC', 'Co', 'Corp', 'International', 'Services', 'Solutions'];
  
  // Locations
  const locations = [
    'New York, USA', 
    'London, UK', 
    'Singapore', 
    'Toronto, Canada', 
    'Sydney, Australia', 
    'Mumbai, India', 
    'Berlin, Germany', 
    'Tokyo, Japan', 
    'Paris, France', 
    'São Paulo, Brazil', 
    'Shanghai, China', 
    'Dubai, UAE', 
    'Amsterdam, Netherlands', 
    'Madrid, Spain', 
    'Zurich, Switzerland'
  ];
  
  // GDP Compliance statuses
  const gdpStatuses = [
    'Compliant', 
    'Pending Review', 
    'Certified', 
    'Provisional', 
    'Under Inspection'
  ];
  
  const distributors = [];
  const usedNames = new Set();
  
  for (let i = 0; i < count; i++) {
    let name;
    
    // Generate a unique name
    do {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const middle = middles[Math.floor(Math.random() * middles.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      
      // Different name patterns
      const patterns = [
        `${prefix} ${middle} ${suffix}`,
        `${prefix}-${middle} ${suffix}`,
        `${prefix}${middle} ${suffix}`,
        `${prefix} ${suffix}`,
        `${middle} ${prefix} ${suffix}`
      ];
      
      name = patterns[Math.floor(Math.random() * patterns.length)];
    } while (usedNames.has(name));
    
    usedNames.add(name);
    
    // Generate Depot_ID with unique number
    const depotId = `DEPOT${(i + 1).toString().padStart(4, '0')}`;
    
    // Pick random location and GDP status
    const location = locations[Math.floor(Math.random() * locations.length)];
    const gdpCompliance = gdpStatuses[Math.floor(Math.random() * gdpStatuses.length)];
    
    // Add to distributors array
    distributors.push({
      Depot_ID: depotId,
      Name: name,
      Location: location,
      "GDP Compliance": gdpCompliance
    });
  }
  
  return distributors;
}

async function createCsvFile(distributors) {
  const outputPath = path.join(__dirname, 'pharma_distributors.csv');
  
  // Create CSV writer with the specific headers
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'Depot_ID', title: 'Depot_ID' },
      { id: 'Name', title: 'Name' },
      { id: 'Location', title: 'Location' },
      { id: 'GDP Compliance', title: 'GDP Compliance' }
    ]
  });
  
  // Write the distributor data to the CSV file
  await csvWriter.writeRecords(distributors);
  
  console.log(`CSV file with ${distributors.length} distributors created at: ${outputPath}`);
  return outputPath;
}

async function main() {
  try {
    // Generate distributors
    const distributors = generatePharmaDistributors(1000);
    
    // Create the CSV file with the distributor data
    const outputPath = await createCsvFile(distributors);
    
    console.log('Done! You can now upload this file to the Enterprise Distributors dataset.');
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

main();
