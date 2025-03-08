import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "password";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function debugVisualization() {
  const session = driver.session();

  try {
    console.log('\nListing all nodes in Neo4j...');
    const countQuery = `
      MATCH (n) 
      RETURN count(n) as total
    `;
    const countResult = await session.run(countQuery);
    console.log('Total nodes:', countResult.records[0].get('total').toNumber());

    const nodeQuery = `
      MATCH (n) 
      RETURN n.name as name
      LIMIT 100
    `;
    const nodeResult = await session.run(nodeQuery);
    nodeResult.records.forEach(record => {
      console.log('Node name:', record.get('name'));
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugVisualization().catch(console.error);