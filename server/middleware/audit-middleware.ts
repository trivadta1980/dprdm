/**

 * Audit Middleware
 * 
 * Middleware that captures details about all HTTP requests to track
 * user activity and API usage in the system.
 */

import { Request, Response, NextFunction } from 'express';
import { logCrudEvent } from '../utils/auditLogger';
import { startUserSession, recordUserActivity, endUserSession } from '../utils/sessionTracker';

// List of paths to exclude from detailed audit logging (to reduce noise)
const EXCLUDED_PATHS = [
  '/api/health',
  '/api/status', 
  '/favicon.ico'
];

// Sensitive paths that should not be logged with query params
const SENSITIVE_PATHS = [
  '/api/login',
  '/api/register',
  '/api/reset-password',
  '/api/change-password'
];

/**
 * Main audit middleware function that captures all HTTP requests
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip excluded paths
  if (EXCLUDED_PATHS.includes(req.path)) {
    return next();
  }
  
  // Get a clean version of the URL (without sensitive data)
  const requestPath = getCleanPath(req);
  
  // Store original end function to intercept it later
  const originalEnd = res.end;
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Capture start time for response time calculation
  const startTime = Date.now();
  
  // Track session activity if authenticated
  // Check if isAuthenticated function exists before using it
  if (req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated() && req.user && req.sessionID) {
    recordUserActivity(req.sessionID, requestPath);
  }
  
  // Handle login/logout events specially
  if (req.path === '/api/login' && req.method === 'POST') {
    // We'll handle actual login success in the response interceptor below
    // since we don't know if it will be successful yet
  } else if (req.path === '/api/logout' && req.method === 'POST') {
    if (req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated() && req.user && req.sessionID) {
      // Log the logout event
      logCrudEvent(
        req,
        'LOGOUT',
        'USER',
        req.user.id.toString(),
        req.user.username,
        null,
        null,
        `User ${req.user.username} logged out`
      );
      
      endUserSession(req.sessionID);
    }
  } else {
    // For all other API requests, log the request details
    if (req.path.startsWith('/api/')) {
      const actionTypeMap: Record<string, "CREATE" | "READ" | "UPDATE" | "DELETE" | "SYSTEM"> = {
        'GET': 'READ',
        'POST': 'CREATE',
        'PUT': 'UPDATE',
        'PATCH': 'UPDATE',
        'DELETE': 'DELETE'
      };
      
      // Map HTTP method to CRUD action type with fallback to READ
      const actionType = actionTypeMap[req.method] || 'READ';
      
      // Determine entity type from path
      const pathParts = req.path.split('/').filter(Boolean);
      let module = 'SYSTEM';
      let entityId = 'api';
      let entityName = req.path;
      
      if (pathParts.length >= 2) {
        // Extract module and entityId from path parts
        const apiEntityMap: Record<string, "USER" | "ROLE" | "REFERENCE_TYPE" | "REFERENCE_DATA" | "RELATIONSHIP" | "CROSSWALK" | "API_KEY" | "SYSTEM"> = {
          'users': 'USER',
          'roles': 'ROLE',
          'reference-types': 'REFERENCE_TYPE',
          'reference-data': 'REFERENCE_DATA',
          'relationships': 'RELATIONSHIP',
          'crosswalks': 'CROSSWALK',
          'api-keys': 'API_KEY',
          'user': 'USER',
        };
        
        // Second path part is usually the entity type
        module = apiEntityMap[pathParts[1]] || 'SYSTEM';
        
        // Third path part is often the entity ID
        if (pathParts.length >= 3 && pathParts[2]) {
          entityId = pathParts[2];
          entityName = `${pathParts[1]}/${entityId}`;
        } else {
          entityName = pathParts[1];
        }
      }
      
      // Log API request
      logCrudEvent(
        req,
        actionType,
        module,
        entityId,
        entityName,
        null,
        null,
        `${req.method} ${requestPath}`,
        {
          query: req.query,
          params: req.params,
          body: sanitizeRequestBody(req)
        }
      );
    }
  }
  
  // Intercept the response to log the outcome
  res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void): Response {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Handle login success here
    if (req.path === '/api/login' && req.method === 'POST' && res.statusCode >= 200 && res.statusCode < 300) {
      if (req.user && req.sessionID) {
        // Start tracking session
        startUserSession(req.sessionID, req.user.id, req.user.username);
        
        // Log login success
        logCrudEvent(
          req,
          'LOGIN',
          'USER',
          req.user.id.toString(),
          req.user.username,
          null,
          null,
          `User ${req.user.username} logged in successfully`,
          { responseTime }
        );
      }
    }
    
    // Restore original end function
    res.end = originalEnd;
    
    // Call the original end function
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  // Continue with the request
  next();
}

/**
 * Remove sensitive information from request path
 */
function getCleanPath(req: Request): string {
  const path = req.originalUrl || req.url;
  
  // Check if this is a sensitive path
  const isSensitive = SENSITIVE_PATHS.some(sensitivePath => 
    path.startsWith(sensitivePath));
  
  if (isSensitive) {
    // Return just the path without query params
    return path.split('?')[0];
  }
  
  return path;
}

/**
 * Sanitize request body by removing sensitive fields
 */
function sanitizeRequestBody(req: Request): Record<string, any> | null {
  if (!req.body || typeof req.body !== 'object') {
    return null;
  }
  
  // Create a copy to avoid modifying the original
  const sanitized = { ...req.body };
  
  // List of sensitive fields to remove
  const sensitiveFields = [
    'password', 
    'newPassword', 
    'currentPassword',
    'token', 
    'refreshToken',
    'apiKey', 
    'secret',
    'accessToken',
    'authorization'
  ];
  
  // Sanitize each sensitive field
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '******';
    }
  });
  
  return sanitized;

}