/**
 * This script fixes existing crosswalk mappings by adding status fields to
 * individual mappings in the mappingData JSON that might be missing them.
 * 
 * It ensures that the source and target attributes are properly set in both 
 * the root level and in the mappingData structure.
 */

// Use PostgreSQL directly since we can't easily import TypeScript
import pg from 'pg';

const { Pool } = pg;

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixMappingStatus() {
  const client = await pool.connect();
  
  try {
    console.log('Starting crosswalk attribute repair process...');
    
    // Get all crosswalk mappings
    const { rows: mappings } = await client.query('SELECT * FROM crosswalk_mappings');
    console.log(`Found ${mappings.length} crosswalk mappings to check`);
    
    let fixedCount = 0;
    let updateErrors = 0;
    
    for (const mapping of mappings) {
      console.log(`Checking mapping #${mapping.id} (${mapping.name})...`);
      
      try {
        // Parse mappingData if it's a string
        let mappingData = mapping.mapping_data;
        if (typeof mappingData === 'string') {
          try {
            mappingData = JSON.parse(mappingData);
          } catch (e) {
            console.error(`Failed to parse mappingData for mapping ${mapping.id}:`, e);
            mappingData = { mappings: [] };
          }
        }
        
        if (!mappingData) {
          mappingData = { mappings: [] };
        }
        
        // Check if sourceAttribute and targetAttribute exist in mappingData
        const sourceAttr = mapping.source_attribute || '';
        const targetAttr = mapping.target_attribute || '';
        
        // If we don't have source or target attributes, try to get them from reference datasets
        if (!sourceAttr || !targetAttr) {
          try {
            // Get source reference dataset to determine attributes
            if (mapping.source_system_id) {
              const { rows: sourceDataSets } = await client.query(
                'SELECT * FROM reference_data_sets WHERE id = $1',
                [mapping.source_system_id]
              );
              
              if (sourceDataSets.length > 0) {
                const sourceDataSet = sourceDataSets[0];
                let sourceData = sourceDataSet.data;
                
                // Parse data if it's a string
                if (typeof sourceData === 'string') {
                  try {
                    sourceData = JSON.parse(sourceData);
                  } catch (e) {
                    console.error(`Failed to parse source dataset data:`, e);
                  }
                }
                
                // Get the first instance and find an appropriate attribute
                if (sourceData && typeof sourceData === 'object') {
                  const firstInstanceKey = Object.keys(sourceData)[0];
                  if (firstInstanceKey) {
                    const firstInstance = sourceData[firstInstanceKey];
                    if (firstInstance && typeof firstInstance === 'object') {
                      // Find the first non-metadata field
                      const possibleKeys = Object.keys(firstInstance).filter(
                        k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
                      );
                      
                      if (possibleKeys.length > 0) {
                        if (!sourceAttr) {
                          mapping.source_attribute = possibleKeys[0];
                          console.log(`  Detected source attribute: ${mapping.source_attribute}`);
                        }
                      }
                    }
                  }
                }
              }
            }
            
            // Get target reference dataset to determine attributes
            if (mapping.target_system_id) {
              const { rows: targetDataSets } = await client.query(
                'SELECT * FROM reference_data_sets WHERE id = $1',
                [mapping.target_system_id]
              );
              
              if (targetDataSets.length > 0) {
                const targetDataSet = targetDataSets[0];
                let targetData = targetDataSet.data;
                
                // Parse data if it's a string
                if (typeof targetData === 'string') {
                  try {
                    targetData = JSON.parse(targetData);
                  } catch (e) {
                    console.error(`Failed to parse target dataset data:`, e);
                  }
                }
                
                // Get the first instance and find an appropriate attribute
                if (targetData && typeof targetData === 'object') {
                  const firstInstanceKey = Object.keys(targetData)[0];
                  if (firstInstanceKey) {
                    const firstInstance = targetData[firstInstanceKey];
                    if (firstInstance && typeof firstInstance === 'object') {
                      // Find the first non-metadata field
                      const possibleKeys = Object.keys(firstInstance).filter(
                        k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
                      );
                      
                      if (possibleKeys.length > 0) {
                        if (!targetAttr) {
                          mapping.target_attribute = possibleKeys[0];
                          console.log(`  Detected target attribute: ${mapping.target_attribute}`);
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error detecting attributes from datasets:`, error);
          }
        }
        
        // Set default attributes if still not found
        if (!mapping.source_attribute) {
          mapping.source_attribute = 'name';
          console.log(`  Using default source attribute: ${mapping.source_attribute}`);
        }
        
        if (!mapping.target_attribute) {
          mapping.target_attribute = 'name';
          console.log(`  Using default target attribute: ${mapping.target_attribute}`);
        }
        
        // Ensure mappingData has the attributes
        mappingData.sourceAttribute = mapping.source_attribute;
        mappingData.targetAttribute = mapping.target_attribute;
        
        // Ensure mappings array exists and has status values
        if (!Array.isArray(mappingData.mappings)) {
          mappingData.mappings = [];
        }
        
        let modified = false;
        
        // Update any missing status values
        for (const item of mappingData.mappings) {
          if (!item.status) {
            item.status = mapping.approval_status || 'PENDING';
            modified = true;
          }
          if (item.confidence === undefined) {
            item.confidence = 0.75; // Default confidence
            modified = true;
          }
        }
        
        // Update the database if changes were made
        if (modified || !mappingData.sourceAttribute || !mappingData.targetAttribute) {
          await client.query(
            'UPDATE crosswalk_mappings SET source_attribute = $1, target_attribute = $2, mapping_data = $3 WHERE id = $4',
            [mapping.source_attribute, mapping.target_attribute, JSON.stringify(mappingData), mapping.id]
          );
          
          console.log(`  Updated mapping #${mapping.id} - set source_attribute=${mapping.source_attribute}, target_attribute=${mapping.target_attribute}`);
          fixedCount++;
        } else {
          console.log(`  No changes needed for mapping #${mapping.id}`);
        }
      } catch (error) {
        console.error(`Error processing mapping #${mapping.id}:`, error);
        updateErrors++;
      }
    }
    
    console.log(`Repair complete. Fixed ${fixedCount} out of ${mappings.length} crosswalk mappings.`);
    if (updateErrors > 0) {
      console.log(`Encountered ${updateErrors} errors during processing.`);
    }
  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    client.release();
    await pool.end();
    console.log('Finished processing.');
  }
}

// Run the script
fixMappingStatus().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});