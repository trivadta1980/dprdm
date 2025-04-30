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
      totalCount = Number(totalItemsResult[0]?.count ?? 0);
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
      // Exclude full data by default for performance (can be included in detail view)
      // oldValue: auditLogs.oldValue,
      // newValue: auditLogs.newValue,
    })
      .from(auditLogs)
      .where(filters.length > 0 ? and(...filters) : undefined)
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

    console.log(`GET /api/audit-logs - Retrieved ${results.length} logs`);
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

    // Format result to prevent exposing sensitive information
    const auditLog = {
      ...result.audit_logs,
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

    // Execute count query
    const totalItems = await db.select({ count: db.fn.count() })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.module, entityType as any),
          eq(auditLogs.entityId, entityId)
        )
      );

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
        totalItems: parseInt(totalItems[0].count.toString()),
        totalPages: Math.ceil(parseInt(totalItems[0].count.toString()) / limit),
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

    // Execute count query
    const totalItems = await db.select({ count: db.fn.count() })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId));

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
        totalItems: parseInt(totalItems[0].count.toString()),
        totalPages: Math.ceil(parseInt(totalItems[0].count.toString()) / limit),
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

    return res.status(200).json({
      actionCounts,
      moduleCounts,
      userCounts,
      dateCounts,
      totalLogs: await db.select({ count: db.fn.count() }).from(auditLogs),
    });
  } catch (error) {
    console.error("Error fetching audit statistics:", error);
    return res.status(500).json({ error: "Failed to fetch audit statistics" });
  }
});

export default router;