import { pgTable, text, serial, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, type InferModel } from "drizzle-orm";
import { pgEnum } from "drizzle-orm/pg-core";

// Add the session table definition if it doesn't exist
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { mode: "date" }).notNull(),
});

// Update the availableRoutes array
const availableRoutes = [
  "/reference-types",
  "/reference-data",
  "/relationships",
  "/crosswalks",
  "/approvals", // Add new approvals route
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

// Add Relationships table
export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  name: text("relationship_name").notNull(),
  sourceDataSetId: integer("source_dataset_id")
    .references(() => referenceDataSets.id)
    .notNull(),
  targetDataSetId: integer("target_dataset_id")
    .references(() => referenceDataSets.id)
    .notNull(),
  relationshipType: text("relationship_type").notNull(), // Parent-Child, Reference, Association
  cardinality: text("cardinality").notNull(), // One-to-One, One-to-Many, Many-to-Many
  sourceField: text("source_field").notNull(),
  targetField: text("target_field").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add after the existing relationships table definition
export const relationshipAttributeDefinitions = pgTable("relationship_attribute_definitions", {
  id: serial("id").primaryKey(),
  relationshipTypeId: integer("relationship_type_id").references(() => relationships.id).notNull(),
  name: text("name").notNull(),
  dataType: text("data_type").notNull(), // string, number, boolean, date, etc.
  isRequired: boolean("is_required").default(false).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const relationshipAttributeValues = pgTable("relationship_attribute_values", {
  id: serial("id").primaryKey(),
  relationshipValueId: integer("relationship_value_id").references(() => relationshipValues.id).notNull(),
  attributeDefinitionId: integer("attribute_definition_id").references(() => relationshipAttributeDefinitions.id).notNull(),
  value: text("value").notNull(), // Store all values as text, convert based on dataType when reading
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add relations
export const relationshipAttributeDefinitionsRelations = relations(relationshipAttributeDefinitions, ({ one, many }) => ({
  relationshipType: one(relationships, {
    fields: [relationshipAttributeDefinitions.relationshipTypeId],
    references: [relationships.id],
  }),
  values: many(relationshipAttributeValues),
}));

export const relationshipAttributeValuesRelations = relations(relationshipAttributeValues, ({ one }) => ({
  relationshipValue: one(relationshipValues, {
    fields: [relationshipAttributeValues.relationshipValueId],
    references: [relationshipValues.id],
  }),
  attributeDefinition: one(relationshipAttributeDefinitions, {
    fields: [relationshipAttributeValues.attributeDefinitionId],
    references: [relationshipAttributeDefinitions.id],
  }),
}));

// Add after the existing relationships table definition
export const relationshipValues = pgTable("relationship_values", {
  id: serial("id").primaryKey(),
  relationshipId: integer("relationship_id")
    .references(() => relationships.id)
    .notNull(),
  sourceInstanceId: text("source_instance_id").notNull(),
  targetInstanceId: text("target_instance_id").notNull(),
  metadata: jsonb("metadata"),
  // Add new approval-related columns
  approvalStatus: approvalStatusEnum("approval_status").default("DRAFT").notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  changeHistory: jsonb("change_history").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add relationships relations
export const relationshipsRelations = relations(relationships, ({ one, many }) => ({
  sourceDataSet: one(referenceDataSets, {
    fields: [relationships.sourceDataSetId],
    references: [referenceDataSets.id],
  }),
  targetDataSet: one(referenceDataSets, {
    fields: [relationships.targetDataSetId],
    references: [referenceDataSets.id],
  }),
  values: many(relationshipValues),
}));

// Add relationship values relations
export const relationshipValuesRelations = relations(relationshipValues, ({ one }) => ({
  relationship: one(relationships, {
    fields: [relationshipValues.relationshipId],
    references: [relationships.id],
  }),
}));


// Add after existing schemas
export const insertRelationshipValueSchema = createInsertSchema(relationshipValues).extend({
  relationshipId: z.number(),
  sourceInstanceId: z.string(),
  targetInstanceId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  approvalStatus: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).default("DRAFT"),
  changeHistory: z.array(z.object({
    timestamp: z.string(),
    prevStatus: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]),
    newStatus: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]),
    userId: z.number(),
    comment: z.string().optional(),
    changes: z.record(z.string(), z.any()).optional()
  })).default([])
});

// Add after existing schemas
export const insertRelationshipSchema = createInsertSchema(relationships).extend({
  sourceDataSetId: z.coerce.number(),
  targetDataSetId: z.coerce.number(),
  name: z.string().min(1, "Relationship name is required"),
  relationshipType: z.string(),
  cardinality: z.string(),
  sourceField: z.string(),
  targetField: z.string(),
});


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


// Add after the existing relationships table definition
export const crosswalkMappings = pgTable("crosswalk_mappings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sourceSystemId: integer("source_system_id")
    .references(() => referenceDataSets.id)
    .notNull(),
  targetSystemId: integer("target_system_id")
    .references(() => referenceDataSets.id)
    .notNull(),
  mappingData: jsonb("mapping_data").notNull(), // Stores key-value pairs for the mapping
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add crosswalk mapping relations
export const crosswalkMappingsRelations = relations(crosswalkMappings, ({ one }) => ({
  sourceSystem: one(referenceDataSets, {
    fields: [crosswalkMappings.sourceSystemId],
    references: [referenceDataSets.id],
  }),
  targetSystem: one(referenceDataSets, {
    fields: [crosswalkMappings.targetSystemId],
    references: [referenceDataSets.id],
  }),
}));

// Add after existing schemas
export const insertCrosswalkMappingSchema = createInsertSchema(crosswalkMappings).extend({
  sourceSystemId: z.coerce.number(),
  targetSystemId: z.coerce.number(),
  name: z.string().min(1, "Mapping name is required"),
  mappingData: z.record(z.string(), z.any()),
});

// Add after existing types
export type RelationshipValue = typeof relationshipValues.$inferSelect;
export type InsertRelationshipValue = z.infer<typeof insertRelationshipValueSchema>;

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
  [key: string]: string | HistoryEntry[] | undefined;
  _history?: HistoryEntry[];
};

// Add after the existing types
export type InsertReferenceDataType = z.infer<typeof insertReferenceDataTypeSchema>;
export type ReferenceDataType = typeof referenceDataTypes.$inferSelect;
export type ReferenceDataTypeSchema = typeof referenceDataTypeSchemas.$inferSelect;
export type InsertReferenceDataSet = z.infer<typeof insertReferenceDataSetSchema>;

// Add after the existing types
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;

// Update the ReferenceDataSet type
export type ReferenceDataSet = typeof referenceDataSets.$inferSelect & {
  data: Record<string, ReferenceDataInstance>;
};

// Export the session type
export type Session = typeof sessions.$inferSelect;

// Add after existing types
export type InsertCrosswalkMapping = z.infer<typeof insertCrosswalkMappingSchema>;
export type CrosswalkMapping = typeof crosswalkMappings.$inferSelect;

// Add types for the new tables
export type RelationshipAttributeDefinition = typeof relationshipAttributeDefinitions.$inferSelect;
export type InsertRelationshipAttributeDefinition = typeof relationshipAttributeDefinitions.$inferInsert;
export type RelationshipAttributeValue = typeof relationshipAttributeValues.$inferSelect;
export type InsertRelationshipAttributeValue = typeof relationshipAttributeValues.$inferInsert;

// Add validation schemas
export const insertRelationshipAttributeDefinitionSchema = createInsertSchema(relationshipAttributeDefinitions).extend({
  relationshipTypeId: z.coerce.number(),
  name: z.string().min(1, "Attribute name is required"),
  dataType: z.enum(["string", "number", "boolean", "date"]),
  isRequired: z.boolean().default(false),
  description: z.string().optional(),
});

export const insertRelationshipAttributeValueSchema = createInsertSchema(relationshipAttributeValues).extend({
  relationshipValueId: z.coerce.number(),
  attributeDefinitionId: z.coerce.number(),
  value: z.string(),
});

// Add this after the existing imports
export const approvalStatusEnum = pgEnum("approval_status", [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED"
]);


export type ChangeHistoryEntry = {
  timestamp: string;
  prevStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  newStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  userId: number;
  comment?: string;
  changes?: Record<string, any>;
};