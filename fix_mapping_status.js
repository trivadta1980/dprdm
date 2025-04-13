/**
 * This script fixes existing crosswalk mappings by adding status fields to
 * individual mappings in the mappingData JSON that might be missing them.
 * 
 * It ensures that the status of each mapping item matches the overall approval_status
 * of the crosswalk mapping record.
 */

const { db } = require('./server/db');
const { crosswalkMappings, eq } = require('./shared/schema');

async function fixMappingStatus() {
  console.log('Starting to fix mapping status in JSON data...');
  
  try {
    // Get all crosswalk mappings
    const mappings = await db
      .select()
      .from(crosswalkMappings);
    
    console.log(`Found ${mappings.length} crosswalk mappings to process`);
    
    // Process each mapping
    for (const mapping of mappings) {
      const mappingData = mapping.mappingData;
      let hasUpdated = false;
      
      // Check if mappingData has mappings array
      if (mappingData && mappingData.mappings && Array.isArray(mappingData.mappings)) {
        // Update each mapping in the array with the correct status
        const updatedMappings = mappingData.mappings.map(item => {
          // If the item doesn't have a status or its status doesn't match the parent, update it
          if (!item.status || item.status !== mapping.approvalStatus) {
            hasUpdated = true;
            return {
              ...item,
              status: mapping.approvalStatus
            };
          }
          return item;
        });
        
        // If we made changes, update the database
        if (hasUpdated) {
          const updatedMappingData = {
            ...mappingData,
            mappings: updatedMappings
          };
          
          // Update the database
          await db
            .update(crosswalkMappings)
            .set({
              mappingData: updatedMappingData,
              updatedAt: new Date()
            })
            .where(eq(crosswalkMappings.id, mapping.id));
          
          console.log(`Updated mapping ${mapping.id}: ${mapping.name} - Status: ${mapping.approvalStatus}`);
        } else {
          console.log(`No updates needed for mapping ${mapping.id}: ${mapping.name} - Status: ${mapping.approvalStatus}`);
        }
      } else {
        console.log(`Warning: Mapping ${mapping.id} has invalid or missing mappings array`);
      }
    }
    
    console.log('Completed fixing mapping status');
  } catch (error) {
    console.error('Error fixing mapping status:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the fix function
fixMappingStatus();