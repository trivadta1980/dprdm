import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "password";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function debugSync() {
  console.log('Starting sync test...');

  try {
    // Verify nodes were created
    const session = driver.session();
    const query = `
      MATCH (n:DataItem)
      WHERE n.dataSetId = '11'
      RETURN count(n) as nodeCount, n.name as name
      LIMIT 5
    `;
    const result = await session.run(query);
    const nodeCount = result.records[0].get('nodeCount').toNumber();
    console.log(`Found ${nodeCount} nodes for dataset 11`);

    for (const record of result.records) {
      console.log(`Sample node name: ${record.get('name')}`);
    }

    await session.close();
  } catch (error) {
    console.error('Error during sync test:', error);
  } finally {
    await driver.close();
  }
}

debugSync().catch(console.error);