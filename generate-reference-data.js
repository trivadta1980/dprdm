
const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');

// Configuration
const OUTPUT_DIR = './generated_data';
const NUM_RECORDS = 1000;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Define the reference data types
const referenceTypes = [
  {
    name: 'Manufacturer',
    schema: [
      { name: 'CMO_ID', dataType: 'string' },
      { name: 'Name', dataType: 'string' },
      { name: 'Sponsor_ID', dataType: 'string' },
      { name: 'GMP Status', dataType: 'string' }
    ]
  },
  {
    name: 'Distributor',
    schema: [
      { name: 'Depot_ID', dataType: 'string' },
      { name: 'Name', dataType: 'string' },
      { name: 'Location', dataType: 'string' },
      { name: 'GDP Compliance', dataType: 'string' }
    ]
  },
  {
    name: 'Site',
    schema: [
      { name: 'Site_ID', dataType: 'string' },
      { name: 'Name', dataType: 'string' },
      { name: 'Region', dataType: 'string' },
      { name: 'GDP/GMP Compliance', dataType: 'string' }
    ]
  }
];

// Generate manufacturers
function generateManufacturers(count) {
  console.log(`Generating ${count} manufacturers...`);
  
  const manufacturers = [];
  
  for (let i = 1; i <= count; i++) {
    const cmoId = `CMO${String(i).padStart(5, '0')}`;
    
    // Generate a realistic pharmaceutical company name
    const companyPrefix = faker.helpers.arrayElement([
      'Advanced', 'Global', 'Premier', 'Integrated', 'Precision', 
      'BioTech', 'NextGen', 'Universal', 'Summit', 'Alliance'
    ]);
    
    const companyMiddle = faker.helpers.arrayElement([
      'Pharma', 'Biologics', 'Therapeutics', 'Sciences', 'Manufacturing',
      'BioPharm', 'Solutions', 'MedTech', 'Laboratories', 'Research'
    ]);
    
    const companySuffix = faker.helpers.arrayElement([
      'Inc.', 'Ltd.', 'Solutions', 'Group', 'Partners', 
      'International', 'Innovations', 'Technologies', 'Systems', 'Corp'
    ]);
    
    const name = `${companyPrefix} ${companyMiddle} ${companySuffix}`;
    
    // Generate sponsor ID
    const sponsorId = `SP${faker.string.numeric(4)}`;
    
    // GMP status
    const gmpStatus = faker.helpers.arrayElement([
      'Certified', 'Pending', 'Provisional', 'Compliant', 'In Review',
      'Approved', 'Conditional', 'Expired', 'Revoked', 'Under Evaluation'
    ]);
    
    manufacturers.push({
      CMO_ID: cmoId,
      Name: name,
      Sponsor_ID: sponsorId,
      'GMP Status': gmpStatus
    });
  }
  
  return manufacturers;
}

// Generate distributors
function generateDistributors(count) {
  console.log(`Generating ${count} distributors...`);
  
  const distributors = [];
  const countries = [
    'USA', 'Canada', 'UK', 'Germany', 'France', 'Italy', 'Spain', 
    'Japan', 'China', 'India', 'Brazil', 'Australia', 'Singapore', 
    'South Korea', 'Switzerland', 'Netherlands', 'Belgium', 'Sweden',
    'Denmark', 'Norway', 'Ireland', 'Austria', 'Poland', 'Mexico'
  ];
  
  for (let i = 1; i <= count; i++) {
    const depotId = `DEP${String(i).padStart(5, '0')}`;
    
    // Generate a realistic distributor name
    const prefix = faker.helpers.arrayElement([
      'Global', 'National', 'Regional', 'Prime', 'Central', 
      'United', 'Strategic', 'Worldwide', 'Integrated', 'Alliance'
    ]);
    
    const middle = faker.helpers.arrayElement([
      'Pharma', 'Medical', 'Healthcare', 'Logistics', 'Distribution',
      'Supply', 'Depot', 'Transport', 'Storage', 'Delivery'
    ]);
    
    const suffix = faker.helpers.arrayElement([
      'Solutions', 'Services', 'Network', 'Group', 'Partners', 
      'Logistics', 'Hub', 'Alliance', 'Systems', 'International'
    ]);
    
    const name = `${prefix} ${middle} ${suffix}`;
    
    // Location
    const country = faker.helpers.arrayElement(countries);
    const city = faker.location.city();
    const location = `${city}, ${country}`;
    
    // GDP compliance
    const gdpCompliance = faker.helpers.arrayElement([
      'Fully Compliant', 'Partial Compliance', 'Pending Review', 'Non-Compliant',
      'Conditional Approval', 'Under Remediation', 'Certified', 'Provisional',
      'Grade A', 'Grade B', 'Grade C'
    ]);
    
    distributors.push({
      Depot_ID: depotId,
      Name: name,
      Location: location,
      'GDP Compliance': gdpCompliance
    });
  }
  
  return distributors;
}

