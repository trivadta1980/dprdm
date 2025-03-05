
import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function activateAdmin() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    // Update the admin user (ID = 1) to set is_active to true
    const result = await pool.query(
      'UPDATE users SET is_active = true WHERE id = 1 RETURNING *'
    );
    
    if (result.rows.length > 0) {
      console.log('Admin account activated successfully:');
      console.log(result.rows[0]);
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error activating admin account:', error);
  } finally {
    await pool.end();
  }
}

activateAdmin();
