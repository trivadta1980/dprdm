import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import fetch from 'node-fetch';

dotenv.config();
neonConfig.webSocketConstructor = ws;
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function login() {
  try {
    const loginResponse = await fetch('http://0.0.0.0:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: "admin",
        password: "Admin123!"
      }),
      redirect: 'manual'
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('Login failed with status:', loginResponse.status);
      console.error('Response:', errorText);
      console.error('Request details:', {
        url: loginResponse.url,
        headers: loginResponse.headers.raw(),
        payload: {
          username: 'admin',
          password: 'Admin123!'
        }
      });
      throw new Error('Login failed');
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login successful, received cookies');
    return cookies;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

async function resetUserPassword(targetUsername) {
  // Create a new database connection
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    // Set new password
    const newPassword = "Admin123!";
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    const result = await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE username = $2',
      [hashedPassword, targetUsername]
    );

    if (result.rowCount > 0) {
      console.log(`Password reset successfully for user: ${targetUsername}`);
      console.log(`New password is: ${newPassword}`);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await pool.end();
  }
}

// Execute the function
async function main() {
  try {
    if (process.argv.length < 3) {
      console.error('Please provide a username as argument');
      console.error('Usage: node reset-user-password.js <username>');
      process.exit(1);
    }

    const targetUsername = process.argv[2];
    console.log(`Attempting to reset password for user: ${targetUsername}`);

    await resetUserPassword(targetUsername);
  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

main();