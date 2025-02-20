import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { parse } from "csv-parse";
import { insertRelationshipSchema } from "@shared/schema";

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
    console.log('POST /api/reference-data/:id/bulk-upload - Request received'); //Added logging
    if (!req.isAuthenticated()) {
        console.log('POST /api/reference-data/:id/bulk-upload - Unauthorized access'); //Added logging
        return res.sendStatus(401);
    }
    try {
      const dataSetId = Number(req.params.id);
      const file = req.file;

      console.log('POST /api/reference-data/:id/bulk-upload - Received upload request for dataset:', dataSetId);
      console.log('POST /api/reference-data/:id/bulk-upload - File received:', file ? 'yes' : 'no');

      if (!file) {
        console.log('POST /api/reference-data/:id/bulk-upload - No file uploaded'); //Added logging
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log('POST /api/reference-data/:id/bulk-upload - File details:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      const dataSet = await storage.getReferenceDataSet(dataSetId);
      if (!dataSet) {
        console.log('POST /api/reference-data/:id/bulk-upload - Dataset not found'); //Added logging
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

      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          // Validate record against schema
          const validRecord: Record<string, any> = {};
          for (const schemaName of schemaNames) {
            if (record[schemaName] === undefined) {
              throw new Error(`Missing required field: ${schemaName}`);
            }
            // Make sure to store data with exact schema names
            validRecord[schemaName] = record[schemaName];
          }
          records.push(validRecord);
        }
      });

      await new Promise((resolve, reject) => {
        parser.on('error', (error) => {
          console.error('POST /api/reference-data/:id/bulk-upload - CSV parsing error:', error); //Added logging
          reject(error);
        });
        parser.on('end', () => {
          console.log('POST /api/reference-data/:id/bulk-upload - CSV parsing complete. Records found:', records.length); //Added logging
          resolve(null);
        });
        parser.write(file.buffer);
        parser.end();
      });

      console.log('POST /api/reference-data/:id/bulk-upload - Updating dataset with records:', records);

      // Update data set with new instances
      const updatedDataSet = await storage.updateReferenceDataSet(dataSetId, {
        data: records.reduce((acc, record, index) => {
          acc[`instance_${index + 1}`] = record;
          return acc;
        }, {} as Record<string, any>)
      });

      console.log('POST /api/reference-data/:id/bulk-upload - Upload complete. Dataset updated with data:', updatedDataSet.data); //Added logging
      res.json(updatedDataSet);
    } catch (error) {
      console.error('POST /api/reference-data/:id/bulk-upload - Error processing bulk upload:', error); //Added logging
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

  const httpServer = createServer(app);
  return httpServer;
}