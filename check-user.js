
import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

dotenv.config();

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function checkUsers() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    // Check connection
    console.log('Checking database connection...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful!');
    
    // Check users table
    console.log('\nChecking users table:');
    const usersResult = await pool.query('SELECT id, username, email, "roleId", "isActive" FROM users');
    
    if (usersResult.rows.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log(`Found ${usersResult.rows.length} users:`);
      console.table(usersResult.rows);
    }
    
    // Check if admin user exists (ID 1)
    const adminResult = await pool.query('SELECT * FROM users WHERE id = 1');
    if (adminResult.rows.length > 0) {
      console.log('\nAdmin user details:');
      const admin = adminResult.rows[0];
      console.log({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        roleId: admin.roleId,
        isActive: admin.isActive,
        hasPassword: !!admin.password,
        resetToken: admin.reset_token || null,
        requirePasswordChange: admin.require_password_change
      });
    } else {
      console.log('\nAdmin user (ID 1) not found!');
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();
