import fetch from 'node-fetch';
import fs from 'fs';

async function downloadTemplate(dataSetId) {
  console.log(`Attempting to download template for dataset ID: ${dataSetId}`);

  try {
    // Make the request to download template
    const response = await fetch(`http://localhost:5000/api/reference-data/${dataSetId}/template`, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
      credentials: 'include'
    });

    if (response.status === 401) {
      console.error('Authentication failed. Please ensure you are logged in.');
      process.exit(1);
    }

    if (!response.ok) {
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