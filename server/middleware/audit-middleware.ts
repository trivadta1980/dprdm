/**
 * Audit Middleware
 * 
 * This middleware intercepts all API requests and logs them to the audit trail.
 * It captures:
 * - Authentication events (login/logout)
 * - API endpoint usage
 * - Session tracking
 * - Error logging
 */

import { Request, Response, NextFunction } from 'express';
import { logCrudEvent, logSystemEvent } from '../utils/auditLogger';

// Sessions we're currently tracking to measure duration
const activeSessions: Record<string, { 
  userId: number, 
  username: string, 
  startTime: Date, 
  lastActivity: Date 
}> = {};

// List of sensitive endpoints that should not log request bodies
const sensitiveEndpoints = [
  '/api/login',
  '/api/register',
  '/api/users', // Contains password data
];

// Endpoints not to log (avoid noise)
const excludedEndpoints = [
  '/api/healthcheck',
  '/api/heartbeat',
];

/**
 * Middleware to log all API requests
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip logging for excluded endpoints
  if (excludedEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }

  // Track original end function to intercept response
  const originalEnd = res.end;
  const startTime = new Date();
  
  // Track session start
  if (req.path === '/api/login' && req.method === 'POST') {
    // We'll handle this in the response intercept below
  }
  
  // Track session end
  else if (req.path === '/api/logout' && req.method === 'POST' && req.isAuthenticated()) {
    const sessionId = req.sessionID;
    if (activeSessions[sessionId]) {
      const { userId, username, startTime } = activeSessions[sessionId];
      const duration = new Date().getTime() - startTime.getTime();
      
      // Log session end
      logCrudEvent(
        req,
        'LOGOUT',
        'USER',
        userId,
        username,
        null,
        null,
        `User logged out after ${Math.round(duration / 1000 / 60)} minutes`
      );
      
      // Remove from active sessions
      delete activeSessions[sessionId];
    }
  }
  
  // Track regular API usage for authenticated users
  else if (req.isAuthenticated() && req.user) {
    // Update activity timestamp for session tracking
    if (req.sessionID && activeSessions[req.sessionID]) {
      activeSessions[req.sessionID].lastActivity = new Date();
    }
    
    // Log API endpoint usage
    const entityModule = determineEntityModule(req.path);
    if (entityModule) {
      const actionType = determineActionType(req.method);
      const entityId = extractEntityId(req.path) || 'multiple';
      const entityName = `${entityModule} via ${req.path}`;
      
      // Only log request details if not a sensitive endpoint
      const requestDetails = sensitiveEndpoints.includes(req.path) 
        ? { sensitive: true } 
        : { 
            query: req.query,
            params: req.params,
            body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined
          };
      
      logCrudEvent(
        req,
        actionType,
        entityModule as any,
        entityId,
        entityName,
        null,
        null,
        `${actionType} operation on ${entityModule} via ${req.method} ${req.path}`,
      );
    }
  }

  // Intercept the response to log status code and duration
  res.end = function(chunk?: any, encoding?: any, callback?: any) {
    // Calculate request duration
    const duration = new Date().getTime() - startTime.getTime();
    
    // Handle login success
    if (req.path === '/api/login' && req.method === 'POST' && res.statusCode === 200 && req.user) {
      // Track new session start
      activeSessions[req.sessionID] = {
        userId: req.user.id,
        username: req.user.username,
        startTime: new Date(),
        lastActivity: new Date()
      };
      
      // Log successful login
      logCrudEvent(
        req,
        'LOGIN',
        'USER',
        req.user.id,
        req.user.username,
        null,
        null,
        `User logged in successfully`
      );
    }
    
    // Log server errors (status >= 500)
    if (res.statusCode >= 500) {
      const errorContext = {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration: duration,
        query: req.query,
        params: req.params,
        // Don't include body for security reasons in error logs
      };
      
      logSystemEvent(
        'SYSTEM', 
        'SYSTEM',
        'server-error',
        `Server Error ${res.statusCode}`,
        errorContext
      );
    }
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}

/**
 * Middleware to handle and log unhandled errors
 */
export function auditErrorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  // Log the error to the audit trail
  const errorContext = {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    query: req.query,
    params: req.params,
    // Don't include body for security
  };
  
  logSystemEvent(
    'SYSTEM', 
    'SYSTEM',
    'server-error',
    `Unhandled Error: ${err.message}`,
    errorContext
  );
  
  // Continue to the next error handler
  next(err);
}

/**
 * Determine the module/entity type based on the request path
 */
function determineEntityModule(path: string): string | null {
  if (path.includes('/users') || path.includes('/auth')) return 'USER';
  if (path.includes('/roles')) return 'ROLE';
  if (path.includes('/reference-types')) return 'REFERENCE_TYPE';
  if (path.includes('/reference-data')) return 'REFERENCE_DATA';
  if (path.includes('/relationships')) return 'RELATIONSHIP';
  if (path.includes('/crosswalks')) return 'CROSSWALK';
  if (path.includes('/api-keys')) return 'API_KEY';
  
  // Default to SYSTEM for unrecognized paths
  return 'SYSTEM';
}

/**
 * Map HTTP methods to audit action types
 */
function determineActionType(method: string): "CREATE" | "READ" | "UPDATE" | "DELETE" | "SYSTEM" {
  switch (method.toUpperCase()) {
    case 'GET': return 'READ';
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'SYSTEM';
  }
}

/**
 * Extract entity ID from URL path if present
 */
function extractEntityId(path: string): string | null {
  // Match pattern like /api/users/123 or /api/reference-data/456
  const matches = path.match(/\/api\/[^\/]+\/(\d+)/);
  return matches ? matches[1] : null;
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return body;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '******';
    }
  });
  
  return sanitized;
}

/**
 * Clean up stale sessions periodically (call this from a scheduled job)
 */
export function cleanupInactiveSessions(maxInactiveMinutes = 30) {
  const now = new Date();
  
  Object.keys(activeSessions).forEach(sessionId => {
    const session = activeSessions[sessionId];
    const inactiveTime = now.getTime() - session.lastActivity.getTime();
    const inactiveMinutes = inactiveTime / 1000 / 60;
    
    if (inactiveMinutes > maxInactiveMinutes) {
      // Log session timeout
      logSystemEvent(
        'SYSTEM',
        'USER',
        session.userId.toString(),
        session.username,
        {
          action: 'SESSION_TIMEOUT',
          sessionId,
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          inactiveMinutes: Math.round(inactiveMinutes)
        }
      );
      
      // Remove from active sessions
      delete activeSessions[sessionId];
    }
  });
}