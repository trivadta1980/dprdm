import fetch from 'node-fetch';
import fs from 'fs';

async function downloadTemplate(dataSetId) {
  console.log(`Attempting to download template for dataset ID: ${dataSetId}`);

  try {
    // Read cookies from file if it exists
    let cookies = '';
    try {
      cookies = fs.readFileSync('cookies.txt', 'utf8').trim();
      console.log('Found cookies file. Raw content:', cookies);

      // Sanitize cookie string - remove any quotes, brackets and extra whitespace
      cookies = cookies.replace(/[\[\]"']/g, '').trim();
      console.log('Sanitized cookie string:', cookies);

      // Split into lines and filter out comments
      const cookieLines = cookies.split('\n')
        .filter(line => !line.startsWith('#') && line.trim().length > 0);

      if (cookieLines.length === 0) {
        console.log('No valid cookies found after filtering.');
      } else {
        console.log('Found valid cookie lines:', cookieLines.length);
      }

      cookies = cookieLines.map(line => {
        const parts = line.split('\t');
        // Last two parts are typically name and value in Netscape format
        if (parts.length >= 2) {
          return `${parts[parts.length - 2]}=${parts[parts.length - 1]}`;
        }
        return null;
      })
      .filter(Boolean)
      .join('; ');

      if (!cookies) {
        console.log('No valid cookies found after sanitization.');
      }
    } catch (err) {
      console.log('No cookies file found. Authentication may fail.');
    }

    // Make the request to download template
    const response = await fetch(`http://localhost:5000/api/reference-data/${dataSetId}/template`, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        ...(cookies && { 'Cookie': cookies })
      }
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