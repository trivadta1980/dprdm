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

async function createRole(sessionCookie) {
  try {
    const roleData = {
      name: "approval_manager",
      description: "Role for managing approval requests",
      routes: ["/approvals", "/reference-data"]
    };

    const response = await fetch('http://0.0.0.0:5000/api/roles', {
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

async function main() {
  try {
    const sessionCookie = await login();
    await createRole(sessionCookie);
  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

main();
