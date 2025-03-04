
import dotenv from 'dotenv';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

dotenv.config();
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function resetAdminPassword() {
  // Create a new database connection
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    // Set new password - you can change this to whatever you want
    const newPassword = "Admin123!";
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the admin user (ID = 1)
    const result = await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = 1',
      [hashedPassword]
    );
    
    if (result.rowCount > 0) {
      console.log(`Admin password reset successfully to: ${newPassword}`);
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
