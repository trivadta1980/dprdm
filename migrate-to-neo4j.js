import { GraphDataService } from './server/services/graphDataService.ts';

async function migrateToNeo4j() {
  // Dataset ID 3 based on the relationship data we saw
  const datasetId = 3;
  
  console.log(`Starting migration for dataset ${datasetId}...`);
  
  try {
    await GraphDataService.syncReferenceDataSet(datasetId);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateToNeo4j().catch(console.error);
