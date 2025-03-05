
// Script to verify the Neo4j connection
const neo4j = require('neo4j-driver');
require('dotenv').config();

async function checkNeo4jConnection() {
  if (!process.env.NEO4J_URI || !process.env.NEO4J_USERNAME || !process.env.NEO4J_PASSWORD) {
    console.error("Neo4j environment variables are not set");
    console.log("Please set the following variables in your .env file:");
    console.log("NEO4J_URI=bolt://your-neo4j-instance:7687");
    console.log("NEO4J_USERNAME=neo4j");
    console.log("NEO4J_PASSWORD=your-password");
    return;
  }

  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );

  try {
    console.log("Attempting to connect to Neo4j...");
    const session = driver.session();
    
    try {
      const result = await session.run('RETURN "Connection successful!" AS message');
      console.log(result.records[0].get('message'));
      
      // Check database constraints and indexes
      console.log("\nVerifying database schema...");
      const schemaResult = await session.run(`
        CALL db.schema.visualization()
      `);
      
      console.log("\nDatabase connection verified successfully!");
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error connecting to Neo4j:", error.message);
  } finally {
    await driver.close();
  }
}

checkNeo4jConnection();
