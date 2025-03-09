
// Use ES modules imports instead of CommonJS
import neo4j from 'neo4j-driver';
import { db } from './server/db.js';
import * as schema from './shared/schema.js';
import { eq, or } from 'drizzle-orm';

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
    // Step 1: Get a relationship from the database with its attribute values
    console.log('\nFetching relationship data from PostgreSQL...');
    const relationship = await db.query.relationships.findFirst({
      where: eq(schema.relationships.id, 3), // Use relationship ID 3 as an example
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

    console.log(`\nFound relationship: ${relationship.name} (ID: ${relationship.id})`);
    console.log(`Values count: ${relationship.values?.length || 0}`);
    
    // If there are no values or attributes, log a message
    if (!relationship.values || relationship.values.length === 0) {
      console.log('No relationship values found for this relationship');
    } else {
      // Pick the first relationship value to demonstrate
      const sampleValue = relationship.values[0];
      console.log(`\nSample relationship value: ${sampleValue.sourceInstanceId} -> ${sampleValue.targetInstanceId}`);
      console.log(`Attribute values count: ${sampleValue.attributeValues?.length || 0}`);
      
      if (sampleValue.attributeValues && sampleValue.attributeValues.length > 0) {
        console.log('\nAttribute values:');
        sampleValue.attributeValues.forEach(attr => {
          console.log(`- ${attr.definition.name}: ${attr.value} (${attr.definition.dataType})`);
        });
      } else {
        console.log('No attribute values found for this relationship value');
      }
    }
    
    // Step 2: Demonstrate how to convert these attributes to Neo4j properties
    console.log('\nConverting attributes to Neo4j properties...');
    
    // Let's manually create a relationship with attributes in Neo4j
    let relValue = relationship.values?.[0];
    if (!relValue) {
      console.log('No relationship value found to test with');
      return;
    }
    
    // Build properties object that would be used in the actual implementation
    const relationshipProperties = {
      relationshipId: relationship.id.toString()
    };
    
    // Add attribute values to the properties
    if (relValue.attributeValues && relValue.attributeValues.length > 0) {
      relValue.attributeValues.forEach(attr => {
        // Convert value based on data type if needed
        let convertedValue = attr.value;
        if (attr.definition.dataType === 'number') {
          convertedValue = parseFloat(attr.value);
        } else if (attr.definition.dataType === 'boolean') {
          convertedValue = attr.value.toLowerCase() === 'true';
        }
        
        // Use the attribute name as the property key
        relationshipProperties[attr.definition.name] = convertedValue;
      });
    }
    
    console.log('\nRelationship properties for Neo4j:', relationshipProperties);
    
    // Step 3: Create or update a test relationship in Neo4j with these properties
    console.log('\nTesting relationship creation in Neo4j with attributes...');
    
    // First check if both nodes exist
    const verifyNodesQuery = `
      MATCH (source:DataItem {name: $sourceName})
      MATCH (target:DataItem {name: $targetName})
      RETURN source, target
    `;
    
    const nodesResult = await session.run(verifyNodesQuery, {
      sourceName: relValue.sourceInstanceId,
      targetName: relValue.targetInstanceId
    });
    
    if (nodesResult.records.length === 0) {
      console.log('One or both nodes not found in Neo4j. Creating test nodes...');
      
      // Create test nodes
      const createNodesQuery = `
        MERGE (source:DataItem {name: $sourceName, dataSetId: "11"})
        MERGE (target:DataItem {name: $targetName, dataSetId: "11"})
        RETURN source, target
      `;
      
      await session.run(createNodesQuery, {
        sourceName: relValue.sourceInstanceId,
        targetName: relValue.targetInstanceId
      });
      
      console.log('Test nodes created');
    }
    
    // Now create the relationship with all the properties
    const createRelQuery = `
      MATCH (source:DataItem {name: $sourceName})
      MATCH (target:DataItem {name: $targetName})
      MERGE (source)-[r:${relationship.relationshipType.toUpperCase()}]->(target)
      SET r = $properties
      RETURN r
    `;
    
    const createResult = await session.run(createRelQuery, {
      sourceName: relValue.sourceInstanceId,
      targetName: relValue.targetInstanceId,
      properties: relationshipProperties
    });
    
    console.log(`Relationship creation result: ${createResult.records.length > 0 ? 'Success' : 'Failed'}`);
    
    // Step 4: Verify the relationship was created with the attributes
    const verifyQuery = `
      MATCH (source:DataItem {name: $sourceName})-[r]->(target:DataItem {name: $targetName})
      RETURN properties(r) as props
    `;
    
    const verifyResult = await session.run(verifyQuery, {
      sourceName: relValue.sourceInstanceId,
      targetName: relValue.targetInstanceId
    });
    
    if (verifyResult.records.length > 0) {
      console.log('\nVerification: Relationship properties in Neo4j:');
      console.log(verifyResult.records[0].get('props'));
    } else {
      console.log('\nVerification failed: Relationship not found');
    }
    
    // Step 5: Show what code changes would be needed in syncReferenceDataSet
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
    MERGE (source)-[r:${relationship.relationshipType.toUpperCase()} ]->(target)
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

testRelationshipAttributes().catch(console.error);
