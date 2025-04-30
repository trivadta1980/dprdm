/**
 * Error Logger Utility
 * 
 * Specialized logger for capturing detailed error information.
 * Implements configurable log levels and detailed error tracking.
 */

import { logSystemEvent } from './auditLogger';

// Log levels for controlling verbosity
export enum LogLevel {
  ERROR = 0,   // Only critical errors
  WARNING = 1, // Warnings and errors
  INFO = 2,    // Standard information plus warnings and errors
  DEBUG = 3,   // Detailed debug information
  TRACE = 4,   // Most granular information
}

// Current log level - can be set via environment variables or configuration
let currentLogLevel = LogLevel.INFO;

/**
 * Set the current log level
 */
export function setLogLevel(level: LogLevel) {
  currentLogLevel = level;
  logSystemEvent(
    'SYSTEM',
    'SYSTEM',
    'log-level',
    'Log Level Changed',
    { previousLevel: LogLevel[currentLogLevel], newLevel: LogLevel[level] }
  );
  currentLogLevel = level;
}

/**
 * Log a critical error
 * Always logged regardless of log level
 */
export function logError(
  error: Error | string,
  module: string,
  entityId?: string | number,
  context?: Record<string, any>
) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[ERROR] [${module}] ${errorMessage}`);
  
  return logSystemEvent(
    'SYSTEM',
    module as any,
    entityId?.toString() || 'error',
    `Error: ${errorMessage.substring(0, 100)}`,
    {
      errorLevel: 'ERROR',
      message: errorMessage,
      stack: errorStack,
      ...context
    }
  );
}

/**
 * Log a warning
 * Only logged if level is WARNING or higher
 */
export function logWarning(
  message: string,
  module: string,
  entityId?: string | number,
  context?: Record<string, any>
) {
  if (currentLogLevel < LogLevel.WARNING) return null;
  
  console.warn(`[WARNING] [${module}] ${message}`);
  
  return logSystemEvent(
    'SYSTEM',
    module as any,
    entityId?.toString() || 'warning',
    `Warning: ${message.substring(0, 100)}`,
    {
      errorLevel: 'WARNING',
      message,
      ...context
    }
  );
}

/**
 * Log information
 * Only logged if level is INFO or higher
 */
export function logInfo(
  message: string,
  module: string,
  entityId?: string | number,
  context?: Record<string, any>
) {
  if (currentLogLevel < LogLevel.INFO) return null;
  
  console.log(`[INFO] [${module}] ${message}`);
  
  return logSystemEvent(
    'SYSTEM',
    module as any,
    entityId?.toString() || 'info',
    `Info: ${message.substring(0, 100)}`,
    {
      errorLevel: 'INFO',
      message,
      ...context
    }
  );
}

/**
 * Log debug information
 * Only logged if level is DEBUG or higher
 */
export function logDebug(
  message: string,
  module: string,
  entityId?: string | number,
  context?: Record<string, any>
) {
  if (currentLogLevel < LogLevel.DEBUG) return null;
  
  console.debug(`[DEBUG] [${module}] ${message}`);
  
  return logSystemEvent(
    'SYSTEM',
    module as any,
    entityId?.toString() || 'debug',
    `Debug: ${message.substring(0, 100)}`,
    {
      errorLevel: 'DEBUG',
      message,
      ...context
    }
  );
}

/**
 * Log trace information (most detailed level)
 * Only logged if level is TRACE
 */
export function logTrace(
  message: string,
  module: string,
  entityId?: string | number,
  context?: Record<string, any>
) {
  if (currentLogLevel < LogLevel.TRACE) return null;
  
  console.debug(`[TRACE] [${module}] ${message}`);
  
  return logSystemEvent(
    'SYSTEM',
    module as any,
    entityId?.toString() || 'trace',
    `Trace: ${message.substring(0, 100)}`,
    {
      errorLevel: 'TRACE',
      message,
      ...context
    }
  );
}

/**
 * Handle and log an error with proper HTTP response
 * This is a helper for API routes
 */
export function handleError(error: any, res: any, module: string, entityId?: string | number) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  logError(error, module, entityId, {
    statusCode: 500,
    endpoint: res.req?.originalUrl,
    method: res.req?.method
  });
  
  return res.status(500).json({ error: errorMessage });
}

/**
 * Parse and log validation errors
 */
export function logValidationError(
  validationErrors: any,
  module: string,
  entityId?: string | number,
  requestData?: Record<string, any>
) {
  const context = {
    validationErrors,
    requestData: sanitizeData(requestData || {})
  };
  
  return logWarning(
    `Validation error: ${JSON.stringify(validationErrors)}`,
    module,
    entityId,
    context
  );
}

/**
 * Sanitize data before logging by removing sensitive fields
 */
function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key'];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '******';
    }
  });
  
  return sanitized;
}