// Load environment variables first
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log('Environment variables loaded. Current working directory:', process.cwd());

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from './db';
import { closeDriver, isNeo4jAvailable } from './neo4j';
import { auditAPIAccess } from './middleware/audit-middleware';

const app = express();
// Increase JSON payload limit to 1MB
app.use(express.json({ limit: '1mb' }));
// Increase URL-encoded payload limit to 1MB
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Add JSON content type header for all /api routes
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Add audit logging middleware after auth is set up in routes.ts
// This will capture all API requests for audit logs

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);

      // Track API usage for successful responses (excluding health checks)
      if (res.statusCode < 400 && 
          !path.includes('/health') && 
          !path.includes('/status') && 
          req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
        try {
          // Import is done inside to avoid circular dependencies
          import('./utils/featureTracker').then(({ trackApiUsage }) => {
            trackApiUsage(req, { responseStatus: res.statusCode, duration });
          }).catch(importErr => {
            console.error('Error importing feature tracker:', importErr);
          });
        } catch (err) {
          console.error('Error tracking API usage:', err);
        }
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Add JSON error handler for API routes
  app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);
    
    // Use our error logger to capture detailed error information
    try {
      // Import directly to avoid issues with require
      import('./utils/errorLogger').then(({ logApiError, ErrorSeverity }) => {
        logApiError(req, err, ErrorSeverity.ERROR, {
          stack: err.stack,
          status: err.status || err.statusCode || 500
        });
      }).catch(importErr => {
        console.error('Error importing error logger:', importErr);
      });
    } catch (logErr) {
      console.error('Error logging API error:', logErr);
    }
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Add general error handler for non-API routes
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error('General Error:', err);
    
    // Use our error logger for general errors too
    try {
      // Import directly to avoid issues with require
      import('./utils/errorLogger').then(({ logSystemError, ErrorSeverity }) => {
        logSystemError(err, 'general_error_handler', ErrorSeverity.ERROR, {
          path: req.path,
          method: req.method,
          query: req.query
        });
      }).catch(importErr => {
        console.error('Error importing error logger:', importErr);
      });
    } catch (logErr) {
      console.error('Error logging general error:', logErr);
    }
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).send(message);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the API routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try to serve the app on port 5000, with fallbacks
  const tryPorts = [5000, 5001, 5002, 5003];

  const startServer = (portIndex = 0) => {
    if (portIndex >= tryPorts.length) {
      console.error("Could not find an available port");
      process.exit(1);
      return;
    }

    const PORT = tryPorts[portIndex];
    server.listen(PORT, "0.0.0.0")
      .on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${PORT} is in use, trying next port...`);
          startServer(portIndex + 1);
        } else {
          console.error(err);
          process.exit(1);
        }
      })
      .on("listening", () => {
        log(`serving on port ${PORT}`);
      });
  };

  startServer();
})();

// Add server shutdown logic for cleanup
const cleanup = async () => {
  console.log('Shutting down gracefully...');

  // Close Neo4j connection if available
  if (isNeo4jAvailable()) {
    await closeDriver();
  }

  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);