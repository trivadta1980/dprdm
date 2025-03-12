# Web Application Template

A modern web application template using React and Express.js with a clean, maintainable directory structure.

## Directory Structure

## Scripts

### Download Reference Data Template

To download a template for bulk loading reference data instances:

```bash
node download_reference_template.js <datasetId>
```

This script will:
1. Download a CSV template for the specified reference data set
2. Save it as a CSV file with appropriate headers
3. Display the template structure in the console

Example usage:
```bash
node download_reference_template.js 3
```

Make sure you are authenticated in the application before running the script.