import fetch from 'node-fetch';

async function loginAndGetCookie() {
  const loginResponse = await fetch('http://0.0.0.0:5000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'Admin123!'
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
}

async function addReferenceInstance() {
  try {
    // Login first and get cookie
    const cookie = await loginAndGetCookie();
    console.log('Successfully logged in');

    // Get the reference data set first
    const getResponse = await fetch('http://0.0.0.0:5000/api/reference-data', {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json'
      },
      credentials: 'include'
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
    console.log("Current data before update:", JSON.stringify(sfdcCountries.data, null, 2));

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

    console.log("Attempting to update with data:", JSON.stringify(updatedData, null, 2));

    // Make the PATCH request
    const updateResponse = await fetch(`http://0.0.0.0:5000/api/reference-data/${sfdcCountries.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ data: updatedData })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update: ${errorText}`);
    }

    const result = await updateResponse.json();
    console.log('Update response:', JSON.stringify(result, null, 2));

    // Verify the update by fetching the data again
    const verifyResponse = await fetch('http://0.0.0.0:5000/api/reference-data', {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      const updatedDataset = verifyData.find(ds => ds.name === "SFDC Countries");
      console.log('Verified data after update:', JSON.stringify(updatedDataset.data, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Execute the function
addReferenceInstance();