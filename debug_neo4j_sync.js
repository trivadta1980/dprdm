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

    console.log('\nChecking nodes for dataset 11...');
    const nodeQuery = `
      MATCH (n:DataItem)
      WHERE n.dataSetId = '11'
      RETURN n.name as name, n.label as label
    `;
    const nodeResult = await session.run(nodeQuery);
    console.log('Sample nodes:', nodeResult.records.map(record => ({
      name: record.get('name'),
      label: record.get('label')
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugSync().catch(console.error);