import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "password";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function debugRelationships() {
  const session = driver.session();

  try {
    console.log('\nTesting Neo4j Connection...');
    const testQuery = `RETURN 'Connection successful' as status`;
    const testResult = await session.run(testQuery);
    console.log('Connection status:', testResult.records[0].get('status'));

    // Check relationships and their attributes
    console.log('\nChecking relationships and their attributes...');
    const relQuery = `
      MATCH (source:DataItem)-[r]->(target:DataItem)
      WHERE source.dataSetId = '11' OR target.dataSetId = '11'
      RETURN 
        source.name as sourceNode, 
        type(r) as relType, 
        target.name as targetNode,
        properties(r) as attributes
      LIMIT 10
    `;

    const relationships = await session.run(relQuery);
    console.log('\nFound relationships:');
    relationships.records.forEach(record => {
      console.log({
        source: record.get('sourceNode'),
        type: record.get('relType'),
        attributes: record.get('attributes'),
        target: record.get('targetNode')
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugRelationships().catch(console.error);
