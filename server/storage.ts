import { users, roles, type User, type InsertUser, type Role, type InsertRole, type UpdateUser } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, sql, desc, count, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { Pool } from '@neondatabase/serverless';
import { type ReferenceDataType, type InsertReferenceDataType, type ReferenceDataTypeSchema } from "@shared/schema"; // Import necessary types
import { referenceDataTypes, referenceDataTypeSchemas } from "@shared/schema"; //Import necessary tables
import { type ReferenceDataSet, type InsertReferenceDataSet, type ReferenceDataInstance } from "@shared/schema"; //Import necessary types for ReferenceDataSet
import { referenceDataSets } from "@shared/schema";
import { relationships, type Relationship, type InsertRelationship } from "@shared/schema";
import { type RelationshipValue, type InsertRelationshipValue } from "@shared/schema"; //Import necessary types for RelationshipValue
import { relationshipValues } from "@shared/schema"; //Import necessary table for RelationshipValue
import { type CrosswalkMapping, type InsertCrosswalkMapping } from "@shared/schema"; //Import necessary types and table for crosswalk mappings
import { crosswalkMappings } from "@shared/schema"; //Import necessary table for crosswalk mappings
import { type RelationshipAttributeDefinition, type InsertRelationshipAttributeDefinition } from "@shared/schema";
import { relationshipAttributeDefinitions } from "@shared/schema";
import { type RelationshipAttributeValue, type InsertRelationshipAttributeValue } from "@shared/schema";
import { relationshipAttributeValues } from "@shared/schema";
import { type ApiKey, type InsertApiKey } from "@shared/schema";
import { apiKeys } from "@shared/schema";
import { type MissingMapping, type InsertMissingMapping } from "@shared/schema";
import { missingMappings } from "@shared/schema";
import crypto from 'crypto';


const PostgresSessionStore = connectPg(session);

// Update the IStorage interface to include new approval methods
export interface IStorage {
  // External API Key operations
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKey(id: number): Promise<ApiKey | undefined>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  getAllApiKeys(): Promise<ApiKey[]>;
  updateApiKey(id: number, updates: Partial<InsertApiKey>): Promise<ApiKey | undefined>;
  updateApiKeyLastUsed(id: number): Promise<void>;
  deleteApiKey(id: number): Promise<boolean>;
  validateApiKey(key: string): Promise<{ valid: boolean; apiKey?: ApiKey }>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>; 

  // Role operations
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  getAllRoles(): Promise<Role[]>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<{ success: boolean; message?: string }>;

