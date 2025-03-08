import neo4j from 'neo4j-driver';

async function testSync() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
  );
  
  const session = driver.session();
  
  try {
    // Create test relationship manually
    console.log('\nCreating test relationship...');
    const createResult = await session.run(`
      MATCH (source:DataItem {name: $sourceName})
      MATCH (target:DataItem {name: $targetName})
      MERGE (source)-[r:ASSOCIATION {relationshipId: "test"}]->(target)
      SET r.testAttr = "test"
      RETURN r
    `, {
      sourceName: 'Catalent Pharma Solutions Inc. - Madison, WI US',
      targetName: 'BioReliance - Glasgow UK'
    });
    
    console.log('Relationship created:', createResult.records.length > 0);
    
    // Verify relationship was created
    const verifyResult = await session.run(`
      MATCH p=(source:DataItem {name: $sourceName})-[r:ASSOCIATION]->(target:DataItem {name: $targetName})
      RETURN r, type(r), properties(r)
    `, {
      sourceName: 'Catalent Pharma Solutions Inc. - Madison, WI US',
      targetName: 'BioReliance - Glasgow UK'
    });
    
    if (verifyResult.records.length > 0) {
      console.log('Relationship found!');
      console.log('Type:', verifyResult.records[0].get('type(r)'));
      console.log('Properties:', verifyResult.records[0].get('properties(r)'));
    } else {
      console.log('No relationship found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

testSync().catch(console.error);
