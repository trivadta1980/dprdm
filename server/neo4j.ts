
import neo4j from 'neo4j-driver';

// Check for Neo4j connection credentials
console.log("Debug: Process ENV NEO4J_URI =", process.env.NEO4J_URI);
console.log("Debug: Process ENV NEO4J_USERNAME =", process.env.NEO4J_USERNAME);
console.log("Debug: Process ENV NEO4J_PASSWORD =", process.env.NEO4J_PASSWORD ? "***REDACTED***" : "Not found");

// Get environment variables directly from file as a fallback
import fs from 'fs';
import path from 'path';
let envVars = {};
try {
  const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^NEO4J_([A-Z_]+)=(.*)$/);
    if (match) {
      const key = `NEO4J_${match[1]}`;
      const value = match[2].trim();
      envVars[key] = value;
      console.log(`Debug: Found in .env file: ${key}=${key === 'NEO4J_PASSWORD' ? '***REDACTED***' : value}`);
    }
  });
} catch (err) {
  console.error("Error reading .env file:", err);
}

// Use fallback values if environment variables aren't set
const neo4jUri = process.env.NEO4J_URI || envVars['NEO4J_URI'];
const neo4jUsername = process.env.NEO4J_USERNAME || envVars['NEO4J_USERNAME'];
const neo4jPassword = process.env.NEO4J_PASSWORD || envVars['NEO4J_PASSWORD'];

if (!neo4jUri || !neo4jUsername || !neo4jPassword) {
  console.warn(
    "Neo4j connection credentials not found. Graph database features will be disabled."
  );
  console.log("NEO4J_URI:", neo4jUri ? "Found" : "Not found");
  console.log("NEO4J_USERNAME:", neo4jUsername ? "Found" : "Not found");
  console.log("NEO4J_PASSWORD:", neo4jPassword ? "Found" : "Not found (or empty)");
}

// Create a driver instance
let driver: neo4j.Driver | null = null;

try {
  if (neo4jUri && neo4jUsername && neo4jPassword) {
    console.log("Attempting to connect to Neo4j with URI:", neo4jUri);
    driver = neo4j.driver(
      neo4jUri,
      neo4j.auth.basic(neo4jUsername, neo4jPassword)
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
