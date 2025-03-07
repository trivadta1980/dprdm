import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { parse } from "csv-parse";
import { 
  insertRelationshipSchema, 
  insertCrosswalkMappingSchema,
  insertRelationshipAttributeDefinitionSchema,
  insertRelationshipAttributeValueSchema
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from './db';
import { isNeo4jAvailable } from './neo4j';
import GraphDataService from './services/graphDataService';
import neo4j from 'neo4j-driver';

const scryptAsync = promisify(scrypt);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and user management routes
  setupAuth(app);

  const upload = multer({ storage: multer.memoryStorage() });

  // Admin-only routes for user management
  app.get("/api/users", async (req, res) => {
    console.log('GET /api/users - Request received'); // Added logging
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      console.log('GET /api/users - Unauthorized access'); // Added logging
      return res.sendStatus(403);
    }
    const users = await storage.getAllUsers();
    console.log('GET /api/users - Users fetched successfully'); // Added logging
    res.json(users);
  });

  // Update user route
  app.patch("/api/users/:id", async (req, res) => {
    console.log('PATCH /api/users/:id - Request received for user ID:', req.params.id); // Added logging
    console.log('PATCH /api/users/:id - Update data:', req.body); // Added logging

    if (!req.isAuthenticated()) {
      console.log('PATCH /api/users/:id - User not authenticated'); // Added logging
      return res.sendStatus(401);
    }

    const userId = Number(req.params.id);
    console.log('PATCH /api/users/:id - Authenticated user ID:', req.user.id, 'Role ID:', req.user.roleId); // Added logging

    // Only allow users to update their own profile unless they're an admin
    if (req.user.id !== userId && req.user.roleId !== 1) {
      console.log('PATCH /api/users/:id - Permission denied: User cannot edit this profile'); // Added logging
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
      console.log('PATCH /api/users/:id - Update result:', user); // Added logging
      if (user) {
        res.json(user);
      } else {
        console.log('PATCH /api/users/:id - User not found'); // Added logging
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('PATCH /api/users/:id - Error updating user:', error); // Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  // Delete user route
  app.delete("/api/users/:id", async (req, res) => {
    console.log('DELETE /api/users/:id - Request received for user ID:', req.params.id); // Added logging

    if (!req.isAuthenticated()) {
      console.log('DELETE /api/users/:id - User not authenticated'); // Added logging
      return res.sendStatus(401);
    }

    // Only admin can delete users
    if (req.user.roleId !== 1) {
      console.log('DELETE /api/users/:id - Permission denied: User is not admin'); // Added logging
      return res.sendStatus(403);
    }

    const userId = Number(req.params.id);

    // Prevent deleting the admin user (assuming user with ID 1 is the main admin)
    if (userId === 1) {
      console.log('DELETE /api/users/:id - Cannot delete main admin user'); // Added logging
      return res.status(403).json({ error: "Cannot delete the main admin user" });
    }

    try {
      const success = await storage.deleteUser(userId);

      if (success) {
        console.log('DELETE /api/users/:id - User deleted successfully'); // Added logging
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/users/:id - User not found'); // Added logging
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('DELETE /api/users/:id - Error deleting user:', error); // Added logging
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
      const dataSetId = Number(req.params.id);
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

  // New route to get sample data template
  app.get("/api/reference-data/:id/template", async (req, res) => {
    console.log('GET /api/reference-data/:id/template - Request received'); //Added logging
    if (!req.isAuthenticated()) {
      console.log('GET /api/reference-data/:id/template - Unauthorized access'); //Added logging
      return res.sendStatus(401);
    }
    try {
      const dataSetId = Number(req.params.id);
      const dataSet = await storage.getReferenceDataSet(dataSetId);

      if (!dataSet) {
        console.log('GET /api/reference-data/:id/template - Dataset not found'); //Added logging
        return res.status(404).json({ error: "Reference Data Set not found" });
      }

      // Get schemas to know the structure
      const schemas = await storage.getReferenceDataTypeSchemas(dataSet.typeId);

      // Create CSV content with just headers for the template
      const headers = schemas.map(s => s.name).join(",");

      // Send as CSV file with just the headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${dataSet.name}_template.csv`);
      res.send(headers);
    } catch (error) {
      console.error('GET /api/reference-data/:id/template - Error generating template:', error); //Added logging
      res.status(500).json({ error: String(error) });
    }
  });

  // Update the bulk upload route to handle the data structure correctly
  app.post("/api/reference-data/:id/bulk-upload", upload.single("file"), async (req, res) => {
    console.log('POST /api/reference-data/:id/bulk-upload - Request received');
    if (!req.isAuthenticated()) {
      console.log('POST /api/reference-data/:id/bulk-upload - Unauthorized access');
      return res.sendStatus(401);
    }

    try {
      const dataSetId = Number(req.params.id);
      const file = req.file;

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
              records.push(validRecord);
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

      // Update data set with new instances
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
    console.log('POST /api/relationships - Request received');
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

      const relationship = await storage.createRelationship(result.data);
      console.log('POST /api/relationships - Relationship created successfully');
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
      console.error('POST /api/relationships - Error:', error);
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
      const success = await storage.deleteRelationshipValue(Number(req.params.valueId));
      if (success) {
        console.log('DELETE /api/relationships/:id/values/:valueId - Value deleted successfully');
        res.sendStatus(200);
      } else {
        console.log('DELETE /api/relationships/:id/values/:valueId - Value not found');
        res.sendStatus(404);
      }
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

  // Add after the existing relationship values routes
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
          console.error('CSV parsing error:', error);
          reject(error);
        });

        parser.on('end', () => {
          resolve();
        });

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
              value: String(record[columnName])
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

      const mapping = await storage.createCrosswalkMapping(result.data);
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
      const mapping = await storage.updateCrosswalkMapping(
        Number(req.params.id),
        req.body
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
      const metrics = await storage.getDashboardMetrics();
      console.log('GET /api/metrics - Metrics fetched successfully');
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
              color: nodeColors[target.labels[0]] || '#4285F4',
              val: target.labels[0] === 'DataSet' ? 15 : 10
            });
          }

          if (relationship) {
            links.push({
              source: source.identity.toString(),
              target: target.identity.toString(),
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

  // Helper function to assign colors based on node type
  //This function is no longer needed as node colors are handled in the visualization endpoint.
  // function getNodeColor(label) {
  //   const colorMap = {
  //     'DataSet': '#4285F4',       // Blue
  //     'DataItem': '#34A853',      // Green
  //     'RelationshipType': '#FBBC05', // Yellow/Orange
  //     'CrosswalkMapping': '#EA4335' // Red
  //   };
  //   return colorMap[label] || '#9334E6'; // Default purple
  // }

  const httpServer = createServer(app);
  return httpServer;
}