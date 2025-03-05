
import neo4j from 'neo4j-driver';

// Check for Neo4j connection credentials
if (!process.env.NEO4J_URI || !process.env.NEO4J_USERNAME || !process.env.NEO4J_PASSWORD) {
  console.warn(
    "Neo4j connection credentials not found. Graph database features will be disabled."
  );
  console.log("NEO4J_URI:", process.env.NEO4J_URI ? "Found" : "Not found");
  console.log("NEO4J_USERNAME:", process.env.NEO4J_USERNAME ? "Found" : "Not found");
  console.log("NEO4J_PASSWORD:", process.env.NEO4J_PASSWORD ? "Found" : "Not found (or empty)");
}

// Create a driver instance
let driver: neo4j.Driver | null = null;

try {
  if (process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD) {
    console.log("Attempting to connect to Neo4j with URI:", process.env.NEO4J_URI);
    driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
    );
    console.log("Neo4j connection established successfully");
  }
} catch (error) {
  console.error("Error connecting to Neo4j:", error);
}

// Function to check if driver is available
export const isNeo4jAvailable = (): boolean => {
  return driver !== null;
};

// Execute a Cypher query with parameters
export const runQuery = async (query: string, params = {}) => {
  if (!driver) {
    throw new Error("Neo4j connection not available");
  }

  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
};

// Close the driver when the application shuts down
export const closeDriver = async () => {
  if (driver) {
    await driver.close();
    console.log("Neo4j connection closed");
  }
};

export default {
  runQuery,
  isNeo4jAvailable,
  closeDriver
};
