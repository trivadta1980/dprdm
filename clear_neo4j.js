import neo4j from 'neo4j-driver';

async function clearNeo4jDatabase() {
  // Get Neo4j credentials from environment variables
  const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD;

  // Create a driver instance
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  try {
    // Get a session to run queries
    const session = driver.session();

    console.log('Starting Neo4j database cleanup...');

    // Delete all relationships first
    await session.run('MATCH ()-[r]-() DELETE r');
    console.log('All relationships deleted');

    // Then delete all nodes
    await session.run('MATCH (n) DELETE n');
    console.log('All nodes deleted');

    // Verify the database is empty
    const result = await session.run('MATCH (n) RETURN count(n) as count');
    const count = result.records[0].get('count').toNumber();
    console.log(`Verification: ${count} nodes remaining in the database`);

    // Close the session
    await session.close();
    console.log('Database cleanup completed successfully');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    throw error;
  } finally {
    // Close the driver connection
    await driver.close();
  }
}

// Execute the cleanup
clearNeo4jDatabase()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });