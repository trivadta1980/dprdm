
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import * as schema from './shared/schema.ts';
import { eq, or } from 'drizzle-orm';

dotenv.config();

/**
 * Test implementation of the syncReferenceDataSet function that includes 
 * relationship attribute values in Neo4j relationships
 */
async function syncReferenceDataSet_test(dataSetId, session) {
  console.log(`[TEST] Syncing dataset ${dataSetId} to Neo4j with relationship attributes`);

  try {
    // Fetch relationships from the database including attribute values
    console.log(`[TEST] Fetching relationships for dataset ${dataSetId} with attribute values`);
    const relationships = await db.query.relationships.findMany({
      where: or(
        eq(schema.relationships.sourceDataSetId, dataSetId),
        eq(schema.relationships.targetDataSetId, dataSetId)
      ),
      with: {
        values: true
      }
    });

    // For each relationship value, fetch its attribute values separately
    for (const relationship of relationships) {
      if (relationship.values && relationship.values.length > 0) {
        for (const value of relationship.values) {
          const attributeValues = await db.query.relationshipAttributeValues.findMany({
            where: eq(schema.relationshipAttributeValues.relationshipValueId, value.id),
            with: {
              definition: true
            }
          });
          
          // Attach attribute values to the relationship value
          value.attributeValues = attributeValues;
        }
      }
    }

    console.log(`[TEST] Found ${relationships.length} relationships for dataset ${dataSetId}`);
    
    // Log relationship values and their attributes
    for (const relationship of relationships) {
      console.log(`[TEST] Relationship ${relationship.id} (${relationship.relationshipType}) has ${relationship.values.length} values`);
      
      for (const value of relationship.values) {
        if (value.attributeValues && value.attributeValues.length > 0) {
          console.log(`  [TEST] Value ${value.id} (${value.sourceInstanceId} -> ${value.targetInstanceId}) has ${value.attributeValues.length} attribute values:`);
          
          for (const attrValue of value.attributeValues) {
            console.log(`    - ${attrValue.definition.name} (${attrValue.definition.dataType}): ${attrValue.value}`);
          }
        } else {
          console.log(`  [TEST] Value ${value.id} (${value.sourceInstanceId} -> ${value.targetInstanceId}) has no attribute values`);
        }
      }

      // Process a relationship value
      if (relationship.values.length > 0) {
        const value = relationship.values[0];
        
        // Verify nodes exist in Neo4j
        const nodesQuery = `
          MATCH (source:DataItem {name: $sourceName})
          MATCH (target:DataItem {name: $targetName})
          RETURN source, target
        `;
        
        const nodesExist = await session.run(nodesQuery, {
          sourceName: value.sourceInstanceId,
          targetName: value.targetInstanceId
        });
        
        if (nodesExist.records.length === 0) {
          console.log(`[TEST] Skipping relationship - One or both nodes not found: source=${value.sourceInstanceId}, target=${value.targetInstanceId}`);
          continue;
        }
        
        // Create properties object with relationship ID
        const relationshipProperties = {
          relationshipId: relationship.id.toString()
        };

        // Add attribute values to properties
        if (value.attributeValues && value.attributeValues.length > 0) {
          console.log(`[TEST] Adding ${value.attributeValues.length} attribute values to Neo4j relationship properties`);
          
          for (const attr of value.attributeValues) {
            // Convert value based on data type if needed
            let convertedValue = attr.value;
            if (attr.definition.dataType === 'number') {
              convertedValue = parseFloat(attr.value);
            } else if (attr.definition.dataType === 'boolean') {
              convertedValue = attr.value.toLowerCase() === 'true';
            }

            // Use the attribute name as the property key
            relationshipProperties[attr.definition.name] = convertedValue;
            console.log(`  [TEST] - Added ${attr.definition.name}: ${convertedValue} (${typeof convertedValue})`);
          }
        }

        // Create relationship with properties
        const createRelQuery = `
          MATCH (source:DataItem {name: $sourceName})
          MATCH (target:DataItem {name: $targetName})
          MERGE (source)-[r:${relationship.relationshipType.toUpperCase()}]->(target)
          SET r = $properties
          RETURN r
        `;

        const result = await session.run(createRelQuery, {
          sourceName: value.sourceInstanceId,
          targetName: value.targetInstanceId,
          properties: relationshipProperties
        });

        console.log(`[TEST] Created relationship: ${value.sourceInstanceId} -> ${value.targetInstanceId} with properties:`, relationshipProperties);
      }
    }
    
    return { success: true, message: "Relationships synced successfully with attribute values" };
  } catch (error) {
    console.error(`[TEST] Error in syncReferenceDataSet_test:`, error);
    throw error;
  }
}

