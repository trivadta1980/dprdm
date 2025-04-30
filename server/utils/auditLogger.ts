/**
 * Audit Logger
 * 
 * Central logging utility that captures all system activities for audit trail purposes.
 * This module integrates with the database to persist audit records.
 */

import { db } from '../db';
import { auditLogs, InsertAuditLog } from '@shared/schema';
import { Request } from 'express';

/**
 * Log a CRUD event for auditing
 * Used for tracking changes to entities in the system
 */
export async function logCrudEvent(
  req: Request | { user?: { id: number, username: string }, ip?: string },
  actionType: "CREATE" | "READ" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "SYSTEM" | 
    "ERROR" | "WARNING" | "INFO" | "DEBUG" | "TRACE" | "LOGIN" | "LOGOUT" | 
    "SESSION_START" | "SESSION_END" | "FEATURE_USAGE" | "BULK_OPERATION",
  module: "USER" | "ROLE" | "REFERENCE_TYPE" | "REFERENCE_DATA" | "RELATIONSHIP" | "CROSSWALK" | "API_KEY" | "SYSTEM",
  entityId: string,
  entityName: string,
  oldValue?: Record<string, any> | null,
  newValue?: Record<string, any> | null,
  changeSummary?: string,
  additionalContext?: Record<string, any>
) {
  try {
    // Skip if CRUD operations in development environment for better performance
    if (process.env.NODE_ENV === 'development' && 
        actionType === 'READ' && 
        !process.env.LOG_READ_OPERATIONS) {
      return null;
    }
    
    // Prepare the audit log entry with enhanced metadata
    const enhancedContext = {
      ...additionalContext,
      userAgent: req.headers?.['user-agent'] || 'Unknown',
      referer: req.headers?.referer || 'Direct',
      sessionID: (req as any).sessionID || 'No Session',
      method: (req as any).method,
      path: (req as any).path,
      requestTime: new Date().toISOString()
    };
    
    const auditEntry: InsertAuditLog = {
      userId: req.user?.id,
      username: req.user?.username || 'system',
      ipAddress: req.ip || '',
      actionType,
      module,
      entityId,
      entityName,
      oldValue: oldValue || undefined,
      newValue: newValue || undefined,
      changeSummary: changeSummary || getDefaultSummary(actionType, module, entityName),
      additionalContext: enhancedContext
    };
    
    // Insert into database
    const [result] = await db.insert(auditLogs).values(auditEntry).returning({
      id: auditLogs.id
    });

    return result;
  } catch (error) {
    // Don't use other loggers here to avoid circular dependencies
    console.error('[Audit Logger] Failed to log event:', error);
    
    // Attempt to write to file as fallback if database insertion fails
    try {
      // Create enhanced fallback entry with the same metadata we would have stored
      const enhancedEntry = {
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        username: req.user?.username || 'system',
        ipAddress: req.ip || '',
        actionType,
        module,
        entityId,
        entityName,
        changeSummary: changeSummary || getDefaultSummary(actionType, module, entityName),
        userAgent: req.headers?.['user-agent'] || 'Unknown',
        referer: req.headers?.referer || 'Direct',
        sessionID: (req as any).sessionID || 'No Session',
        method: (req as any).method,
        path: (req as any).path,
        error: String(error)
      };
      
      console.warn('[Audit Logger] Writing to fallback log:', enhancedEntry);
    } catch (fallbackError) {
      console.error('[Audit Logger] Even fallback logging failed:', fallbackError);
    }
    
    return null;
  }
}

/**
 * Log a system event that's not tied to a specific user action
 */
