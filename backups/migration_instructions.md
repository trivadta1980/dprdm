# Migration Instructions for RDM Application

This document provides instructions for migrating the Reference Data Management (RDM) application to a new Replit environment.

## Backup Contents

1. **Database Backup**: `database_backup_20250424_183840.sql` - Complete PostgreSQL database dump
2. **Application Code**: `app_code_backup_20250424_185655.tar.gz` - Complete application source code excluding node_modules
3. **Configuration Files**:
   - `env_backup_20250424_185711.txt` - Environment variables
   - `package_json_backup_20250424_185718.json` - Package dependencies
   - `tsconfig_json_backup_20250424_185718.json` - TypeScript configuration
   - `drizzle_config_backup_20250424_185718.ts` - Drizzle ORM configuration

## Migration Steps

### 1. Set Up a New Replit

1. Create a new Node.js Replit project
2. Upload and extract the application code backup:
   ```bash
   tar -xzf app_code_backup_20250424_185655.tar.gz -C /path/to/new/replit
   ```

### 2. Install Dependencies

1. Install all required NPM packages:
   ```bash
   npm install
   ```

### 3. Set Up the Database

1. Create a new PostgreSQL database in the new Replit environment
2. Restore the database from backup:
   ```bash
   psql $DATABASE_URL < database_backup_20250424_183840.sql
   ```

### 4. Configure Environment Variables

1. Copy environment variables from the backup to your new `.env` file
2. Update any connection strings or credentials as needed for the new environment

### 5. Neo4j Setup (If Required)

1. Set up a Neo4j database instance (free tier available at Neo4j Aura)
2. Update the `.env` file with your new Neo4j credentials:
   ```
   NEO4J_URI=your_new_uri
   NEO4J_USERNAME=your_new_username
   NEO4J_PASSWORD=your_new_password
   ```

### 6. Start the Application

1. Run the application:
   ```bash
   npm run dev
   ```

## Important Notes

- The backup contains all user accounts, roles, and permissions from the original application
- The database dump includes all reference data sets, types, relationships, and crosswalks
- You may need to update API keys if external services are used
- Neo4j data will need to be resynced in the new environment using the provided scripts