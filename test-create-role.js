import fetch from 'node-fetch';

async function login() {
  try {
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: "admin",
        password: "Admin123!"
      }),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login successful');
    return cookies;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

async function createRole(sessionCookie) {
  try {
    const roleData = {
      name: "approval_manager",
      description: "Role for managing approval requests",
      routes: ["/approvals", "/reference-data"]
    };

    const response = await fetch('http://localhost:5000/api/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(roleData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create role: ${errorText}`);
    }

    const result = await response.json();
    console.log('Role created successfully:', result);
  } catch (error) {
    console.error('Error creating role:', error.message);
  }
}

// Execute the functions
async function main() {
  try {
    const sessionCookie = await login();
    await createRole(sessionCookie);
  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

main();