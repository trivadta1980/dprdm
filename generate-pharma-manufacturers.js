
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

function generatePharmaMakers(count = 1000) {
  console.log(`Generating ${count} pharmaceutical manufacturers...`);
  
  const prefixes = ['Pharma', 'Med', 'Bio', 'Gen', 'Life', 'Health', 'Cure', 'Vax', 'Thera', 'Clinic', 'Lab', 'Tech', 'Sci', 'Pro', 'Nova'];
  const middles = ['Tech', 'Science', 'Genetics', 'Therapeutics', 'Medicines', 'Health', 'Biologics', 'Medical', 'Pharma', 'Biotech', 'Labs', 'Chem', 'Research', 'Solutions', 'Systems'];
  const suffixes = ['Inc', 'Corp', 'Co', 'LLC', 'Ltd', 'Group', 'Pharmaceuticals', 'Biosciences', 'Technologies', 'Laboratories', 'Therapeutics', 'Sciences', 'SA', 'GmbH', 'AG', 'Holdings'];
  
  // GMP Status options
  const gmpStatuses = [
    'Certified', 
    'Compliant', 
    'Pending Renewal', 
    'Probation', 
    'Under Review'
  ];
  
  const manufacturers = [];
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
        `${prefix}${middle} ${suffix}`,
        `${prefix}-${middle} ${suffix}`,
        `${prefix} ${middle} ${suffix}`,
        `${prefix} ${suffix}`,
        `${middle} ${prefix} ${suffix}`
      ];
      
      name = patterns[Math.floor(Math.random() * patterns.length)];
    } while (usedNames.has(name));
    
    usedNames.add(name);
    
    // Generate CMO_ID (CMO for Contract Manufacturing Organization followed by unique number)
    const cmoId = `CMO${(i + 1).toString().padStart(4, '0')}`;
    
    // Generate Sponsor_ID (SP for Sponsor followed by unique number)
    const sponsorId = `SP${Math.floor(Math.random() * 500 + 1).toString().padStart(4, '0')}`;
    
    // Pick a random GMP status
    const gmpStatus = gmpStatuses[Math.floor(Math.random() * gmpStatuses.length)];
    
    // Add to manufacturers array with all properties we've generated
    manufacturers.push({
      CMO_ID: cmoId,
      Name: name,
      Sponsor_ID: sponsorId,
      "GMP Status": gmpStatus
    });
  }
  
  return manufacturers;
}

async function createCsvFile(manufacturers) {
  const outputPath = path.join(__dirname, 'pharma_manufacturers.csv');
  
  // Create CSV writer with the specific headers requested
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'CMO_ID', title: 'CMO_ID' },
      { id: 'Name', title: 'Name' },
      { id: 'Sponsor_ID', title: 'Sponsor_ID' },
      { id: 'GMP Status', title: 'GMP Status' }
    ]
  });
  
  // Write the manufacturer data to the CSV file
  await csvWriter.writeRecords(manufacturers);
  
  console.log(`CSV file with ${manufacturers.length} manufacturers created at: ${outputPath}`);
  return outputPath;
}

async function main() {
  try {
    // Generate manufacturers
    const manufacturers = generatePharmaMakers(1000);
    
    // Create the CSV file with the manufacturer data
    const outputPath = await createCsvFile(manufacturers);
    
    console.log('Done! You can now upload this file to the Enterprise Manufacturers dataset.');
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

main();
