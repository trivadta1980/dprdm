import fetch from 'node-fetch';
import fs from 'fs';

async function downloadTemplate(dataSetId) {
  console.log(`Attempting to download template for dataset ID: ${dataSetId}`);

  try {
    // First, authenticate using username/password
    const username = 'admin';
    const password = 'Admin123!';

    console.log("Attempting to authenticate with username:", username); //Added logging

    // Make the login request first
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!loginResponse.ok) {
      throw new Error('Authentication failed. Please check your credentials.');
    }

    // Extract cookies from login response
    const cookies = loginResponse.headers.raw()['set-cookie'] || [];
    const cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');

    console.log("Authentication successful!"); //Added logging

    // Now make the template download request
    const response = await fetch(`http://localhost:5000/api/reference-data/${dataSetId}/template`, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        'Cookie': cookieHeader
      }
    });

    if (response.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }

    if (!response.ok) {
      console.error("Template download failed:", response.status, response.statusText);
      throw new Error(`Failed to download template: ${response.statusText}`);
    }

    // Get the filename from content disposition or use default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'reference_data_template.csv';
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    // Save the template to a file
    const content = await response.text();
    fs.writeFileSync(filename, content);
    console.log(`Template successfully downloaded and saved as: ${filename}`);
    console.log('\nTemplate structure:');
    console.log(content);

  } catch (error) {
    console.error('Error downloading template:', error.message);
    process.exit(1);
  }
}

// Get dataset ID from command line argument
const dataSetId = process.argv[2];
if (!dataSetId) {
  console.error('Please provide a dataset ID as an argument');
  console.log('Usage: node download_reference_template.js <datasetId>');
  process.exit(1);
}

downloadTemplate(dataSetId);