const neo4j = require('neo4j-driver');
require('dotenv').config();

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

    // Demo how we would add attribute values
    const attributeValues = [
      { name: "priority", value: "high", dataType: "string" },
      { name: "cost", value: "1200.50", dataType: "number" },
      { name: "active", value: "true", dataType: "boolean" }
    ];

    // Build properties object that would be used in the actual implementation
    const relationshipProperties = {
      relationshipId: '3'
    };

    // Add attribute values to the properties
    attributeValues.forEach(attr => {
      // Convert value based on data type
      let convertedValue = attr.value;
      if (attr.dataType === 'number') {
        convertedValue = parseFloat(attr.value);
      } else if (attr.dataType === 'boolean') {
        convertedValue = attr.value.toLowerCase() === 'true';
      }

      // Use the attribute name as the property key
      relationshipProperties[attr.name] = convertedValue;
    });

    console.log('\nRelationship properties for Neo4j:', relationshipProperties);

    // Update the test relationship in Neo4j with these properties
    const updateRelQuery = `
      MATCH ()-[r:ASSOCIATION]->()
      WHERE r.relationshipId = '3'
      SET r += $properties
      RETURN r
    `;

    const updateResult = await session.run(updateRelQuery, {
      properties: relationshipProperties
    });

    console.log(`Relationship update result: ${updateResult.records.length > 0 ? 'Success' : 'Failed'}`);

    // Verify the relationship was updated with the attributes
    const verifyQuery = `
      MATCH ()-[r:ASSOCIATION]->()
      WHERE r.relationshipId = '3'
      RETURN properties(r) as props
    `;

    const verifyResult = await session.run(verifyQuery);

    if (verifyResult.records.length > 0) {
      console.log('\nVerification: Relationship properties in Neo4j:');
      console.log(verifyResult.records[0].get('props'));
    } else {
      console.log('\nVerification failed: Relationship not found');
    }

    // Show what code changes would be needed in syncReferenceDataSet
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

// Run the test
testRelationshipAttributes().catch(console.error);