async function testRelationshipAttributes() {
  console.log('Starting relationship attribute test...');

  // Create Neo4j driver
  console.log('Connecting to Neo4j...');
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );

  const session = driver.session();

  try {
    // First get a relationship ID to test with from Neo4j
    const findRelQuery = `
      MATCH ()-[r:ASSOCIATION]->()
      WHERE r.relationshipId = '3'
      RETURN r LIMIT 1
    `;

    const relResult = await session.run(findRelQuery);
    if (relResult.records.length === 0) {
      console.log('No relationships found to test with');
      return;
    }

    const relationship = relResult.records[0].get('r');
    console.log('Found relationship:', relationship.type);
    console.log('Relationship properties:', relationship.properties);

    // Run the test implementation
    console.log('\nTesting syncReferenceDataSet_test implementation with real attribute values...');
    const result = await syncReferenceDataSet_test(11, session);
    console.log('Test result:', result);

    // Verify the relationships have been updated with attributes
    const verifyQuery = `
      MATCH ()-[r:ASSOCIATION]->()
      WHERE r.relationshipId = '3'
      RETURN properties(r) as props
    `;

    const verifyResult = await session.run(verifyQuery);

    if (verifyResult.records.length > 0) {
      console.log('\nVerification: Relationship properties in Neo4j after test:');
      console.log(verifyResult.records[0].get('props'));
    } else {
      console.log('\nVerification failed: Relationship not found after test');
    }

    // Show what code changes would be needed in GraphDataService.syncReferenceDataSet
    console.log('\n------------------------------------------------------------------------------');
    console.log('Code changes needed in GraphDataService.syncReferenceDataSet():');
    console.log('------------------------------------------------------------------------------');
    console.log(`
// 1. When fetching relationships, include attribute values:
const relationships = await db.query.relationships.findMany({
  where: or(
    eq(schema.relationships.sourceDataSetId, dataSetId),
    eq(schema.relationships.targetDataSetId, dataSetId)
  ),
  with: {
    values: {
      with: {
        attributeValues: {
          with: {
            definition: true
          }
        }
      }
    }
  }
});

// 2. When creating Neo4j relationships, build properties from attributes:
for (const value of relationship.values) {
  // Create properties object with relationship ID
  const relationshipProperties = {
    relationshipId: relationship.id.toString()
  };

  // Add attribute values to properties
  if (value.attributeValues && value.attributeValues.length > 0) {
    for (const attr of value.attributeValues) {
      // Convert value based on data type if needed
      let convertedValue = attr.value;
      if (attr.definition.dataType === 'number') {
        convertedValue = parseFloat(attr.value);
      } else if (attr.definition.dataType === 'boolean') {
        convertedValue = attr.value.toLowerCase() === 'true';
      }

      // Use the attribute name as the property key
      relationshipProperties[attr.definition.name] = convertedValue;
    }
  }

  // Create relationship with the properties
  const createRelQuery = \`
    MATCH (source:DataItem {name: $sourceName})
    MATCH (target:DataItem {name: $targetName})
    MERGE (source)-[r:${relationship.relationshipType ? relationship.relationshipType.toUpperCase() : 'ASSOCIATION'} ]->(target)
    SET r = $properties
    RETURN r
  \`;

  await runQuery(createRelQuery, {
    sourceName: value.sourceInstanceId,
    targetName: value.targetInstanceId,
    properties: relationshipProperties
  });
}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

// Run the test
testRelationshipAttributes().catch(console.error);
