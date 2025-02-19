import { pgTable, text, serial, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, type InferModel } from "drizzle-orm";

// Add routes type and array
const availableRoutes = [
  "/reference-types",
  "/reference-data",
  "/relationships",
  "/crosswalks",
] as const;

export type AvailableRoute = typeof availableRoutes[number];

// Roles table with routes
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  routes: text("routes").array(),
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

// Add after the existing tables
export const referenceDataTypes = pgTable("reference_data_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const referenceDataTypeSchemas = pgTable("reference_data_type_schemas", {
  id: serial("id").primaryKey(),
  referenceDataTypeId: integer("reference_data_type_id")
    .references(() => referenceDataTypes.id)
    .notNull(),
  name: text("name").notNull(),
  dataType: text("data_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add relations
export const referenceDataTypesRelations = relations(referenceDataTypes, ({ many }) => ({
  schemas: many(referenceDataTypeSchemas),
  dataSets: many(referenceDataSets),
}));

export const referenceDataTypeSchemasRelations = relations(referenceDataTypeSchemas, ({ one }) => ({
  referenceDataType: one(referenceDataTypes, {
    fields: [referenceDataTypeSchemas.referenceDataTypeId],
    references: [referenceDataTypes.id],
  }),
}));

// Add Reference Data Sets table
export const referenceDataSets = pgTable("reference_data_sets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  typeId: integer("type_id")
    .references(() => referenceDataTypes.id)
    .notNull(),
  data: jsonb("data").notNull(),  // Store the dynamic data according to schema
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add relations
export const referenceDataSetsRelations = relations(referenceDataSets, ({ one }) => ({
  type: one(referenceDataTypes, {
    fields: [referenceDataSets.typeId],
    references: [referenceDataTypes.id],
  }),
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
}).extend({
  routes: z.array(z.string()),
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

// Add after the existing schemas
export const insertReferenceDataTypeSchema = createInsertSchema(referenceDataTypes).extend({
  schemas: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      dataType: z.string().min(1, "Data type is required"),
    })
  ),
});

// Add after the existing schemas
export const insertReferenceDataSetSchema = createInsertSchema(referenceDataSets).extend({
  data: z.record(z.string(), z.any()), // Dynamic schema based on reference type
});

// Types
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

// Add this type definition after the existing types
export type HistoryEntry = {
  timestamp: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
};

export type ReferenceDataInstance = {
  [key: string]: string;
  _history?: HistoryEntry[];
};

// Add after the existing types
export type InsertReferenceDataType = z.infer<typeof insertReferenceDataTypeSchema>;
export type ReferenceDataType = typeof referenceDataTypes.$inferSelect;
export type ReferenceDataTypeSchema = typeof referenceDataTypeSchemas.$inferSelect;
export type InsertReferenceDataSet = z.infer<typeof insertReferenceDataSetSchema>;

// Update the ReferenceDataSet type
export type ReferenceDataSet = typeof referenceDataSets.$inferSelect & {
  data: Record<string, ReferenceDataInstance>;
};