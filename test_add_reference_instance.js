import fetch from 'node-fetch';

async function loginAndGetCookie() {
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'Admin123!'
    })
  });

  if (!loginResponse.ok) {
    throw new Error('Login failed');
  }

  return loginResponse.headers.get('set-cookie');
}

async function addReferenceInstance() {
  try {
    // Login first and get cookie
    const cookie = await loginAndGetCookie();
    console.log('Successfully logged in');

    // Get the reference data set first
    const getResponse = await fetch('http://localhost:5000/api/reference-data', {
      headers: {
        'Cookie': cookie
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get reference data: ${await getResponse.text()}`);
    }

    const dataSets = await getResponse.json();
    console.log('Retrieved datasets:', dataSets.length);

    const sfdcCountries = dataSets.find(ds => ds.name === "SFDC Countries");
    if (!sfdcCountries) {
      console.error("SFDC Countries dataset not found");
      return;
    }

    console.log("Found SFDC Countries dataset with ID:", sfdcCountries.id);

    // Prepare new instance data
    const timestamp = new Date().toISOString();
    const currentData = { ...sfdcCountries.data } || {};
    const newInstanceId = `instance_${Object.keys(currentData).length + 1}`;

    const updatedData = {
      ...currentData,
      [newInstanceId]: {
        "Country": "Spain",
        "Country_Code": "ESP",
        "status": "DRAFT",
        "createdBy": "test_script",
        "createdAt": timestamp,
        "lastModifiedBy": "test_script",
        "lastModifiedAt": timestamp,
        "_history": [{
          "timestamp": timestamp,
          "changes": [
            {
              "field": "Country",
              "oldValue": "",
              "newValue": "Spain"
            },
            {
              "field": "Country_Code",
              "oldValue": "",
              "newValue": "ESP"
            }
          ]
        }]
      }
    };

    // Make the PATCH request
    const updateResponse = await fetch(`http://localhost:5000/api/reference-data/${sfdcCountries.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({ data: updatedData })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update: ${errorText}`);
    }

    const result = await updateResponse.json();
    console.log('Successfully added new instance:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Execute the function
addReferenceInstance();