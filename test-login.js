import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

dotenv.config();
neonConfig.webSocketConstructor = ws;
const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function testLogin() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    // Get username from command line args or default to 'jnankani'
    const username = process.argv[2] || 'jnankani';
    const password = 'Admin123!';

    console.log(`Testing login for user: ${username}`);

    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      console.log(`User "${username}" not found in database.`);
      return;
    }

    const user = userResult.rows[0];
    console.log(`User found: ${user.username} (ID: ${user.id})`);

    // Check if account is active
    console.log(`Account active status: ${user.is_active}`);
    if (!user.is_active) {
      console.log('Account is inactive');
      return;
    }

    // Verify password
    const passwordCorrect = await comparePasswords(password, user.password);
    console.log(`Password verification result: ${passwordCorrect ? 'CORRECT' : 'INCORRECT'}`);

    if (passwordCorrect) {
      console.log('Login would be successful with these credentials!');
    } else {
      console.log('Login would fail with these credentials.');
    }
  } catch (error) {
    console.error('Error testing login:', error);
  } finally {
    await pool.end();
  }
}

testLogin();