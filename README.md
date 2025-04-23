# Reference Data Management (RDM) System

A comprehensive platform designed for enterprise-level data mapping. This system helps organizations effectively manage, map, and visualize reference data across different systems. It provides a centralized solution for maintaining data consistency, establishing relationships between datasets, and creating mappings between different business systems, all with advanced visualization capabilities.

## Table of Contents

1. [Application Overview](#application-overview)
2. [Technical Architecture](#technical-architecture)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [Databases](#databases)
3. [Directory Structure](#directory-structure)
4. [Core Features](#core-features)
   - [User Authentication](#user-authentication)
   - [Reference Data Types](#reference-data-types)
   - [Reference Data Sets](#reference-data-sets)
   - [Relationships](#relationships)
   - [Crosswalk Mappings](#crosswalk-mappings)
   - [Graph Visualization](#graph-visualization)
5. [Key Database Tables](#key-database-tables)
6. [Development Workflow](#development-workflow)
7. [Getting Started](#getting-started)
8. [Scripts and Utilities](#scripts-and-utilities)
   - [Download Reference Data Template](#download-reference-data-template)
   - [Database Migrations](#database-migrations)
9. [Contributing](#contributing)
10. [Best Practices](#best-practices)

## Application Overview

This system helps organizations:
- Define and maintain reference data types and schemas
- Create and manage reference data sets
- Establish relationships between related data
- Create crosswalk mappings between different systems
- Visualize data relationships in an interactive graph format
- Support data governance with approval workflows

## Technical Architecture

### Frontend
- Built with React and TypeScript
- React Query for advanced data fetching
- Tailwind CSS and shadcn components for UI
- Graph visualization capabilities

### Backend
- Express.js server with RESTful API
- Session-based authentication system
- Role-based access controls
- Database abstraction with Drizzle ORM

### Databases
- PostgreSQL for relational data storage
- Neo4j graph database for relationship visualization

## Directory Structure

### `/client`: Frontend Application
- `/src/components`: Reusable UI components
- `/src/pages`: Page-level components (routing)
- `/src/hooks`: Custom React hooks
- `/src/lib`: Utility libraries
- `/src/utils`: Helper functions

### `/server`: Backend Application
- `routes.ts`: API endpoints
- `storage.ts`: Database operations
- `auth.ts`: Authentication logic
- `neo4j.ts`: Graph database connection

### `/shared`: Shared Code
- `schema.ts`: Database schema definitions with Drizzle ORM

## Core Features

### User Authentication
- Role-based access controls
- Different permissions for different user roles
- Session management for secure access

### Reference Data Types
- Define the structure of reference data
- Each type has a schema with fields (name, data type)
- Ensure data consistency across the system

### Reference Data Sets
- Instances of reference data types with actual data
- CSV import/export functionality
- Search, filter, and browse capabilities

### Relationships
- Define connections between reference data sets
- Support for different relationship types
- Relationship attributes for additional context

### Crosswalk Mappings
- Map data between different systems
- Handle missing mappings with specific workflows
- Support approval workflows for data governance

### Graph Visualization
- Interactive visualization of data relationships
- Built on Neo4j graph database
- Explore and understand data connections visually

## Key Database Tables

The database schema includes:
1. `users` and `roles`: User management
2. `referenceDataTypes`: Define data structures
3. `referenceDataSets`: Store actual reference data
4. `relationships`: Define connections between data sets
5. `relationshipValues`: Store relationship instances
6. `crosswalkMappings`: Map data between systems
7. `missingMappings`: Track unmapped values

## Development Workflow

1. Define reference data types and schemas
2. Create reference data sets based on these types
3. Establish relationships between related data sets
4. Create crosswalk mappings for data transformation
5. Manage and approve mappings through governance workflows
6. Visualize and analyze data relationships

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the application: `npm run dev`
4. Access the application at the port specified (default: 5000)

## Scripts and Utilities

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

### Database Migrations

For database changes:
1. Update the schema in `shared/schema.ts`
2. Run `npm run db:push` to update the database schema

## Contributing

1. Create a new branch for your changes: `git checkout -b feature-branch`
2. Make your changes and test thoroughly
3. Commit your changes: `git commit -m "Description of changes"`
4. Push to your branch: `git push origin feature-branch`
5. Create a pull request to merge changes

## Best Practices

1. Follow the existing code structure and patterns
2. Use Drizzle ORM for all database operations
3. Keep frontend and backend concerns separated
4. Write tests for new functionality
5. Document any significant changes or additions