import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "password";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function debugSync() {
  const session = driver.session();

  try {
    console.log('\nTesting Neo4j Connection...');
    const testQuery = `RETURN 'Connection successful' as status`;
    const testResult = await session.run(testQuery);
    console.log('Connection status:', testResult.records[0].get('status'));

    // Try to create test nodes with sample site data
    console.log('\nAttempting to create test nodes...');
    const createQuery = `
      CREATE (n:DataItem {
        name: 'Catalent Pharma Solutions Inc. - Madison, WI US',
        dataSetId: '11',
        Site_ID: 'SITE_0003',
        Site_Name: 'Catalent Pharma Solutions Inc. - Madison, WI US',
        Site_Type: 'API',
        label: 'Site_ID: SITE_0003\nSite_Name: Catalent Pharma Solutions Inc. - Madison, WI US\nSite_Type: API'
      })
      RETURN n
    `;

    await session.run(createQuery);
    console.log('Test nodes created successfully');

    console.log('\nListing all nodes in Neo4j...');
    const countQuery = `
      MATCH (n) 
      RETURN count(n) as total
    `;
    const countResult = await session.run(countQuery);
    console.log('Total nodes:', countResult.records[0].get('total').toNumber());

    // Try to create a test relationship
    console.log('\nTesting relationship creation...');
    const createRelQuery = `
      MATCH (source:DataItem)
      WHERE source.dataSetId = '11'
      WITH source LIMIT 2
      WITH collect(source) as nodes
      WITH nodes[0] as source, nodes[1] as target
      WHERE source IS NOT NULL AND target IS NOT NULL
      CREATE (source)-[r:SUPPLIES_TO { 
        type: 'TEST',
        relationshipId: '1',
        product: 'TEST_PRODUCT',
        quantity: '100',
        frequency: 'WEEKLY'
      }]->(target)
      RETURN source.name as source, target.name as target, properties(r) as attributes
    `;

    const relResult = await session.run(createRelQuery);
    if (relResult.records.length > 0) {
      console.log('Created test relationship:', {
        source: relResult.records[0].get('source'),
        target: relResult.records[0].get('target'),
        attributes: relResult.records[0].get('attributes')
      });
    } else {
      console.log('No relationships created - not enough nodes found');
    }

    // Check relationships and their attributes
    console.log('\nChecking all relationships and their attributes...');
    const relQuery = `
      MATCH (source:DataItem)-[r]->(target:DataItem)
      WHERE source.dataSetId = '11' OR target.dataSetId = '11'
      RETURN source.name as source, type(r) as type, properties(r) as attributes, target.name as target
    `;

    const relationships = await session.run(relQuery);
    console.log('\nFound relationships:');
    relationships.records.forEach(record => {
      console.log({
        source: record.get('source'),
        type: record.get('type'),
        attributes: record.get('attributes'),
        target: record.get('target')
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugSync().catch(console.error);