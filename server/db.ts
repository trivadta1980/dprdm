import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { setTimeout } from 'timers/promises';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

let connectionAttempts = 0;
let poolInstance: Pool | null = null;


const connectToDB = async () => {
  try {
    poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });
    connectionAttempts = 0;
    console.log("Database connection established successfully");
    return drizzle({ client: poolInstance, schema });
  } catch (error) {
    console.error("Error connecting to database:", error);
    if (connectionAttempts < MAX_RETRIES) {
      connectionAttempts++;
      console.log(`Retrying connection (${connectionAttempts}/${MAX_RETRIES}) in ${RETRY_DELAY}ms...`);
      await setTimeout(RETRY_DELAY);
      return connectToDB();
    } else {
      console.error("Maximum connection retries reached.  Application may malfunction.");
      //In a production environment, a more robust fallback or error handling mechanism would be necessary.
      throw new Error("Failed to connect to the database after multiple retries.");

    }
  }
};

export const db = await connectToDB();