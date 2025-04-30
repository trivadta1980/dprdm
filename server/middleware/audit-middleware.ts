/**
 * Audit Logging Middleware
 * 
 * This middleware captures HTTP requests and logs them to the audit trail.
 * It's designed to automatically track API access and user actions.
 */

import { Request, Response, NextFunction } from "express";
import { logCrudEvent } from "../utils/auditLogger";

/**
 * Determine the entity type from the request path
 * @param path Request path
 * @returns Entity type string
 */
function getEntityTypeFromPath(path: string): "USER" | "ROLE" | "REFERENCE_TYPE" | "REFERENCE_DATA" | "RELATIONSHIP" | "CROSSWALK" | "API_KEY" | "SYSTEM" {
  if (path.includes('/users') || path.includes('/login') || path.includes('/logout')) {
    return "USER";
  } else if (path.includes('/roles')) {
    return "ROLE";
  } else if (path.includes('/reference-types')) {
    return "REFERENCE_TYPE";
  } else if (path.includes('/reference-data')) {
    return "REFERENCE_DATA";
  } else if (path.includes('/relationships')) {
    return "RELATIONSHIP";
  } else if (path.includes('/crosswalks')) {
    return "CROSSWALK";
  } else if (path.includes('/api-keys')) {
    return "API_KEY";
  } else {
    return "SYSTEM";
  }
}

/**
 * Determine the action type from the HTTP method
 * @param method HTTP method
 * @returns Action type string
 */
function getActionTypeFromMethod(method: string): "CREATE" | "READ" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" {
  switch (method.toUpperCase()) {
    case 'POST':
      return "CREATE";
    case 'GET':
      return "READ";
    case 'PUT':
    case 'PATCH':
      return "UPDATE";
    case 'DELETE':
      return "DELETE";
    default:
      return "READ";
  }
}

/**
 * Extract entity ID from the request path
 * @param path Request path
 * @returns Entity ID or undefined
 */
function getEntityIdFromPath(path: string): string | undefined {
  const segments = path.split('/').filter(Boolean);
  // Look for IDs in path segments - usually the last segment
  if (segments.length > 1) {
    const lastSegment = segments[segments.length - 1];
    // Check if last segment is numeric or looks like an ID
    if (/^\d+$/.test(lastSegment)) {
      return lastSegment;
    }
  }
  return undefined;
}

/**
 * Get entity name from path and params
 * @param path Request path
 * @param params Request parameters
 * @returns Constructed entity name
 */
function getEntityNameFromRequest(path: string, params: any): string {
  const entityType = getEntityTypeFromPath(path);
  const entityId = getEntityIdFromPath(path);
  
  if (entityId) {
    return `${entityType.toLowerCase()}/${entityId}`;
  } else {
    return `${entityType.toLowerCase()}`;
  }
}

/**
 * Middleware function to log API requests to audit trail
 */
export function auditAPIAccess(req: Request, res: Response, next: NextFunction) {
  // Skip logging for certain paths
  if (
    req.path.includes('/health') || 
    req.path.includes('/metrics') ||
    req.path === '/api/user' || // Skip user check requests
    req.path.includes('/audit-logs') // Don't log audit log requests to avoid recursion
  ) {
    return next();
  }
  
  // Original response methods
  const originalEnd = res.end;
  const originalJson = res.json;
  
  // Override end method to capture response
  res.end = function(this: Response, ...args: any[]) {
    try {
      const entityType = getEntityTypeFromPath(req.path);
      const actionType = getActionTypeFromMethod(req.method);
      const entityId = getEntityIdFromPath(req.path) || '';
      const entityName = getEntityNameFromRequest(req.path, req.params);
      
      // Only log if user is authenticated
      if (req.isAuthenticated() && req.user) {
        logCrudEvent(
          req,
          actionType,
          entityType,
          entityId,
          entityName,
          undefined, // oldValue
          undefined, // newValue
          `${req.method} ${req.path}`
        ).catch(err => {
          console.error('Failed to log API access:', err);
        });
      }
    } catch (err) {
      console.error('Error in audit middleware:', err);
    }
    
    return originalEnd.apply(this, args);
  };
  
  // Override json method to capture structured response
  res.json = function(this: Response, body: any) {
    // For non-GET requests, this could also log the request body and response
    // But we'll keep it simple for now
    return originalJson.apply(this, [body]);
  };
  
  next();
}

/**
 * Middleware to explicitly log entity operations with detailed change tracking
 */
export function auditEntityChanges(
  entityType: "USER" | "ROLE" | "REFERENCE_TYPE" | "REFERENCE_DATA" | "RELATIONSHIP" | "CROSSWALK" | "API_KEY" | "SYSTEM",
  actionType: "CREATE" | "READ" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT",
  getEntityId: (req: Request) => string | number,
  getEntityName: (req: Request) => string,
  getOldValue?: (req: Request) => Record<string, any> | undefined,
  getNewValue?: (req: Request) => Record<string, any> | undefined
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original methods
    const originalEnd = res.end;
    const originalJson = res.json;
    
    // Override end method
    res.end = function(this: Response, ...args: any[]) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const entityId = getEntityId(req);
          const entityName = getEntityName(req);
          
          let oldValue = undefined;
          if (getOldValue) {
            try {
              oldValue = getOldValue(req);
            } catch (err) {
              console.error('Error getting old value for audit:', err);
            }
          }
          
          let newValue = undefined;
          if (getNewValue) {
            try {
              newValue = getNewValue(req);
            } catch (err) {
              console.error('Error getting new value for audit:', err);
            }
          }
          
          if (req.isAuthenticated() && req.user) {
            logCrudEvent(
              req,
              actionType,
              entityType,
              entityId,
              entityName,
              oldValue,
              newValue,
              `${actionType} ${entityType.toLowerCase()} "${entityName}"`
            ).catch(err => {
              console.error('Failed to log entity change:', err);
            });
          }
        } catch (err) {
          console.error('Error in entity audit middleware:', err);
        }
      }
      
      return originalEnd.apply(this, args);
    };
    
    // Override json method
    res.json = function(this: Response, body: any) {
      return originalJson.apply(this, [body]);
    };
    
    next();
  };
}