import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Add available routes type
export const availableRoutes = [
  {
    path: "/users",
    name: "User Management",
    description: "Manage system users",
    adminOnly: true
  },
  {
    path: "/roles",
    name: "Role Management",
    description: "Manage user roles and permissions",
    adminOnly: true
  },
  {
    path: "/reference-types",
    name: "Reference Data Types",
    description: "Manage reference data types"
  },
  {
    path: "/reference-data",
    name: "Reference Data",
    description: "Manage reference data"
  },
  {
    path: "/relationships",
    name: "Relationships",
    description: "Manage data relationships"
  },
  {
    path: "/crosswalks",
    name: "Crosswalks",
    description: "Manage data crosswalks"
  }
] as const;

// Roles table with route permissions
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  routePermissions: text("route_permissions").array(), // Store array of permitted route paths
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table with enhanced fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  requirePasswordChange: boolean("require_password_change").default(false).notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

// Base schema without password confirmation
const baseUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  roleId: true,
});

// Registration schema with password requirements and confirmation
export const insertUserSchema = baseUserSchema.extend({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password reset request schema
export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Password reset schema
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Update schema without password fields
export const updateUserSchema = baseUserSchema.omit({
  password: true
});

// Validation schemas
export const insertRoleSchema = createInsertSchema(roles).pick({
  name: true,
  description: true,
  routePermissions: true,
}).extend({
  routePermissions: z.array(z.string()).default([])
});

// Add password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

// Types
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type RouteConfig = typeof availableRoutes[number];