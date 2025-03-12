import fetch from 'node-fetch';

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

async function resetUserPassword(sessionCookie, targetUsername) {
  try {
    // First get user id from username
    const usersResponse = await fetch('http://0.0.0.0:5000/api/users', {
      headers: {
        'Cookie': sessionCookie,
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!usersResponse.ok) {
      throw new Error(`Failed to get users list: ${await usersResponse.text()}`);
    }

    const users = await usersResponse.json();
    const targetUser = users.find(user => user.username === targetUsername);
    
    if (!targetUser) {
      throw new Error(`User ${targetUsername} not found`);
    }

    console.log(`Found user ${targetUsername} with ID: ${targetUser.id}`);

    // Now reset the password
    const response = await fetch(`http://0.0.0.0:5000/api/users/${targetUser.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        newPassword: "Admin123!"
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to reset password: ${errorText}`);
    }

    console.log(`Successfully reset password for user ${targetUsername}`);
  } catch (error) {
    console.error('Error resetting password:', error.message);
  }
}

// Execute the functions
async function main() {
  try {
    if (process.argv.length < 3) {
      console.error('Please provide a username as argument');
      console.error('Usage: node reset-user-password.js <username>');
      process.exit(1);
    }

    const targetUsername = process.argv[2];
    console.log(`Attempting to reset password for user: ${targetUsername}`);
    
    const sessionCookie = await login();
    await resetUserPassword(sessionCookie, targetUsername);
  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

main();
