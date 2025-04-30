/**
 * Audit Logs API Routes
 * 
 * API endpoints for retrieving and filtering audit logs.
 * These routes are only accessible by administrators or users with audit view permissions.
 */

import { Router, Request, Response } from "express";
import { db } from "./db";
import { auditLogs, users, roles } from "@shared/schema";
import { eq, desc, and, gte, lte, ilike, inArray } from "drizzle-orm";
import { requireAuth } from "./auth";

// Create a router for audit routes
const router = Router();

// Ensure the stats endpoint is registered before the general audit logs endpoint
// to avoid route conflicts.

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

    // Get count by action type
    const actionCounts = await db
      .select({
        actionType: auditLogs.actionType,
        count: db.fn.count(),
      })
      .from(auditLogs)
      .groupBy(auditLogs.actionType);

    // Get count by module
    const moduleCounts = await db
      .select({
        module: auditLogs.module,
        count: db.fn.count(),
      })
      .from(auditLogs)
      .groupBy(auditLogs.module);

    // Get count by user (top 10)
    const userCounts = await db
      .select({
        userId: auditLogs.userId,
        username: auditLogs.username,
        count: db.fn.count(),
      })
      .from(auditLogs)
      .groupBy(auditLogs.userId, auditLogs.username)
      .orderBy(desc(db.fn.count()))
      .limit(10);

    // Get counts by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dateCounts = await db
      .select({
        date: db.sql`DATE(${auditLogs.timestamp})`,
        count: db.fn.count(),
      })
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, thirtyDaysAgo))
      .groupBy(db.sql`DATE(${auditLogs.timestamp})`)
      .orderBy(db.sql`DATE(${auditLogs.timestamp})`);

    // Calculate statistics for the client display with proper error handling
    let totalActions = 0;
    try {
      const totalCountResult = await db.select({ count: db.fn.count() }).from(auditLogs);
      console.log("Total count result:", totalCountResult);
      
      if (totalCountResult && totalCountResult.length > 0) {
        if (totalCountResult[0].count !== undefined && totalCountResult[0].count !== null) {
          totalActions = Number(totalCountResult[0].count);
        }
      }
    } catch (error) {
      console.error("Error counting total actions:", error);
    }
    
    // Count user-specific actions (login, logout, and user-generated actions)
    const userActions = actionCounts
      .filter(action => ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE'].includes(action.actionType))
      .reduce((sum, item) => sum + Number(item.count), 0);
    
    // Count data changes (create, update, delete)
    const dataChanges = actionCounts
      .filter(action => ['CREATE', 'UPDATE', 'DELETE'].includes(action.actionType))
      .reduce((sum, item) => sum + Number(item.count), 0);
    
    // Count system events (everything else)
    const systemEvents = Number(totalActions) - Number(userActions);
    
    // Format recent activity
    const recentActions = await db
      .select({
        id: auditLogs.id,
        timestamp: auditLogs.timestamp,
        username: auditLogs.username,
        actionType: auditLogs.actionType,
        module: auditLogs.module,
        entityName: auditLogs.entityName,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(5);

    return res.status(200).json({
      actionCounts,
      moduleCounts,
      userCounts,
      dateCounts,
      totalLogs: totalActions,
      // Statistics for the UI cards
      totalActions,
      userActions,
      dataChanges,
      systemEvents,
      recentActions,
    });
  } catch (error) {
    console.error("Error fetching audit statistics:", error);
    return res.status(500).json({ error: "Failed to fetch audit statistics" });
  }
});

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
      const countQuery = db.select({ 
        count: db.fn.count()
      }).from(auditLogs);
      
      // Only add where clause if filters exist
      if (filters.length > 0) {
        countQuery.where(and(...filters));
      }
      
      const totalItemsResult = await countQuery;
      console.log("Count query result:", JSON.stringify(totalItemsResult));
      
      // More robust error handling
      if (totalItemsResult && Array.isArray(totalItemsResult) && totalItemsResult.length > 0) {
        const countValue = totalItemsResult[0]?.count;
        if (countValue !== undefined && countValue !== null) {
          totalCount = Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting audit logs:", error);
      totalCount = 0;
    }

    // Execute data query with filters, sorting, pagination
    const dataQuery = db.select({
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
      // Exclude full data by default for performance (can be included in detail view)
      // oldValue: auditLogs.oldValue,
      // newValue: auditLogs.newValue,
    })
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);
      
    // Only add where clause if filters exist
    if (filters.length > 0) {
      dataQuery.where(and(...filters));
    }
    
    const rawResults = await dataQuery;
    
    // Map field names for frontend compatibility
    const mappedResults = rawResults.map(log => ({
      ...log,
      userIp: log.ipAddress,        // Frontend expects userIp instead of ipAddress
      entityType: log.module,       // Frontend expects entityType instead of module
      details: log.changeSummary    // Frontend expects details
    }));

    // Format response with pagination metadata
    const response = {
      data: mappedResults,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    console.log(`GET /api/audit-logs - Retrieved ${rawResults.length} logs`);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({ error: "Failed to fetch audit logs" });
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

    // Format result to prevent exposing sensitive information and map field names for frontend
    const auditLog = {
      ...result.audit_logs,
      // Map backend field names to what frontend expects
      userIp: result.audit_logs.ipAddress,         // Frontend expects userIp instead of ipAddress
      entityType: result.audit_logs.module,        // Frontend expects entityType instead of module 
      details: result.audit_logs.changeSummary,    // Frontend expects details
      userDetails: result.users ? {
        id: result.users.id,
        username: result.users.username,
        email: result.users.email,
        roleId: result.users.roleId,
      } : null,
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
      
      console.log("Entity count query result:", JSON.stringify(totalItems));
      
      if (totalItems && Array.isArray(totalItems) && totalItems.length > 0) {
        const countValue = totalItems[0]?.count;
        if (countValue !== undefined && countValue !== null) {
          totalCount = Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting entity audit logs:", error);
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
      module: auditLogs.module,       // Include for field mapping
      ipAddress: auditLogs.ipAddress  // Include for field mapping
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

    // Map field names for frontend compatibility
    const mappedResults = results.map(log => ({
      ...log,
      userIp: log.ipAddress,        // Frontend expects userIp instead of ipAddress
      entityType: log.module,       // Frontend expects entityType instead of module
      details: log.changeSummary    // Frontend expects details
    }));

    // Format response with pagination metadata
    const response = {
      data: mappedResults,
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
      
      console.log("User count query result:", JSON.stringify(totalItems));
      
      if (totalItems && Array.isArray(totalItems) && totalItems.length > 0) {
        const countValue = totalItems[0]?.count;
        if (countValue !== undefined && countValue !== null) {
          totalCount = Number(countValue);
        }
      }
    } catch (error) {
      console.error("Error counting user audit logs:", error);
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
      ipAddress: auditLogs.ipAddress  // Include for field mapping
    })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    // Map field names for frontend compatibility
    const mappedResults = results.map(log => ({
      ...log,
      userIp: log.ipAddress,        // Frontend expects userIp instead of ipAddress
      entityType: log.module,       // Frontend expects entityType instead of module
      details: log.changeSummary    // Frontend expects details
    }));

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
      data: mappedResults,
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



export default router;