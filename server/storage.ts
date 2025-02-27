import { users, roles, type User, type InsertUser, type Role, type InsertRole, type UpdateUser } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, sql, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { type ReferenceDataType, type InsertReferenceDataType, type ReferenceDataTypeSchema } from "@shared/schema"; // Import necessary types
import { referenceDataTypes, referenceDataTypeSchemas } from "@shared/schema"; //Import necessary tables
import { type ReferenceDataSet, type InsertReferenceDataSet, type ReferenceDataInstance } from "@shared/schema"; //Import necessary types for ReferenceDataSet
import { referenceDataSets } from "@shared/schema";
import { relationships, type Relationship, type InsertRelationship } from "@shared/schema";
import { type RelationshipValue, type InsertRelationshipValue } from "@shared/schema"; //Import necessary types for RelationshipValue
import { relationshipValues } from "@shared/schema"; //Import necessary table for RelationshipValue
import { type CrosswalkMapping, type InsertCrosswalkMapping } from "@shared/schema"; //Import necessary types and table for crosswalk mappings
import { crosswalkMappings } from "@shared/schema"; //Import necessary table for crosswalk mappings


const PostgresSessionStore = connectPg(session);

export interface IStorage {
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
  deleteRole(id: number): Promise<boolean>;

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

  // Crosswalk mapping methods
  createCrosswalkMapping(mapping: InsertCrosswalkMapping): Promise<CrosswalkMapping>;
  getCrosswalkMapping(id: number): Promise<CrosswalkMapping | undefined>;
  getAllCrosswalkMappings(): Promise<CrosswalkMapping[]>;
  getCrosswalkMappingsBySystem(systemId: number): Promise<CrosswalkMapping[]>;
  updateCrosswalkMapping(id: number, mapping: Partial<InsertCrosswalkMapping>): Promise<CrosswalkMapping>;
  deleteCrosswalkMapping(id: number): Promise<boolean>;

  // Dashboard metrics and activity
  getDashboardMetrics(): Promise<{
    totalDatasets: number;
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
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
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

  async deleteRole(id: number): Promise<boolean> {
    const [role] = await db
      .delete(roles)
      .where(eq(roles.id, id))
      .returning();
    return !!role;
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
    return db.select().from(referenceDataTypes);
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
    const dataSets = await db.select().from(referenceDataSets);
    return dataSets.map(dataSet => ({
      ...dataSet,
      data: dataSet.data as Record<string, ReferenceDataInstance>
    }));
  }

  async getReferenceDataSetsByType(typeId: number): Promise<ReferenceDataSet[]> {
    const dataSets = await db
      .select()
      .from(referenceDataSets)
      .where(eq(referenceDataSets.typeId, typeId));

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
    return db.select().from(relationships);
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
      );
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
    const [relationship] = await db
      .delete(relationships)
      .where(eq(relationships.id, id))
      .returning();
    return !!relationship;
  }

  // Implement relationship value methods
  async createRelationshipValue(value: InsertRelationshipValue): Promise<RelationshipValue> {
    const [relationshipValue] = await db
      .insert(relationshipValues)
      .values(value)
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
      .where(eq(relationshipValues.relationshipId, relationshipId));
  }

  async deleteRelationshipValue(id: number): Promise<boolean> {
    const [value] = await db
      .delete(relationshipValues)
      .where(eq(relationshipValues.id, id))
      .returning();
    return !!value;
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
    return db.select().from(crosswalkMappings);
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
      );
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

  async getDashboardMetrics(): Promise<{
    totalDatasets: number;
    activeMappings: number;
    recentChanges: number;
    activeUsers: number;
  }> {
    const [datasets] = await db
      .select({ count: sql`count(*)` })
      .from(referenceDataSets);

    const [mappings] = await db
      .select({ count: sql`count(*)` })
      .from(crosswalkMappings);

    const [changes] = await db
      .select({ count: sql`count(*)` })
      .from(referenceDataSets)
      .where(
        sql`created_at > NOW() - INTERVAL '24 hours'`
      );

    const [users] = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    return {
      totalDatasets: Number(datasets?.count || 0),
      activeMappings: Number(mappings?.count || 0),
      recentChanges: Number(changes?.count || 0),
      activeUsers: Number(users?.count || 0)
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
        type: sql`'dataset'`.as('type'),
        description: referenceDataSets.name,
        timestamp: referenceDataSets.createdAt,
      })
      .from(referenceDataSets)
      .orderBy(desc(referenceDataSets.createdAt))
      .limit(3);

    // Get recent mappings
    const recentMappings = await db
      .select({
        type: sql`'mapping'`.as('type'),
        description: crosswalkMappings.name,
        timestamp: crosswalkMappings.createdAt,
      })
      .from(crosswalkMappings)
      .orderBy(desc(crosswalkMappings.createdAt))
      .limit(3);

    // Get recent relationships
    const recentRelationships = await db
      .select({
        type: sql`'relationship'`.as('type'),
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
}

export const storage = new DatabaseStorage();