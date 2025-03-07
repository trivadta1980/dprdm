import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { createObjectCsvWriter } from 'csv-writer';

// Set to store unique site combinations (name + type)
const uniqueSites = new Map();

// Read the input CSV file
createReadStream('lkp_lane_masked.csv')
  .pipe(parse({ columns: true, trim: true }))
  .on('data', (row) => {
    // Process origin
    if (row.origin && row.origin_node) {
      const key = `${row.origin}|${row.origin_node}`;
      if (!uniqueSites.has(key)) {
        uniqueSites.set(key, {
          name: row.origin,
          type: row.origin_node
        });
      }
    }

    // Process destination
    if (row.destination && row.destination_node) {
      const key = `${row.destination}|${row.destination_node}`;
      if (!uniqueSites.has(key)) {
        uniqueSites.set(key, {
          name: row.destination,
          type: row.destination_node
        });
      }
    }
  })
  .on('end', () => {
    // Convert unique sites to array and add IDs
    const sitesArray = Array.from(uniqueSites.entries()).map(([_, site], index) => ({
      Site_ID: `SITE_${(index + 1).toString().padStart(4, '0')}`,
      Site_Name: site.name,
      Site_Type: site.type
    }));

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: 'sites.csv',
      header: [
        { id: 'Site_ID', title: 'Site_ID' },
        { id: 'Site_Name', title: 'Site_Name' },
        { id: 'Site_Type', title: 'Site_Type' }
      ]
    });

    // Write to CSV file
    csvWriter.writeRecords(sitesArray)
      .then(() => {
        console.log(`Generated sites.csv with ${sitesArray.length} unique sites`);
        console.log('Sample of generated data:');
        console.log(sitesArray.slice(0, 5));
      });
  });