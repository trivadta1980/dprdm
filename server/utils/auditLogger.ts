/**
 * Audit Logger Utility
 * 
 * This utility provides functions to log audit events throughout the application.
 * It's designed to be used in routes and middleware to track user actions.
 */

import { db } from "../db";
import { auditLogs, type InsertAuditLog } from "@shared/schema";
import { Request } from "express";

/**
 * Logs an audit event to the database
 * 
 * @param logData Audit log data to record
 * @returns The created audit log entry
 */
export async function logAuditEvent(logData: InsertAuditLog) {
  try {
    const [result] = await db.insert(auditLogs).values(logData).returning();
    return result;
  } catch (error) {
    console.error("Error logging audit event:", error);
    // Continue execution even if logging fails - don't interrupt the main operation
    return null;
  }
}

/**
 * Creates an audit log entry for a standard CRUD operation
 * 
 * @param req Express request object
 * @param actionType Type of action (CREATE, READ, UPDATE, DELETE)
 * @param module Entity type being affected
 * @param entityId ID of the entity
 * @param entityName Human-readable name of the entity
 * @param oldValue Previous state of the entity (for updates/deletes)
 * @param newValue New state of the entity (for creates/updates)
 * @param changeSummary Human-readable summary of the changes
 * @returns The created audit log entry
 */
export async function logCrudEvent(
  req: Request,
  actionType: "CREATE" | "READ" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT",
  module: "USER" | "ROLE" | "REFERENCE_TYPE" | "REFERENCE_DATA" | "RELATIONSHIP" | "CROSSWALK" | "API_KEY" | "SYSTEM",
  entityId: string | number,
  entityName: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  changeSummary?: string
) {
  // Skip audit logging if the user is not authenticated
  if (!req.isAuthenticated() || !req.user) {
    console.warn("Attempted to log audit event without authenticated user");
    return null;
  }

  // Get IP address from request
  const ipAddress = 
    req.headers['x-forwarded-for'] || 
    req.socket.remoteAddress || 
    'unknown';

  // Build audit log data
  // We use the original field names for DB storage but add frontendCompatible context
  // that will help with debugging field mapping issues
  const auditData: InsertAuditLog = {
    userId: req.user.id,
    username: req.user.username,
    ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
    actionType,
    module,
    entityId: entityId.toString(),
    entityName,
    oldValue,
    newValue,
    changeSummary: changeSummary || createChangeSummary(actionType, module, entityName),
    additionalContext: {
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
      query: req.query,
      sessionID: req.sessionID,
      // Store frontend-compatible field names in additionalContext for debugging
      frontendCompatible: {
        userIp: typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
        entityType: module,
        details: changeSummary || createChangeSummary(actionType, module, entityName)
      }
    }
  };

  return await logAuditEvent(auditData);
}

/**
 * Logs a system event that's not related to a specific user action
 * 
 * @param actionType Type of action
 * @param module Entity type being affected
 * @param entityId ID of the entity (optional)
 * @param entityName Name of the entity (optional)
 * @param details Additional context for the event
 * @returns The created audit log entry
 */
export async function logSystemEvent(
  actionType: "CREATE" | "UPDATE" | "DELETE" | "SYSTEM",
  module: "USER" | "ROLE" | "REFERENCE_TYPE" | "REFERENCE_DATA" | "RELATIONSHIP" | "CROSSWALK" | "API_KEY" | "SYSTEM",
  entityId?: string | number,
  entityName?: string,
  details?: Record<string, any>
) {
  const changeSummary = `System ${actionType.toLowerCase()} operation on ${module.toLowerCase()}`;
  
  const auditData: InsertAuditLog = {
    username: "SYSTEM",
    actionType,
    module,
    entityId: entityId?.toString() || '',
    entityName: entityName || "System Operation",
    changeSummary,
    additionalContext: {
      ...details,
      // Store frontend-compatible field names in additionalContext for debugging
      frontendCompatible: {
        userIp: "system",
        entityType: module,
        details: changeSummary
      }
    }
  };

  return await logAuditEvent(auditData);
}

/**
 * Creates a human-readable summary of the changes
 * 
 * @param actionType Type of action
 * @param module Entity type
 * @param entityName Name of the entity
 * @returns A formatted summary string
 */
function createChangeSummary(
  actionType: "CREATE" | "READ" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT",
  module: "USER" | "ROLE" | "REFERENCE_TYPE" | "REFERENCE_DATA" | "RELATIONSHIP" | "CROSSWALK" | "API_KEY" | "SYSTEM",
  entityName: string
): string {
  const moduleFormatted = module.toLowerCase().replace('_', ' ');
  
  switch (actionType) {
    case "CREATE":
      return `Created new ${moduleFormatted} "${entityName}"`;
    case "READ":
      return `Viewed ${moduleFormatted} "${entityName}"`;
    case "UPDATE":
      return `Updated ${moduleFormatted} "${entityName}"`;
    case "DELETE":
      return `Deleted ${moduleFormatted} "${entityName}"`;
    case "APPROVE":
      return `Approved ${moduleFormatted} "${entityName}"`;
    case "REJECT":
      return `Rejected ${moduleFormatted} "${entityName}"`;
    default:
      return `Performed ${actionType.toLowerCase()} operation on ${moduleFormatted} "${entityName}"`;
  }
}

/**
 * Compare old and new objects to generate a detailed change description
 * 
 * @param oldObj Previous state of object
 * @param newObj New state of object
 * @returns Array of changes with field, old value, and new value
 */
export function generateChanges(oldObj: Record<string, any>, newObj: Record<string, any>) {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];
  
  // Find all keys from both objects
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  // Skip internal fields and functions
  const skipKeys = ['_id', 'id', 'createdAt', 'updatedAt', 'password'];
  
  for (const key of allKeys) {
    // Skip internal fields
    if (skipKeys.includes(key) || typeof oldObj[key] === 'function' || typeof newObj[key] === 'function') {
      continue;
    }
    
    // Check if value exists in both and is different
    if (key in oldObj && key in newObj) {
      // Handle objects and arrays with deep comparison
      if (
        typeof oldObj[key] === 'object' && 
        oldObj[key] !== null && 
        typeof newObj[key] === 'object' && 
        newObj[key] !== null
      ) {
        // Simplified deep comparison for objects/arrays - in practice use a deep equal function
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
          changes.push({
            field: key,
            oldValue: oldObj[key],
            newValue: newObj[key]
          });
        }
      } 
      // Simple value comparison
      else if (oldObj[key] !== newObj[key]) {
        changes.push({
          field: key,
          oldValue: oldObj[key],
          newValue: newObj[key]
        });
      }
    }
    // Field added
    else if (!(key in oldObj) && key in newObj) {
      changes.push({
        field: key,
        oldValue: undefined,
        newValue: newObj[key]
      });
    }
    // Field removed
    else if (key in oldObj && !(key in newObj)) {
      changes.push({
        field: key,
        oldValue: oldObj[key],
        newValue: undefined
      });
    }
  }
  
  return changes;
}

/**
 * Create a formatter function that can be used to sanitize sensitive data before logging
 * 
 * @param sensitiveFields Array of field names to sanitize
 * @returns Function that sanitizes an object
 */
export function createSanitizer(sensitiveFields: string[] = ['password', 'token', 'secret', 'key']) {
  return function sanitizeForAudit(obj: Record<string, any>): Record<string, any> {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result = { ...obj };
    
    for (const field of sensitiveFields) {
      if (field in result) {
        result[field] = '******';
      }
    }
    
    return result;
  };
}