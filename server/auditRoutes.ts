/**
 * Audit Logs API Routes
 * 
 * API endpoints for retrieving and filtering audit logs.
 * These routes are only accessible by administrators or users with audit view permissions.
 */

import { Router, Request, Response } from "express";
import { db } from "./db";
import { auditLogs, users, roles } from "@shared/schema";
import { eq, desc, and, gte, lte, ilike, inArray, or, between } from "drizzle-orm";
import { requireAuth } from "./auth";

// Create a router for audit routes
const router = Router();

/**
 * @route GET /api/audit-logs
 * @description Get all audit logs with filtering and pagination
 * @access Admin
 */
router.get("/audit-logs", requireAuth, async (req: Request, res: Response) => {
  console.log("GET /api/audit-logs - Request received");
  try {
    // Only allow administrators to access audit logs
    if (!req.isAuthenticated() || !req.user?.roleId || req.user.roleId !== 1) {
      return res.status(403).json({ error: "Not authorized to view audit logs" });
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Extract filter parameters
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const username = req.query.username as string | undefined;
    const action = req.query.action as string | undefined;
    const module = req.query.module as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const search = req.query.search as string | undefined;

    // Build query filters
    let filters = [];

    if (userId) {
      filters.push(eq(auditLogs.userId, userId));
    }

    if (username) {
      filters.push(ilike(auditLogs.username, `%${username}%`));
    }

    if (action) {
      // Handle multiple actions as comma-separated list
      if (action.includes(',')) {
        const actions = action.split(',');
        filters.push(inArray(auditLogs.actionType, actions as any[]));
      } else {
        filters.push(eq(auditLogs.actionType, action as any));
      }
    }

    if (module) {
      // Handle multiple modules as comma-separated list
      if (module.includes(',')) {
        const modules = module.split(',');
        filters.push(inArray(auditLogs.module, modules as any[]));
      } else {
        filters.push(eq(auditLogs.module, module as any));
      }
    }

    if (entityId) {
      filters.push(eq(auditLogs.entityId, entityId));
    }

    if (startDate) {
      filters.push(gte(auditLogs.timestamp, new Date(startDate)));
    }

    if (endDate) {
      filters.push(lte(auditLogs.timestamp, new Date(endDate)));
    }

    if (search) {
      // Search across multiple fields
      filters.push(
        ilike(auditLogs.entityName, `%${search}%`)
      );
    }

    // Execute count query with error handling
    let totalCount = 0;
    try {
      // Use count() directly and handle the case when filters is empty
      const filterCondition = filters.length > 0 ? and(...filters) : undefined;
      const countQuery = db.select({ count: db.fn.count() }).from(auditLogs);
      
      // Only apply where clause if we have filters
      const totalItemsResult = filterCondition 
        ? await countQuery.where(filterCondition)
        : await countQuery;
      
      // Safely access the count value with fallback
      if (totalItemsResult && totalItemsResult.length > 0) {
        // Handle different types of count results (PostgreSQL vs SQLite)
        const countValue = totalItemsResult[0]?.count;
        if (countValue !== undefined) {
          totalCount = typeof countValue === 'number' 
            ? countValue 
            : Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting audit logs:", error);
      totalCount = 0;
    }

    // Execute data query with filters, sorting, pagination
    const results = await db.select({
      id: auditLogs.id,
      timestamp: auditLogs.timestamp,
      userId: auditLogs.userId,
      username: auditLogs.username,
      ipAddress: auditLogs.ipAddress,
      actionType: auditLogs.actionType,
      module: auditLogs.module,
      entityId: auditLogs.entityId,
      entityName: auditLogs.entityName,
      changeSummary: auditLogs.changeSummary,
      oldValue: auditLogs.oldValue,
      newValue: auditLogs.newValue,
      additionalContext: auditLogs.additionalContext,
    })
      .from(auditLogs)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    // Process the results to enhance with details
    const enhancedResults = results.map(log => {
      // Generate a details field if not already present
      let details = log.changeSummary;
      if (!details && log.actionType) {
        const actionVerb = getActionVerb(log.actionType);
        details = `${actionVerb} ${log.module?.toLowerCase() || 'entity'} ${log.entityName || ''}`;
        
        // Try to extract path info from additionalContext if available
        if (log.additionalContext && typeof log.additionalContext === 'object') {
          try {
            const context = log.additionalContext;
            if (context.path) {
              details += ` (${context.method || ''} ${context.path})`;
            }
          } catch (e) {
            // Ignore context parsing errors
          }
        }
      }
      
      return {
        ...log,
        details, // Add the properly formatted details field
        // Generate basic changes made preview if available
        changesMade: (log.oldValue && log.newValue) ? 
          generateChangeList(log.oldValue, log.newValue).slice(0, 3) : // Just first 3 for preview
          []
      };
    });
    
    // Format response with pagination metadata
    const response = {
      data: enhancedResults,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    console.log(`GET /api/audit-logs - Retrieved ${results.length} logs`);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

/**
 * @route GET /api/audit-logs/stats
 * @description Get statistics about audit logs (counts by type, etc.)
 * @access Admin
 */
router.get("/audit-logs/stats", requireAuth, async (req: Request, res: Response) => {
  console.log("GET /api/audit-logs/stats - Request received");
  try {
    // Only allow administrators to access audit stats
    if (!req.isAuthenticated() || !req.user?.roleId || req.user.roleId !== 1) {
      return res.status(403).json({ error: "Not authorized to view audit statistics" });
    }

    // Get summary statistics for the dashboard
    // To avoid errors with empty tables, we'll use more robust queries
    let totalActions = 0, userActions = 0, dataChanges = 0, systemEvents = 0;
    let recentActions = [];

    // Get total actions count
    try {
      const totalResult = await db.select({ count: db.fn.count() }).from(auditLogs);
      
      // Handle different types of count results (PostgreSQL vs SQLite)
      if (totalResult && totalResult.length > 0) {
        const countValue = totalResult[0]?.count;
        if (countValue !== undefined) {
          totalActions = typeof countValue === 'number' 
            ? countValue 
            : Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting total actions:", error);
    }

    // Get user-related actions count (LOGIN, LOGOUT, etc.)
    try {
      const userResult = await db
        .select({ count: db.fn.count() })
        .from(auditLogs)
        .where(
          or(
            eq(auditLogs.module, 'USER'),
            eq(auditLogs.actionType, 'LOGIN'),
            eq(auditLogs.actionType, 'LOGOUT')
          )
        );
      
      // Handle different types of count results (PostgreSQL vs SQLite)
      if (userResult && userResult.length > 0) {
        const countValue = userResult[0]?.count;
        if (countValue !== undefined) {
          userActions = typeof countValue === 'number' 
            ? countValue 
            : Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting user actions:", error);
    }

    // Get data change actions count (CREATE, UPDATE, DELETE)
    try {
      const dataResult = await db
        .select({ count: db.fn.count() })
        .from(auditLogs)
        .where(
          or(
            eq(auditLogs.actionType, 'CREATE'),
            eq(auditLogs.actionType, 'UPDATE'),
            eq(auditLogs.actionType, 'DELETE')
          )
        );
      
      // Handle different types of count results (PostgreSQL vs SQLite)
      if (dataResult && dataResult.length > 0) {
        const countValue = dataResult[0]?.count;
        if (countValue !== undefined) {
          dataChanges = typeof countValue === 'number' 
            ? countValue 
            : Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting data changes:", error);
    }

    // Get system events count (ERROR, INFO, WARNING)
    try {
      const systemResult = await db
        .select({ count: db.fn.count() })
        .from(auditLogs)
        .where(
          or(
            eq(auditLogs.actionType, 'ERROR'),
            eq(auditLogs.actionType, 'INFO'),
            eq(auditLogs.actionType, 'WARNING'),
            eq(auditLogs.actionType, 'FEATURE_USAGE')
          )
        );
      
      // Handle different types of count results (PostgreSQL vs SQLite)
      if (systemResult && systemResult.length > 0) {
        const countValue = systemResult[0]?.count;
        if (countValue !== undefined) {
          systemEvents = typeof countValue === 'number' 
            ? countValue 
            : Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting system events:", error);
    }

    // Get recent audit logs
    try {
      recentActions = await db.select({
        id: auditLogs.id,
        timestamp: auditLogs.timestamp,
        userId: auditLogs.userId,
        username: auditLogs.username,
        actionType: auditLogs.actionType,
        module: auditLogs.module,
        entityId: auditLogs.entityId,
        entityName: auditLogs.entityName,
        changeSummary: auditLogs.changeSummary,
      })
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(10);
    } catch (error) {
      console.error("Error fetching recent audit logs:", error);
      recentActions = [];
    }

    // Return formatted response with the counts
    return res.status(200).json({
      totalActions,
      userActions,
      dataChanges, 
      systemEvents,
      recentActions
    });
  } catch (error) {
    console.error("Error fetching audit statistics:", error);
    return res.status(500).json({ error: "Failed to fetch audit statistics" });
  }
});

/**
 * @route GET /api/audit-logs/:id
 * @description Get detailed information for a specific audit log
 * @access Admin
 */
router.get("/audit-logs/:id", requireAuth, async (req: Request, res: Response) => {
  console.log(`GET /api/audit-logs/${req.params.id} - Request received`);
  try {
    // Only allow administrators to access audit logs
    if (!req.isAuthenticated() || !req.user?.roleId || req.user.roleId !== 1) {
      return res.status(403).json({ error: "Not authorized to view audit logs" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid audit log ID" });
    }

    // Fetch full audit log details
    const [result] = await db.select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .leftJoin(users, eq(auditLogs.userId, users.id));

    if (!result) {
      return res.status(404).json({ error: "Audit log not found" });
    }

    // Format result to prevent exposing sensitive information and enhance with richer details
    const oldData = result.audit_logs.oldValue;
    const newData = result.audit_logs.newValue;
    
    // Generate a list of changes for display
    const changesMade = [];
    
    // If we have both old and new values, generate a detailed change list
    if (oldData && newData) {
      try {
        // Get all unique keys from both objects
        const allKeys = [...new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})])];
        
        // Create change entries for each modified field
        allKeys.forEach(key => {
          if (key === 'updatedAt' || key === 'lastActivity') return; // Skip some fields
          
          const oldValue = oldData[key];
          const newValue = newData[key];
          
          // Check if values are different
          if (
            (!oldData.hasOwnProperty(key) && newData.hasOwnProperty(key)) ||
            (oldData.hasOwnProperty(key) && !newData.hasOwnProperty(key)) ||
            JSON.stringify(oldValue) !== JSON.stringify(newValue)
          ) {
            changesMade.push({
              field: key,
              oldValue: oldValue === undefined ? 'N/A' : typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
              newValue: newValue === undefined ? 'N/A' : typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)
            });
          }
        });
      } catch (error) {
        console.warn("Error generating changes for audit log:", error);
      }
    }
    
    // Generate a human-readable details string if not already present
    let details = result.audit_logs.changeSummary;
    if (!details && result.audit_logs.actionType) {
      const actionVerb = getActionVerb(result.audit_logs.actionType);
      details = `${actionVerb} ${result.audit_logs.module?.toLowerCase() || 'entity'} ${result.audit_logs.entityName || ''}`;
      
      // Add more context from additional_context if available
      if (result.audit_logs.additionalContext) {
        try {
          const context = result.audit_logs.additionalContext;
          if (context.path) {
            details += ` (${context.method || ''} ${context.path})`;
          }
        } catch (e) {
          // Ignore context parsing errors
        }
      }
    }
    
    // Construct the enhanced audit log
    const auditLog = {
      ...result.audit_logs,
      userDetails: result.users ? {
        id: result.users.id,
        username: result.users.username,
        email: result.users.email,
        roleId: result.users.roleId,
      } : null,
      details: details,
      changesMade: changesMade,
      sessionData: result.audit_logs.additionalContext ? 
        { 
          id: result.audit_logs.additionalContext.sessionID,
          userAgent: result.audit_logs.additionalContext.userAgent,
          referer: result.audit_logs.additionalContext.referer 
        } : null
    };

    return res.status(200).json(auditLog);
  } catch (error) {
    console.error(`Error fetching audit log ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to fetch audit log details" });
  }
});

/**
 * @route GET /api/audit-logs/entity/:type/:id
 * @description Get audit logs for a specific entity
 * @access Admin
 */
router.get("/audit-logs/entity/:type/:id", requireAuth, async (req: Request, res: Response) => {
  console.log(`GET /api/audit-logs/entity/${req.params.type}/${req.params.id} - Request received`);
  try {
    // Only allow administrators to access audit logs
    if (!req.isAuthenticated() || !req.user?.roleId || req.user.roleId !== 1) {
      return res.status(403).json({ error: "Not authorized to view audit logs" });
    }

    const entityType = req.params.type.toUpperCase();
    const entityId = req.params.id;

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Execute count query with error handling
    let totalCount = 0;
    try {
      const totalItems = await db.select({ count: db.fn.count() })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.module, entityType as any),
            eq(auditLogs.entityId, entityId)
          )
        );
        
      // Safely access the count value with fallback
      if (totalItems && totalItems.length > 0) {
        // Handle different types of count results (PostgreSQL vs SQLite)
        const countValue = totalItems[0]?.count;
        if (countValue !== undefined) {
          totalCount = typeof countValue === 'number' 
            ? countValue 
            : Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting entity audit logs:", error);
      totalCount = 0;
    }

    // Execute data query
    const results = await db.select({
      id: auditLogs.id,
      timestamp: auditLogs.timestamp,
      userId: auditLogs.userId,
      username: auditLogs.username,
      actionType: auditLogs.actionType,
      entityName: auditLogs.entityName,
      changeSummary: auditLogs.changeSummary,
    })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.module, entityType as any),
          eq(auditLogs.entityId, entityId)
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    // Format response with pagination metadata
    const response = {
      data: results,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    console.log(`GET /api/audit-logs/entity/${req.params.type}/${req.params.id} - Retrieved ${results.length} logs`);
    return res.status(200).json(response);
  } catch (error) {
    console.error(`Error fetching entity audit logs:`, error);
    return res.status(500).json({ error: "Failed to fetch entity audit logs" });
  }
});

/**
 * @route GET /api/audit-logs/user/:id
 * @description Get all audit logs for a specific user
 * @access Admin
 */
router.get("/audit-logs/user/:id", requireAuth, async (req: Request, res: Response) => {
  console.log(`GET /api/audit-logs/user/${req.params.id} - Request received`);
  try {
    // Only allow administrators to access user audit logs
    if (!req.isAuthenticated() || !req.user?.roleId || req.user.roleId !== 1) {
      return res.status(403).json({ error: "Not authorized to view user audit logs" });
    }

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Execute count query with error handling
    let totalCount = 0;
    try {
      const totalItems = await db.select({ count: db.fn.count() })
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId));
        
      // Safely access the count value with fallback
      if (totalItems && totalItems.length > 0) {
        // Handle different types of count results (PostgreSQL vs SQLite)
        const countValue = totalItems[0]?.count;
        if (countValue !== undefined) {
          totalCount = typeof countValue === 'number' 
            ? countValue 
            : Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting user audit logs:", error);
      totalCount = 0;
    }

    // Execute data query
    const results = await db.select({
      id: auditLogs.id,
      timestamp: auditLogs.timestamp,
      actionType: auditLogs.actionType,
      module: auditLogs.module,
      entityId: auditLogs.entityId,
      entityName: auditLogs.entityName,
      changeSummary: auditLogs.changeSummary,
    })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    // Get user details
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      roleId: users.roleId,
    })
      .from(users)
      .where(eq(users.id, userId));

    // Format response with pagination metadata
    const response = {
      data: results,
      user,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    console.log(`GET /api/audit-logs/user/${req.params.id} - Retrieved ${results.length} logs`);
    return res.status(200).json(response);
  } catch (error) {
    console.error(`Error fetching user audit logs:`, error);
    return res.status(500).json({ error: "Failed to fetch user audit logs" });
  }
});

/**
 * Helper function to generate a list of changes between two objects
 * This is used to display what changed in an audit log entry
 */
function generateChangeList(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  ignoredFields: string[] = ['updatedAt', 'lastActivity']
): { field: string; oldValue: string; newValue: string }[] {
  const changes: { field: string; oldValue: string; newValue: string }[] = [];
  
  try {
    // Get all unique keys from both objects
    const allKeys = [...new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})])];
    
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
          oldValue: oldValue === undefined ? 'N/A' : typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
          newValue: newValue === undefined ? 'N/A' : typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)
        });
      }
    });
  } catch (error) {
    console.warn("Error generating changes:", error);
  }
  
  return changes;
}

/**
 * Helper function to get a human-readable verb for the action type
 * This mirrors the function in auditLogger.ts but is duplicated here to avoid circular dependencies
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

export default router;