export async function logSystemEvent(
  actionType: "CREATE" | "UPDATE" | "DELETE" | "SYSTEM" | 
    "ERROR" | "WARNING" | "INFO" | "DEBUG" | "TRACE",
  module: "USER" | "ROLE" | "REFERENCE_TYPE" | "REFERENCE_DATA" | "RELATIONSHIP" | "CROSSWALK" | "API_KEY" | "SYSTEM",
  entityId: string,
  description: string,
  context?: Record<string, any>
) {
  try {
    // For system events, we create an enhanced audit entry with system metadata
    const enhancedContext = {
      ...context,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        pid: process.pid
      }
    };
    
    const auditEntry: InsertAuditLog = {
      username: 'system',
      ipAddress: '',
      actionType,
      module,
      entityId,
      entityName: description.substring(0, 50), // Truncate for entity name
      changeSummary: description,
      additionalContext: enhancedContext
    };
    
    // Insert into database
    const [result] = await db.insert(auditLogs).values(auditEntry).returning({
      id: auditLogs.id
    });

    return result;
  } catch (error) {
    console.error('[Audit Logger] Failed to log system event:', error);
    
    // Log to console as fallback with enhanced information
    console.warn('[System Event]', {
      timestamp: new Date().toISOString(),
      actionType,
      module,
      entityId,
      description,
      context,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        pid: process.pid
      },
      error: String(error)
    });
    
    return null;
  }
}

/**
 * Generate a default human-readable summary based on action and entity
 */
function getDefaultSummary(
  actionType: string,
  module: string,
  entityName: string
): string {
  const actionVerb = getActionVerb(actionType);
  return `${actionVerb} ${module.toLowerCase()} ${entityName}`;
}

/**
 * Get a human-readable verb for the action type
 */
function getActionVerb(actionType: string): string {
  switch (actionType) {
    case 'CREATE': return 'Created';
    case 'READ': return 'Viewed';
    case 'UPDATE': return 'Updated';
    case 'DELETE': return 'Deleted';
    case 'APPROVE': return 'Approved';
    case 'REJECT': return 'Rejected';
    case 'SYSTEM': return 'System processed';
    case 'ERROR': return 'Error occurred in';
    case 'WARNING': return 'Warning occurred in';
    case 'INFO': return 'Info logged for';
    case 'DEBUG': return 'Debug info for';
    case 'TRACE': return 'Trace captured for';
    case 'LOGIN': return 'Logged in to';
    case 'LOGOUT': return 'Logged out from';
    case 'SESSION_START': return 'Started session for';
    case 'SESSION_END': return 'Ended session for';
    case 'FEATURE_USAGE': return 'Used feature in';
    case 'BULK_OPERATION': return 'Performed bulk operation on';
    default: return 'Interacted with';
  }
}

/**
 * Compare objects and generate a list of changes
 */
export function generateChanges(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  ignoredFields: string[] = ['updatedAt', 'lastActivity']
): { field: string; oldValue: any; newValue: any }[] {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];
  
  // Get all unique keys
  const allKeys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])];
  
  // Check each key for changes
  allKeys.forEach(key => {
    // Skip ignored fields
    if (ignoredFields.includes(key)) {
      return;
    }
    
    const oldValue = oldObj[key];
    const newValue = newObj[key];
    
    // Check if values are different (including existence checks)
    if (
      (!oldObj.hasOwnProperty(key) && newObj.hasOwnProperty(key)) ||
      (oldObj.hasOwnProperty(key) && !newObj.hasOwnProperty(key)) ||
      JSON.stringify(oldValue) !== JSON.stringify(newValue)
    ) {
      changes.push({
        field: key,
        oldValue: oldValue,
        newValue: newValue
      });
    }
  });
  
  return changes;
}

/**
 * Generate a human-readable summary of changes
 */
export function generateChangeSummary(
  entityType: string,
  entityName: string,
  changes: { field: string; oldValue: any; newValue: any }[]
): string {
  if (changes.length === 0) {
    return `No changes made to ${entityType} ${entityName}`;
  }
  
  if (changes.length === 1) {
    const change = changes[0];
    return `Changed ${change.field} from "${stringify(change.oldValue)}" to "${stringify(change.newValue)}" in ${entityType} ${entityName}`;
  }
  
  return `Updated ${changes.length} fields in ${entityType} ${entityName}: ${changes.map(c => c.field).join(', ')}`;
}

/**
 * Helper to safely stringify values, including handling undefined/null
 */
function stringify(value: any): string {
  if (value === undefined) {
    return 'undefined';
  }
  
  if (value === null) {
    return 'null';
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Complex Object]';
    }
  }
  
  return String(value);
}