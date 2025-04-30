/**
 * Feature Tracker
 * 
 * Utility for tracking feature usage and user activity within the application.
 * Provides analytics on which features are most used and by whom.
 */

import { logCrudEvent } from './auditLogger';
import { Request } from 'express';

// Feature categories for grouping and reporting
export enum FeatureCategory {
  REFERENCE_DATA = 'REFERENCE_DATA',
  RELATIONSHIPS = 'RELATIONSHIPS',
  CROSSWALKS = 'CROSSWALKS',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  APPROVALS = 'APPROVALS',
  SEARCH = 'SEARCH',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  REPORTS = 'REPORTS',
  API_USAGE = 'API_USAGE',
  SETTINGS = 'SETTINGS'
}

// Map of API paths to feature categories for automatic tracking
const pathToFeatureMap: Record<string, FeatureCategory> = {
  '/api/reference-types': FeatureCategory.REFERENCE_DATA,
  '/api/reference-data': FeatureCategory.REFERENCE_DATA,
  '/api/relationships': FeatureCategory.RELATIONSHIPS,
  '/api/crosswalks': FeatureCategory.CROSSWALKS,
  '/api/users': FeatureCategory.USER_MANAGEMENT,
  '/api/roles': FeatureCategory.USER_MANAGEMENT,
  '/api/approvals': FeatureCategory.APPROVALS,
  '/api/search': FeatureCategory.SEARCH,
  '/api/export': FeatureCategory.EXPORT,
  '/api/import': FeatureCategory.IMPORT
};

/**
 * Log a feature usage event
 * 
 * @param req Express request object
 * @param featureName Name of the feature being used
 * @param category Feature category
 * @param details Additional details about the usage
 */
export function trackFeatureUsage(
  req: Request,
  featureName: string,
  category: FeatureCategory,
  details?: Record<string, any>
): void {
  const userId = req.user?.id;
  const username = req.user?.username || 'anonymous';
  
  // Create usage details for logging
  const usageDetails = {
    featureName,
    category,
    userId,
    username,
    path: req.path,
    method: req.method,
    ...details
  };
  
  // Log the feature usage
  logCrudEvent(
    req,
    'INFO',
    'SYSTEM',
    `feature_${Date.now()}`,
    'Feature Usage',
    null,
    null,
    `User ${username} used feature: ${featureName}`,
    usageDetails
  );
}

/**
 * Track feature usage based on API path
 * 
 * This function automatically maps API paths to features and logs usage
 * 
 * @param req Express request object
 * @param details Additional details about the usage
 */
export function trackApiUsage(
  req: Request,
  details?: Record<string, any>
): void {
  // Extract path without query params for matching
  const path = req.path.split('?')[0];
  
  // Find matching feature category
  let category = FeatureCategory.API_USAGE;
  let featureName = path;
  
  // Check for exact match
  if (pathToFeatureMap[path]) {
    category = pathToFeatureMap[path];
  } else {
    // Check for partial match
    for (const [prefix, featureCategory] of Object.entries(pathToFeatureMap)) {
      if (path.startsWith(prefix)) {
        category = featureCategory;
        break;
      }
    }
  }
  
  // Create a more user-friendly feature name from the path
  featureName = path.replace('/api/', '').replace(/-/g, ' ');
  
  // Add HTTP method to make it clearer what action was taken
  featureName = `${req.method} ${featureName}`;
  
  // Only track API usage for authenticated users
  if (req.isAuthenticated() && req.user) {
    trackFeatureUsage(req, featureName, category, details);
  }
}

/**
 * Track a specific application feature being used
 * 
 * Use this for tracking UI interactions that don't directly map to API calls
 * 
 * @param req Express request object
 * @param featureName Name of the feature being used
 * @param category Feature category
 * @param details Additional details about the usage
 */
export function trackAppFeatureUsage(
  req: Request,
  featureName: string,
  category: FeatureCategory,
  details?: Record<string, any>
): void {
  trackFeatureUsage(req, featureName, category, {
    source: 'client',
    ...details
  });
}

/**
 * Track search activity
 * 
 * @param req Express request object
 * @param searchTerm Search term used
 * @param searchContext Where the search was performed
 * @param resultsCount Number of results returned
 */
export function trackSearch(
  req: Request,
  searchTerm: string,
  searchContext: string,
  resultsCount: number
): void {
  trackFeatureUsage(req, 'Search', FeatureCategory.SEARCH, {
    searchTerm,
    searchContext,
    resultsCount
  });
}

/**
 * Track data export activity
 * 
 * @param req Express request object
 * @param exportType Type of export (CSV, JSON, etc.)
 * @param dataType Type of data being exported
 * @param recordCount Number of records exported
 */
export function trackExport(
  req: Request,
  exportType: string,
  dataType: string,
  recordCount: number
): void {
  trackFeatureUsage(req, 'Data Export', FeatureCategory.EXPORT, {
    exportType,
    dataType,
    recordCount
  });
}

/**
 * Track data import activity
 * 
 * @param req Express request object
 * @param importType Type of import (CSV, JSON, etc.)
 * @param dataType Type of data being imported
 * @param recordCount Number of records imported
 * @param successCount Number of records successfully imported
 * @param errorCount Number of records with errors
 */
export function trackImport(
  req: Request,
  importType: string,
  dataType: string,
  recordCount: number,
  successCount: number,
  errorCount: number
): void {
  trackFeatureUsage(req, 'Data Import', FeatureCategory.IMPORT, {
    importType,
    dataType,
    recordCount,
    successCount,
    errorCount,
    errorRate: errorCount > 0 ? (errorCount / recordCount) * 100 : 0
  });
}