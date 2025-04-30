/**
 * Error Logger
 * 
 * Specialized logging utility for capturing and storing error information
 * with configurable detail levels. Integrated with the audit trail system.
 */

import { logCrudEvent } from './auditLogger';
import { Request } from 'express';

// Define error severity levels
export enum ErrorSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE'
}

/**
 * Log an API error with contextual information
 * 
 * @param req Express request object
 * @param error The error that occurred
 * @param severity Error severity level
 * @param details Additional contextual details
 */
export function logApiError(
  req: Request,
  error: Error,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  details?: Record<string, any>
): void {
  // Extract useful information from the request
  const path = req.path;
  const method = req.method;
  const userId = req.user?.id;
  const username = req.user?.username || 'anonymous';
  
  // Create error details for logging
  const errorDetails = {
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
    requestPath: path,
    requestMethod: method,
    userId,
    username,
    ...details
  };
  
  // Log based on severity
  logCrudEvent(
    req,
    severity,
    'SYSTEM',
    `error_${Date.now()}`,
    'API Error',
    null,
    null,
    `[${severity}] ${error.name}: ${error.message} (${method} ${path})`,
    errorDetails
  );
  
  // If this is a serious error, also log to console
  if (severity === ErrorSeverity.ERROR) {
    console.error(`API Error [${method} ${path}]:`, error);
  }
}

/**
 * Log a system error not tied to an API request
 * 
 * @param error The error that occurred
 * @param context Context information about where the error occurred
 * @param severity Error severity level
 * @param details Additional contextual details
 */
export function logSystemError(
  error: Error,
  context: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  details?: Record<string, any>
): void {
  // Create error details for logging
  const errorDetails = {
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
    context,
    ...details
  };
  
  // Create a fake request with minimal information
  const fakeReq = {
    path: '/system',
    method: 'SYSTEM',
    user: { id: 0, username: 'system' }
  } as any;
  
  // Log based on severity
  logCrudEvent(
    fakeReq,
    severity,
    'SYSTEM',
    `error_${Date.now()}`,
    'System Error',
    null,
    null,
    `[${severity}] ${error.name}: ${error.message} (${context})`,
    errorDetails
  );
  
  // If this is a serious error, also log to console
  if (severity === ErrorSeverity.ERROR || severity === ErrorSeverity.WARNING) {
    console.error(`System Error [${context}]:`, error);
  }
}

/**
 * Log a warning message that isn't tied to an exception
 * 
 * @param message Warning message
 * @param context Context information about where the warning occurred
 * @param details Additional contextual details
 */
export function logWarning(
  message: string,
  context: string,
  details?: Record<string, any>
): void {
  const fakeReq = {
    path: '/system',
    method: 'SYSTEM',
    user: { id: 0, username: 'system' }
  } as any;
  
  logCrudEvent(
    fakeReq,
    'WARNING',
    'SYSTEM',
    `warning_${Date.now()}`,
    'System Warning',
    null,
    null,
    `[WARNING] ${message} (${context})`,
    details
  );
  
  console.warn(`Warning [${context}]: ${message}`);
}

/**
 * Process a caught error and log it appropriately
 * 
 * @param error The error that occurred
 * @param context Information about where the error occurred
 * @param req Optional Express request object if this is an API error
 */
export function processError(
  error: Error,
  context: string,
  req?: Request
): void {
  if (req) {
    logApiError(req, error, ErrorSeverity.ERROR, { context });
  } else {
    logSystemError(error, context);
  }
}

/**
 * Simple wrapper for try/catch blocks to log errors
 * 
 * @param fn Function to execute
 * @param context Context information for error logging
 * @param req Optional Express request object
 * @returns The result of the function or undefined if an error occurred
 */
export async function tryCatchWithLogging<T>(
  fn: () => Promise<T>,
  context: string,
  req?: Request
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    processError(error as Error, context, req);
    return undefined;
  }
}