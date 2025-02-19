import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { parse } from "csv-parse";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and user management routes
  setupAuth(app);

  const upload = multer({ storage: multer.memoryStorage() });

  // Admin-only routes for user management
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      return res.sendStatus(403);
    }
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // Update user route
  app.patch("/api/users/:id", async (req, res) => {
    console.log('Received update request for user ID:', req.params.id);
    console.log('Update data:', req.body);

    if (!req.isAuthenticated()) {
      console.log('User not authenticated');
      return res.sendStatus(401);
    }

    const userId = Number(req.params.id);
    console.log('Authenticated user ID:', req.user.id, 'Role ID:', req.user.roleId);

    // Only allow users to update their own profile unless they're an admin
    if (req.user.id !== userId && req.user.roleId !== 1) {
      console.log('Permission denied: User cannot edit this profile');
      return res.sendStatus(403);
    }

    try {
      const user = await storage.updateUser(userId, req.body);
      console.log('Update result:', user);
      if (user) {
        res.json(user);
      } else {
        console.log('User not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Reference Data Types routes
  app.get("/api/reference-types", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const types = await storage.getAllReferenceDataTypes();
      res.json(types);
    } catch (error) {
      console.error('Error fetching reference types:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/reference-types", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      console.log('Creating reference type with data:', req.body);
      const referenceType = await storage.createReferenceDataType(req.body);
      console.log('Created reference type:', referenceType);
      res.status(201).json(referenceType);
    } catch (error) {
      console.error('Error creating reference type:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/reference-types/:id/schemas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const schemas = await storage.getReferenceDataTypeSchemas(Number(req.params.id));
      res.json(schemas);
    } catch (error) {
      console.error('Error fetching reference type schemas:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/api/reference-types/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      console.log('Updating reference type with data:', req.body);
      const referenceType = await storage.updateReferenceDataType(
        Number(req.params.id),
        req.body
      );
      console.log('Updated reference type:', referenceType);
      res.json(referenceType);
    } catch (error) {
      console.error('Error updating reference type:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Reference Data Sets routes
  app.get("/api/reference-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const dataSets = await storage.getAllReferenceDataSets();
      res.json(dataSets);
    } catch (error) {
      console.error('Error fetching reference data sets:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/reference-data/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const dataSet = await storage.getReferenceDataSet(Number(req.params.id));
      if (dataSet) {
        res.json(dataSet);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('Error fetching reference data set:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/reference-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const dataSet = await storage.createReferenceDataSet(req.body);
      res.status(201).json(dataSet);
    } catch (error) {
      console.error('Error creating reference data set:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // New route to get sample data template
  app.get("/api/reference-data/:id/template", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const dataSetId = Number(req.params.id);
      const dataSet = await storage.getReferenceDataSet(dataSetId);

      if (!dataSet) {
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
      console.error('Error generating template:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Update the bulk upload route to handle the data structure correctly
  app.post("/api/reference-data/:id/bulk-upload", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const dataSetId = Number(req.params.id);
      const file = req.file;

      console.log('Received upload request for dataset:', dataSetId);
      console.log('File received:', file ? 'yes' : 'no');

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log('File details:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      const dataSet = await storage.getReferenceDataSet(dataSetId);
      if (!dataSet) {
        return res.status(404).json({ error: "Reference Data Set not found" });
      }

      const schemas = await storage.getReferenceDataTypeSchemas(dataSet.typeId);
      const schemaNames = schemas.map(s => s.name);

      console.log('Schema names:', schemaNames);

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
          console.error('CSV parsing error:', error);
          reject(error);
        });
        parser.on('end', () => {
          console.log('CSV parsing complete. Records found:', records.length);
          resolve(null);
        });
        parser.write(file.buffer);
        parser.end();
      });

      console.log('Updating dataset with records:', records);

      // Update data set with new instances
      const updatedDataSet = await storage.updateReferenceDataSet(dataSetId, {
        data: records.reduce((acc, record, index) => {
          acc[`instance_${index + 1}`] = record;
          return acc;
        }, {} as Record<string, any>)
      });

      console.log('Upload complete. Dataset updated with data:', updatedDataSet.data);
      res.json(updatedDataSet);
    } catch (error) {
      console.error('Error processing bulk upload:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/api/reference-data/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const dataSet = await storage.updateReferenceDataSet(
        Number(req.params.id),
        req.body
      );
      res.json(dataSet);
    } catch (error) {
      console.error('Error updating reference data set:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/reference-data/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const success = await storage.deleteReferenceDataSet(Number(req.params.id));
      if (success) {
        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('Error deleting reference data set:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}