  // New methods for password reset
  setResetToken(userId: number, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearResetToken(userId: number): Promise<void>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;

  // Session store
  sessionStore: session.Store;
  // Add new method
  updateRequirePasswordChange(userId: number, requireChange: boolean): Promise<void>;

  // Reference Data Type operations
  createReferenceDataType(data: InsertReferenceDataType): Promise<ReferenceDataType>;
  getReferenceDataType(id: number): Promise<ReferenceDataType | undefined>;
  getAllReferenceDataTypes(): Promise<ReferenceDataType[]>;
  getReferenceDataTypeSchemas(typeId: number): Promise<ReferenceDataTypeSchema[]>;
  // Add new update method
  updateReferenceDataType(id: number, data: InsertReferenceDataType): Promise<ReferenceDataType>;
  // Check if reference data type has associated data sets
  hasAssociatedDataSets(typeId: number): Promise<boolean>;
  // Delete reference data type
  deleteReferenceDataType(id: number): Promise<{ success: boolean; message?: string }>;

  // Reference Data Set operations
  createReferenceDataSet(data: InsertReferenceDataSet): Promise<ReferenceDataSet>;
  getReferenceDataSet(id: number): Promise<ReferenceDataSet | undefined>;
  getAllReferenceDataSets(): Promise<ReferenceDataSet[]>;
  getReferenceDataSetsByType(typeId: number): Promise<ReferenceDataSet[]>;
  updateReferenceDataSet(id: number, data: Partial<InsertReferenceDataSet>): Promise<ReferenceDataSet>;
  deleteReferenceDataSet(id: number): Promise<boolean>;

  // Add relationship management methods
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  getRelationship(id: number): Promise<Relationship | undefined>;
  getAllRelationships(): Promise<Relationship[]>;
  getRelationshipsByDataSet(dataSetId: number): Promise<Relationship[]>;
  updateRelationship(id: number, relationship: Partial<InsertRelationship>): Promise<Relationship>;
  deleteRelationship(id: number): Promise<boolean>;

  // Add relationship value methods
  createRelationshipValue(value: InsertRelationshipValue): Promise<RelationshipValue>;
  getRelationshipValue(id: number): Promise<RelationshipValue | undefined>;
  getRelationshipValues(relationshipId: number): Promise<RelationshipValue[]>;
  deleteRelationshipValue(id: number): Promise<boolean>;
  getAvailableTargets(relationshipId: number, sourceId: string): Promise<Record<string, any>[]>;
  getAvailableSources(relationshipId: number, targetId: string): Promise<Record<string, any>[]>;
  
  // Add to IStorage interface after getRelationshipValues method
  updateRelationshipValue(id: number, updates: Partial<RelationshipValue>): Promise<RelationshipValue>;

  // Crosswalk mapping methods
  createCrosswalkMapping(mapping: InsertCrosswalkMapping): Promise<CrosswalkMapping>;
  getCrosswalkMapping(id: number): Promise<CrosswalkMapping | undefined>;
  getAllCrosswalkMappings(): Promise<CrosswalkMapping[]>;
  getCrosswalkMappingsBySystem(systemId: number): Promise<CrosswalkMapping[]>;
  getCrosswalkMappingsByTargetId(targetId: number): Promise<CrosswalkMapping[]>;
  updateCrosswalkMapping(id: number, mapping: Partial<InsertCrosswalkMapping>): Promise<CrosswalkMapping>;
  deleteCrosswalkMapping(id: number): Promise<boolean>;
  
  // Crosswalk mapping approval methods
  getPendingCrosswalkMappings(): Promise<CrosswalkMapping[]>;
  approveCrosswalkMapping(id: number, userId: number, comment?: string): Promise<CrosswalkMapping>;
  rejectCrosswalkMapping(id: number, userId: number, comment?: string): Promise<CrosswalkMapping>;
  updateCrosswalkMappingStatus(id: number, status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED", userId: number, comment?: string): Promise<CrosswalkMapping>;

  // Dashboard metrics and activity
  getDashboardMetrics(): Promise<{
    totalDatasets: number;
    totalDataTypes: number;
    totalRelationships: number;
    totalCrosswalks: number;
    activeMappings: number;
    recentChanges: number;
    activeUsers: number;
  }>;
  getRecentActivity(): Promise<Array<{
    type: string;
    description: string;
    user: string;
    timestamp: Date;
  }>>;

  // Relationship attribute definition methods
  createRelationshipAttributeDefinition(definition: InsertRelationshipAttributeDefinition): Promise<RelationshipAttributeDefinition>;
  getRelationshipAttributeDefinition(id: number): Promise<RelationshipAttributeDefinition | undefined>;
  getRelationshipAttributeDefinitions(relationshipTypeId: number): Promise<RelationshipAttributeDefinition[]>;
  updateRelationshipAttributeDefinition(id: number, definition: Partial<InsertRelationshipAttributeDefinition>): Promise<RelationshipAttributeDefinition>;
  deleteRelationshipAttributeDefinition(id: number): Promise<boolean>;

  // Relationship attribute value methods
  createRelationshipAttributeValue(value: InsertRelationshipAttributeValue): Promise<RelationshipAttributeValue>;
  getRelationshipAttributeValues(relationshipValueId: number): Promise<RelationshipAttributeValue[]>;
  updateRelationshipAttributeValue(id: number, value: Partial<InsertRelationshipAttributeValue>): Promise<RelationshipAttributeValue>;
  deleteRelationshipAttributeValue(id: number): Promise<boolean>;

  // Add new approval-related methods for relationship values
  saveRelationshipValueAsDraft(value: InsertRelationshipValue): Promise<RelationshipValue>;
  submitRelationshipValueForApproval(id: number, userId: number): Promise<RelationshipValue>;
  approveRelationshipValue(id: number, userId: number, comment?: string): Promise<RelationshipValue>;
  rejectRelationshipValue(id: number, userId: number, comment?: string): Promise<RelationshipValue>;
  bulkApproveRelationshipValues(ids: number[], userId: number): Promise<RelationshipValue[]>;
  getRelationshipValueHistory(id: number): Promise<ChangeHistoryEntry[]>;
  getPendingRelationshipValues(): Promise<RelationshipValue[]>;
  getDraftRelationshipValues(): Promise<RelationshipValue[]>;
  getRelationshipValuesByStatus(status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"): Promise<RelationshipValue[]>;
  
  // Missing mappings methods
  logMissingMapping(mapping: InsertMissingMapping): Promise<MissingMapping>;
  getMissingMappings(crosswalkId?: number): Promise<MissingMapping[]>;
  getMissingMappingStatistics(): Promise<{
    totalCount: number;
    crosswalkCounts: {crosswalkId: number; crosswalkName: string; count: number}[];
  }>;
  deleteMissingMapping(id: number): Promise<boolean>;
  updateMissingMapping(id: number, updates: Partial<InsertMissingMapping>): Promise<MissingMapping>;
}

interface ChangeHistoryEntry {
  timestamp: string;
  prevStatus: string | null;
  newStatus: string;
  userId: number;
  comment: string;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Create a new pool specifically for the session store
    const sessionPool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    this.sessionStore = new PostgresSessionStore({
      pool: sessionPool,
      createTableIfMissing: true,
    });
  }

  // API Key operations
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    // Generate a random API key if one is not provided
    if (!apiKey.key) {
      apiKey.key = crypto.randomUUID().replace(/-/g, '');
    }
    
    const [createdApiKey] = await db
      .insert(apiKeys)
      .values({
        ...apiKey,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return createdApiKey;
  }

  async getApiKey(id: number): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id));
    
    return apiKey;
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, key));
    
    return apiKey;
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    return db.select().from(apiKeys);
  }

  async updateApiKey(id: number, updates: Partial<InsertApiKey>): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .update(apiKeys)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(apiKeys.id, id))
      .returning();
    
    return apiKey;
  }

  async updateApiKeyLastUsed(id: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date()
      })
      .where(eq(apiKeys.id, id));
  }

  async deleteApiKey(id: number): Promise<boolean> {
    const [apiKey] = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id))
      .returning();
    
    return !!apiKey;
  }

  async validateApiKey(key: string): Promise<{ valid: boolean; apiKey?: ApiKey }> {
    const apiKey = await this.getApiKeyByKey(key);
    
    if (!apiKey) {
      return { valid: false };
    }

    // Check if the API key is active
    if (!apiKey.isActive) {
      return { valid: false };
    }

    // Check if the API key has expired
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { valid: false };
    }

    // Update last used timestamp
    await this.updateApiKeyLastUsed(apiKey.id);
    
    return { valid: true, apiKey };
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    console.log('Storage: Updating user', id, 'with data:', updates);
    try {
      const [user] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      console.log('Storage: Update result:', user);
      return user;
    } catch (error) {
      console.error('Storage: Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return !!user;
  }

  // Role operations
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }

  async getAllRoles(): Promise<Role[]> {
    return db.select().from(roles);
  }

  async setResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    return user;
  }

  async clearResetToken(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateRequirePasswordChange(userId: number, requireChange: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        requirePasswordChange: requireChange,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateRole(id: number, updates: Partial<InsertRole>): Promise<Role> {
    const [role] = await db
      .update(roles)
      .set(updates)
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: number): Promise<{success: boolean; message?: string}> {
    // First check if any users have this role
    const linkedUsers = await db
      .select()
      .from(users)
      .where(eq(users.roleId, id));

    if (linkedUsers.length > 0) {
      return {
        success: false,
        message: "This role cannot be deleted because it is currently assigned to users. Please reassign or delete the users first."
      };
    }

    // If no users are linked, proceed with deletion
    const [role] = await db
      .delete(roles)
      .where(eq(roles.id, id))
      .returning();
      
    return {
      success: !!role
    };
  }

  async createReferenceDataType(data: InsertReferenceDataType): Promise<ReferenceDataType> {
    const { schemas, ...typeData } = data;
    console.log('Storage: Creating reference type with data:', data);

    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the reference data type
      const [referenceType] = await tx
        .insert(referenceDataTypes)
        .values(typeData)
        .returning();

      console.log('Storage: Created reference type:', referenceType);

      // Create the schema entries
      if (schemas && schemas.length > 0) {
        console.log('Storage: Creating schemas:', schemas);
        const createdSchemas = await tx
          .insert(referenceDataTypeSchemas)
          .values(
            schemas.map((schema) => ({
              referenceDataTypeId: referenceType.id,
              name: schema.name,
              dataType: schema.dataType,
            }))
          )
          .returning();
        console.log('Storage: Created schemas:', createdSchemas);
      }

      return referenceType;
    });
  }

  async getReferenceDataType(id: number): Promise<ReferenceDataType | undefined> {
    const [type] = await db
      .select()
      .from(referenceDataTypes)
      .where(eq(referenceDataTypes.id, id));
    return type;
  }

  async getAllReferenceDataTypes(): Promise<ReferenceDataType[]> {
    return db
      .select()
      .from(referenceDataTypes)
      .orderBy(desc(referenceDataTypes.createdAt));
  }

  async getReferenceDataTypeSchemas(typeId: number): Promise<ReferenceDataTypeSchema[]> {
    return db
      .select()
      .from(referenceDataTypeSchemas)
      .where(eq(referenceDataTypeSchemas.referenceDataTypeId, typeId));
  }

  async updateReferenceDataType(id: number, data: InsertReferenceDataType): Promise<ReferenceDataType> {
    const { schemas, ...typeData } = data;
    console.log('Storage: Updating reference type with data:', data);

    return await db.transaction(async (tx) => {
      // Update the reference data type
      const [referenceType] = await tx
        .update(referenceDataTypes)
        .set({
          ...typeData,
          updatedAt: new Date()
        })
        .where(eq(referenceDataTypes.id, id))
        .returning();

      console.log('Storage: Updated reference type:', referenceType);

      // Delete existing schemas
      await tx
        .delete(referenceDataTypeSchemas)
        .where(eq(referenceDataTypeSchemas.referenceDataTypeId, id));

      // Create new schema entries
      if (schemas && schemas.length > 0) {
        console.log('Storage: Creating new schemas:', schemas);
        const createdSchemas = await tx
          .insert(referenceDataTypeSchemas)
          .values(
            schemas.map((schema) => ({
              referenceDataTypeId: id,
              name: schema.name,
              dataType: schema.dataType,
            }))
          )
          .returning();
        console.log('Storage: Created new schemas:', createdSchemas);
      }

      return referenceType;
    });
  }

  async hasAssociatedDataSets(typeId: number): Promise<boolean> {
    console.log('Storage: Checking if reference type has associated data sets:', typeId);
    const dataSets = await db
      .select({ count: count() })
      .from(referenceDataSets)
      .where(eq(referenceDataSets.typeId, typeId));
    
    const hasDataSets = dataSets[0].count > 0;
    console.log(`Storage: Type ${typeId} has associated data sets: ${hasDataSets}`);
    return hasDataSets;
  }

  async deleteReferenceDataType(id: number): Promise<{ success: boolean; message?: string }> {
    console.log('Storage: Attempting to delete reference type:', id);
    
    // First check if the type has any associated data sets
    const hasDataSets = await this.hasAssociatedDataSets(id);
    
    if (hasDataSets) {
      console.log(`Storage: Cannot delete reference type ${id} - has associated data sets`);
      return {
        success: false,
        message: "This reference data type cannot be deleted because it has associated data sets. Please delete the data sets first."
      };
    }
    
    // If no data sets are linked, proceed with deletion
    return await db.transaction(async (tx) => {
      // First delete any schemas associated with this type
      await tx
        .delete(referenceDataTypeSchemas)
        .where(eq(referenceDataTypeSchemas.referenceDataTypeId, id));
      
      // Then delete the type itself
      const [deletedType] = await tx
        .delete(referenceDataTypes)
        .where(eq(referenceDataTypes.id, id))
        .returning();
        
      console.log(`Storage: Reference type ${id} deleted successfully`);
      return {
        success: !!deletedType
      };
    });
  }

  async createReferenceDataSet(data: InsertReferenceDataSet): Promise<ReferenceDataSet> {
    const [referenceDataSet] = await db
      .insert(referenceDataSets)
      .values(data)
      .returning();
    return referenceDataSet;
  }

  async getReferenceDataSet(id: number): Promise<ReferenceDataSet | undefined> {
    console.log('Storage: Fetching reference data set with ID:', id);

    try {
      const [referenceDataSet] = await db
        .select()
        .from(referenceDataSets)
        .where(eq(referenceDataSets.id, id));

      if (!referenceDataSet) {
        console.log('Storage: No data set found for ID:', id);
        return undefined;
      }

      // Cast the data field to the correct type
      const typedDataSet: ReferenceDataSet = {
        ...referenceDataSet,
        data: referenceDataSet.data as Record<string, ReferenceDataInstance>
      };

      // Log the exact structure being returned
      console.log('Storage: Retrieved data set structure:', {
        hasResult: true,
        fields: Object.keys(typedDataSet),
        name: typedDataSet.name,
        id: typedDataSet.id,
        dataType: typeof typedDataSet.data,
        dataContent: typedDataSet.data
      });

      return typedDataSet;
    } catch (error) {
      console.error('Storage: Error fetching reference data set:', error);
      throw error;
    }
  }

  async getAllReferenceDataSets(): Promise<ReferenceDataSet[]> {
    // Sort by created_at in descending order (newest first)
    const dataSets = await db
      .select()
      .from(referenceDataSets)
      .orderBy(desc(referenceDataSets.createdAt));
    
    return dataSets.map(dataSet => ({
      ...dataSet,
      data: dataSet.data as Record<string, ReferenceDataInstance>
    }));
  }

  async getReferenceDataSetsByType(typeId: number): Promise<ReferenceDataSet[]> {
    const dataSets = await db
      .select()
      .from(referenceDataSets)
      .where(eq(referenceDataSets.typeId, typeId))
      .orderBy(desc(referenceDataSets.createdAt));

    return dataSets.map(dataSet => ({
      ...dataSet,
      data: dataSet.data as Record<string, ReferenceDataInstance>
    }));
  }

  async updateReferenceDataSet(
    id: number,
    data: Partial<InsertReferenceDataSet>
  ): Promise<ReferenceDataSet> {
    const [referenceDataSet] = await db
      .update(referenceDataSets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(referenceDataSets.id, id))
      .returning();

    return {
      ...referenceDataSet,
      data: referenceDataSet.data as Record<string, ReferenceDataInstance>
    };
  }

  async deleteReferenceDataSet(id: number): Promise<boolean> {
    const [referenceDataSet] = await db
      .delete(referenceDataSets)
      .where(eq(referenceDataSets.id, id))
      .returning();
    return !!referenceDataSet;
  }

  // Implement relationship management methods
  async createRelationship(relationship: InsertRelationship): Promise<Relationship> {
    const [newRelationship] = await db
      .insert(relationships)
      .values(relationship)
      .returning();
    return newRelationship;
  }

  async getRelationship(id: number): Promise<Relationship | undefined> {
    const [relationship] = await db
      .select()
      .from(relationships)
      .where(eq(relationships.id, id));
    return relationship;
  }

  async getAllRelationships(): Promise<Relationship[]> {
    return db
      .select()
      .from(relationships)
      .orderBy(desc(relationships.createdAt));
  }

  async getRelationshipsByDataSet(dataSetId: number): Promise<Relationship[]> {
    return db
      .select()
      .from(relationships)
      .where(
        or(
          eq(relationships.sourceDataSetId, dataSetId),
          eq(relationships.targetDataSetId, dataSetId)
        )
      )
      .orderBy(desc(relationships.createdAt));
  }

  async updateRelationship(
    id: number,
    updates: Partial<InsertRelationship>
  ): Promise<Relationship> {
    const [relationship] = await db
      .update(relationships)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(relationships.id, id))
      .returning();
    return relationship;
  }

  async deleteRelationship(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // First, get all relationship values associated with this relationship
      const relValues = await tx
        .select()
        .from(relationshipValues)
        .where(eq(relationshipValues.relationshipId, id));
      
      // For each relationship value, delete associated attribute values
      for (const relValue of relValues) {
        await tx
          .delete(relationshipAttributeValues)
          .where(eq(relationshipAttributeValues.relationshipValueId, relValue.id));
      }

      // Then delete all relationship values associated with this relationship
      await tx
        .delete(relationshipValues)
        .where(eq(relationshipValues.relationshipId, id));
        
      // Get all attribute definitions for this relationship
      const attrDefs = await tx
        .select()
        .from(relationshipAttributeDefinitions)
        .where(eq(relationshipAttributeDefinitions.relationshipTypeId, id));
        
      // Delete all attribute values associated with these definitions
      for (const attrDef of attrDefs) {
        await tx
          .delete(relationshipAttributeValues)
          .where(eq(relationshipAttributeValues.attributeDefinitionId, attrDef.id));
      }
      
      // Delete all attribute definitions for this relationship
      await tx
        .delete(relationshipAttributeDefinitions)
        .where(eq(relationshipAttributeDefinitions.relationshipTypeId, id));

      // Finally delete the relationship itself
      const [relationship] = await tx
        .delete(relationships)
        .where(eq(relationships.id, id))
        .returning();

      return !!relationship;
    });
  }

  // Implement relationship value methods
  async createRelationshipValue(value: InsertRelationshipValue): Promise<RelationshipValue> {
    // Set default approval status to DRAFT for new values
    const [relationshipValue] = await db
      .insert(relationshipValues)
      .values({
        ...value,
        approvalStatus: "DRAFT",
        changeHistory: [{
          timestamp: new Date().toISOString(),
          prevStatus: null,
          newStatus: "DRAFT",
          userId: value.approvedBy || null,
          comment: "Initial creation"
        }]
      })
      .returning();
    return relationshipValue;
  }

  async getRelationshipValue(id: number): Promise<RelationshipValue | undefined> {
    const [value] = await db
      .select()
      .from(relationshipValues)
      .where(eq(relationshipValues.id, id));
    return value;
  }

  async getRelationshipValues(relationshipId: number): Promise<RelationshipValue[]> {
    return db
      .select()
      .from(relationshipValues)
      .where(eq(relationshipValues.relationshipId, relationshipId))
      .orderBy(desc(relationshipValues.createdAt));
  }

  async deleteRelationshipValue(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // First delete all attribute values associated with this relationship value
      await tx
        .delete(relationshipAttributeValues)
        .where(eq(relationshipAttributeValues.relationshipValueId, id));
        
      // Then delete the relationship value itself
      const [value] = await tx
        .delete(relationshipValues)
        .where(eq(relationshipValues.id, id))
        .returning();
        
      return !!value;
    });
  }

  async getAvailableTargets(
    relationshipId: number,
    sourceId: string
  ): Promise<Record<string, any>[]> {
    // First get the relationship to know the target dataset
    const relationship = await this.getRelationship(relationshipId);
    if (!relationship) return [];

    // Get the target dataset
    const targetDataSet = await this.getReferenceDataSet(relationship.targetDataSetId);
    if (!targetDataSet) return [];

    // Get existing relationship values for this source
    const existingValues = await db
      .select()
      .from(relationshipValues)
      .where(
        and(
          eq(relationshipValues.relationshipId, relationshipId),
          eq(relationshipValues.sourceInstanceId, sourceId)
        )
      );

    // Filter out already connected targets based on cardinality
    const existingTargetIds = existingValues.map(v => v.targetInstanceId);
    const allTargets = Object.entries(targetDataSet.data).map(([id, data]) => ({
      id,
      ...data,
    }));

    if (relationship.cardinality === 'one-to-one') {
      return allTargets.filter(target => !existingTargetIds.includes(target.id));
    }

    return allTargets;
  }

  async getAvailableSources(
    relationshipId: number,
    targetId: string
  ): Promise<Record<string, any>[]> {
    // First get the relationship to know the source dataset
    const relationship = await this.getRelationship(relationshipId);
    if (!relationship) return [];

    // Get the source dataset
    const sourceDataSet = await this.getReferenceDataSet(relationship.sourceDataSetId);
    if (!sourceDataSet) return [];

    // Get existing relationship values for this target
    const existingValues = await db
      .select()
      .from(relationshipValues)
      .where(
        and(
          eq(relationshipValues.relationshipId, relationshipId),
          eq(relationshipValues.targetInstanceId, targetId)
        )
      );

    // Filter out already connected sources based on cardinality
    const existingSourceIds = existingValues.map(v => v.sourceInstanceId);
    const allSources = Object.entries(sourceDataSet.data).map(([id, data]) => ({
      id,
      ...data,
    }));

    if (relationship.cardinality === 'one-to-one' || relationship.cardinality === 'one-to-many') {
      return allSources.filter(source => !existingSourceIds.includes(source.id));
    }

    return allSources;
  }

  // Add implementation in DatabaseStorage class after getRelationshipValues method
  async updateRelationshipValue(
    id: number,
    updates: Partial<RelationshipValue>
  ): Promise<RelationshipValue> {
    const [value] = await db
      .update(relationshipValues)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(relationshipValues.id, id))
      .returning();
    return value;
  }

  // Implement crosswalk mapping methods
  async createCrosswalkMapping(mapping: InsertCrosswalkMapping): Promise<CrosswalkMapping> {
    const [crosswalkMapping] = await db
      .insert(crosswalkMappings)
      .values(mapping)
      .returning();
    return crosswalkMapping;
  }

  async getCrosswalkMapping(id: number): Promise<CrosswalkMapping | undefined> {
    const [mapping] = await db
      .select()
      .from(crosswalkMappings)
      .where(eq(crosswalkMappings.id, id));
    return mapping;
  }

  async getAllCrosswalkMappings(): Promise<CrosswalkMapping[]> {
    return db
      .select()
      .from(crosswalkMappings)
      .orderBy(desc(crosswalkMappings.createdAt));
  }

  async getCrosswalkMappingsBySystem(systemId: number): Promise<CrosswalkMapping[]> {
    return db
      .select()
      .from(crosswalkMappings)
      .where(
        or(
          eq(crosswalkMappings.sourceSystemId, systemId),
          eq(crosswalkMappings.targetSystemId, systemId)
        )
      )
      .orderBy(desc(crosswalkMappings.createdAt));
  }
  
  async getCrosswalkMappingsByTargetId(targetId: number): Promise<CrosswalkMapping[]> {
    return db
      .select()
      .from(crosswalkMappings)
      .where(eq(crosswalkMappings.targetSystemId, targetId))
      .orderBy(desc(crosswalkMappings.createdAt));
  }

  async updateCrosswalkMapping(
    id: number,
    updates: Partial<InsertCrosswalkMapping>
  ): Promise<CrosswalkMapping> {
    const [mapping] = await db
      .update(crosswalkMappings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(crosswalkMappings.id, id))
      .returning();
    return mapping;
  }

  async deleteCrosswalkMapping(id: number): Promise<boolean> {
    const [mapping] = await db
      .delete(crosswalkMappings)
      .where(eq(crosswalkMappings.id, id))
      .returning();
    return !!mapping;
  }

  // Crosswalk mapping approval methods
  async getPendingCrosswalkMappings(): Promise<CrosswalkMapping[]> {
    console.log('getPendingCrosswalkMappings - Starting');
    
    // First, get all crosswalk mappings
    const allMappings = await db
      .select()
      .from(crosswalkMappings)
      .orderBy(desc(crosswalkMappings.createdAt));
    
    console.log(`getPendingCrosswalkMappings - Retrieved ${allMappings.length} total mappings`);
    
    // Then filter them to get only the ones that have at least one mapping with "PENDING" status
    const pendingMappings = allMappings.filter(mapping => {
      try {
        console.log(`Checking mapping ID ${mapping.id}`);
        console.log(`Mapping data: ${JSON.stringify(mapping.mappingData)}`);
        
        if (!mapping.mappingData || !mapping.mappingData.mappings || !Array.isArray(mapping.mappingData.mappings)) {
          console.log(`Mapping ${mapping.id} has no valid mappings array`);
          return false;
        }
        
        // Check if any mapping has a "PENDING" status
        const hasPendingItems = mapping.mappingData.mappings.some(item => {
          console.log(`Checking item status: ${item.status}`);
          return item.status === "PENDING";
        });
        
        console.log(`Mapping ${mapping.id} has pending items: ${hasPendingItems}`);
        return hasPendingItems;
      } catch (error) {
        console.error(`Error processing mapping ${mapping.id}:`, error);
        return false;
      }
    });
    
    console.log(`getPendingCrosswalkMappings - Found ${pendingMappings.length} mappings with pending items`);
    return pendingMappings;
  }

  async approveCrosswalkMapping(id: number, userId: number, comment?: string): Promise<CrosswalkMapping> {
    // Get the current mapping first
    const currentMapping = await this.getCrosswalkMapping(id);
    if (!currentMapping) {
      throw new Error(`Crosswalk mapping with ID ${id} not found`);
    }

    // Update the status of all pending mappings to approved
    if (currentMapping.mappingData && currentMapping.mappingData.mappings && Array.isArray(currentMapping.mappingData.mappings)) {
      let mappingData = {...currentMapping.mappingData};
      let hasChanges = false;
      
      mappingData.mappings = mappingData.mappings.map(mapping => {
        if (mapping.status === "PENDING") {
          hasChanges = true;
          return {
            ...mapping,
            status: "APPROVED"
          };
        }
        return mapping;
      });
      
      if (hasChanges) {
        // Create a history entry
        const timestamp = new Date().toISOString();
        const historyEntry: ChangeHistoryEntry = {
          timestamp,
          prevStatus: "PENDING",
          newStatus: "APPROVED",
          userId,
          comment: comment || "Approved mappings"
        };
        
        // Get current history or initialize empty array
        const currentHistory = currentMapping.changeHistory as ChangeHistoryEntry[] || [];
        const updatedHistory = [...currentHistory, historyEntry];
        
        // Apply the updates
        const [updatedMapping] = await db
          .update(crosswalkMappings)
          .set({
            mappingData,
            changeHistory: updatedHistory,
            updatedAt: new Date()
          })
          .where(eq(crosswalkMappings.id, id))
          .returning();
          
        return updatedMapping;
      }
    }
    
    // If no changes were made, return the current mapping
    return currentMapping;
  }

  async rejectCrosswalkMapping(id: number, userId: number, comment?: string): Promise<CrosswalkMapping> {
    // Get the current mapping first
    const currentMapping = await this.getCrosswalkMapping(id);
    if (!currentMapping) {
      throw new Error(`Crosswalk mapping with ID ${id} not found`);
    }

    // Update the status of all pending mappings to rejected
    if (currentMapping.mappingData && currentMapping.mappingData.mappings && Array.isArray(currentMapping.mappingData.mappings)) {
      let mappingData = {...currentMapping.mappingData};
      let hasChanges = false;
      
      mappingData.mappings = mappingData.mappings.map(mapping => {
        if (mapping.status === "PENDING") {
          hasChanges = true;
          return {
            ...mapping,
            status: "REJECTED"
          };
        }
        return mapping;
      });
      
      if (hasChanges) {
        // Create a history entry
        const timestamp = new Date().toISOString();
        const historyEntry: ChangeHistoryEntry = {
          timestamp,
          prevStatus: "PENDING",
          newStatus: "REJECTED",
          userId,
          comment: comment || "Rejected mappings"
        };
        
        // Get current history or initialize empty array
        const currentHistory = currentMapping.changeHistory as ChangeHistoryEntry[] || [];
        const updatedHistory = [...currentHistory, historyEntry];
        
        // Apply the updates
        const [updatedMapping] = await db
          .update(crosswalkMappings)
          .set({
            mappingData,
            changeHistory: updatedHistory,
            updatedAt: new Date()
          })
          .where(eq(crosswalkMappings.id, id))
          .returning();
          
        return updatedMapping;
      }
    }
    
    // If no changes were made, return the current mapping
    return currentMapping;
  }
  
  async submitCrosswalkMappingForApproval(id: number, userId: number, comment?: string): Promise<CrosswalkMapping> {
    // Get the current mapping first
    const currentMapping = await this.getCrosswalkMapping(id);
    if (!currentMapping) {
      throw new Error(`Crosswalk mapping with ID ${id} not found`);
    }
    
    // Update the status of all DRAFT mappings to PENDING
    if (currentMapping.mappingData && currentMapping.mappingData.mappings && Array.isArray(currentMapping.mappingData.mappings)) {
      let mappingData = {...currentMapping.mappingData};
      let hasChanges = false;
      
      mappingData.mappings = mappingData.mappings.map(mapping => {
        if (mapping.status === "DRAFT") {
          hasChanges = true;
          return {
            ...mapping,
            status: "PENDING"
          };
        }
        return mapping;
      });
      
      if (hasChanges) {
        // Create a history entry
        const timestamp = new Date().toISOString();
        const historyEntry: ChangeHistoryEntry = {
          timestamp,
          prevStatus: "DRAFT",
          newStatus: "PENDING",
          userId,
          comment: comment || "Submitted for approval"
        };
        
        // Get current history or initialize empty array
        const currentHistory = currentMapping.changeHistory as ChangeHistoryEntry[] || [];
        const updatedHistory = [...currentHistory, historyEntry];
        
        // Apply the updates
        const [updatedMapping] = await db
          .update(crosswalkMappings)
          .set({
            mappingData,
            changeHistory: updatedHistory,
            updatedAt: new Date()
          })
          .where(eq(crosswalkMappings.id, id))
          .returning();
          
        return updatedMapping;
      }
    }
    
    // If no changes were made, return the current mapping
    return currentMapping;
  }
  
  async bulkApproveCrosswalkMappings(ids: number[], userId: number, comment?: string): Promise<CrosswalkMapping[]> {
    const results: CrosswalkMapping[] = [];
    
    for (const id of ids) {
      try {
        const mapping = await this.approveCrosswalkMapping(id, userId, comment);
        results.push(mapping);
      } catch (error) {
        console.error(`Error approving crosswalk mapping ${id}:`, error);
        // Continue with other mappings even if one fails
      }
    }
    
    return results;
  }

  async bulkRejectCrosswalkMappings(ids: number[], userId: number, comment?: string): Promise<CrosswalkMapping[]> {
    const results: CrosswalkMapping[] = [];
    
    for (const id of ids) {
      try {
        const mapping = await this.rejectCrosswalkMapping(id, userId, comment);
        results.push(mapping);
      } catch (error) {
        console.error(`Error rejecting crosswalk mapping ${id}:`, error);
        // Continue with other mappings even if one fails
      }
    }
    
    return results;
  }
  
  async bulkSubmitCrosswalkMappingsForApproval(ids: number[], userId: number, comment?: string): Promise<CrosswalkMapping[]> {
    const results: CrosswalkMapping[] = [];
    
    for (const id of ids) {
      try {
        const mapping = await this.submitCrosswalkMappingForApproval(id, userId, comment);
        results.push(mapping);
      } catch (error) {
        console.error(`Error submitting crosswalk mapping ${id} for approval:`, error);
        // Continue with other mappings even if one fails
      }
    }
    
    return results;
  }

  async updateCrosswalkMappingStatus(
    id: number,
    status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED",
    userId: number,
    comment?: string
  ): Promise<CrosswalkMapping> {
    // Get the current status first
    const currentMapping = await this.getCrosswalkMapping(id);
    if (!currentMapping) {
      throw new Error(`Crosswalk mapping with ID ${id} not found`);
    }

    const prevStatus = currentMapping.approvalStatus;
    const timestamp = new Date().toISOString();

    // Create a history entry
    const historyEntry: ChangeHistoryEntry = {
      timestamp,
      prevStatus,
      newStatus: status,
      userId,
      comment: comment || ""
    };

    // Get current history or initialize empty array
    const currentHistory = currentMapping.changeHistory as ChangeHistoryEntry[] || [];
    const updatedHistory = [...currentHistory, historyEntry];

    // Update fields based on new status
    const updates: Partial<CrosswalkMapping> = {
      approvalStatus: status,
      changeHistory: updatedHistory
    };

    // For approved status, add approver info
    if (status === "APPROVED") {
      updates.approvedBy = userId;
      updates.approvedAt = new Date();
    }

    // IMPORTANT FIX: Update the status in the individual mappings inside mappingData
    let mappingData = {...currentMapping.mappingData};
    
    // If mappingData contains a mappings array, update the status of each mapping
    if (mappingData.mappings && Array.isArray(mappingData.mappings)) {
      mappingData.mappings = mappingData.mappings.map((mapping: any) => {
        return {
          ...mapping,
          status: status // Set the status of each individual mapping
        };
      });
      
      // Add the updated mappingData to the updates
      updates.mappingData = mappingData;
    }

    // Apply the updates
    const [updatedMapping] = await db
      .update(crosswalkMappings)
      .set(updates)
      .where(eq(crosswalkMappings.id, id))
      .returning();

    return updatedMapping;
  }

  async getDashboardMetrics(): Promise<{
    totalDatasets: number;
    totalDataTypes: number;
    totalRelationships: number;
    totalCrosswalks: number;
    totalMissingMappings: number;
    activeMappings: number;
    recentChanges: number;
    activeUsers: number;
  }> {
    const [datasets] = await db
      .select({ count: sql`count(*)` })
      .from(referenceDataSets);

    const [dataTypes] = await db
      .select({ count: sql`count(*)` })
      .from(referenceDataTypes);

    const [relationshipCount] = await db
      .select({ count: sql`count(*)` })
      .from(relationships);

    const [crosswalks] = await db
      .select({ count: sql`count(*)` })
      .from(crosswalkMappings);
      
    const [missingMappingsCount] = await db
      .select({ count: sql`count(*)` })
      .from(missingMappings);

    const [mappings] = await db
      .select({ count: sql`count(*)` })
      .from(crosswalkMappings);

    const [changes] = await db
      .select({ count: sql`count(*)` })
      .from(referenceDataSets)
      .where(
        sql`created_at > NOW() - INTERVAL '24 hours'`
      );

    const [activeUsers] = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    return {
      totalDatasets: Number(datasets?.count || 0),
      totalDataTypes: Number(dataTypes?.count || 0),
      totalRelationships: Number(relationshipCount?.count || 0),
      totalCrosswalks: Number(crosswalks?.count || 0),
      totalMissingMappings: Number(missingMappingsCount?.count || 0),
      activeMappings: Number(mappings?.count || 0),
      recentChanges: Number(changes?.count || 0),
      activeUsers: Number(activeUsers?.count || 0)
    };
  }

  async getRecentActivity(): Promise<Array<{
    type: string;
    description: string;
    user: string;
    timestamp: Date;
  }>> {
    // Get recent datasets
    const recentDatasets = await db
      .select({
        type: sql<string>`'dataset'`.as('type'),
        description: referenceDataSets.name,
        timestamp: referenceDataSets.createdAt,
      })
      .from(referenceDataSets)
      .orderBy(desc(referenceDataSets.createdAt))
      .limit(3);

    // Get recent mappings
    const recentMappings = await db
      .select({
        type: sql<string>`'mapping'`.as('type'),
        description: crosswalkMappings.name,
        timestamp: crosswalkMappings.createdAt,
      })
      .from(crosswalkMappings)
      .orderBy(desc(crosswalkMappings.createdAt))
      .limit(3);

    // Get recent relationships
    const recentRelationships = await db
      .select({
        type: sql<string>`'relationship'`.as('type'),
        description: relationships.name,
        timestamp: relationships.createdAt,
      })
      .from(relationships)
      .orderBy(desc(relationships.createdAt))
      .limit(3);

    // Combine and sort all activities
    const allActivities = [...recentDatasets, ...recentMappings, ...recentRelationships]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map(activity => ({
        ...activity,
        user: 'System', // Since we don't track user for these actions yet
      }));

    return allActivities;
  }

  // Implement relationship attribute definition methods
  async createRelationshipAttributeDefinition(definition: InsertRelationshipAttributeDefinition): Promise<RelationshipAttributeDefinition> {
    const [attributeDef] = await db
      .insert(relationshipAttributeDefinitions)
      .values(definition)
      .returning();
    return attributeDef;
  }

  async getRelationshipAttributeDefinition(id: number): Promise<RelationshipAttributeDefinition | undefined> {
    const [attributeDef] = await db
      .select()
      .from(relationshipAttributeDefinitions)
      .where(eq(relationshipAttributeDefinitions.id, id));
    return attributeDef;
  }

  async getRelationshipAttributeDefinitions(relationshipTypeId: number): Promise<RelationshipAttributeDefinition[]> {
    return db
      .select()
      .from(relationshipAttributeDefinitions)
      .where(eq(relationshipAttributeDefinitions.relationshipTypeId, relationshipTypeId));
  }

  async updateRelationshipAttributeDefinition(
    id: number,
    updates: Partial<InsertRelationshipAttributeDefinition>
  ): Promise<RelationshipAttributeDefinition> {
    const [attributeDef] = await db
      .update(relationshipAttributeDefinitions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(relationshipAttributeDefinitions.id, id))
      .returning();
    return attributeDef;
  }

  async deleteRelationshipAttributeDefinition(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // First delete all attribute values associated with this definition
      await tx
        .delete(relationshipAttributeValues)
        .where(eq(relationshipAttributeValues.attributeDefinitionId, id));
        
      // Then delete the attribute definition itself
      const [attributeDef] = await tx
        .delete(relationshipAttributeDefinitions)
        .where(eq(relationshipAttributeDefinitions.id, id))
        .returning();
        
      return !!attributeDef;
    });
  }

  // Implement relationship attribute value methods
  async createRelationshipAttributeValue(value: InsertRelationshipAttributeValue): Promise<RelationshipAttributeValue> {
    const [attributeValue] = await db
      .insert(relationshipAttributeValues)
      .values(value)
      .returning();
    return attributeValue;
  }

  async getRelationshipAttributeValues(relationshipValueId: number): Promise<RelationshipAttributeValue[]> {
    return db
      .select()
      .from(relationshipAttributeValues)
      .where(eq(relationshipAttributeValues.relationshipValueId, relationshipValueId));
  }

  async updateRelationshipAttributeValue(
    id: number,
    updates: Partial<InsertRelationshipAttributeValue>
  ): Promise<RelationshipAttributeValue> {
    const [attributeValue] = await db
      .update(relationshipAttributeValues)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(relationshipAttributeValues.id, id))
      .returning();
    return attributeValue;
  }

  async deleteRelationshipAttributeValue(id: number): Promise<boolean> {
    const [attributeValue] = await db
      .delete(relationshipAttributeValues)
      .where(eq(relationshipAttributeValues.id, id))
      .returning();
    return !!attributeValue;
  }

  async saveRelationshipValueAsDraft(value: InsertRelationshipValue): Promise<RelationshipValue> {
    const [relationshipValue] = await db
      .insert(relationshipValues)
      .values({
        ...value,
        approvalStatus: "DRAFT",
        changeHistory: [{
          timestamp: new Date().toISOString(),
          prevStatus: null,
          newStatus: "DRAFT",
          userId: value.approvedBy,
          comment: "Initial draft created"
        }]
      })
      .returning();
    return relationshipValue;
  }

  async submitRelationshipValueForApproval(id: number, userId: number): Promise<RelationshipValue> {
    const [existingValue] = await db
      .select()
      .from(relationshipValues)
      .where(eq(relationshipValues.id, id));

    if (!existingValue || existingValue.approvalStatus !== "DRAFT") {
      throw new Error("Only draft values can be submitted for approval");
    }

    const [updatedValue] = await db
      .update(relationshipValues)
      .set({
        approvalStatus: "PENDING",
        updatedAt: new Date(),
        changeHistory: [
          ...existingValue.changeHistory,
          {
            timestamp: new Date().toISOString(),
            prevStatus: "DRAFT",
            newStatus: "PENDING",
            userId,
            comment: "Submitted for approval"
          }
        ]
      })
      .where(eq(relationshipValues.id, id))
      .returning();

    return updatedValue;
  }

  async approveRelationshipValue(id: number, userId: number, comment?: string): Promise<RelationshipValue> {
    const [existingValue] = await db
      .select()
      .from(relationshipValues)
      .where(eq(relationshipValues.id, id));

    if (!existingValue || existingValue.approvalStatus !== "PENDING") {
      throw new Error("Only pending values can be approved");
    }

    const [updatedValue] = await db
      .update(relationshipValues)
      .set({
        approvalStatus: "APPROVED",
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
        changeHistory: [
          ...existingValue.changeHistory,
          {
            timestamp: new Date().toISOString(),
            prevStatus: "PENDING",
            newStatus: "APPROVED",
            userId,
            comment: comment || "Approved"
          }
        ]
      })
      .where(eq(relationshipValues.id, id))
      .returning();

    return updatedValue;
  }

  async rejectRelationshipValue(id: number, userId: number, comment?: string): Promise<RelationshipValue> {
    const [existingValue] = await db
      .select()
      .from(relationshipValues)
      .where(eq(relationshipValues.id, id));

    if (!existingValue || existingValue.approvalStatus !== "PENDING") {
      throw new Error("Only pending values can be rejected");
    }

    const [updatedValue] = await db
      .update(relationshipValues)
      .set({
        approvalStatus: "REJECTED",
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
        changeHistory: [
          ...existingValue.changeHistory,
          {
            timestamp: new Date().toISOString(),
            prevStatus: "PENDING",
            newStatus: "REJECTED",
            userId,
            comment: comment || "Rejected"
          }
        ]
      })
      .where(eq(relationshipValues.id, id))
      .returning();

    return updatedValue;
  }

  async bulkApproveRelationshipValues(ids: number[], userId: number): Promise<RelationshipValue[]> {
    const results: RelationshipValue[] = [];

    // Process each value sequentially to maintain consistency
    for (const id of ids) {
      try {
        const result = await this.approveRelationshipValue(id, userId);
        results.push(result);
      } catch (error) {
        console.error(`Error approving relationship value ${id}:`, error);
        // Continue with next item even if one fails
      }
    }

    return results;
  }

  async getRelationshipValueHistory(id: number): Promise<ChangeHistoryEntry[]> {
    const [value] = await db
      .select()
      .from(relationshipValues)
      .where(eq(relationshipValues.id, id));

    return value?.changeHistory || [];
  }

  async getPendingRelationshipValues(): Promise<RelationshipValue[]> {
    return db
      .select()
      .from(relationshipValues)
      .where(eq(relationshipValues.approvalStatus, "PENDING"))
      .orderBy(desc(relationshipValues.createdAt));
  }

  async getDraftRelationshipValues(): Promise<RelationshipValue[]> {
    return db
      .select()
      .from(relationshipValues)
      .where(eq(relationshipValues.approvalStatus, "DRAFT"))
      .orderBy(desc(relationshipValues.createdAt));
  }

  async getRelationshipValuesByStatus(
    status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
  ): Promise<RelationshipValue[]> {
    return db
      .select()
      .from(relationshipValues)
      .where(eq(relationshipValues.approvalStatus, status))
      .orderBy(desc(relationshipValues.createdAt));
  }

  // Missing mappings implementation
  async logMissingMapping(mapping: InsertMissingMapping): Promise<MissingMapping> {
    console.log('Storage: Logging missing mapping:', mapping);
    
    try {
      // Check if a similar request already exists
      const existingMappings = await db
        .select()
        .from(missingMappings)
        .where(
          and(
            eq(missingMappings.crosswalkId, mapping.crosswalkId),
            eq(missingMappings.sourceValue, mapping.sourceValue)
          )
        );
      
      if (existingMappings.length > 0) {
        // Update existing record
        const existingMapping = existingMappings[0];
        console.log('Storage: Found existing missing mapping, updating count');
        
        const [updatedMapping] = await db
          .update(missingMappings)
          .set({
            requestCount: existingMapping.requestCount + 1,
            lastRequestedAt: new Date(),
            updatedAt: new Date(),
            requestUserId: mapping.requestUserId || existingMapping.requestUserId,
            requestContext: mapping.requestContext || existingMapping.requestContext
          })
          .where(eq(missingMappings.id, existingMapping.id))
          .returning();
        
        return updatedMapping;
      } else {
        // Create new record
        console.log('Storage: Creating new missing mapping record');
        const [newMapping] = await db
          .insert(missingMappings)
          .values({
            ...mapping,
            requestedAt: new Date(),
            lastRequestedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return newMapping;
      }
    } catch (error) {
      console.error('Storage: Error logging missing mapping:', error);
      throw error;
    }
  }

  async getMissingMappings(crosswalkId?: number): Promise<MissingMapping[]> {
    try {
      let query = db
        .select({
          missingMapping: missingMappings,
          crosswalk: crosswalkMappings,
          user: users
        })
        .from(missingMappings)
        .leftJoin(crosswalkMappings, eq(missingMappings.crosswalkId, crosswalkMappings.id))
        .leftJoin(users, eq(missingMappings.requestUserId, users.id))
        .orderBy(desc(missingMappings.lastRequestedAt));
      
      // Apply crosswalk filter if provided
      if (crosswalkId) {
        query = query.where(eq(missingMappings.crosswalkId, crosswalkId));
      }
      
      const results = await query;
      
      // Format the results
      return results.map(row => ({
        ...row.missingMapping,
        crosswalkName: row.crosswalk?.name || 'Unknown Crosswalk',
        userName: row.user?.username || 'Unknown User'
      }));
    } catch (error) {
      console.error('Storage: Error fetching missing mappings:', error);
      throw error;
    }
  }
  
  async getMissingMappingById(id: number): Promise<MissingMapping | null> {
    try {
      const result = await db
        .select({
          missingMapping: missingMappings,
          crosswalk: crosswalkMappings,
          user: users
        })
        .from(missingMappings)
        .leftJoin(crosswalkMappings, eq(missingMappings.crosswalkId, crosswalkMappings.id))
        .leftJoin(users, eq(missingMappings.requestUserId, users.id))
        .where(eq(missingMappings.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      // Format the result
      return {
        ...result[0].missingMapping,
        crosswalkName: result[0].crosswalk?.name || 'Unknown Crosswalk',
        userName: result[0].user?.username || 'Unknown User'
      };
    } catch (error) {
      console.error('Storage: Error fetching missing mapping by ID:', error);
      throw error;
    }
  }

  async getMissingMappingStatistics(): Promise<{
    totalCount: number;
    crosswalkCounts: { crosswalkId: number; crosswalkName: string; count: number }[];
  }> {
    try {
      // Get total count
      const totalCountResult = await db
        .select({ count: count() })
        .from(missingMappings);
      
      const totalCount = totalCountResult[0]?.count || 0;
      
      // Get counts by crosswalk
      const crosswalkResults = await db
        .select({
          crosswalkId: missingMappings.crosswalkId,
          count: count(),
        })
        .from(missingMappings)
        .groupBy(missingMappings.crosswalkId);
      
      // Get crosswalk names
      const crosswalkIds = crosswalkResults.map(result => result.crosswalkId);
      
      // Handle the case when there are no missing mappings
      let crosswalks = [];
      if (crosswalkIds.length > 0) {
        crosswalks = await db
          .select()
          .from(crosswalkMappings)
          .where(
            inArray(crosswalkMappings.id, crosswalkIds)
          );
      }
      
      // Map crosswalk names to results
      const crosswalkCounts = crosswalkResults.map(result => {
        const crosswalk = crosswalks.find(c => c.id === result.crosswalkId);
        return {
          crosswalkId: result.crosswalkId,
          crosswalkName: crosswalk?.name || 'Unknown Crosswalk',
          count: Number(result.count)
        };
      });
      
      return {
        totalCount,
        crosswalkCounts
      };
    } catch (error) {
      console.error('Storage: Error getting missing mapping statistics:', error);
      throw error;
    }
  }

  async deleteMissingMapping(id: number): Promise<boolean> {
    try {
      const [deleted] = await db
        .delete(missingMappings)
        .where(eq(missingMappings.id, id))
        .returning();
      
      return !!deleted;
    } catch (error) {
      console.error('Storage: Error deleting missing mapping:', error);
      throw error;
    }
  }

  async updateMissingMapping(id: number, updates: Partial<InsertMissingMapping>): Promise<MissingMapping> {
    try {
      const [updated] = await db
        .update(missingMappings)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(missingMappings.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Storage: Error updating missing mapping:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();