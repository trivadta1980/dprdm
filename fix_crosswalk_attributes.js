/**
 * This utility script repairs existing crosswalk mappings by adding missing sourceAttribute 
 * and targetAttribute values. It will detect the appropriate attributes from the linked 
 * reference datasets.
 */

import { db } from './server/db.ts';
import { crosswalkMappings } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function fixCrosswalkAttributes() {
  console.log('Starting crosswalk attribute repair tool...');
  
  try {
    // Get all crosswalk mappings from database
    const mappings = await db.select().from(crosswalkMappings);
    console.log(`Found ${mappings.length} crosswalk mappings to check`);
    
    let fixedCount = 0;
    
    for (const mapping of mappings) {
      const hasAttributes = mapping.sourceAttribute && mapping.targetAttribute;
      let mappingData = mapping.mappingData || {};

      if (typeof mappingData === 'string') {
        try {
          mappingData = JSON.parse(mappingData);
        } catch (e) {
          console.error(`Failed to parse mappingData for mapping ${mapping.id}:`, e);
          mappingData = {};
        }
      }
      
      const hasDataAttributes = mappingData.sourceAttribute && mappingData.targetAttribute;
      
      // Skip if both root and mappingData have attributes
      if (hasAttributes && hasDataAttributes && 
          mapping.sourceAttribute === mappingData.sourceAttribute && 
          mapping.targetAttribute === mappingData.targetAttribute) {
        continue;
      }
      
      console.log(`Checking mapping #${mapping.id} (${mapping.name})...`);
      console.log(`Current state: sourceAttr=${mapping.sourceAttribute}, targetAttr=${mapping.targetAttribute}, ` +
                  `in mappingData: sourceAttr=${mappingData.sourceAttribute}, targetAttr=${mappingData.targetAttribute}`);
      
      // Try to get source and target datasets to detect attributes
      if (mapping.sourceSystemId && mapping.targetSystemId) {
        try {
          // Get the source and target datasets to analyze schema
          const sourceDataset = await getReferenceDataSet(mapping.sourceSystemId);
          const targetDataset = await getReferenceDataSet(mapping.targetSystemId);
          
          let sourceAttribute = mapping.sourceAttribute || mappingData.sourceAttribute || '';
          let targetAttribute = mapping.targetAttribute || mappingData.targetAttribute || '';
          
          // Detect source attribute if needed
          if (!sourceAttribute && sourceDataset && sourceDataset.data) {
            const firstInstance = Object.values(sourceDataset.data)[0];
            if (firstInstance) {
              const possibleKeys = Object.keys(firstInstance).filter(
                k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
              );
              if (possibleKeys.length > 0) {
                sourceAttribute = possibleKeys[0];
                console.log(`  Detected source attribute: ${sourceAttribute}`);
              }
            }
          }
          
          // Detect target attribute if needed
          if (!targetAttribute && targetDataset && targetDataset.data) {
            const firstInstance = Object.values(targetDataset.data)[0];
            if (firstInstance) {
              const possibleKeys = Object.keys(firstInstance).filter(
                k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
              );
              if (possibleKeys.length > 0) {
                targetAttribute = possibleKeys[0];
                console.log(`  Detected target attribute: ${targetAttribute}`);
              }
            }
          }
          
          // Apply default if we still don't have attributes
          if (!sourceAttribute) {
            sourceAttribute = 'name'; // Default fallback
            console.log(`  Using default source attribute: ${sourceAttribute}`);
          }
          
          if (!targetAttribute) {
            targetAttribute = 'name'; // Default fallback
            console.log(`  Using default target attribute: ${targetAttribute}`);
          }
          
          // Build updated mappingData
          const updatedMappingData = {
            ...mappingData,
            sourceAttribute,
            targetAttribute,
            mappings: mappingData.mappings || []
          };
          
          // Update the database
          await db.update(crosswalkMappings)
            .set({
              sourceAttribute,
              targetAttribute,
              mappingData: updatedMappingData
            })
            .where(eq(crosswalkMappings.id, mapping.id));
          
          console.log(`  Updated mapping #${mapping.id} with sourceAttr=${sourceAttribute}, targetAttr=${targetAttribute}`);
          fixedCount++;
        } catch (error) {
          console.error(`  Error processing mapping #${mapping.id}:`, error);
        }
      } else {
        console.log(`  Skipping mapping #${mapping.id} - missing source or target system ID`);
      }
    }
    
    console.log(`Repair complete. Fixed ${fixedCount} out of ${mappings.length} crosswalk mappings.`);
  } catch (error) {
    console.error('Error occurred during repair process:', error);
  } finally {
    console.log('Finished crosswalk attribute repair process.');
    process.exit(0);
  }
}

async function getReferenceDataSet(id) {
  // Query database directly to get reference dataset
  try {
    const [result] = await db.execute(
      `SELECT * FROM reference_data WHERE id = $1`,
      [id]
    );
    
    if (!result || !result.rows || result.rows.length === 0) {
      return null;
    }
    
    // Parse JSON data field if it exists
    if (result.rows[0].data && typeof result.rows[0].data === 'string') {
      try {
        result.rows[0].data = JSON.parse(result.rows[0].data);
      } catch (e) {
        console.error(`Failed to parse data for dataset ${id}:`, e);
      }
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error fetching reference dataset ${id}:`, error);
    return null;
  }
}

// Run the repair tool
fixCrosswalkAttributes().catch(console.error);