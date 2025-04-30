/**
 * Feature Usage Tracker
 * 
 * This utility tracks detailed usage of specific features within the application.
 * It provides insights into how users interact with the system.
 */

import { logCrudEvent } from './auditLogger';
import { logInfo } from './errorLogger';
import { Request } from 'express';

// Feature categories for tracking
export enum FeatureCategory {
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  REFERENCE_DATA = 'REFERENCE_DATA',
  RELATIONSHIPS = 'RELATIONSHIPS',
  CROSSWALKS = 'CROSSWALKS',
  APPROVALS = 'APPROVALS',
  SYSTEM = 'SYSTEM',
  AUDIT = 'AUDIT',
  API_KEYS = 'API_KEYS',
}

// Feature actions
export enum FeatureAction {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SEARCH = 'SEARCH',
  FILTER = 'FILTER',
  BULK_OPERATION = 'BULK_OPERATION',
}

// Interface for feature usage events
interface FeatureUsageEvent {
  category: FeatureCategory;
  action: FeatureAction;
  feature: string;
  entityId?: string | number;
  metadata?: Record<string, any>;
}

/**
 * Track feature usage by a user
 */
export function trackFeatureUsage(
  req: Request,
  category: FeatureCategory,
  action: FeatureAction, 
  feature: string,
  entityId?: string | number,
  metadata?: Record<string, any>
) {
  // Skip tracking if not authenticated
  if (!req.isAuthenticated() || !req.user) {
    return null;
  }
  
  const sanitizedMetadata = sanitizeMetadata(metadata || {});
  
  // Map to system audit action type
  const actionTypeMap: Record<FeatureAction, "CREATE" | "READ" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "SYSTEM"> = {
    [FeatureAction.VIEW]: 'READ',
    [FeatureAction.CREATE]: 'CREATE',
    [FeatureAction.UPDATE]: 'UPDATE',
    [FeatureAction.DELETE]: 'DELETE',
    [FeatureAction.EXPORT]: 'SYSTEM',
    [FeatureAction.IMPORT]: 'SYSTEM',
    [FeatureAction.APPROVE]: 'APPROVE',
    [FeatureAction.REJECT]: 'REJECT',
    [FeatureAction.SEARCH]: 'READ',
    [FeatureAction.FILTER]: 'READ',
    [FeatureAction.BULK_OPERATION]: 'SYSTEM',
  };
  
  // Map to system audit module
  const moduleMap: Record<FeatureCategory, "USER" | "ROLE" | "REFERENCE_TYPE" | "REFERENCE_DATA" | "RELATIONSHIP" | "CROSSWALK" | "API_KEY" | "SYSTEM"> = {
    [FeatureCategory.USER_MANAGEMENT]: 'USER',
    [FeatureCategory.REFERENCE_DATA]: 'REFERENCE_DATA',
    [FeatureCategory.RELATIONSHIPS]: 'RELATIONSHIP',
    [FeatureCategory.CROSSWALKS]: 'CROSSWALK',
    [FeatureCategory.APPROVALS]: 'SYSTEM',
    [FeatureCategory.SYSTEM]: 'SYSTEM',
    [FeatureCategory.AUDIT]: 'SYSTEM',
    [FeatureCategory.API_KEYS]: 'API_KEY',
  };
  
  // Generate a feature usage ID
  const featureId = entityId || `feature-${feature.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Create the change summary
  const changeSummary = `User ${req.user.username} ${action.toLowerCase()} ${feature} in ${category.toLowerCase().replace(/_/g, ' ')}`;
  
  // Log to audit system
  return logCrudEvent(
    req,
    actionTypeMap[action],
    moduleMap[category],
    featureId.toString(),
    feature,
    null,
    null,
    changeSummary,
  );
}

/**
 * Track a bulk operation with count information
 */
export function trackBulkOperation(
  req: Request,
  category: FeatureCategory,
  operation: string,
  recordCount: number,
  successCount: number,
  metadata?: Record<string, any>
) {
  if (!req.isAuthenticated() || !req.user) {
    return null;
  }
  
  const feature = `Bulk ${operation}`;
  const sanitizedMetadata = {
    ...sanitizeMetadata(metadata || {}),
    recordCount,
    successCount,
    failureCount: recordCount - successCount,
    successRate: `${Math.round((successCount / recordCount) * 100)}%`
  };
  
  return trackFeatureUsage(
    req,
    category,
    FeatureAction.BULK_OPERATION,
    feature,
    undefined,
    sanitizedMetadata
  );
}

/**
 * Track a search operation
 */
export function trackSearch(
  req: Request,
  category: FeatureCategory,
  searchTerm: string,
  resultCount: number,
  filters?: Record<string, any>
) {
  if (!req.isAuthenticated() || !req.user) {
    return null;
  }
  
  return trackFeatureUsage(
    req,
    category,
    FeatureAction.SEARCH,
    'Search',
    undefined,
    {
      searchTerm,
      resultCount,
      filters: filters ? JSON.stringify(filters) : undefined
    }
  );
}

/**
 * Track an export operation
 */
export function trackExport(
  req: Request,
  category: FeatureCategory,
  exportType: string,
  recordCount: number,
  format: string
) {
  if (!req.isAuthenticated() || !req.user) {
    return null;
  }
  
  return trackFeatureUsage(
    req,
    category,
    FeatureAction.EXPORT,
    `Export ${exportType}`,
    undefined,
    {
      recordCount,
      format
    }
  );
}

/**
 * Track an import operation
 */
export function trackImport(
  req: Request,
  category: FeatureCategory,
  importType: string,
  recordCount: number,
  format: string,
  successCount: number
) {
  if (!req.isAuthenticated() || !req.user) {
    return null;
  }
  
  return trackFeatureUsage(
    req,
    category,
    FeatureAction.IMPORT,
    `Import ${importType}`,
    undefined,
    {
      recordCount,
      format,
      successCount,
      failureCount: recordCount - successCount,
      successRate: `${Math.round((successCount / recordCount) * 100)}%`
    }
  );
}

/**
 * Sanitize metadata to remove sensitive information
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized = { ...metadata };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key'];
  
  // Remove sensitive fields
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '******';
    }
  });
  
  // Ensure metadata isn't too large
  const jsonSize = JSON.stringify(sanitized).length;
  if (jsonSize > 10000) {
    // Truncate if too large
    return {
      truncated: true,
      message: `Metadata was too large (${jsonSize} bytes) and was truncated`,
      original_keys: Object.keys(sanitized)
    };
  }
  
  return sanitized;
}