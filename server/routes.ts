import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { parse } from "csv-parse";
import externalRoutes from "./externalRoutes";
import { apiKeyAuth } from "./middleware/api-auth";
import diagnosticsRouter from "./diagnostics";
import {
  insertRelationshipSchema,
  insertCrosswalkMappingSchema,
  insertRelationshipAttributeDefinitionSchema,
  insertRelationshipAttributeValueSchema,
  insertMissingMappingSchema,
  relationships,
  crosswalkMappings,
  relationshipValues,
  missingMappings,
  referenceDataSets,
  users,
  referenceDataTypes
} from "@shared/schema";
import { sql, eq, and, or, inArray } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from './db';
import { isNeo4jAvailable } from './neo4j';
import GraphDataService from './services/graphDataService';
import neo4j from 'neo4j-driver';
import { comparePasswords } from './auth';

const scryptAsync = promisify(scrypt);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and user management routes
  setupAuth(app);

  const upload = multer({ storage: multer.memoryStorage() });

  // Admin-only routes for user management
  app.get("/api/users", async (req, res) => {
    console.log('GET /api/users - Request received');
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      console.log('GET /api/users - Unauthorized access');
      return res.sendStatus(403);
    }
    const users = await storage.getAllUsers();
    console.log('GET /api/users - Users fetched successfully');
    res.json(users);
  });

  // Update user route
  app.patch("/api/users/:id", async (req, res) => {
    console.log('PATCH /api/users/:id - Request received for user ID:', req.params.id);
    console.log('PATCH /api/users/:id - Update data:', req.body);

    if (!req.isAuthenticated()) {
      console.log('PATCH /api/users/:id - User not authenticated');
      return res.sendStatus(401);
    }

    const userId = Number(req.params.id);
    console.log('PATCH /api/users/:id - Authenticated user ID:', req.user.id, 'Role ID:', req.user.roleId);

    // Only allow users to update their own profile unless they're an admin
    if (req.user.id !== userId && req.user.roleId !== 1) {
      console.log('PATCH /api/users/:id - Permission denied: User cannot edit this profile');
      return res.sendStatus(403);
    }

    try {
      // If changing password, hash it first
      if (req.body.password) {
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(req.body.password, salt, 64)) as Buffer;
        req.body.password = `${buf.toString("hex")}.${salt}`;
      }

      const user = await storage.updateUser(userId, req.body);
      console.log('PATCH /api/users/:id - Update result:', user);
      if (user) {
        res.json(user);
      } else {
        console.log('PATCH /api/users/:id - User not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('PATCH /api/users/:id - Error updating user:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Delete user route
  app.delete("/api/users/:id", async (req, res) => {
    console.log('DELETE /api/users/:id - Request received for user ID:', req.params.id);

    if (!req.isAuthenticated()) {
      console.log('DELETE /api/users/:id - User not authenticated');
      return res.sendStatus(401);
    }

    // Only admin can delete users
    if (req.user.roleId !== 1) {
      console.log('DELETE /api/users/:id - Permission denied: User is not admin');
      return res.sendStatus(403);
    }

    const userId = Number(req.params.id);

    // Prevent deleting the admin user (assuming user with ID 1 is the main admin)
    if (userId === 1) {
      console.log('DELETE /api/users/:id - Cannot delete main admin user');
      return res.status(403).json({ error: "Cannot delete the main admin user" });
    }

    try {
      const success = await storage.deleteUser(userId);

      if (success) {
        console.log('DELETE /api/users/:id - User deleted successfully');
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/users/:id - User not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('DELETE /api/users/:id - Error deleting user:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Reference Data Types routes
  app.get("/api/reference-types", async (req, res) => {
    console.log('GET /api/reference-types - Request received'); //Added logging
    if (!req.isAuthenticated()) {
      console.log('GET /api/reference-types - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }

    try {
      const types = await storage.getAllReferenceDataTypes();
      console.log('GET /api/reference-types - Reference types fetched successfully'); //Added logging
      res.json(types);
    } catch (error) {
      console.error('GET /api/reference-types - Error fetching reference types:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  // Add endpoint to get a single reference type by ID
  app.get("/api/reference-types/:id", async (req, res) => {
    console.log('GET /api/reference-types/:id - Request received for ID:', req.params.id); //Added logging
    if (!req.isAuthenticated()) {
      console.log('GET /api/reference-types/:id - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }

    try {
      const typeId = Number(req.params.id);
      // Get the single type from the database
      const types = await storage.getAllReferenceDataTypes();
      const type = types.find(t => t.id === typeId);

      if (!type) {
        console.log('GET /api/reference-types/:id - Type not found for ID:', typeId); //Added logging
        return res.status(404).json({ error: "Reference data type not found" });
      }

      console.log('GET /api/reference-types/:id - Type found:', type); //Added logging
      res.json(type);
    } catch (error) {
      console.error('GET /api/reference-types/:id - Error fetching reference type:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/reference-types", async (req, res) => {
    console.log('POST /api/reference-types - Request received'); //Added logging
    if (!req.isAuthenticated()) {
      console.log('POST /api/reference-types - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }
    try {
      console.log('POST /api/reference-types - Creating reference type with data:', req.body);
      const referenceType = await storage.createReferenceDataType(req.body);
      console.log('POST /api/reference-types - Created reference type:', referenceType);
      res.status(201).json(referenceType);
    } catch (error) {
      console.error('POST /api/reference-types - Error creating reference type:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/reference-types/:id/schemas", async (req, res) => {
    console.log('GET /api/reference-types/:id/schemas - Request received'); //Added logging
    if (!req.isAuthenticated()) {
      console.log('GET /api/reference-types/:id/schemas - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }
    try {
      const schemas = await storage.getReferenceDataTypeSchemas(Number(req.params.id));
      console.log('GET /api/reference-types/:id/schemas - Schemas fetched successfully'); //Added logging
      res.json(schemas);
    } catch (error) {
      console.error('GET /api/reference-types/:id/schemas - Error fetching reference type schemas:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/api/reference-types/:id", async (req, res) => {
    console.log('PATCH /api/reference-types/:id - Request received'); //Added logging
    if (!req.isAuthenticated()) {
      console.log('PATCH /api/reference-types/:id - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }
    try {
      console.log('PATCH /api/reference-types/:id - Updating reference type with data:', req.body);
      const referenceType = await storage.updateReferenceDataType(
        Number(req.params.id),
        req.body
      );
      console.log('PATCH /api/reference-types/:id - Updated reference type:', referenceType);
      res.json(referenceType);
    } catch (error) {
      console.error('PATCH /api/reference-types/:id - Error updating reference type:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/reference-types/:id", async (req, res) => {
    console.log('DELETE /api/reference-types/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/reference-types/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const typeId = Number(req.params.id);
      console.log('DELETE /api/reference-types/:id - Deleting reference type with ID:', typeId);
      
      // First check if this type has associated data sets
      const hasAssociatedDataSets = await storage.hasAssociatedDataSets(typeId);
      
      if (hasAssociatedDataSets) {
        console.log('DELETE /api/reference-types/:id - Cannot delete: Type has associated datasets');
        return res.status(400).json({ 
          error: "Cannot delete this reference data type because it has associated data sets. Please delete the data sets first." 
        });
      }
      
      // If no associated data sets, proceed with deletion
      const result = await storage.deleteReferenceDataType(typeId);
      
      if (result.success) {
        console.log('DELETE /api/reference-types/:id - Successfully deleted reference type:', typeId);
        res.json({ success: true });
      } else {
        console.log('DELETE /api/reference-types/:id - Failed to delete reference type:', result.message);
        res.status(400).json({ error: result.message || "Failed to delete reference data type" });
      }
    } catch (error) {
      console.error('DELETE /api/reference-types/:id - Error deleting reference type:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Reference Data Sets routes
  app.get("/api/reference-data", async (req, res) => {
    console.log('GET /api/reference-data - Request received'); //Added logging
    if (!req.isAuthenticated()) {
      console.log('GET /api/reference-data - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }
    try {
      const dataSets = await storage.getAllReferenceDataSets();
      console.log('GET /api/reference-data - Data sets fetched successfully'); //Added logging
      res.json(dataSets);
    } catch (error) {
      console.error('GET /api/reference-data - Error fetching reference data sets:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/reference-data/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('GET /api/reference-data/:id - Not authenticated');
      return res.sendStatus(401);
    }

    try {
      console.log('GET /api/reference-data/:id - Request params:', req.params);
      
      // Validate the ID parameter before proceeding
      if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
        console.log('GET /api/reference-data/:id - Invalid ID parameter:', req.params.id);
        return res.status(400).json({ error: 'Invalid reference data ID parameter' });
      }
      
      const dataSetId = Number(req.params.id);
      
      // Ensure the ID is a valid number
      if (isNaN(dataSetId)) {
        console.log('GET /api/reference-data/:id - Invalid numeric ID:', req.params.id);
        return res.status(400).json({ error: 'Invalid reference data ID format' });
      }
      
      console.log('GET /api/reference-data/:id - Fetching dataset:', dataSetId);

      const dataSet = await storage.getReferenceDataSet(dataSetId);
      console.log('GET /api/reference-data/:id - Raw dataset from storage:', dataSet);

      if (dataSet) {
        // Log the structure of the data before sending
        console.log('GET /api/reference-data/:id - Dataset structure:', {
          id: dataSet.id,
          name: dataSet.name,
          dataType: typeof dataSet.data,
          dataContent: dataSet.data
        });
        res.json(dataSet);
      } else {
        console.log('GET /api/reference-data/:id - Dataset not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('GET /api/reference-data/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/reference-data", async (req, res) => {
    console.log('POST /api/reference-data - Request received'); //Added logging
    if (!req.isAuthenticated()) {
      console.log('POST /api/reference-data - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }
    try {
      const dataSet = await storage.createReferenceDataSet(req.body);
      console.log('POST /api/reference-data - Data set created successfully'); //Added logging
      // Sync with Neo4j if available
      if (GraphDataService.isAvailable()) {
        try {
          await GraphDataService.syncReferenceDataSet(dataSet.id);
        } catch (graphError) {
          console.error('Error syncing to graph database:', graphError);
          // Continue with the response even if graph sync fails
        }
      }
      res.status(201).json(dataSet);
    } catch (error) {
      console.error('POST /api/reference-data - Error creating reference data set:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/reference-data/:id/values", async (req, res) => {
    console.log('GET /api/reference-data/:id/values - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/reference-data/:id/values - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const dataSetId = Number(req.params.id);
      const attribute = req.query.attribute ? String(req.query.attribute) : undefined;
      console.log('GET /api/reference-data/:id/values - Fetching values for dataset:', dataSetId, 'attribute:', attribute);
      
      const values = await storage.getReferenceDataSetValues(dataSetId, attribute);
      console.log(`GET /api/reference-data/:id/values - Retrieved ${values.length} values`);
      
      res.json(values);
    } catch (error) {
      console.error('GET /api/reference-data/:id/values - Error fetching values:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/reference-data/:id/template", async (req, res) => {
    console.log('GET /api/reference-data/:id/template - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/reference-data/:id/template - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const dataSetId = Number(req.params.id);
      console.log('GET /api/reference-data/:id/template - Fetching dataset:', dataSetId);

      const dataSet = await storage.getReferenceDataSet(dataSetId);
      if (!dataSet) {
        console.log('GET /api/reference-data/:id/template - Dataset not found');
        return res.status(404).json({ error: "Reference Data Set not found" });
      }

      // Get schemas to know the structure
      const schemas = await storage.getReferenceDataTypeSchemas(dataSet.typeId);
      console.log('GET /api/reference-data/:id/template - Retrieved schemas:', schemas.map(s => s.name));

      // Create CSV content with headers
      const headers = schemas.map(s => s.name).join(",") + "\n";

      // Set response headers to prevent caching and force download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(dataSet.name)}_template.csv"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log('GET /api/reference-data/:id/template - Sending template with headers:', headers.trim());
      res.send(headers);
    } catch (error) {
      console.error('GET /api/reference-data/:id/template - Error generating template:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/reference-data/:id/bulk-upload", upload.single("file"), async (req, res) => {
    console.log('POST /api/reference-data/:id/bulk-upload - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/reference-data/:id/bulk-upload - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const dataSetId = Number(req.params.id);
      const file = req.file;
      const timestamp = new Date().toISOString();

      console.log('POST /api/reference-data/:id/bulk-upload - Received upload request for dataset:', dataSetId);
      console.log('POST /api/reference-data/:id/bulk-upload - File received:', file ? 'yes' : 'no');

      if (!file) {
        console.log('POST /api/reference-data/:id/bulk-upload - No file uploaded');
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log('POST /api/reference-data/:id/bulk-upload - File details:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      const dataSet = await storage.getReferenceDataSet(dataSetId);
      if (!dataSet) {
        console.log('POST /api/reference-data/:id/bulk-upload - Dataset not found');
        return res.status(404).json({ error: "Reference Data Set not found" });
      }

      const schemas = await storage.getReferenceDataTypeSchemas(dataSet.typeId);
      const schemaNames = schemas.map(s => s.name);

      console.log('POST /api/reference-data/:id/bulk-upload - Schema names:', schemaNames);

      // Parse CSV
      const records: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      await new Promise<void>((resolve, reject) => {
        parser.on('readable', function() {
          let record;
          while ((record = parser.read()) !== null) {
            // Validate record against schema
            const validRecord: Record<string, any> = {};
            for (const schemaName of schemaNames) {
              if (record[schemaName] === undefined) {
                console.error(`Missing required field: ${schemaName} in record:`, record);
                // Skip this record instead of throwing an error
                continue;
              }
              // Make sure to store data with exact schema names
              validRecord[schemaName] = record[schemaName];
            }
            // Only add valid records
            if (Object.keys(validRecord).length === schemaNames.length) {
              // Add metadata to each record
              records.push({
                ...validRecord,
                status: "DRAFT",
                createdBy: req.user?.username || "system",
                createdAt: timestamp,
                lastModifiedBy: req.user?.username || "system",
                lastModifiedAt: timestamp,
                _history: [{
                  timestamp,
                  changes: Object.entries(validRecord).map(([field, value]) => ({
                    field,
                    oldValue: "",
                    newValue: value
                  }))
                }]
              });
            }
          }
        });

        parser.on('error', (error) => {
          console.error('POST /api/reference-data/:id/bulk-upload - CSV parsing error:', error);
          reject(error);
        });

        parser.on('end', () => {
          console.log('POST /api/reference-data/:id/bulk-upload - CSV parsing complete. Records found:', records.length);
          resolve();
        });

        parser.write(file.buffer);
        parser.end();
      });

      // Make sure we have records to process
      if (records.length === 0) {
        throw new Error('No valid records found in the CSV file');
      }

      console.log('POST /api/reference-data/:id/bulk-upload - Updating dataset with records count:', records.length);

      // Update data set with new instances including metadata
      const updatedDataSet = await storage.updateReferenceDataSet(dataSetId, {
        data: records.reduce((acc, record, index) => {
          acc[`instance_${index + 1}`] = record;
          return acc;
        }, {} as Record<string, any>)
      });

      console.log('POST /api/reference-data/:id/bulk-upload - Upload complete. Dataset updated with data:', updatedDataSet.data);
      res.json(updatedDataSet);

    } catch (error) {
      console.error('POST /api/reference-data/:id/bulk-upload - Error processing bulk upload:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/reference-data/:id/dependencies", async (req, res) => {
    console.log('GET /api/reference-data/:id/dependencies - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/reference-data/:id/dependencies - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const dataSetId = Number(req.params.id);
      console.log(`Checking dependencies for dataset ID: ${dataSetId}`);

      // Import required operators
      const { eq, or } = await import('drizzle-orm');

      // Get relationships where this dataset is used
      const relationshipResults = await db
        .select()
        .from(relationships)
        .where(
          or(
            eq(relationships.sourceDataSetId, dataSetId),
            eq(relationships.targetDataSetId, dataSetId)
          )
        );

      // Get crosswalk mappings where this dataset is used
      const crosswalkResults = await db
        .select()
        .from(crosswalkMappings)
        .where(
          or(
            eq(crosswalkMappings.sourceSystemId, dataSetId),
            eq(crosswalkMappings.targetSystemId, dataSetId)
          )
        );

      console.log('Dependencies check results:', {
        dataSetId,
        relationshipCount: relationshipResults.length,
        crosswalkCount: crosswalkResults.length,
        relationshipIds: relationshipResults.map(r => r.id),
        crosswalkIds: crosswalkResults.map(c => c.id)
      });

      res.json({
        relationships: relationshipResults,
        crosswalks: crosswalkResults,
        canDelete: relationshipResults.length === 0 && crosswalkResults.length === 0
      });
    } catch (error) {
      console.error('Dependency check failed:', {
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
      res.status(500).json({
        error: "Failed to check dependencies",
        details: error.message
      });
    }
  });


  app.patch("/api/reference-data/:id", async (req, res) => {
    console.log('PATCH /api/reference-data/:id - Request received'); //Added logging
    if (!req.isAuthenticated()) {
      console.log('PATCH /api/reference-data/:id - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }
    try {
      const dataSet = await storage.updateReferenceDataSet(
        Number(req.params.id),
        req.body
      );
      console.log('PATCH /api/reference-data/:id - Data set updated successfully'); //Added logging
      // Sync with Neo4j if available
      if (GraphDataService.isAvailable()) {
        try {
          await GraphDataService.syncReferenceDataSet(dataSet.id);
        } catch (graphError) {
          console.error('Error syncing to graph database:', graphError);
          // Continue with the response even if graph sync fails
        }
      }
      res.json(dataSet);
    } catch (error) {
      console.error('PATCH /api/reference-data/:id - Error updating reference data set:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/reference-data/:id", async (req, res) => {
    console.log('DELETE /api/reference-data/:id - Request received'); //Added logging
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/reference-data/:id - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }
    try {
      const success = await storage.deleteReferenceDataSet(Number(req.params.id));
      if (success) {
        console.log('DELETE /api/reference-data/:id - Data set deleted successfully'); //Added logging
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/reference-data/:id - Data set not found'); //Added logging
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('DELETE /api/reference-data/:id - Error deleting reference data set:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  // Add relationship routes
  app.get("/api/relationships", async (req, res) => {
    console.log('GET /api/relationships - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/relationships - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const relationships = await storage.getAllRelationships();
      console.log('GET /api/relationships - Relationships fetched successfully');
      res.json(relationships);
    } catch (error) {
      console.error('GET /api/relationships - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add new endpoint to get unique relationship types
  app.get("/api/relationships/types", async (req, res) => {
    console.log('GET /api/relationships/types - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/relationships/types - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      // Check if this is for dropdown (needs to return all types regardless of pagination)
      const forDropdown = req.query.forDropdown === 'true';
      console.log('GET /api/relationships/types - For dropdown:', forDropdown);
      
      let query = db
        .select({
          id: relationships.id,
          name: relationships.name
        })
        .from(relationships);
        
      if (!forDropdown) {
        // Original behavior - only get types that have pending values
        query = query
          .innerJoin(
            relationshipValues,
            eq(relationshipValues.relationshipId, relationships.id)
          )
          .where(eq(relationshipValues.approvalStatus, "PENDING"))
          .groupBy(relationships.id, relationships.name);
      }
      
      const relationshipTypes = await query;

      console.log('GET /api/relationships/types - Types fetched:', relationshipTypes.length);
      res.json(relationshipTypes);
    } catch (error) {
      console.error('GET /api/relationships/types - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/relationships/:id", async (req, res) => {
    console.log('GET /api/relationships/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/relationships/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const relationship = await storage.getRelationship(Number(req.params.id));
      if (relationship) {
        console.log('GET /api/relationships/:id - Relationship found');
        res.json(relationship);
      } else {
        console.log('GET /api/relationships/:id - Relationship not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('GET /api/relationships/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/relationships", async (req, res) => {
    console.log('POST /api/relationships - Request received with payload:', req.body);
    if (!req.isAuthenticated()) {
      console.log('POST /api/relationships - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const result = insertRelationshipSchema.safeParse(req.body);
      if (!result.success) {
        console.log('POST /api/relationships - Invalid data:', result.error);
        return res.status(400).json(result.error);
      }

      console.log('POST /api/relationships - Validated data:', result.data);
      const relationship = await storage.createRelationship(result.data);
      console.log('POST /api/relationships - Relationship created successfully:', relationship);

      // Sync with Neo4j if available
      if (GraphDataService.isAvailable()) {
        try {
          await GraphDataService.syncRelationship(relationship.id);
        } catch (graphError) {
          console.error('Error syncing relationship to graph database:', graphError);
          // Continue with the response even if graph sync fails
        }
      }
      res.status(201).json(relationship);
    } catch (error) {
      console.error('POST /api/relationships - Error creating relationship:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/api/relationships/:id", async (req, res) => {
    console.log('PATCH /api/relationships/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('PATCH /api/relationships/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const relationship = await storage.updateRelationship(
        Number(req.params.id),
        req.body
      );
      console.log('PATCH /api/relationships/:id - Relationship updated successfully');
      // Sync with Neo4j if available
      if (GraphDataService.isAvailable()) {
        try {
          await GraphDataService.syncRelationship(relationship.id);
        } catch (graphError) {
          console.error('Error syncing relationship to graph database:', graphError);
          // Continue with the response even if graph sync fails
        }
      }
      res.json(relationship);
    } catch (error) {
      console.error('PATCH /api/relationships/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/relationships/:id", async (req, res) => {
    console.log('DELETE /api/relationships/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/relationships/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const success = await storage.deleteRelationship(Number(req.params.id));
      if (success) {
        console.log('DELETE /api/relationships/:id - Relationship deleted successfully');
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/relationships/:id - Relationship not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('DELETE /api/relationships/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/api/relationships/:id/values/:valueId", async (req, res) => {
    console.log('PATCH /api/relationships/:id/values/:valueId - Request received');
    if (!req.isAuthenticated()) {
      console.log('PATCH /api/relationships/:id/values/:valueId - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const valueId = Number(req.params.valueId);
      const { sourceInstanceId, targetInstanceId } = req.body;

      // Validate input
      if (!sourceInstanceId || !targetInstanceId) {
        return res.status(400).json({ error: "Source and target instance IDs are required" });
      }

      // Get current value to record changes
      const currentValue = await db
        .select()
        .from(relationshipValues)
        .where(eq(relationshipValues.id, valueId))
        .limit(1);

      if (!currentValue.length) {
        return res.status(404).json({ error: "Relationship value not found" });
      }

      const isStatusChange = ["APPROVED", "REJECTED"].includes(currentValue[0].approvalStatus);
      
      // Update the relationship value with change history
      const value = await storage.updateRelationshipValue(valueId, {
        sourceInstanceId,
        targetInstanceId,
        // Change status to DRAFT if currently APPROVED or REJECTED
        ...(isStatusChange && { approvalStatus: "DRAFT" }),
        changeHistory: [...(currentValue[0].changeHistory as any[] || []), {
          timestamp: new Date().toISOString(),
          changes: [
            {
              field: 'sourceInstanceId',
              oldValue: currentValue[0].sourceInstanceId,
              newValue: sourceInstanceId
            },
            {
              field: 'targetInstanceId',
              oldValue: currentValue[0].targetInstanceId,
              newValue: targetInstanceId
            },
            // Add status change to history if applicable
            ...(isStatusChange ? [{
              field: 'approvalStatus',
              oldValue: currentValue[0].approvalStatus,
              newValue: "DRAFT"
            }] : [])
          ]
        }]
      });

      // Sync with Neo4j if available
      if (GraphDataService.isAvailable()) {
        try {
          await GraphDataService.syncRelationship(Number(req.params.id));
        } catch (graphError) {
          console.error('Error syncing to graph database:', graphError);
          // Continue with the response even if graph sync fails
        }
      }

      console.log('PATCH /api/relationships/:id/values/:valueId - Value updated successfully');
      res.json(value);
    } catch (error) {
      console.error('PATCH /api/relationships/:id/values/:valueId - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/relationships/:id/values", async (req, res) => {
    console.log('GET /api/relationships/:id/values - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/relationships/:id/values - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const relationshipId = Number(req.params.id);
      const status = req.query.status as string;

      // Build the conditions array
      const conditions = [eq(relationshipValues.relationshipId, relationshipId)];
      
      // Add status condition if status is specified and not 'all'
      if (status && status !== 'all') {
        conditions.push(eq(relationshipValues.approvalStatus, status));
      }

      // Query with status filter if provided
      const values = await db
        .select()
        .from(relationshipValues)
        .where(and(...conditions))
        .orderBy(relationshipValues.createdAt);

      console.log('GET /api/relationships/:id/values - Values fetched successfully');
      res.json(values);
    } catch (error) {
      console.error('GET /api/relationships/:id/values - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add the bulk submit endpoint after the existing relationship value routes
  app.post("/api/relationships/:id/values/bulk-submit", async (req, res) => {
    console.log('POST /api/relationships/:id/values/bulk-submit - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/relationships/:id/values/bulk-submit - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const { valueIds } = req.body;

      if (!Array.isArray(valueIds) || valueIds.length === 0) {
        return res.status(400).json({ error: "No values provided for bulk submission" });
      }

      console.log('POST /api/relationships/:id/values/bulk-submit - Processing values:', valueIds);

      // Get all values to check their status
      const values = await db
        .select()
        .from(relationshipValues)
        .where(inArray(relationshipValues.id, valueIds));

      console.log('POST /api/relationships/:id/values/bulk-submit - Found values:', values.length);

      // Check if all values are in DRAFT status
      const nonDraftValues = values.filter(v => v.approvalStatus !== "DRAFT");
      if (nonDraftValues.length > 0) {
        return res.status(400).json({
          error: "Some values are not in DRAFT status",
          invalidIds: nonDraftValues.map(v => v.id)
        });
      }

      // Update all values with new status and change history
      const timestamp = new Date().toISOString();
      const updates = await Promise.all(
        values.map(value => 
          db.update(relationshipValues)
            .set({
              approvalStatus: "PENDING",
              updatedAt: new Date(),
              changeHistory: [
                ...(value.changeHistory as any[] || []),
                {
                  timestamp,
                  changes: [{
                    field: 'approvalStatus',
                    oldValue: 'DRAFT',
                    newValue: 'PENDING'
                  }]
                }
              ]
            })
            .where(eq(relationshipValues.id, value.id))
            .returning()
        )
      );

      console.log(`POST /api/relationships/:id/values/bulk-submit - Successfully submitted ${updates.length} values`);
      res.json({ success: true, count: updates.length });
    } catch (error) {
      console.error('POST /api/relationships/:id/values/bulk-submit - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Optimized endpoint for fetching pending relationship values
  app.get("/api/approvals/relationship-values/pending", async (req, res) => {
    console.log('GET /api/approvals/relationship-values/pending - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/approvals/relationship-values/pending - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 50;
      const offset = (page - 1) * pageSize;

      // Extract filter parameters
      const searchTerm = req.query.search_term as string;
      const relationshipTypeId = req.query.relationship_type_id ? Number(req.query.relationship_type_id) : undefined;
      const sourceDatasetId = req.query.source_dataset_id ? Number(req.query.source_dataset_id) : undefined;
      const targetDatasetId = req.query.target_dataset_id ? Number(req.query.target_dataset_id) : undefined;
      const fromDate = req.query.from_date ? new Date(req.query.from_date as string) : undefined;
      const toDate = req.query.to_date ? new Date(req.query.to_date as string) : undefined;

      console.log('Filter parameters:', {
        page,
        pageSize,
        searchTerm,
        relationshipTypeId,
        sourceDatasetId,
        targetDatasetId,
        fromDate,
        toDate
      });

      // Build WHERE conditions
      let conditions = [eq(relationshipValues.approvalStatus, "PENDING")];

      if (searchTerm) {
        conditions.push(
          or(
            sql`CAST(${relationships.name} AS TEXT) ILIKE ${`%${searchTerm}%`}`,
            sql`CAST(${relationshipValues.sourceInstanceId} AS TEXT) ILIKE ${`%${searchTerm}%`}`,
            sql`CAST(${relationshipValues.targetInstanceId} AS TEXT) ILIKE ${`%${searchTerm}%`}`
          )
        );
      }

      if (relationshipTypeId) {
        conditions.push(eq(relationships.id, relationshipTypeId));
      }

      if (sourceDatasetId) {
        conditions.push(eq(relationships.sourceDataSetId, sourceDatasetId));
      }

      if (targetDatasetId) {
        conditions.push(eq(relationships.targetDataSetId, targetDatasetId));
      }

      if (fromDate) {
        conditions.push(sql`${relationshipValues.createdAt} >= ${fromDate.toISOString()}`);
      }

      if (toDate) {
        conditions.push(sql`${relationshipValues.createdAt} <= ${toDate.toISOString()}`);
      }

      // Get total count first
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(relationshipValues)
        .innerJoin(relationships, eq(relationshipValues.relationshipId, relationships.id))
        .where(and(...conditions));

      const totalCount = Number(totalCountResult[0].count);
      const totalPages = Math.ceil(totalCount / pageSize);

      // Get paginated relationship values with filters
      const pendingValues = await db
        .select({
          id: relationshipValues.id,
          relationshipId: relationshipValues.relationshipId,
          sourceInstanceId: relationshipValues.sourceInstanceId,
          targetInstanceId: relationshipValues.targetInstanceId,
          approvalStatus: relationshipValues.approvalStatus,
          history: relationshipValues.changeHistory,
          createdAt: relationshipValues.createdAt,
          relationshipName: relationships.name,
          sourceDataSetId: relationships.sourceDataSetId,
          targetDataSetId: relationships.targetDataSetId,
        })
        .from(relationshipValues)
        .innerJoin(
          relationships,
          eq(relationshipValues.relationshipId, relationships.id)
        )
        .where(and(...conditions))
        .limit(pageSize)
        .offset(offset);

      // Batch fetch required datasets
      const dataSetIds = new Set([
        ...pendingValues.map(v => v.sourceDataSetId),
        ...pendingValues.map(v => v.targetDataSetId)
      ]);
      
      const dataSets = await Promise.all(
        Array.from(dataSetIds).map(id => storage.getReferenceDataSet(id))
      );
      
      // Create a map for quick dataset lookup  
      const dataSetMap = new Map(
        dataSets.filter(ds => ds !== null).map(ds => [ds.id, ds])
      );

      // Enhance values with dataset info
      const enhancedValues = pendingValues.map(value => ({
        ...value,
        sourceDataSet: {
          id: value.sourceDataSetId,
          name: dataSetMap.get(value.sourceDataSetId)?.name || '',
          data: dataSetMap.get(value.sourceDataSetId)?.data || {}
        },
        targetDataSet: {
          id: value.targetDataSetId,
          name: dataSetMap.get(value.targetDataSetId)?.name || '',
          data: dataSetMap.get(value.targetDataSetId)?.data || {}
        }
      }));

      console.log('GET /api/approvals/relationship-values/pending - Values fetched successfully:', {
        totalCount,
        currentPage: page,
        totalPages,
        fetchedCount: enhancedValues.length
      });

      res.json({
        data: enhancedValues,
        metadata: {
          totalCount,
          currentPage: page,
          pageSize,
          totalPages
        }
      });
    } catch (error) {
      console.error('GET /api/approvals/relationship-values/pending - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add after the existing relationship routes
  app.get("/api/relationships/:id/values", async (req, res) => {
    console.log('GET /api/relationships/:id/values - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/relationships/:id/values - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const values = await storage.getRelationshipValues(Number(req.params.id));
      console.log('GET /api/relationships/:id/values - Values fetched successfully');
      res.json(values);
    } catch (error) {
      console.error('GET /api/relationships/:id/values - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/relationships/:id/values", async (req, res) => {
    console.log('POST /api/relationships/:id/values - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/relationships/:id/values - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const value = await storage.createRelationshipValue(req.body);
      console.log('POST /api/relationships/:id/values - Value created successfully');
      res.status(201).json(value);
    } catch (error) {
      console.error('POST /api/relationships/:id/values - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/relationships/:id/values/:valueId", async (req, res) => {
    console.log('DELETE /api/relationships/:id/values/:valueId - Request received');
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/relationships/:id/values/:valueId - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const valueId = Number(req.params.valueId);

      // Use SQL transaction to ensure data consistency
      await db.transaction(async (tx) => {
        // First delete related attribute values
        await tx.execute(sql`
          DELETE FROM relationship_attribute_values 
          WHERE relationship_value_id = ${valueId}
        `);

        // Then delete the relationship value
        await tx.execute(sql`
          DELETE FROM relationship_values 
          WHERE id = ${valueId}
        `);
      });

      console.log('DELETE /api/relationships/:id/values/:valueId - Value deleted successfully');
      res.sendStatus(200);
    } catch (error) {
      console.error('DELETE /api/relationships/:id/values/:valueId - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/relationships/:id/values/available-targets", async (req, res) => {
    console.log('GET /api/relationships/:id/values/available-targets - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/relationships/:id/values/available-targets - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const sourceId = req.query.sourceId as string;
      if (!sourceId) {
        return res.status(400).json({ error: "Source ID is required" });
      }
      const targets = await storage.getAvailableTargets(Number(req.params.id), sourceId);
      console.log('GET /api/relationships/:id/values/available-targets - Targets fetched successfully');
      res.json(targets);
    } catch (error) {
      console.error('GET /api/relationships/:id/values/available-targets - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/relationships/:id/values/:valueId/attributes", async (req, res) => {
    console.log('GET /api/relationships/:id/values/:valueId/attributes - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/relationships/:id/values/:valueId/attributes - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const values = await storage.getRelationshipAttributeValues(Number(req.params.valueId));
      console.log('GET /api/relationships/:id/values/:valueId/attributes - Values fetched successfully');
      res.json(values);
    } catch (error) {
      console.error('GET /api/relationships/:id/values/:valueId/attributes - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/relationships/:id/values/import", upload.single('file'), async (req, res) => {
    console.log('POST /api/relationships/:id/values/import - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/relationships/:id/values/import - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const file = req.file;
      const mapping = JSON.parse(req.body.mapping);

      if (!file || !mapping) {
        return res.status(400).json({ error: "Missing file or mapping configuration" });
      }

      console.log('Mapping configuration:', mapping);

      // Parse CSV
      const records: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      await new Promise<void>((resolve, reject) => {
        parser.on('readable', function() {
          let record;
          while ((record = parser.read()) !== null) {
            records.push(record);
          }
        });

        parser.on('error', (error) => {
          console.error('POST /api/relationships/:id/values/import - CSV parsing error:', error);
          reject(error);
        });

        parser.on('end', () => {
          resolve();        });

        parser.write(file.buffer);
        parser.end();
      });

      // Process records and create relationship values with attributes
      for (const record of records) {
        // Create relationship value
        const relationshipValue = await storage.createRelationshipValue({
          relationshipId: Number(req.params.id),
          sourceInstanceId: record[mapping.sourceInstanceId],
          targetInstanceId: record[mapping.targetInstanceId],
          metadata: {} // Optional metadata
        });

        // Create attribute values
        for (const [attributeId, columnName] of Object.entries(mapping.attributes)) {
          if (columnName && record[columnName]) {
            await storage.createRelationshipAttributeValue({
              relationshipValueId: relationshipValue.id,

              attributeDefinitionId: Number(attributeId),
              value: String(record[columnName]),
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      res.status(201).json({ message: "Import completed successfully" });
    } catch (error) {
      console.error('POST /api/relationships/:id/values/import - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add relationship attribute definition routes
  app.get("/api/relationships/:id/attribute-definitions", async (req, res) => {
    console.log('GET /api/relationships/:id/attribute-definitions - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/relationships/:id/attribute-definitions - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const definitions = await storage.getRelationshipAttributeDefinitions(Number(req.params.id));
      console.log('GET /api/relationships/:id/attribute-definitions - Definitions fetched successfully');
      res.json(definitions);
    } catch (error) {
      console.error('GET /api/relationships/:id/attribute-definitions - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/relationships/:id/attribute-definitions", async (req, res) => {
    console.log('POST /api/relationships/:id/attribute-definitions - Request received');
    console.log('Request body:', req.body);

    if (!req.isAuthenticated()) {
      console.log('POST /api/relationships/:id/attribute-definitions - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const result = insertRelationshipAttributeDefinitionSchema.safeParse({
        ...req.body,
        relationshipTypeId: Number(req.params.id)
      });

      if (!result.success) {
        console.log('POST /api/relationships/:id/attribute-definitions - Invalid data:', result.error);
        return res.status(400).json(result.error);
      }

      console.log('Validated data:', result.data);
      const definition = await storage.createRelationshipAttributeDefinition(result.data);
      console.log('POST /api/relationships/:id/attribute-definitions - Definition created successfully:', definition);
      res.status(201).json(definition);
    } catch (error) {
      console.error('POST /api/relationships/:id/attribute-definitions - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/api/relationships/attribute-definitions/:id", async (req, res) => {
    console.log('PATCH /api/relationships/attribute-definitions/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('PATCH /api/relationships/attribute-definitions/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const definition = await storage.updateRelationshipAttributeDefinition(
        Number(req.params.id),
        req.body
      );
      console.log('PATCH /api/relationships/attribute-definitions/:id - Definition updated successfully');
      res.json(definition);
    } catch (error) {
      console.error('PATCH /api/relationships/attribute-definitions/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/relationships/attribute-definitions/:id", async (req, res) => {
    console.log('DELETE /api/relationships/attribute-definitions/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/relationships/attribute-definitions/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const success = await storage.deleteRelationshipAttributeDefinition(Number(req.params.id));
      if (success) {
        console.log('DELETE /api/relationships/attribute-definitions/:id - Definition deleted successfully');
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/relationships/attribute-definitions/:id - Definition not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('DELETE /api/relationships/attribute-definitions/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add relationship attribute value routes
  app.get("/api/relationships/values/:valueId/attributes", async (req, res) => {
    console.log('GET /api/relationships/values/:valueId/attributes - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/relationships/values/:valueId/attributes - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const values = await storage.getRelationshipAttributeValues(Number(req.params.valueId));
      console.log('GET /api/relationships/values/:valueId/attributes - Values fetched successfully');
      res.json(values);
    } catch (error) {
      console.error('GET /api/relationships/values/:valueId/attributes - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/relationships/values/:valueId/attributes", async (req, res) => {
    console.log('POST /api/relationships/values/:valueId/attributes - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/relationships/values/:valueId/attributes - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const result = insertRelationshipAttributeValueSchema.safeParse({
        ...req.body,
        relationshipValueId: Number(req.params.valueId)
      });

      if (!result.success) {
        console.log('POST /api/relationships/values/:valueId/attributes - Invalid data:', result.error);
        return res.status(400).json(result.error);
      }

      const value = await storage.createRelationshipAttributeValue(result.data);
      console.log('POST /api/relationships/values/:valueId/attributes - Value created successfully');
      res.status(201).json(value);
    } catch (error) {
      console.error('POST /api/relationships/values/:valueId/attributes - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/api/relationships/attribute-values/:id", async (req, res) => {
    console.log('PATCH /api/relationships/attribute-values/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('PATCH /api/relationships/attribute-values/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const value = await storage.updateRelationshipAttributeValue(
        Number(req.params.id),
        req.body
      );
      console.log('PATCH /api/relationships/attribute-values/:id - Value updated successfully');
      res.json(value);
    } catch (error) {
      console.error('PATCH /api/relationships/attribute-values/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/relationships/attribute-values/:id", async (req, res) => {
    console.log('DELETE /api/relationships/attribute-values/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/relationships/attribute-values/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const success = await storage.deleteRelationshipAttributeValue(Number(req.params.id));
      if (success) {
        console.log('DELETE /api/relationships/attribute-values/:id - Value deleted successfully');
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/relationships/attribute-values/:id - Value not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('DELETE /api/relationships/attribute-values/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Crosswalk Mapping routes
  app.get("/api/crosswalks", async (req, res) => {
    console.log('GET /api/crosswalks - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/crosswalks - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const mappings = await storage.getAllCrosswalkMappings();
      console.log('GET /api/crosswalks - Mappings fetched successfully');
      res.json(mappings);
    } catch (error) {
      console.error('GET /api/crosswalks - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Get crosswalks by target dataset ID
  app.get("/api/crosswalks/by-target/:targetDatasetId", async (req, res) => {
    console.log(`GET /api/crosswalks/by-target/${req.params.targetDatasetId} - Request received`);
    
    // Enhanced auth logging for production debugging
    console.log(`[DEBUG Auth] Crosswalks By Target - Auth details:`, {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'method unavailable',
      hasUser: !!req.user,
      userId: req.user ? req.user.id : 'none',
      sessionID: req.sessionID || 'no session ID',
      path: req.path,
      cookies: req.headers.cookie ? 'present' : 'absent'
    });
    
    if (!req.isAuthenticated()) {
      console.log(`GET /api/crosswalks/by-target/${req.params.targetDatasetId} - Unauthorized access`);
      return res.sendStatus(401);
    }
    
    try {
      const targetDatasetId = parseInt(req.params.targetDatasetId);
      if (isNaN(targetDatasetId)) {
        return res.status(400).json({ error: "Invalid target dataset ID" });
      }
      
      const crosswalks = await storage.getCrosswalkMappingsByTargetId(targetDatasetId);
      console.log(`GET /api/crosswalks/by-target/${targetDatasetId} - Mappings fetched successfully`);
      res.status(200).json(crosswalks);
    } catch (error) {
      console.error(`GET /api/crosswalks/by-target/${req.params.targetDatasetId} - Error:`, error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Lookup a value in a crosswalk mapping
  app.get("/api/crosswalks/:id/lookup/:sourceValue", async (req, res) => {
    console.log(`GET /api/crosswalks/:id/lookup/:sourceValue - Request received`);
    if (!req.isAuthenticated()) {
      console.log(`GET /api/crosswalks/:id/lookup/:sourceValue - Unauthorized access`);
      return res.sendStatus(401);
    }
    
    try {
      const crosswalkId = parseInt(req.params.id);
      const sourceValue = req.params.sourceValue;
      const requestContext = req.query.context || 'API lookup';
      
      if (isNaN(crosswalkId)) {
        return res.status(400).json({ error: "Invalid crosswalk ID" });
      }
      
      // Get the crosswalk mapping
      const crosswalk = await storage.getCrosswalkMapping(crosswalkId);
      if (!crosswalk) {
        return res.status(404).json({ error: "Crosswalk mapping not found" });
      }
      
      // Look up the source value in the mappings
      const mapping = crosswalk.mappingData?.mappings?.find(m => m.sourceValue === sourceValue);
      
      if (mapping) {
        // If found, return the target value
        console.log(`GET /api/crosswalks/:id/lookup/:sourceValue - Mapping found for value: ${sourceValue}`);
        return res.json({
          found: true,
          sourceValue: sourceValue,
          targetValue: mapping.targetValue,
          confidence: mapping.confidence
        });
      } else {
        // If not found, log the missing mapping and return not found
        console.log(`GET /api/crosswalks/:id/lookup/:sourceValue - Mapping not found for value: ${sourceValue}, logging missing mapping`);
        
        // Log the missing mapping
        await storage.logMissingMapping({
          crosswalkId,
          sourceValue,
          requestContext: String(requestContext),
          requestUserId: req.user?.id || null
        });
        
        return res.json({
          found: false,
          sourceValue: sourceValue,
          message: "No mapping found for this source value"
        });
      }
    } catch (error) {
      console.error(`GET /api/crosswalks/:id/lookup/:sourceValue - Error:`, error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // DIAGNOSTIC ROUTES - Not included in navigation, for debugging only
  // These routes help diagnose authentication issues in production
  app.use('/api/diagnostics', (req, res, next) => {
    console.log(`[DIAGNOSTICS] Request to ${req.path}`);
    next();
  });
  
  // Use the diagnostic routes imported at the top of the file
  app.use('/api/diagnostics', diagnosticsRouter);

  app.get("/api/crosswalks/:id", async (req, res) => {
    console.log('GET /api/crosswalks/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/crosswalks/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const id = Number(req.params.id);

      // Validate that the ID is a valid number
      if (isNaN(id)) {
        console.log('GET /api/crosswalks/:id - Invalid ID parameter:', req.params.id);
        return res.status(400).json({ error: "Invalid crosswalk ID - must be a number" });
      }

      const mapping = await storage.getCrosswalkMapping(id);
      if (mapping) {
        console.log('GET /api/crosswalks/:id - Mapping found');
        res.json(mapping);
      } else {
        console.log('GET /api/crosswalks/:id - Mapping not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('GET /api/crosswalks/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add new route for downloading crosswalk template
  app.get("/api/crosswalks/:id/template", async (req, res) => {
    console.log('GET /api/crosswalks/:id/template - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/crosswalks/:id/template - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const crosswalkId = Number(req.params.id);
      console.log('GET /api/crosswalks/:id/template - Crosswalk ID:', crosswalkId);

      const crosswalk = await storage.getCrosswalkMapping(crosswalkId);

      if (!crosswalk) {
        console.log('GET /api/crosswalks/:id/template - Crosswalk not found');
        return res.status(404).json({ error: "Crosswalk mapping not found" });
      }

      console.log('GET /api/crosswalks/:id/template - Crosswalk found:', {
        id: crosswalk.id,
        name: crosswalk.name,
        sourceSystemId: crosswalk.sourceSystemId,
        targetSystemId: crosswalk.targetSystemId
      });

      // Get source and target data sets
      const sourceDataSet = await storage.getReferenceDataSet(crosswalk.sourceSystemId);
      const targetDataSet = await storage.getReferenceDataSet(crosswalk.targetSystemId);

      if (!sourceDataSet || !targetDataSet) {
        console.log('GET /api/crosswalks/:id/template - Source or target dataset not found:', {
          sourceFound: !!sourceDataSet,
          targetFound: !!targetDataSet,
          sourceId: crosswalk.sourceSystemId,
          targetId: crosswalk.targetSystemId
        });
        return res.status(404).json({ error: "Source or target data set not found" });
      }

      // Get schemas for source and target
      const sourceSchemas = await storage.getReferenceDataTypeSchemas(sourceDataSet.typeId);
      const targetSchemas = await storage.getReferenceDataTypeSchemas(targetDataSet.typeId);

      if (!sourceSchemas.length || !targetSchemas.length) {
        console.log('GET /api/crosswalks/:id/template - Schemas not found');
        return res.status(404).json({ error: "Source or target schemas not found" });
      }

      // Create CSV header with source and target column names
      const sourcePrimaryColumn = sourceSchemas[0].name;
      const targetPrimaryColumn = targetSchemas[0].name;
      const headers = `Source_${sourcePrimaryColumn},Target_${targetPrimaryColumn}`;

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${crosswalk.name}_template.csv`);

      // Send as CSV file with just the headers
      res.send(headers);
      console.log('GET /api/crosswalks/:id/template - Template generated successfully');
    } catch (error) {
      console.error('GET /api/crosswalks/:id/template - Error generating template:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/crosswalks", async (req, res) => {
    console.log('POST /api/crosswalks - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/crosswalks - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const result = insertCrosswalkMappingSchema.safeParse(req.body);
      if (!result.success) {
        console.log('POST /api/crosswalks - Invalid data:', result.error);
        return res.status(400).json(result.error);
      }

      // Set the initial approval status to PENDING and create a change history entry
      const userId = req.user.id;
      const timestamp = new Date().toISOString();
      
      const mappingData = {
        ...result.data,
        approvalStatus: "PENDING",
        changeHistory: [{
          timestamp,
          prevStatus: null,
          newStatus: "PENDING",
          userId,
          comment: "Initial submission"
        }]
      };
      
      const mapping = await storage.createCrosswalkMapping(mappingData);
      console.log('POST /api/crosswalks - Mapping created successfully');
      // Sync with Neo4j if available
      if (GraphDataService.isAvailable()) {
        try {
          await GraphDataService.syncCrosswalk(mapping.id);
        } catch (graphError) {
          console.error('Error syncing crosswalk to graph database:', graphError);
          // Continue with the response even if graph sync fails
        }
      }
      res.status(201).json(mapping);
    } catch (error) {
      console.error('POST /api/crosswalks - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/api/crosswalks/:id", async (req, res) => {
    console.log('PATCH /api/crosswalks/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('PATCH /api/crosswalks/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      // First, get the current mapping to ensure we have the approval status
      const mappingId = Number(req.params.id);
      const currentMapping = await storage.getCrosswalkMapping(mappingId);
      if (!currentMapping) {
        return res.status(404).json({ error: "Crosswalk mapping not found" });
      }
      
      // Init with a deep copy of the request body
      let updatedData = { ...req.body };
      
      // Store sourceAttribute/targetAttribute at root level if they're present
      if (req.body.sourceAttribute !== undefined) {
        console.log('PATCH /api/crosswalks/:id - Updating sourceAttribute:', req.body.sourceAttribute);
        // Update the root level source attribute
        currentMapping.sourceAttribute = req.body.sourceAttribute;
      }
      
      if (req.body.targetAttribute !== undefined) {
        console.log('PATCH /api/crosswalks/:id - Updating targetAttribute:', req.body.targetAttribute);
        // Update the root level target attribute
        currentMapping.targetAttribute = req.body.targetAttribute;
      }
      
      // If we're updating mappingData, we need to handle merging properly
      if (req.body.mappingData) {
        console.log('PATCH /api/crosswalks/:id - Updating mappingData');
        
        // Make sure we have valid structures to work with
        const currentMappingData = currentMapping.mappingData || { 
          mappings: [],
          sourceAttribute: currentMapping.sourceAttribute || '',
          targetAttribute: currentMapping.targetAttribute || ''
        };
        
        // Get the existing mappings
        const existingMappings = Array.isArray(currentMappingData.mappings) 
          ? currentMappingData.mappings 
          : [];
        
        // Log before processing for debugging
        console.log('PATCH /api/crosswalks/:id - Current mappings count:', existingMappings.length);
        console.log('PATCH /api/crosswalks/:id - New mappings data count:', Array.isArray(req.body.mappingData.mappings) ? req.body.mappingData.mappings.length : 0);
        
        // Check if this is a complete replacement of mappings or a merge request
        const isMergeRequest = req.body.mergeStrategy === 'merge';
        console.log('PATCH /api/crosswalks/:id - Merge strategy:', isMergeRequest ? 'merge' : 'replace');
        
        // Get the status for new mappings
        const status = currentMapping.approvalStatus || "DRAFT";
        
        // Prepare updated mappings, ensuring they have a status
        let updatedMappings = Array.isArray(req.body.mappingData.mappings) 
          ? req.body.mappingData.mappings.map(mapping => {
              if (!mapping.status) {
                return {
                  ...mapping,
                  status: status
                };
              }
              return mapping;
            })
          : [];
          
        // Based on merge strategy, either replace or merge mappings
        let finalMappings;
        if (isMergeRequest) {
          // Create a helper function to check for duplicates
          const isDuplicate = (existing, newMapping) => {
            return existing.some(m => 
              m.sourceValue === newMapping.sourceValue && 
              m.targetValue === newMapping.targetValue
            );
          };
          
          // Filter out any duplicates before merging
          const uniqueNewMappings = updatedMappings.filter(
            newMapping => !isDuplicate(existingMappings, newMapping)
          );
          
          // Now merge without duplicates
          finalMappings = [
            ...existingMappings,
            ...uniqueNewMappings
          ];
          
          console.log('PATCH /api/crosswalks/:id - Unique new mappings count:', uniqueNewMappings.length);
        } else {
          // Complete replacement
          finalMappings = updatedMappings;
        }
        
        // Log after processing
        console.log('PATCH /api/crosswalks/:id - Final mappings count:', finalMappings.length);
        
        // Update the mappingData with the processed mappings
        updatedData.mappingData = {
          ...req.body.mappingData,
          mappings: finalMappings
        };
      }
      
      // Make sure to include sourceAttribute and targetAttribute in the final update
      // If provided in the request, use those values (allows client to update)
      if (req.body.sourceAttribute) {
        updatedData.sourceAttribute = req.body.sourceAttribute;
      } else if (currentMapping.sourceAttribute) {
        updatedData.sourceAttribute = currentMapping.sourceAttribute;
      }
      
      if (req.body.targetAttribute) {
        updatedData.targetAttribute = req.body.targetAttribute;
      } else if (currentMapping.targetAttribute) {
        updatedData.targetAttribute = currentMapping.targetAttribute;
      }
      
      // If we have empty attributes, try to detect the correct ones from reference datasets
      if ((!updatedData.sourceAttribute || !updatedData.targetAttribute) && 
          (currentMapping.sourceSystemId && currentMapping.targetSystemId)) {
        try {
          console.log('PATCH /api/crosswalks/:id - Detecting attributes from reference datasets');
          // Fetch source and target datasets to determine attributes
          const sourceDataset = await storage.getReferenceDataSet(Number(currentMapping.sourceSystemId));
          const targetDataset = await storage.getReferenceDataSet(Number(currentMapping.targetSystemId));
          
          // Detect attributes from datasets
          if (sourceDataset && sourceDataset.data && !updatedData.sourceAttribute) {
            // Get first instance and find primary attribute (exclude metadata fields)
            const firstInstance = Object.values(sourceDataset.data)[0];
            if (firstInstance) {
              const possibleKeys = Object.keys(firstInstance).filter(
                k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
              );
              if (possibleKeys.length > 0) {
                console.log('PATCH /api/crosswalks/:id - Detected source attribute:', possibleKeys[0]);
                updatedData.sourceAttribute = possibleKeys[0];
              }
            }
          }
          
          if (targetDataset && targetDataset.data && !updatedData.targetAttribute) {
            // Get first instance and find primary attribute (exclude metadata fields)
            const firstInstance = Object.values(targetDataset.data)[0];
            if (firstInstance) {
              const possibleKeys = Object.keys(firstInstance).filter(
                k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
              );
              if (possibleKeys.length > 0) {
                console.log('PATCH /api/crosswalks/:id - Detected target attribute:', possibleKeys[0]);
                updatedData.targetAttribute = possibleKeys[0];
              }
            }
          }
        } catch (attrError) {
          console.error('PATCH /api/crosswalks/:id - Error detecting attributes:', attrError);
          // Continue even if attribute detection fails
        }
      }
      
      // Ensure we have defaults for the attributes if still missing
      if (!updatedData.sourceAttribute) {
        console.log('PATCH /api/crosswalks/:id - Using default source attribute name');
        updatedData.sourceAttribute = 'name'; // Default fallback
      }
      
      if (!updatedData.targetAttribute) {
        console.log('PATCH /api/crosswalks/:id - Using default target attribute name');
        updatedData.targetAttribute = 'name'; // Default fallback
      }
      
      // If we have mappingData with attributes, ensure those values are used
      // This ensures attributes at both levels remain in sync
      if (updatedData.mappingData) {
        // Ensure sourceAttribute exists and matches in both places
        updatedData.mappingData.sourceAttribute = updatedData.sourceAttribute;
        updatedData.mappingData.targetAttribute = updatedData.targetAttribute;
      }
      
      console.log('PATCH /api/crosswalks/:id - Final updatedData:', {
        sourceAttribute: updatedData.sourceAttribute,
        targetAttribute: updatedData.targetAttribute
      });
      
      const mapping = await storage.updateCrosswalkMapping(
        mappingId,
        updatedData
      );
      console.log('PATCH /api/crosswalks/:id - Mapping updated successfully');
      // Sync with Neo4j if available
      if (GraphDataService.isAvailable()) {
        try {
          await GraphDataService.syncCrosswalk(mapping.id);
        } catch (graphError) {
          console.error('Error syncing crosswalk to graph database:', graphError);
          // Continue with the response even if graph sync fails
        }
      }
      res.json(mapping);
    } catch (error) {
      console.error('PATCH /api/crosswalks/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/crosswalks/:id", async (req, res) => {
    console.log('DELETE /api/crosswalks/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/crosswalks/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const success = await storage.deleteCrosswalkMapping(Number(req.params.id));
      if (success) {
        console.log('DELETE /api/crosswalks/:id - Mapping deleted successfully');
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/crosswalks/:id - Mapping not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('DELETE /api/crosswalks/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Missing Mappings Routes
  
  // Log a missing mapping
  app.post("/api/missing-mappings", async (req, res) => {
    console.log('POST /api/missing-mappings - Request received');
    
    if (!req.isAuthenticated()) {
      console.log('POST /api/missing-mappings - Unauthorized access');
      return res.sendStatus(401);
    }
    
    try {
      const result = insertMissingMappingSchema.safeParse(req.body);
      
      if (!result.success) {
        console.log('POST /api/missing-mappings - Invalid data:', result.error);
        return res.status(400).json({ error: result.error });
      }
      
      // Add user information to the missing mapping
      const missingMapping = await storage.logMissingMapping({
        ...result.data,
        requestUserId: req.user.id,
        requestContext: req.body.requestContext || 'API request'
      });
      
      console.log('POST /api/missing-mappings - Missing mapping logged successfully');
      res.status(201).json(missingMapping);
    } catch (error) {
      console.error('POST /api/missing-mappings - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Get all missing mappings or filtered by crosswalk
  app.get("/api/missing-mappings", async (req, res) => {
    console.log('GET /api/missing-mappings - Request received');
    console.log('GET /api/missing-mappings - Session ID:', req.sessionID);
    console.log('GET /api/missing-mappings - Is Authenticated:', req.isAuthenticated());
    console.log('GET /api/missing-mappings - User:', req.user ? `ID: ${req.user.id}, Role: ${req.user.roleId}` : 'Not authenticated');
    
    if (!req.isAuthenticated()) {
      console.log('GET /api/missing-mappings - Unauthorized access');
      return res.sendStatus(401);
    }
    
    try {
      const crosswalkId = req.query.crosswalkId ? Number(req.query.crosswalkId) : undefined;
      console.log('GET /api/missing-mappings - Filter by crosswalk:', crosswalkId);
      
      console.log('GET /api/missing-mappings - Attempting to fetch missing mappings from storage');
      const missingMappings = await storage.getMissingMappings(crosswalkId);
      console.log('GET /api/missing-mappings - Missing mappings fetched successfully, count:', missingMappings.length);
      
      // Log the first few items if available
      if (missingMappings.length > 0) {
        console.log('GET /api/missing-mappings - Sample data (first item):', 
          JSON.stringify(missingMappings[0], null, 2).substring(0, 500)); // Limit output size
      }
      
      res.json(missingMappings);
    } catch (error) {
      console.error('GET /api/missing-mappings - Error:', error);
      console.error('GET /api/missing-mappings - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ error: String(error), stack: error instanceof Error ? error.stack : undefined });
    }
  });
  
  // Get statistics for missing mappings
  // Important: This specific route must come before the :id wildcard route
  app.get("/api/missing-mappings/statistics", async (req, res) => {
    console.log('GET /api/missing-mappings/statistics - Request received');
    
    if (!req.isAuthenticated()) {
      console.log('GET /api/missing-mappings/statistics - Unauthorized access');
      return res.sendStatus(401);
    }
    
    try {
      const statistics = await storage.getMissingMappingStatistics();
      console.log('GET /api/missing-mappings/statistics - Statistics fetched successfully');
      
      res.json(statistics);
    } catch (error) {
      console.error('GET /api/missing-mappings/statistics - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Get a specific missing mapping by ID
  app.get("/api/missing-mappings/:id", async (req, res) => {
    console.log('GET /api/missing-mappings/:id - Request received for ID:', req.params.id);
    
    if (!req.isAuthenticated()) {
      console.log('GET /api/missing-mappings/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    
    try {
      const missingMapping = await storage.getMissingMappingById(Number(req.params.id));
      
      if (!missingMapping) {
        console.log(`GET /api/missing-mappings/:id - Mapping ID ${req.params.id} not found`);
        return res.status(404).json({ error: "Missing mapping not found" });
      }
      
      console.log(`GET /api/missing-mappings/:id - Found mapping:`, missingMapping);
      res.json(missingMapping);
    } catch (error) {
      console.error('GET /api/missing-mappings/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Delete a missing mapping
  app.delete("/api/missing-mappings/:id", async (req, res) => {
    console.log('DELETE /api/missing-mappings/:id - Request received for ID:', req.params.id);
    
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/missing-mappings/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    
    try {
      // Log the authentication status
      console.log('DELETE /api/missing-mappings/:id - Auth info:', {
        isAuthenticated: req.isAuthenticated(),
        userId: req.user?.id,
        sessionID: req.sessionID
      });
      
      // First check if the mapping exists
      const existingMapping = await storage.getMissingMappingById(Number(req.params.id));
      if (!existingMapping) {
        console.log(`DELETE /api/missing-mappings/:id - Mapping ID ${req.params.id} not found in database`);
        return res.status(404).json({ error: "Missing mapping not found" });
      }
      
      console.log(`DELETE /api/missing-mappings/:id - Found mapping to delete:`, existingMapping);
      
      const success = await storage.deleteMissingMapping(Number(req.params.id));
      
      if (success) {
        console.log('DELETE /api/missing-mappings/:id - Missing mapping deleted successfully');
        res.json({ success: true });
      } else {
        console.log('DELETE /api/missing-mappings/:id - Delete operation failed');
        res.status(404).json({ error: "Failed to delete mapping" });
      }
    } catch (error) {
      console.error('DELETE /api/missing-mappings/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Add to crosswalk endpoint
  app.post("/api/missing-mappings/:id/add-to-crosswalk", async (req, res) => {
    console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Request received');
    
    if (!req.isAuthenticated()) {
      console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Unauthorized access');
      return res.sendStatus(401);
    }
    
    try {
      const missingMappingId = Number(req.params.id);
      const { crosswalkId, targetValue, confidence = 0.75, status = 'PENDING' } = req.body;
      
      if (!crosswalkId || !targetValue) {
        console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Missing required fields');
        return res.status(400).json({ error: "Required fields missing" });
      }
      
      // Get the missing mapping
      const missingMapping = await storage.getMissingMappingById(missingMappingId);
      if (!missingMapping) {
        console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Missing mapping not found');
        return res.status(404).json({ error: "Missing mapping not found" });
      }
      
      // Get the crosswalk
      const crosswalk = await storage.getCrosswalkMapping(Number(crosswalkId));
      if (!crosswalk) {
        console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Crosswalk not found');
        return res.status(404).json({ error: "Crosswalk not found" });
      }
      
      // Parse mappingData if it exists
      let mappingData = crosswalk.mappingData || {};
      if (typeof mappingData === 'string') {
        try {
          mappingData = JSON.parse(mappingData);
        } catch (e) {
          console.error('Error parsing mapping data:', e);
          mappingData = {};
        }
      }
      
      // Ensure mappings array exists
      if (!mappingData.mappings) {
        mappingData.mappings = [];
      }
      
      // Ensure source and target attributes exist in mappingData
      let sourceAttribute = crosswalk.sourceAttribute || '';
      let targetAttribute = crosswalk.targetAttribute || '';
      
      // Try to get source and target attributes from source/target datasets if not available
      if (!sourceAttribute || !targetAttribute) {
        try {
          console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Fetching source/target attributes');
          
          if (crosswalk.sourceSystemId && !sourceAttribute) {
            const sourceDataset = await storage.getReferenceDataSet(Number(crosswalk.sourceSystemId));
            if (sourceDataset && sourceDataset.data) {
              const firstInstance = Object.values(sourceDataset.data)[0];
              if (firstInstance) {
                const possibleKeys = Object.keys(firstInstance).filter(
                  k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
                );
                if (possibleKeys.length > 0) {
                  sourceAttribute = possibleKeys[0];
                  console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Detected source attribute:', sourceAttribute);
                }
              }
            }
          }
          
          if (crosswalk.targetSystemId && !targetAttribute) {
            const targetDataset = await storage.getReferenceDataSet(Number(crosswalk.targetSystemId));
            if (targetDataset && targetDataset.data) {
              const firstInstance = Object.values(targetDataset.data)[0];
              if (firstInstance) {
                const possibleKeys = Object.keys(firstInstance).filter(
                  k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
                );
                if (possibleKeys.length > 0) {
                  targetAttribute = possibleKeys[0];
                  console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Detected target attribute:', targetAttribute);
                }
              }
            }
          }
        } catch (attrError) {
          console.error('POST /api/missing-mappings/:id/add-to-crosswalk - Error detecting attributes:', attrError);
        }
      }
      
      // Set default attributes if still not found
      if (!sourceAttribute) {
        sourceAttribute = 'name';
        console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Using default source attribute name');
      }
      
      if (!targetAttribute) {
        targetAttribute = 'name';
        console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Using default target attribute name');
      }
      
      // Update mappingData with correct attributes
      mappingData.sourceAttribute = sourceAttribute;
      mappingData.targetAttribute = targetAttribute;
      
      // Check if this source value already exists in the mappings
      const duplicateIndex = mappingData.mappings.findIndex(m => 
        m.sourceValue === missingMapping.sourceValue
      );
      
      if (duplicateIndex >= 0) {
        // Update existing mapping
        mappingData.mappings[duplicateIndex] = {
          ...mappingData.mappings[duplicateIndex],
          targetValue,
          confidence,
          status,
        };
        console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Updated existing mapping');
      } else {
        // Add new mapping
        mappingData.mappings.push({
          sourceValue: missingMapping.sourceValue,
          targetValue,
          confidence,
          status,
        });
        console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Added new mapping');
      }
      
      // Update the crosswalk mapping with both mappingData and the attributes at root level
      const updatedCrosswalk = await storage.updateCrosswalkMapping(
        Number(crosswalkId),
        { 
          mappingData,
          sourceAttribute,
          targetAttribute
        }
      );
      
      // Delete the missing mapping since it's been added
      await storage.deleteMissingMapping(missingMappingId);
      
      console.log('POST /api/missing-mappings/:id/add-to-crosswalk - Successfully added to crosswalk');
      res.json({ success: true, crosswalk: updatedCrosswalk });
    } catch (error) {
      console.error('POST /api/missing-mappings/:id/add-to-crosswalk - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Batch-add missing mappings to crosswalk
  app.post("/api/missing-mappings/batch-add", async (req, res) => {
    console.log('POST /api/missing-mappings/batch-add - Request received');
    
    if (!req.isAuthenticated()) {
      console.log('POST /api/missing-mappings/batch-add - Unauthorized access');
      return res.sendStatus(401);
    }
    
    try {
      const { 
        mappingIds, 
        crosswalkId, 
        targetValues, 
        confidence = 0.75, 
        status = 'PENDING' 
      } = req.body;
      
      if (!mappingIds || !Array.isArray(mappingIds) || mappingIds.length === 0 || 
          !crosswalkId || !targetValues || Object.keys(targetValues).length === 0) {
        console.log('POST /api/missing-mappings/batch-add - Missing required fields');
        return res.status(400).json({ error: "Required fields missing" });
      }
      
      // Get the crosswalk
      const crosswalk = await storage.getCrosswalkMapping(Number(crosswalkId));
      if (!crosswalk) {
        console.log('POST /api/missing-mappings/batch-add - Crosswalk not found');
        return res.status(404).json({ error: "Crosswalk not found" });
      }
      
      // Parse mappingData if it exists
      let mappingData = crosswalk.mappingData || {};
      if (typeof mappingData === 'string') {
        try {
          mappingData = JSON.parse(mappingData);
        } catch (e) {
          console.error('Error parsing mapping data:', e);
          mappingData = {};
        }
      }
      
      // Ensure mappings array exists
      if (!mappingData.mappings) {
        mappingData.mappings = [];
      }
      
      // Ensure source and target attributes exist in mappingData
      let sourceAttribute = crosswalk.sourceAttribute || '';
      let targetAttribute = crosswalk.targetAttribute || '';
      
      // Try to get source and target attributes from source/target datasets if not available
      if (!sourceAttribute || !targetAttribute) {
        try {
          console.log('POST /api/missing-mappings/batch-add - Fetching source/target attributes');
          
          if (crosswalk.sourceSystemId && !sourceAttribute) {
            const sourceDataset = await storage.getReferenceDataSet(Number(crosswalk.sourceSystemId));
            if (sourceDataset && sourceDataset.data) {
              const firstInstance = Object.values(sourceDataset.data)[0];
              if (firstInstance) {
                const possibleKeys = Object.keys(firstInstance).filter(
                  k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
                );
                if (possibleKeys.length > 0) {
                  sourceAttribute = possibleKeys[0];
                  console.log('POST /api/missing-mappings/batch-add - Detected source attribute:', sourceAttribute);
                }
              }
            }
          }
          
          if (crosswalk.targetSystemId && !targetAttribute) {
            const targetDataset = await storage.getReferenceDataSet(Number(crosswalk.targetSystemId));
            if (targetDataset && targetDataset.data) {
              const firstInstance = Object.values(targetDataset.data)[0];
              if (firstInstance) {
                const possibleKeys = Object.keys(firstInstance).filter(
                  k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
                );
                if (possibleKeys.length > 0) {
                  targetAttribute = possibleKeys[0];
                  console.log('POST /api/missing-mappings/batch-add - Detected target attribute:', targetAttribute);
                }
              }
            }
          }
        } catch (attrError) {
          console.error('POST /api/missing-mappings/batch-add - Error detecting attributes:', attrError);
        }
      }
      
      // Set default attributes if still not found
      if (!sourceAttribute) {
        sourceAttribute = 'name';
        console.log('POST /api/missing-mappings/batch-add - Using default source attribute name');
      }
      
      if (!targetAttribute) {
        targetAttribute = 'name';
        console.log('POST /api/missing-mappings/batch-add - Using default target attribute name');
      }
      
      // Update mappingData with correct attributes
      mappingData.sourceAttribute = sourceAttribute;
      mappingData.targetAttribute = targetAttribute;
      
      // Fetch all missing mappings
      const missingMappings = [];
      for (const id of mappingIds) {
        const mapping = await storage.getMissingMappingById(Number(id));
        if (mapping) {
          missingMappings.push(mapping);
        }
      }
      
      if (missingMappings.length === 0) {
        console.log('POST /api/missing-mappings/batch-add - No valid missing mappings found');
        return res.status(404).json({ error: "No valid missing mappings found" });
      }
      
      // Process each missing mapping
      const results = [];
      const processedIds = [];
      
      for (const missingMapping of missingMappings) {
        const targetValue = targetValues[missingMapping.id];
        
        if (!targetValue) {
          results.push({
            id: missingMapping.id,
            success: false,
            message: "No target value provided for this mapping"
          });
          continue;
        }
        
        // Check if this source value already exists in the mappings
        const duplicateIndex = mappingData.mappings.findIndex(m => 
          m.sourceValue === missingMapping.sourceValue
        );
        
        if (duplicateIndex >= 0) {
          // Update existing mapping
          mappingData.mappings[duplicateIndex] = {
            ...mappingData.mappings[duplicateIndex],
            targetValue,
            confidence,
            status,
          };
          results.push({
            id: missingMapping.id,
            success: true,
            message: "Updated existing mapping"
          });
        } else {
          // Add new mapping
          mappingData.mappings.push({
            sourceValue: missingMapping.sourceValue,
            targetValue,
            confidence,
            status,
          });
          results.push({
            id: missingMapping.id,
            success: true,
            message: "Added new mapping"
          });
        }
        
        processedIds.push(missingMapping.id);
      }
      
      // Update the crosswalk mapping with both mappingData and the attributes at root level
      const updatedCrosswalk = await storage.updateCrosswalkMapping(
        Number(crosswalkId),
        { 
          mappingData,
          sourceAttribute,
          targetAttribute
        }
      );
      
      // Delete the processed missing mappings
      for (const id of processedIds) {
        await storage.deleteMissingMapping(Number(id));
      }
      
      console.log(`POST /api/missing-mappings/batch-add - Successfully processed ${processedIds.length} mappings`);
      res.json({ 
        success: true, 
        results, 
        crosswalk: updatedCrosswalk,
        processedCount: processedIds.length
      });
    } catch (error) {
      console.error('POST /api/missing-mappings/batch-add - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Smart suggestions for missing mappings
  app.post("/api/missing-mappings/smart-suggestions", async (req, res) => {
    console.log('POST /api/missing-mappings/smart-suggestions - Request received');
    
    if (!req.isAuthenticated()) {
      console.log('POST /api/missing-mappings/smart-suggestions - Unauthorized access');
      return res.sendStatus(401);
    }
    
    try {
      const { mappingIds, crosswalkId } = req.body;
      
      if (!mappingIds || !Array.isArray(mappingIds) || mappingIds.length === 0 || !crosswalkId) {
        console.log('POST /api/missing-mappings/smart-suggestions - Missing required fields');
        return res.status(400).json({ error: "Required fields missing" });
      }
      
      // Get the crosswalk
      const crosswalk = await storage.getCrosswalkMapping(Number(crosswalkId));
      if (!crosswalk) {
        console.log('POST /api/missing-mappings/smart-suggestions - Crosswalk not found');
        return res.status(404).json({ error: "Crosswalk not found" });
      }
      
      // Parse mappingData if it exists
      let mappingData = crosswalk.mappingData || {};
      if (typeof mappingData === 'string') {
        try {
          mappingData = JSON.parse(mappingData);
        } catch (e) {
          console.error('Error parsing mapping data:', e);
          mappingData = {};
        }
      }
      
      // Ensure mappings array exists
      if (!mappingData.mappings) {
        mappingData.mappings = [];
      }
      
      // Fetch all missing mappings
      const missingMappings = [];
      for (const id of mappingIds) {
        const mapping = await storage.getMissingMappingById(Number(id));
        if (mapping) {
          missingMappings.push(mapping);
        }
      }
      
      if (missingMappings.length === 0) {
        console.log('POST /api/missing-mappings/smart-suggestions - No valid missing mappings found');
        return res.status(404).json({ error: "No valid missing mappings found" });
      }
      
      // Get existing mappings for reference
      const existingMappings = mappingData.mappings || [];
      
      // Generate suggestions for each missing mapping
      const suggestions = [];
      
      for (const missingMapping of missingMappings) {
        let suggestedValues = [];
        const sourceValue = missingMapping.sourceValue;
        
        // Strategy 1: Exact matching (already exists in the crosswalk)
        const exactMatch = existingMappings.find(m => 
          m.sourceValue?.toLowerCase() === sourceValue?.toLowerCase()
        );
        
        if (exactMatch) {
          suggestedValues.push({
            value: exactMatch.targetValue,
            confidence: 1.0,
            reason: "Exact match found in existing mappings"
          });
        } else {
          // Strategy 2: Substring matching
          const substringMatches = existingMappings.filter(m => 
            m.sourceValue?.toLowerCase().includes(sourceValue?.toLowerCase()) ||
            sourceValue?.toLowerCase().includes(m.sourceValue?.toLowerCase())
          );
          
          if (substringMatches.length > 0) {
            for (const match of substringMatches) {
              const sourceLength = match.sourceValue.length;
              const missingLength = sourceValue.length;
              const lengthRatio = Math.min(sourceLength, missingLength) / Math.max(sourceLength, missingLength);
              const confidence = 0.7 * lengthRatio;
              
              suggestedValues.push({
                value: match.targetValue,
                confidence: confidence,
                reason: "Substring match found in existing mappings"
              });
            }
          }
          
          // Strategy 3: Word similarity
          const words = sourceValue.toLowerCase().split(/\s+/);
          const wordMatches = existingMappings.filter(m => {
            const mWords = m.sourceValue?.toLowerCase().split(/\s+/) || [];
            return words.some(word => mWords.includes(word));
          });
          
          if (wordMatches.length > 0) {
            for (const match of wordMatches) {
              const mWords = match.sourceValue?.toLowerCase().split(/\s+/) || [];
              const commonWords = words.filter(word => mWords.includes(word));
              const confidence = 0.5 * (commonWords.length / Math.max(words.length, mWords.length));
              
              suggestedValues.push({
                value: match.targetValue,
                confidence: confidence,
                reason: "Word similarity match found in existing mappings"
              });
            }
          }
        }
        
        // Sort suggestions by confidence and take top 5
        suggestedValues.sort((a, b) => b.confidence - a.confidence);
        suggestedValues = suggestedValues.slice(0, 5);
        
        suggestions.push({
          id: missingMapping.id,
          sourceValue: missingMapping.sourceValue,
          suggestions: suggestedValues
        });
      }
      
      console.log(`POST /api/missing-mappings/smart-suggestions - Generated suggestions for ${suggestions.length} mappings`);
      res.json({ 
        success: true, 
        suggestions 
      });
    } catch (error) {
      console.error('POST /api/missing-mappings/smart-suggestions - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Add endpoints for approving/rejecting reference data instances
  app.post("/api/reference-data/:id/instances/:instanceId/approve", async (req, res) => {
    console.log('POST /api/reference-data/:id/instances/:instanceId/approve - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/reference-data/:id/instances/:instanceId/approve - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const dataSetId = Number(req.params.id);
      const instanceId = req.params.instanceId;
      const timestamp = new Date().toISOString();

      // Get the current dataset
      const dataSet = await storage.getReferenceDataSet(dataSetId);
      if (!dataSet) {
        console.log('POST /api/reference-data/:id/instances/:instanceId/approve - Dataset not found');
        return res.status(404).json({ error: "Reference data set not found" });
      }

      const currentData = { ...dataSet.data };
      const currentInstance = currentData[instanceId];

      if (!currentInstance) {
        console.log('POST /api/reference-data/:id/instances/:instanceId/approve - Instance not found');
        return res.status(404).json({ error: "Instance not found" });
      }

      if (currentInstance.status !== "PENDING_APPROVAL") {
        console.log('POST /api/reference-data/:id/instances/:instanceId/approve - Instance not pending approval');
        return res.status(400).json({ error: "Only pending instances can be approved" });
      }

      // Update the instance status
      const updatedData = {
        ...currentData,
        [instanceId]: {
          ...currentInstance,
          status: "APPROVED",
          lastModifiedBy: req.user?.username || "system",
          lastModifiedAt: timestamp,
          _history: [
            ...(currentInstance._history || []),
            {
              timestamp,
              changes: [{
                field: "status",
                oldValue: "PENDING_APPROVAL",
                newValue: "APPROVED"
              }]
            }
          ]
        }
      };

      // Save the updated dataset
      const updatedDataSet = await storage.updateReferenceDataSet(dataSetId, {
        data: updatedData
      });

      console.log('POST /api/reference-data/:id/instances/:instanceId/approve - Instance approved successfully');
      res.json(updatedDataSet);

    } catch (error) {
      console.error('POST /api/reference-data/:id/instances/:instanceId/approve - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/reference-data/:id/instances/:instanceId/reject", async (req, res) => {
    console.log('POST /api/reference-data/:id/instances/:instanceId/reject - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/reference-data/:id/instances/:instanceId/reject - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const dataSetId = Number(req.params.id);
      const instanceId = req.params.instanceId;
      const timestamp = new Date().toISOString();

      // Get the current dataset
      const dataSet = await storage.getReferenceDataSet(dataSetId);
      if (!dataSet) {
        console.log('POST /api/reference-data/:id/instances/:instanceId/reject - Dataset not found');
        return res.status(404).json({ error: "Reference data set not found" });
      }

      const currentData = { ...dataSet.data };
      const currentInstance = currentData[instanceId];

      if (!currentInstance) {
        console.log('POST /api/reference-data/:id/instances/:instanceId/reject - Instance not found');
        return res.status(404).json({ error: "Instance not found" });
      }

      if (currentInstance.status !== "PENDING_APPROVAL") {
        console.log('POST /api/reference-data/:id/instances/:instanceId/reject - Instance not pending approval');
        return res.status(400).json({ error: "Only pending instances can be rejected" });
      }

      // Update the instance status
      const updatedData = {
        ...currentData,
        [instanceId]: {
          ...currentInstance,
          status: "DRAFT",
          lastModifiedBy: req.user?.username || "system",
          lastModifiedAt: timestamp,
          _history: [
            ...(currentInstance._history || []),
            {
              timestamp,
              changes: [{
                field: "status",
                oldValue: "PENDING_APPROVAL",
                newValue: "DRAFT"
              }]
            }
          ]
        }
      };

      // Save the updated dataset
      const updatedDataSet = await storage.updateReferenceDataSet(dataSetId, {
        data: updatedData
      });

      console.log('POST /api/reference-data/:id/instances/:instanceId/reject - Instance rejected successfully');
      res.json(updatedDataSet);

    } catch (error) {
      console.error('POST /api/reference-data/:id/instances/:instanceId/reject - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/crosswalks/system/:systemId", async (req, res) => {
    console.log('GET /api/crosswalks/system/:systemId - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/crosswalks/system/:systemId - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const mappings = await storage.getCrosswalkMappingsBySystem(Number(req.params.systemId));
      console.log('GET /api/crosswalks/system/:systemId - Mappings fetched successfully');
      res.json(mappings);
    } catch (error) {
      console.error('GET /api/crosswalks/system/:systemId - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/metrics", async (req, res) => {
    console.log('GET /api/metrics - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/metrics - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      // Wrap each individual query in try/catch to identify which one is failing
      let metrics = {
        totalDatasets: 0,
        totalDataTypes: 0,
        totalRelationships: 0,
        totalCrosswalks: 0,
        totalMissingMappings: 0,
        activeMappings: 0,
        recentChanges: 0,
        activeUsers: 0
      };
      
      try {
        const [datasets] = await db
          .select({ count: sql`count(*)` })
          .from(referenceDataSets);
        metrics.totalDatasets = Number(datasets?.count || 0);
        console.log('Datasets count fetched:', metrics.totalDatasets);
      } catch (err) {
        console.error('Error fetching datasets count:', err);
      }
      
      try {
        const [dataTypes] = await db
          .select({ count: sql`count(*)` })
          .from(referenceDataTypes);
        metrics.totalDataTypes = Number(dataTypes?.count || 0);
        console.log('Data types count fetched:', metrics.totalDataTypes);
      } catch (err) {
        console.error('Error fetching data types count:', err);
      }
      
      try {
        const [relationshipCount] = await db
          .select({ count: sql`count(*)` })
          .from(relationships);
        metrics.totalRelationships = Number(relationshipCount?.count || 0);
        console.log('Relationships count fetched:', metrics.totalRelationships);
      } catch (err) {
        console.error('Error fetching relationships count:', err);
      }
      
      try {
        const [crosswalks] = await db
          .select({ count: sql`count(*)` })
          .from(crosswalkMappings);
        metrics.totalCrosswalks = Number(crosswalks?.count || 0);
        console.log('Crosswalks count fetched:', metrics.totalCrosswalks);
      } catch (err) {
        console.error('Error fetching crosswalks count:', err);
      }
      
      try {
        const [missingMappingsCount] = await db
          .select({ count: sql`count(*)` })
          .from(missingMappings);
        metrics.totalMissingMappings = Number(missingMappingsCount?.count || 0);
        console.log('Missing mappings count fetched:', metrics.totalMissingMappings);
      } catch (err) {
        console.error('Error fetching missing mappings count:', err);
      }
      
      try {
        const [mappings] = await db
          .select({ count: sql`count(*)` })
          .from(crosswalkMappings);
        metrics.activeMappings = Number(mappings?.count || 0);
        console.log('Active mappings count fetched:', metrics.activeMappings);
      } catch (err) {
        console.error('Error fetching active mappings count:', err);
      }
      
      try {
        const [changes] = await db
          .select({ count: sql`count(*)` })
          .from(referenceDataSets)
          .where(
            sql`created_at > NOW() - INTERVAL '24 hours'`
          );
        metrics.recentChanges = Number(changes?.count || 0);
        console.log('Recent changes count fetched:', metrics.recentChanges);
      } catch (err) {
        console.error('Error fetching recent changes count:', err);
      }
      
      try {
        const [activeUsers] = await db
          .select({ count: sql`count(*)` })
          .from(users)
          .where(eq(users.isActive, true));
        metrics.activeUsers = Number(activeUsers?.count || 0);
        console.log('Active users count fetched:', metrics.activeUsers);
      } catch (err) {
        console.error('Error fetching active users count:', err);
      }

      console.log('GET /api/metrics - Metrics fetched successfully:', metrics);
      res.json(metrics);
    } catch (error) {
      console.error('GET /api/metrics - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/recent-activity", async (req, res) => {
    console.log('GET /api/recent-activity - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/recent-activity - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const activity = await storage.getRecentActivity();
      console.log('GET /api/recent-activity - Activity fetched successfully');
      res.json(activity);
    } catch (error) {
      console.error('GET /api/recent-activity - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Debug endpoint to get raw crosswalk data
  app.get('/api/crosswalks/debug', async (req, res) => {
    try {
      console.log('GET /api/crosswalks/debug - Request received');
      if (!req.isAuthenticated()) {
        console.log('GET /api/crosswalks/debug - Unauthorized access');
        return res.sendStatus(401);
      }

      // Get all crosswalks with their raw data
      const crosswalks = await storage.getAllCrosswalkMappings();

      // Add more detailed logging for debugging
      console.log('GET /api/crosswalks/debug - Raw data fetched successfully, count:', crosswalks.length);
      if (crosswalks.length > 0) {
        console.log('GET /api/crosswalks/debug - First record sample:', JSON.stringify(crosswalks[0]));

        // Add a specific mapping data example for debugging
        if (crosswalks[0].mappingData) {
          console.log('GET /api/crosswalks/debug - First record mapping data:',
            JSON.stringify(crosswalks[0].mappingData));
        }
      } else {
        console.log('GET /api/crosswalks/debug - No records found');
      }

      return res.json(crosswalks || []);
    } catch (error) {
      console.error('GET /api/crosswalks/debug - Error:', error);
      return res.status(500).json({ error: String(error) });
    }
  });


  // System status endpoint
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      graphDbAvailable: isNeo4jAvailable(),
    });
  });

  // Graph database info endpoint
  app.get('/api/graph-status', (req, res) => {
    res.json({
      available: GraphDataService.isAvailable(),
      services: {
        referenceData: true,
        relationships: true,
        crosswalks: true
      }
    });
  });

  // Add the graph visualization endpoint
  app.get('/api/graph/visualization', async (req, res) => {
    try {
      console.log("GET /api/graph/visualization - Checking if Neo4j is available");

      if (!isNeo4jAvailable()) {
        console.log("GET /api/graph/visualization - Neo4j not available");
        console.log("NEO4J_URI:", process.env.NEO4J_URI ? "Found" : "Not found");
        console.log("NEO4J_USERNAME:", process.env.NEO4J_USERNAME ? "Found" : "Not found");
        console.log("NEO4J_PASSWORD:", process.env.NEO4J_PASSWORD ? "Found (but redacted)" : "Not found");
        return res.status(503).json({
          error: "Neo4j database not available",
          reason: "Neo4j connection has not been established. Check server logs for details."
        });
      }

      // Create Neo4j driver instance
      const driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
      );

      const session = driver.session();

      try {
        // Enhanced query to get nodes and their relationships
        const result = await session.run(`
          MATCH (n)
          OPTIONAL MATCH (n)-[r]->(m)
          WITH n, r, m
          WHERE n:DataSet OR n:DataItem OR n:RelationshipType OR EXISTS((n)-[:CONTAINS]->()) OR EXISTS(()-[:CONTAINS]->(n))
          RETURN n, r, m
        `);

        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        const nodeColors = {
          DataSet: '#4285F4',
          DataItem: '#34A853',
          RelationshipType: '#FBBC05',
          CrosswalkMapping: '#EA4335'
        };

        // Process nodes and relationships
        result.records.forEach(record => {
          const source = record.get('n');
          const relationship = record.get('r');
          const target = record.get('m');

          if (source && !nodeMap.has(source.identity.toString())) {
            const properties = { ...source.properties };
            // For DataItems, ensure we set a display name from the available properties
            if (source.labels.includes('DataItem')) {
              // Try to find a suitable name property from the data
              const nameProperties = Object.entries(properties).find(([key, value]) =>
                key.toLowerCase().includes('name') ||
                key.toLowerCase().includes('title') ||
                key.toLowerCase().includes('site')
              );
              if (nameProperties) {
                properties.name = nameProperties[1];
              }
            }

            nodeMap.set(source.identity.toString(), nodes.length);
            nodes.push({
              id: source.identity.toString(),
              label: source.labels[0],
              properties: properties,
              color: nodeColors[source.labels[0]] || '#4285F4',
              val: source.labels[0] === 'DataSet' ? 15 : 10
            });
          }

          if (target && !nodeMap.has(target.identity.toString())) {
            const properties = { ...target.properties };
            if (target.labels.includes('DataItem')) {
              const nameProperties = Object.entries(properties).find(([key, value]) =>
                key.toLowerCase().includes('name') ||
                key.toLowerCase().includes('title') ||
                key.toLowerCase().includes('site')
              );
              if (nameProperties) {
                properties.name = nameProperties[1];
              }
            }

            nodeMap.set(target.identity.toString(), nodes.length);
            nodes.push({
              id: target.identity.toString(),
              label: target.labels[0],
              properties: properties,
              color: nodeColors[target.labels[0]] || '#4285F4',              val: target.labels[0] === 'DataSet' ? 15 : 10
            });
          }

          if (relationship) {
            links.push({
              source: nodeMap.get(source.identity.toString()),
              target: nodeMap.get(target.identity.toString()),
              type: relationship.type,
              properties: relationship.properties
            });
          }
        });

        console.log("GET /api/graph/visualization - Processed nodes:", nodes.length);
        console.log("GET /api/graph/visualization - Processed links:", links.length);

        res.json({ nodes, links });
      } finally {
        await session.close();
        await driver.close();
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add this route after the existing graph routes
  app.get("/api/graph/dataset/:id", async (req, res) => {
    console.log('GET /api/graph/dataset/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/graph/dataset/:id - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const dataSetId = Number(req.params.id);

      // Get the dataset name from storage
      const dataSet = await storage.getReferenceDataSet(dataSetId);
      if (!dataSet) {
        return res.status(404).json({ error: "Dataset not found" });
      }

      // Query Neo4j for nodes and relationships
      if (GraphDataService.isAvailable()) {
        // First sync the dataset if needed
        await GraphDataService.syncReferenceDataSet(dataSetId);

        // Get statistics about nodes and relationships
        const stats = await GraphDataService.getDatasetGraphStats(dataSetId);
        res.json(stats);
      } else {
        res.status(503).json({ error: "Neo4j is not available" });
      }
    } catch (error) {
      console.error('GET /api/graph/dataset/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add after the existing /api/graph/dataset/:id route
  app.get("/api/graph/dataset/:id/visualization", async (req, res) => {
    console.log('GET /api/graph/dataset/:id/visualization - Request received');
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const dataSetId = Number(req.params.id);
      const dataSet = await storage.getReferenceDataSet(dataSetId);

      if (!dataSet) {
        return res.status(404).json({ error: "Dataset not found" });
      }

      if (!GraphDataService.isAvailable()) {
        return res.status(503).json({ error: "Neo4j is not available" });
      }

      // First sync the dataset to ensure data is present
      await GraphDataService.syncReferenceDataSet(dataSetId);

      // Query Neo4j for graph data - get all connected nodes and relationships
      const session = GraphDataService.getSession();
      try {
        const result = await session.run(`
            MATCH (item:DataItem {dataSetId: $dataSetId})
            OPTIONAL MATCH (item)-[r]->(target:DataItem)
            RETURN 
              collect(DISTINCT item) as items,
              collect(DISTINCT target) as relatedItems,
              collect(DISTINCT r) as rels
            `, { dataSetId: dataSetId.toString() });

        const record = result.records[0];
        const nodes = new Set();
        const links = [];

        // Process main dataset items
        const items = record.get('items');
        items.forEach(item => {
          nodes.add(JSON.stringify({
            id: item.properties.id,
            label: item.properties.name,
            type: 'DataItem'
          }));
        });

        // Process related items from other datasets
        const relatedItems = record.get('relatedItems');
        relatedItems.forEach(item => {
          if (item) {
            nodes.add(JSON.stringify({
              id: item.properties.id,
              label: item.properties.name,
              type: 'DataItem'
            }));
          }
        });

        // Process relationships
        const relationships = record.get('rels');
        relationships.forEach(rel => {
          if (rel) {
            links.push({
              source: rel.startNode.properties.id,
              target: rel.endNode.properties.id,
              type: rel.type,
              label: rel.properties.label
            });
          }
        });

        // Convert nodes Set back to array
        const nodesArray = Array.from(nodes).map(node => JSON.parse(node));

        res.json({
          nodes: nodesArray,
          links
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error('GET /api/graph/dataset/:id/visualization - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add this route after the existing graph routes
  app.get("/api/graph/product-paths", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      if (!isNeo4jAvailable()) {
        return res.status(503).json({ error: "Neo4j is not available" });
      }

      const { productId, source, target } = req.query;
      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      const paths = await GraphDataService.findProductShippingPaths(
        productId as string,
        source as string | undefined,
        target as string | undefined
      );

      res.json(paths);
    } catch (error) {
      console.error('Error finding product paths:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add after existing graph routes
  app.get("/api/graph/debug", async (req, res) => {
    console.log('GET /api/graph/debug - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/graph/debug - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      if (!isNeo4jAvailable()) {
        throw new Error("Neo4j is not available");
      }

      const debugInfo = await GraphDataService.debugRelationships();
      console.log('GET /api/graph/debug - Debug info retrieved successfully');
      res.json(debugInfo);
    } catch (error) {
      console.error('GET /api/graph/debug - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add new graph-related routes
  app.get("/api/graph/sites", async (req, res) => {
    console.log('GET /api/graph/sites - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/graph/sites - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const sites = await GraphDataService.getAllSites();
      console.log('GET /api/graph/sites - Sites fetched successfully');
      res.json(sites);
    } catch (error) {
      console.error('GET /api/graph/sites - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/graph/products", async (req, res) => {
    console.log('GET /api/graph/products - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/graph/products - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const products = await GraphDataService.getUniqueProducts();
      console.log('GET /apiapi/graph/products - Products fetched successfully');
      res.json(products);
    } catch (error) {
      console.error('GET /apiapi/graph/products - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/graph/paths", async (req, res) => {
    console.log('GET /api/graph/paths - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/graph/paths- Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const { product, source, target } = req.query;
      if (!product) {
        return res.status(400).json({ error: "Product ID is required" });
      }
      const paths = await GraphDataService.findProductShippingPaths(
        product as string,
        source as string,
        target as string
      );
      console.log('GET /api/graph/paths - Paths fetched successfully');
      res.json(paths);
    } catch (error) {
      console.error('GET /api/graph/paths - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add the new route before the last line (return httpServer)
  app.get("/api/graph/full", async (req, res) => {
    console.log('GET /api/graph/full - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/graph/full - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const graphData = await GraphDataService.getFullSupplyChainGraph();
      console.log('GET /api/graph/full - Graph data fetched successfully');
      res.json(graphData);
    } catch (error) {
      console.error('GET /api/graph/full - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  // Add new endpoint for pending approvals
  app.get("/api/approvals/pending", async (req, res) => {
    console.log('GET /api/approvals/pending - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/approvals/pending - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      // Get all reference data sets
      const dataSets = await storage.getAllReferenceDataSets();
      const pendingApprovals = [];

      // Iterate through each dataset
      for (const dataSet of dataSets) {
        const instances = dataSet.data;

        // Skip if no data
        if (!instances) continue;

        // Iterate through each instance in the dataset
        for (const [instanceId, instanceData] of Object.entries(instances)) {
          // Check if instance has PENDING_APPROVAL status
          if (instanceData.status === "PENDING_APPROVAL") {
            // Get the primary field value as instance name
            // For example, if it's a State dataset, use the "State" field
            const schemas = await storage.getReferenceDataTypeSchemas(dataSet.typeId);
            const primaryField = schemas[0]?.name; // Use first schema field as primary
            const instanceName = primaryField ? instanceData[primaryField] : instanceId;

            pendingApprovals.push({
              dataSetId: dataSet.id,
              dataSetName: dataSet.name,
              instanceId,
              instanceName, // Add instance name to response
              data: instanceData,
              history: instanceData._history || []
            });
          }
        }
      }

      console.log('GET /api/approvals/pending - Found pending approvals:', pendingApprovals.length);
      res.json(pendingApprovals);
    } catch (error) {
      console.error('GET /api/approvals/pending - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add after existing relationship value routes
  
  // Crosswalk Mapping Approval Endpoints
  app.get("/api/approvals/crosswalk-mappings/pending", async (req, res) => {
    console.log('GET /api/approvals/crosswalk-mappings/pending - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/approvals/crosswalk-mappings/pending - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      // Get pending crosswalk mappings
      const pendingMappings = await storage.getPendingCrosswalkMappings();
      console.log('Pending mappings count:', pendingMappings.length);
      
      // Force-log the entire mappings for debugging
      console.log('Pending mappings data:', JSON.stringify(pendingMappings));
      
      // Enhance with source and target system names
      const enhancedMappings = await Promise.all(
        pendingMappings.map(async (mapping) => {
          const sourceSystem = await storage.getReferenceDataSet(mapping.sourceSystemId);
          const targetSystem = await storage.getReferenceDataSet(mapping.targetSystemId);
          
          return {
            ...mapping,
            sourceSystemName: sourceSystem?.name || 'Unknown System',
            targetSystemName: targetSystem?.name || 'Unknown System'
          };
        })
      );
      
      console.log('GET /api/approvals/crosswalk-mappings/pending - Mappings fetched successfully:', enhancedMappings.length);
      console.log('Enhanced mapping results:', JSON.stringify(enhancedMappings.map(m => ({
        id: m.id,
        name: m.name,
        sourceSystem: m.sourceSystemName,
        targetSystem: m.targetSystemName,
        mappingCount: m.mappingData?.mappings?.length || 0,
        pendingCount: m.mappingData?.mappings?.filter(item => item.status === "PENDING").length || 0
      }))));
      
      res.json(enhancedMappings);
    } catch (error) {
      console.error('GET /api/approvals/crosswalk-mappings/pending - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/crosswalks/:id/approve", async (req, res) => {
    console.log('POST /api/crosswalks/:id/approve - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/crosswalks/:id/approve - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const mappingId = parseInt(req.params.id);
      const userId = req.user.id;
      const comment = req.body.comment;

      const mapping = await storage.approveCrosswalkMapping(mappingId, userId, comment);
      
      // Log and dispatch event for UI refresh
      console.log('POST /api/crosswalks/:id/approve - Mapping approved successfully');
      
      // Broadcast approval event to update UI components
      res.app.emit('crosswalkMappingApproved', {
        crosswalkMappingId: mappingId,
        actionType: 'approve',
        userId
      });
      
      res.json(mapping);
    } catch (error) {
      console.error('POST /api/crosswalks/:id/approve - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/crosswalks/:id/reject", async (req, res) => {
    console.log('POST /api/crosswalks/:id/reject - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/crosswalks/:id/reject - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const mappingId = parseInt(req.params.id);
      const userId = req.user.id;
      const comment = req.body.comment;

      const mapping = await storage.rejectCrosswalkMapping(mappingId, userId, comment);
      
      // Log and dispatch event for UI refresh
      console.log('POST /api/crosswalks/:id/reject - Mapping rejected successfully');
      
      // Broadcast rejection event to update UI components
      res.app.emit('crosswalkMappingRejected', {
        crosswalkMappingId: mappingId,
        actionType: 'reject',
        userId
      });
      
      res.json(mapping);
    } catch (error) {
      console.error('POST /api/crosswalks/:id/reject - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  app.post("/api/crosswalks/:id/submit", async (req, res) => {
    console.log('POST /api/crosswalks/:id/submit - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/crosswalks/:id/submit - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const mappingId = parseInt(req.params.id);
      const userId = req.user.id;
      const comment = req.body.comment || "Submitted for approval";

      // Get the current mapping first to update the JSON mappingData
      const currentMapping = await storage.getCrosswalkMapping(mappingId);
      if (!currentMapping) {
        return res.status(404).json({ error: `Crosswalk mapping with ID ${mappingId} not found` });
      }

      // Check if we need to update the mappingData
      if (currentMapping.mappingData && currentMapping.mappingData.mappings) {
        // Update the status for each mapping in the JSON
        const updatedMappingData = {
          ...currentMapping.mappingData,
          mappings: currentMapping.mappingData.mappings.map((mapping) => ({
            ...mapping,
            status: "PENDING"  // Update status to PENDING
          }))
        };

        // Update the mappingData in the database
        await storage.updateCrosswalkMapping(mappingId, {
          mappingData: updatedMappingData
        });
      }

      // Submit the mapping for approval (updates the overall status)
      console.log(`Submitting crosswalk mapping ${mappingId} for approval. User: ${userId}`);
      const mapping = await storage.submitCrosswalkMappingForApproval(mappingId, userId, comment);
      
      // Log and dispatch event for UI refresh
      console.log('POST /api/crosswalks/:id/submit - Mapping submitted successfully');
      
      // Broadcast submission event to update UI components
      res.app.emit('crosswalkMappingSubmitted', {
        crosswalkMappingId: mappingId,
        actionType: 'submit',
        userId
      });
      
      // Invalidate the approvals dashboard cache
      res.app.emit('approvalsUpdated', {
        type: 'crosswalk',
        action: 'submit',
        ids: [mappingId]
      });
      
      res.json(mapping);
    } catch (error) {
      console.error('POST /api/crosswalks/:id/submit - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  app.post("/api/crosswalks/bulk-submit", async (req, res) => {
    console.log('POST /api/crosswalks/bulk-submit - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/crosswalks/bulk-submit - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const { ids, comment } = req.body;
      const userId = req.user.id;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No valid crosswalk mapping IDs provided" });
      }

      // First update each mapping's JSON data to set status on individual mappings
      for (const mappingId of ids) {
        // Get the current mapping
        const currentMapping = await storage.getCrosswalkMapping(mappingId);
        if (!currentMapping) {
          console.log(`Mapping ID ${mappingId} not found, skipping`);
          continue;
        }

        // Update the mappingData JSON
        if (currentMapping.mappingData && currentMapping.mappingData.mappings) {
          const updatedMappingData = {
            ...currentMapping.mappingData,
            mappings: currentMapping.mappingData.mappings.map((mapping) => ({
              ...mapping,
              status: "PENDING"  // Update status to PENDING
            }))
          };

          // Update the mappingData in the database
          await storage.updateCrosswalkMapping(mappingId, {
            mappingData: updatedMappingData
          });
        }
      }

      // Now call the bulk submission function to update the approval status
      const mappings = await storage.bulkSubmitCrosswalkMappingsForApproval(ids, userId, comment);
      
      // Log and dispatch event for UI refresh
      console.log(`POST /api/crosswalks/bulk-submit - ${mappings.length} mappings submitted successfully`);
      
      // Broadcast bulk submission event to update UI components
      res.app.emit('crosswalkMappingBulkSubmitted', {
        crosswalkMappingIds: ids,
        actionType: 'bulk-submit',
        userId
      });
      
      // Invalidate the approvals dashboard cache for bulk submissions
      res.app.emit('approvalsUpdated', {
        type: 'crosswalk',
        action: 'bulk-submit',
        ids: ids
      });
      
      res.json(mappings);
    } catch (error) {
      console.error('POST /api/crosswalks/bulk-submit - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add bulk approval endpoint for crosswalk mappings
  app.post("/api/approvals/crosswalk-mappings/bulk-approve", async (req, res) => {
    console.log('POST /api/approvals/crosswalk-mappings/bulk-approve - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/approvals/crosswalk-mappings/bulk-approve - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const { ids, comment } = req.body;
      const userId = req.user.id;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        console.log('POST /api/approvals/crosswalk-mappings/bulk-approve - Invalid request, no IDs provided');
        return res.status(400).json({ error: "No IDs provided for bulk approval" });
      }

      const results = await storage.bulkApproveCrosswalkMappings(ids, userId, comment);
      const successCount = results.length;
      
      console.log(`POST /api/approvals/crosswalk-mappings/bulk-approve - Successfully approved ${successCount}/${ids.length} mappings`);
      
      // Broadcast bulk approval event to update UI components
      res.app.emit('crosswalkMappingBulkApproved', {
        crosswalkMappingIds: ids,
        actionType: 'approve',
        userId: userId
      });
      
      res.json({ 
        success: true, 
        message: `Successfully approved ${successCount}/${ids.length} mappings`,
        results
      });
    } catch (error) {
      console.error('POST /api/approvals/crosswalk-mappings/bulk-approve - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  app.post("/api/approvals/crosswalk-mappings/bulk-reject", async (req, res) => {
    console.log('POST /api/approvals/crosswalk-mappings/bulk-reject - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/approvals/crosswalk-mappings/bulk-reject - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const { ids, comment } = req.body;
      const userId = req.user.id;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        console.log('POST /api/approvals/crosswalk-mappings/bulk-reject - Invalid request, no IDs provided');
        return res.status(400).json({ error: "No IDs provided for bulk rejection" });
      }

      const results = await storage.bulkRejectCrosswalkMappings(ids, userId, comment);
      const successCount = results.length;
      
      console.log(`POST /api/approvals/crosswalk-mappings/bulk-reject - Successfully rejected ${successCount}/${ids.length} mappings`);
      
      // Broadcast bulk rejection event to update UI components
      res.app.emit('crosswalkMappingBulkRejected', {
        crosswalkMappingIds: ids,
        actionType: 'reject',
        userId: userId
      });
      
      res.json({ 
        success: true, 
        message: `Successfully rejected ${successCount}/${ids.length} mappings`,
        results
      });
    } catch (error) {
      console.error('POST /api/approvals/crosswalk-mappings/bulk-reject - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  app.delete("/api/relationships/:id/values", async (req, res) => {
    console.log('DELETE /api/relationships/:id/values - Request received');
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/relationships/:id/values - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const relationshipId = Number(req.params.id);

      // Verify relationship exists
      const relationship = await storage.getRelationship(relationshipId);
      if (!relationship) {
        console.log(`DELETE /api/relationships/:id/values - Relationship ${relationshipId} not found`);
        return res.status(404).json({ error: "Relationship not found" });
      }

      let deletedCount = 0;

      // Use SQL transaction to ensure data consistency
      await db.transaction(async (tx) => {
        // First count how many records we'll delete for reporting
        const countResult = await tx.execute(sql`
          SELECT COUNT(*) as count FROM relationship_values 
          WHERE relationship_id = ${relationshipId}
        `);
        deletedCount = countResult.rows[0]?.count || 0;

        // Delete all attribute values for this relationship's values
        await tx.execute(sql`
          DELETE FROM relationship_attribute_values 
          WHERE relationship_value_id IN (
            SELECT id FROM relationship_values 
            WHERE relationship_id = ${relationshipId}
          )
        `);

        // Then delete all relationship values
        await tx.execute(sql`
          DELETE FROM relationship_values 
          WHERE relationship_id = ${relationshipId}
        `);
      });

      // Sync with Neo4j if available
      if (GraphDataService.isAvailable()) {
        try {
          await GraphDataService.syncRelationship(relationshipId);
        } catch (graphError) {
          console.error('Error syncing relationship to graph database after deletion:', graphError);
          // Continue with the response even if graph sync fails
        }
      }

      console.log(`DELETE /api/relationships/:id/values - ${deletedCount} values deleted successfully`);
      res.status(200).json({ message: `${deletedCount} relationship values deleted successfully` });
    } catch (error) {
      console.error('DELETE /api/relationships/:id/values - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add after existing approval routes
  app.get("/api/approvals/relationship-values/pending", async (req, res) => {
    console.log('GET /api/approvals/relationship-values/pending - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/approvals/relationship-values/pending - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      // Get all relationship values with PENDING status
      const pendingValues = await db
        .select({
          id: relationshipValues.id,
          relationshipId: relationshipValues.relationshipId,
          sourceInstanceId: relationshipValues.sourceInstanceId,
          targetInstanceId: relationshipValues.targetInstanceId,
          approvalStatus: relationshipValues.approvalStatus,
          history: relationshipValues.changeHistory,
        })
        .from(relationshipValues)
        .where(eq(relationshipValues.approvalStatus, "PENDING"));

      // Enhance with relationship and dataset information
      const enhancedValues = [];
      for (const value of pendingValues) {
        try {
          const relationship = await storage.getRelationship(value.relationshipId);
          if (!relationship) {
            console.log(`Relationship not found for id: ${value.relationshipId}`);
            continue;
          }

          const sourceDataSet = await storage.getReferenceDataSet(relationship.sourceDataSetId);
          const targetDataSet = await storage.getReferenceDataSet(relationship.targetDataSetId);

          if (!sourceDataSet || !targetDataSet) {
            console.log(`Missing dataset for relationship: ${value.relationshipId}`);
            continue;
          }

          enhancedValues.push({
            ...value,
            relationshipName: relationship.name,
            sourceDataSet: {
              id: sourceDataSet.id,
              name: sourceDataSet.name,
              data: sourceDataSet.data
            },
            targetDataSet: {
              id: targetDataSet.id,
              name: targetDataSet.name,
              data: targetDataSet.data
            }
          });
        } catch (enhanceError) {
          console.error('Error enhancing relationship value:', enhanceError);
          // Skip this item but continue processing others
          continue;
        }
      }

      console.log('GET /api/approvals/relationship-values/pending - Values fetched successfully:', enhancedValues.length);
      res.json(enhancedValues);
    } catch (error) {
      console.error('GET /api/approvals/relationship-values/pending - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/relationships/:id/values/:valueId/submit", async (req, res) => {
    console.log('POST /api/relationships/:id/values/:valueId/submit - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/relationships/:id/values/:valueId/submit - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const relationshipId = Number(req.params.id);
      const valueId = Number(req.params.valueId);
      const userId = req.user.id;

      const value = await storage.submitRelationshipValueForApproval(valueId, userId);
      console.log('POST /api/relationships/:id/values/:valueId/submit - Value submitted successfully');
      res.json(value);
    } catch (error) {
      console.error('POST /api/relationships/:id/values/:valueId/submit - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/relationships/:id/values/:valueId/approve", async (req, res) => {
    console.log('POST /api/relationships/:id/values/:valueId/approve - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/relationships/:id/values/:valueId/approve - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const relationshipId = Number(req.params.id);
      const valueId = Number(req.params.valueId);
      const userId = req.user.id;
      const comment = req.body.comment;

      const value = await storage.approveRelationshipValue(valueId, userId, comment);
      console.log('POST /api/relationships/:id/values/:valueId/approve - Value approved successfully');
      res.json(value);
    } catch (error) {
      console.error('POST /api/relationships/:id/values/:valueId/approve - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/relationships/:id/values/:valueId/reject", async (req, res) => {
    console.log('POST /api/relationships/:id/values/:valueId/reject - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/relationships/:id/values/:valueId/reject - Unauthorized access');
      return res.sendStatus(401);
    }
    try {
      const relationshipId = Number(req.params.id);
      const valueId = Number(req.params.valueId);
      const userId = req.user.id;
      const comment = req.body.comment;

      const value = await storage.rejectRelationshipValue(valueId, userId, comment);
      console.log('POST /api/relationships/:id/values/:valueId/reject - Value rejected successfully');
      res.json(value);
    } catch (error) {
      console.error('POST /api/relationships/:id/values/:valueId/reject - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Add after existing approval routes
  app.get("/api/approvals/relationship-values/pending", async (req, res) => {
    console.log('GET /api/approvals/relationship-values/pending - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/approvals/relationship-values/pending - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      // Get all relationship values with PENDING status
      const pendingValues = await db
        .select({
          id: relationshipValues.id,
          relationshipId: relationshipValues.relationshipId,
          sourceInstanceId: relationshipValues.sourceInstanceId,
          targetInstanceId: relationshipValues.targetInstanceId,
          approvalStatus: relationshipValues.approvalStatus,
          history: relationshipValues.changeHistory,
        })
        .from(relationshipValues)
        .where(eq(relationshipValues.approvalStatus, "PENDING"));

      // Enhance with relationship and dataset information
      const enhancedValues = [];
      for (const value of pendingValues) {
        try {
          const relationship = await storage.getRelationship(value.relationshipId);
          if (!relationship) {
            console.log(`Relationship not found for id: ${value.relationshipId}`);
            continue;
          }

          const sourceDataSet = await storage.getReferenceDataSet(relationship.sourceDataSetId);
          const targetDataSet = await storage.getReferenceDataSet(relationship.targetDataSetId);

          if (!sourceDataSet || !targetDataSet) {
            console.log(`Missing dataset for relationship: ${value.relationshipId}`);
            continue;
          }

          enhancedValues.push({
            ...value,
            relationshipName: relationship.name,
            sourceDataSet: {
              id: sourceDataSet.id,
              name: sourceDataSet.name,
              data: sourceDataSet.data
            },
            targetDataSet: {
              id: targetDataSet.id,
              name: targetDataSet.name,
              data: targetDataSet.data
            }
          });
        } catch (enhanceError) {
          console.error('Error enhancing relationship value:', enhanceError);
          // Skip this item but continue processing others
          continue;
        }
      }

      console.log('GET /api/approvals/relationship-values/pending - Values fetched successfully:', enhancedValues.length);
      res.json(enhancedValues);
    } catch (error) {
      console.error('GET /api/approvals/relationship-values/pending - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // External API routes with API key authentication
  console.log('Setting up API-key authenticated external routes');
  app.use('/api/external', apiKeyAuth, externalRoutes);

  // API Keys management routes (authenticated users only)
  // Add compatibility routes for the "-keys" endpoint that client is using
  app.get('/api/-keys', async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('GET /api/-keys - Unauthorized access');
      return res.sendStatus(401);
    }
    console.log('GET /api/-keys - Request received');
    try {
      const apiKeys = await storage.getAllApiKeys();
      
      // Only admins can see all API keys
      const isAdmin = req.user.roleId === 1;
      
      // Filter keys if user is not admin to only show their own
      const filteredKeys = isAdmin 
        ? apiKeys 
        : apiKeys.filter(key => key.createdBy === req.user.id);
      
      // Don't send the actual key value for security
      const safeKeys = filteredKeys.map(key => {
        // Create a copy without the key field
        const { key: _, ...safeKey } = key;
        return safeKey;
      });
      
      console.log('GET /api/-keys - Keys fetched successfully:', safeKeys.length);
      res.json(safeKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  });
  
  // Add POST endpoint for the "-keys" endpoint for creating keys
  app.post('/api/-keys', async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('POST /api/-keys - Unauthorized access');
      return res.sendStatus(401);
    }
    console.log('POST /api/-keys - Request received');
    try {
      // Generate a secure random key
      const apiKeyValue = randomBytes(32).toString('hex');
      
      // Extract only the fields we need from req.body to avoid date issues
      const { name, description, expiresAt } = req.body;
      
      // Create a proper Date object or undefined if expiresAt is provided
      let expiry = undefined;
      if (expiresAt) {
        expiry = new Date(expiresAt);
      }
      
      // Create the API key in the database
      const apiKey = await storage.createApiKey({
        name,
        description,
        key: apiKeyValue,
        createdBy: req.user.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: expiry
      });
      
      console.log('POST /api/-keys - API key created successfully');
      
      // Only return the actual key value once during creation
      res.status(201).json({
        ...apiKey,
        key: apiKeyValue // Include the actual key only in the creation response
      });
    } catch (error) {
      console.error('POST /api/-keys - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  app.patch('/api/-keys/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('PATCH /api/-keys/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    console.log('PATCH /api/-keys/:id - Request received');
    const keyId = Number(req.params.id);
    const isAdmin = req.user.roleId === 1;
    
    try {
      // First get the key to check ownership
      const existingKey = await storage.getApiKey(keyId);
      
      if (!existingKey) {
        console.log('PATCH /api/-keys/:id - Key not found');
        return res.status(404).json({ error: 'API key not found' });
      }
      
      // Only the key creator or admin can update it
      if (!isAdmin && existingKey.createdBy !== req.user.id) {
        console.log('PATCH /api/-keys/:id - Unauthorized: User does not own this key');
        return res.status(403).json({ error: 'You do not have permission to update this API key' });
      }
      
      // Update the key
      const updatedKey = await storage.updateApiKey(keyId, {
        ...req.body,
        updatedAt: new Date()
      });
      
      if (!updatedKey) {
        console.log('PATCH /api/-keys/:id - Update failed');
        return res.status(500).json({ error: 'Failed to update API key' });
      }
      
      console.log('PATCH /api/-keys/:id - Key updated successfully');
      
      // Don't return the actual key value in the response
      const { key: _, ...safeKey } = updatedKey;
      res.json(safeKey);
    } catch (error) {
      console.error('PATCH /api/-keys/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  app.delete('/api/-keys/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/-keys/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    console.log('DELETE /api/-keys/:id - Request received');
    const keyId = Number(req.params.id);
    const isAdmin = req.user.roleId === 1;
    
    try {
      // First get the key to check ownership
      const existingKey = await storage.getApiKey(keyId);
      
      if (!existingKey) {
        console.log('DELETE /api/-keys/:id - Key not found');
        return res.status(404).json({ error: 'API key not found' });
      }
      
      // Only the key creator or admin can delete it
      if (!isAdmin && existingKey.createdBy !== req.user.id) {
        console.log('DELETE /api/-keys/:id - Unauthorized: User does not own this key');
        return res.status(403).json({ error: 'You do not have permission to delete this API key' });
      }
      
      // Delete the key
      const success = await storage.deleteApiKey(keyId);
      
      if (success) {
        console.log('DELETE /api/-keys/:id - Key deleted successfully');
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/-keys/:id - Deletion failed');
        res.status(500).json({ error: 'Failed to delete API key' });
      }
    } catch (error) {
      console.error('DELETE /api/-keys/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  app.post('/api/-keys/:id/view', async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('POST /api/-keys/:id/view - Unauthorized access');
      return res.sendStatus(401);
    }
    console.log('POST /api/-keys/:id/view - Request received');
    const keyId = Number(req.params.id);
    const isAdmin = req.user.roleId === 1;
    const { password } = req.body;
    
    if (!password) {
      console.log('POST /api/-keys/:id/view - No password provided');
      return res.status(400).json({ error: 'Password is required to view API key' });
    }
    
    try {
      // First get the key to check ownership
      const existingKey = await storage.getApiKey(keyId);
      
      if (!existingKey) {
        console.log('POST /api/-keys/:id/view - Key not found');
        return res.status(404).json({ error: 'API key not found' });
      }
      
      // Only the key creator or admin can view it
      if (!isAdmin && existingKey.createdBy !== req.user.id) {
        console.log('POST /api/-keys/:id/view - Unauthorized: User does not own this key');
        return res.status(403).json({ error: 'You do not have permission to view this API key' });
      }
      
      // Verify password
      const user = await storage.getUser(req.user.id);
      
      if (!user || !user.password) {
        console.log('POST /api/-keys/:id/view - User authentication error');
        return res.status(401).json({ error: 'Authentication error' });
      }
      
      const isPasswordValid = await comparePasswords(password, user.password);
      
      if (!isPasswordValid) {
        console.log('POST /api/-keys/:id/view - Invalid password');
        return res.status(401).json({ error: 'Invalid password' });
      }
      
      console.log('POST /api/-keys/:id/view - Password validated, returning key');
      res.json(existingKey);
    } catch (error) {
      console.error('POST /api/-keys/:id/view - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  app.get('/api/api-keys', async (req, res) => {
    console.log('GET /api/api-keys - Request received');
    if (!req.isAuthenticated()) {
      console.log('GET /api/api-keys - Unauthorized access');
      return res.sendStatus(401);
    }
    
    // Only admins can see all API keys
    const isAdmin = req.user.roleId === 1;
    
    try {
      const apiKeys = await storage.getAllApiKeys();
      
      // Filter keys if user is not admin to only show their own
      const filteredKeys = isAdmin 
        ? apiKeys 
        : apiKeys.filter(key => key.createdBy === req.user.id);
      
      // Don't send the actual key value for security
      const safeKeys = filteredKeys.map(key => {
        // Create a copy without the key field
        const { key: _, ...safeKey } = key;
        return safeKey;
      });
      
      console.log('GET /api/api-keys - Keys fetched successfully:', safeKeys.length);
      res.json(safeKeys);
    } catch (error) {
      console.error('GET /api/api-keys - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/api-keys', async (req, res) => {
    console.log('POST /api/api-keys - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/api-keys - Unauthorized access');
      return res.sendStatus(401);
    }
    
    try {
      // Generate a secure random key
      const apiKeyValue = randomBytes(32).toString('hex');
      
      // Create the API key in the database
      const apiKey = await storage.createApiKey({
        ...req.body,
        key: apiKeyValue,
        createdBy: req.user.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('POST /api/api-keys - API key created successfully');
      
      // Only return the actual key value once during creation
      res.status(201).json({
        ...apiKey,
        key: apiKeyValue // Include the actual key only in the creation response
      });
    } catch (error) {
      console.error('POST /api/api-keys - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch('/api/api-keys/:id', async (req, res) => {
    console.log('PATCH /api/api-keys/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('PATCH /api/api-keys/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    
    const keyId = Number(req.params.id);
    const isAdmin = req.user.roleId === 1;
    
    try {
      // First get the key to check ownership
      const existingKey = await storage.getApiKey(keyId);
      
      if (!existingKey) {
        console.log('PATCH /api/api-keys/:id - Key not found');
        return res.status(404).json({ error: 'API key not found' });
      }
      
      // Only the key creator or admin can update it
      if (!isAdmin && existingKey.createdBy !== req.user.id) {
        console.log('PATCH /api/api-keys/:id - Unauthorized: User does not own this key');
        return res.status(403).json({ error: 'You do not have permission to update this API key' });
      }
      
      // Update the key
      const updatedKey = await storage.updateApiKey(keyId, {
        ...req.body,
        updatedAt: new Date()
      });
      
      if (!updatedKey) {
        console.log('PATCH /api/api-keys/:id - Update failed');
        return res.status(500).json({ error: 'Failed to update API key' });
      }
      
      console.log('PATCH /api/api-keys/:id - Key updated successfully');
      
      // Don't return the actual key value in the response
      const { key: _, ...safeKey } = updatedKey;
      res.json(safeKey);
    } catch (error) {
      console.error('PATCH /api/api-keys/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete('/api/api-keys/:id', async (req, res) => {
    console.log('DELETE /api/api-keys/:id - Request received');
    if (!req.isAuthenticated()) {
      console.log('DELETE /api/api-keys/:id - Unauthorized access');
      return res.sendStatus(401);
    }
    
    const keyId = Number(req.params.id);
    const isAdmin = req.user.roleId === 1;
    
    try {
      // First get the key to check ownership
      const existingKey = await storage.getApiKey(keyId);
      
      if (!existingKey) {
        console.log('DELETE /api/api-keys/:id - Key not found');
        return res.status(404).json({ error: 'API key not found' });
      }
      
      // Only the key creator or admin can delete it
      if (!isAdmin && existingKey.createdBy !== req.user.id) {
        console.log('DELETE /api/api-keys/:id - Unauthorized: User does not own this key');
        return res.status(403).json({ error: 'You do not have permission to delete this API key' });
      }
      
      // Delete the key
      const success = await storage.deleteApiKey(keyId);
      
      if (success) {
        console.log('DELETE /api/api-keys/:id - Key deleted successfully');
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/api-keys/:id - Deletion failed');
        res.status(500).json({ error: 'Failed to delete API key' });
      }
    } catch (error) {
      console.error('DELETE /api/api-keys/:id - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Return a single API key with its value (requires verification)
  app.post('/api/api-keys/:id/view', async (req, res) => {
    console.log('POST /api/api-keys/:id/view - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/api-keys/:id/view - Unauthorized access');
      return res.sendStatus(401);
    }
    
    const keyId = Number(req.params.id);
    const isAdmin = req.user.roleId === 1;
    const { password } = req.body;
    
    if (!password) {
      console.log('POST /api/api-keys/:id/view - No password provided');
      return res.status(400).json({ error: 'Password is required to view API key' });
    }
    
    try {
      // First get the key to check ownership
      const existingKey = await storage.getApiKey(keyId);
      
      if (!existingKey) {
        console.log('POST /api/api-keys/:id/view - Key not found');
        return res.status(404).json({ error: 'API key not found' });
      }
      
      // Only the key creator or admin can view it
      if (!isAdmin && existingKey.createdBy !== req.user.id) {
        console.log('POST /api/api-keys/:id/view - Unauthorized: User does not own this key');
        return res.status(403).json({ error: 'You do not have permission to view this API key' });
      }
      
      // Verify password
      const user = await storage.getUser(req.user.id);
      
      if (!user || !user.password) {
        console.log('POST /api/api-keys/:id/view - User authentication error');
        return res.status(401).json({ error: 'Authentication error' });
      }
      
      const isPasswordValid = await comparePasswords(password, user.password);
      
      if (!isPasswordValid) {
        console.log('POST /api/api-keys/:id/view - Invalid password');
        return res.status(401).json({ error: 'Invalid password' });
      }
      
      console.log('POST /api/api-keys/:id/view - Password validated, returning key');
      res.json(existingKey);
    } catch (error) {
      console.error('POST /api/api-keys/:id/view - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}