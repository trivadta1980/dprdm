import neo4j from 'neo4j-driver';

async function debugNeo4j() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
  );
  
  const session = driver.session();
  
  try {
    // List all nodes to see what's actually in the database
    console.log('\nListing all nodes in Neo4j...');
    const allNodesResult = await session.run('MATCH (n:DataItem) RETURN n.name');
    console.log('Total nodes:', allNodesResult.records.length);
    allNodesResult.records.forEach(record => {
      console.log('Node name:', record.get('n.name'));
    });

    // 1. Check source node
    console.log('\nChecking source node...');
    const sourceResult = await session.run(
      'MATCH (n:DataItem) WHERE n.name = $name RETURN n',
      { name: 'Catalent Pharma Solutions Inc. - Madison, WI US' }
    );
    console.log('Source node exists:', sourceResult.records.length > 0);
    if (sourceResult.records.length > 0) {
      console.log('Source properties:', sourceResult.records[0].get('n').properties);
    }

    // 2. Check target node
    console.log('\nChecking target node...');
    const targetResult = await session.run(
      'MATCH (n:DataItem) WHERE n.name = $name RETURN n',
      { name: 'BioReliance - Glasgow UK' }
    );
    console.log('Target node exists:', targetResult.records.length > 0);
    if (targetResult.records.length > 0) {
      console.log('Target properties:', targetResult.records[0].get('n').properties);
    }

    // 3. Try to create the relationship
    console.log('\nAttempting to create relationship...');
    const createResult = await session.run(`
      MATCH (source:DataItem {name: $sourceName})
      MATCH (target:DataItem {name: $targetName})
      MERGE (source)-[r:ASSOCIATION]->(target)
      RETURN r
    `, {
      sourceName: 'Catalent Pharma Solutions Inc. - Madison, WI US',
      targetName: 'BioReliance - Glasgow UK'
    });
    console.log('Relationship created:', createResult.records.length > 0);

    // 4. Verify the relationship was created
    console.log('\nVerifying relationship...');
    const verifyResult = await session.run(`
      MATCH (source:DataItem {name: $sourceName})-[r]->(target:DataItem {name: $targetName})
      RETURN type(r) as type, properties(r) as props
    `, {
      sourceName: 'Catalent Pharma Solutions Inc. - Madison, WI US',
      targetName: 'BioReliance - Glasgow UK'
    });
    console.log('Relationship verification:', verifyResult.records.length > 0);
    if (verifyResult.records.length > 0) {
      console.log('Relationship type:', verifyResult.records[0].get('type'));
      console.log('Relationship properties:', verifyResult.records[0].get('props'));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugNeo4j().catch(console.error);