// Generate sites
function generateSites(count) {
  console.log(`Generating ${count} sites...`);
  
  const sites = [];
  const regions = [
    'North America', 'South America', 'Western Europe', 'Eastern Europe',
    'Northern Europe', 'Southern Europe', 'Middle East', 'North Africa',
    'Sub-Saharan Africa', 'Central Asia', 'East Asia', 'South Asia',
    'Southeast Asia', 'Oceania', 'Caribbean', 'Central America'
  ];
  
  for (let i = 1; i <= count; i++) {
    const siteId = `SITE${String(i).padStart(5, '0')}`;
    
    // Generate a realistic site name
    const prefix = faker.helpers.arrayElement([
      'Central', 'Primary', 'Regional', 'Advanced', 'Main', 
      'Strategic', 'Core', 'Principal', 'Flagship', 'Key'
    ]);
    
    const middle = faker.helpers.arrayElement([
      'Research', 'Manufacturing', 'Distribution', 'Clinical', 'Processing',
      'Production', 'Development', 'Packaging', 'Testing', 'Storage'
    ]);
    
    const suffix = faker.helpers.arrayElement([
      'Facility', 'Center', 'Hub', 'Campus', 'Complex', 
      'Site', 'Unit', 'Plant', 'Laboratory', 'Location'
    ]);
    
    const name = `${prefix} ${middle} ${suffix}`;
    
    // Region
    const region = faker.helpers.arrayElement(regions);
    
    // Compliance
    const compliance = faker.helpers.arrayElement([
      'GMP Certified', 'GDP Compliant', 'Dual Certified', 'GMP Pending',
      'GDP Pending', 'GMP/GDP Compliant', 'Conditionally Approved',
      'Under Review', 'Certified with Exceptions', 'Fully Certified'
    ]);
    
    sites.push({
      Site_ID: siteId,
      Name: name,
      Region: region,
      'GDP/GMP Compliance': compliance
    });
  }
  
  return sites;
}

// Save data to CSV
function saveToCSV(data, fileName) {
  if (data.length === 0) {
    console.log(`No data to save for ${fileName}`);
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      // Handle commas in data by enclosing in quotes
      const cellValue = row[header] || '';
      return cellValue.includes(',') ? `"${cellValue}"` : cellValue;
    }).join(','))
  ];
  
  const filePath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, csvRows.join('\n'));
  console.log(`Saved ${data.length} records to ${filePath}`);
}

// Main execution
async function main() {
  // Display reference types that will be created
  console.log('Reference Types to be created:');
  referenceTypes.forEach(type => {
    console.log(`- ${type.name}`);
    type.schema.forEach(field => {
      console.log(`  - ${field.name} (${field.dataType})`);
    });
  });
  
  // Generate data
  const manufacturers = generateManufacturers(NUM_RECORDS);
  const distributors = generateDistributors(NUM_RECORDS);
  const sites = generateSites(NUM_RECORDS);
  
  // Save data to CSV files
  saveToCSV(manufacturers, 'Enterprise_Manufacturers.csv');
  saveToCSV(distributors, 'Enterprise_Distributors.csv');
  saveToCSV(sites, 'Enterprise_Sites.csv');
  
  console.log('\nData generation complete!');
  console.log('Next steps:');
  console.log('1. Create the Reference Data Types in the app using the provided schemas');
  console.log('2. Create Reference Data Sets for each type');
  console.log('3. Upload the CSV files using the bulk upload feature');
}

main().catch(error => {
  console.error('Error generating data:', error);
  process.exit(1);
});
