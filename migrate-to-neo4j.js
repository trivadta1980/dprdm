
// Script to migrate existing PostgreSQL data to Neo4j
import * as dotenv from 'dotenv';
dotenv.config();
import neo4j from 'neo4j-driver';
import { eq } from 'drizzle-orm';

// Import TypeScript modules directly (they'll be transpiled on the fly)
import { db } from './server/db.ts';
import * as schema from './shared/schema.ts';

// Extract needed tables
const { referenceDataSets, relationships, crosswalkMappings, relationshipValues } = schema;

// Create Neo4j driver
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function migrateData() {
  console.log("Starting data migration to Neo4j...");
  
  try {
    // Step 1: Clear existing Neo4j data (optional, can be commented out)
    console.log("Clearing existing Neo4j data...");
    const session = driver.session();
    await session.run('MATCH (n) DETACH DELETE n');
    await session.close();
    
    // Step 2: Migrate reference data sets
    console.log("Migrating reference data sets...");
    const dataSets = await db.select().from(referenceDataSets);
    for (const dataSet of dataSets) {
      console.log(`Migrating data set: ${dataSet.name} (ID: ${dataSet.id})`);
      await migrateReferenceDataSet(dataSet);
    }
    
    // Step 3: Migrate relationships
    console.log("Migrating relationships...");
    const allRelationships = await db.select().from(relationships);
    for (const relationship of allRelationships) {
      console.log(`Migrating relationship: ${relationship.name} (ID: ${relationship.id})`);
      await migrateRelationship(relationship);
    }
    
    // Step 4: Migrate crosswalk mappings
    console.log("Migrating crosswalk mappings...");
    const crosswalks = await db.select().from(crosswalkMappings);
    for (const crosswalk of crosswalks) {
      console.log(`Migrating crosswalk: ${crosswalk.id})`);
      await migrateCrosswalk(crosswalk);
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await driver.close();
  }
}

async function migrateReferenceDataSet(dataSet) {
  // Implementation would use the same logic as in GraphDataService
  // This is a simplified version
  const session = driver.session();
  try {
    // Create dataset node
    await session.run(`
      MERGE (ds:DataSet {id: $id, name: $name})
      SET ds.description = $description, 
          ds.typeId = $typeId,
          ds.updatedAt = $updatedAt
      RETURN ds
    `, {
      id: dataSet.id.toString(),
      name: dataSet.name,
      description: dataSet.description || "",
      typeId: dataSet.typeId.toString(),
      updatedAt: dataSet.updatedAt.toISOString(),
    });
    
    // Create item nodes for each data item
    const data = dataSet.data;
    for (const [itemId, item] of Object.entries(data)) {
      const properties = {};
      for (const [key, value] of Object.entries(item)) {
        if (key !== '_history' && value !== null && value !== undefined) {
          properties[key] = value.toString();
        }
      }
      
      await session.run(`
        MERGE (item:DataItem {id: $itemId, dataSetId: $dataSetId})
        SET item += $properties
        WITH item
        MATCH (ds:DataSet {id: $dataSetId})
        MERGE (ds)-[:CONTAINS]->(item)
        RETURN item
      `, {
        itemId,
        dataSetId: dataSet.id.toString(),
        properties,
      });
    }
  } finally {
    await session.close();
  }
}

async function migrateRelationship(relationship) {
  // Implementation using similar logic as GraphDataService
  const session = driver.session();
  try {
    // Create relationship type
    await session.run(`
      MERGE (rel:RelationshipType {id: $id, name: $name})
      SET rel.relationshipType = $relType,
          rel.cardinality = $cardinality,
          rel.sourceField = $sourceField,
          rel.targetField = $targetField,
          rel.updatedAt = $updatedAt
      RETURN rel
    `, {
      id: relationship.id.toString(),
      name: relationship.name || `Relationship ${relationship.id}`,
      relType: relationship.relationshipType,
      cardinality: relationship.cardinality,
      sourceField: relationship.sourceField,
      targetField: relationship.targetField,
      updatedAt: relationship.updatedAt.toISOString(),
    });
    
    // Create actual relationships between items
    const relValues = await db.query.relationshipValues.findMany({
      where: eq(relationshipValues.relationshipId, relationship.id)
    });
    
    for (const relValue of relValues) {
      await session.run(`
        MATCH (source:DataItem {id: $sourceId, dataSetId: $sourceDataSetId})
        MATCH (target:DataItem {id: $targetId, dataSetId: $targetDataSetId})
        MERGE (source)-[r:${relationship.relationshipType.toUpperCase()} {relationshipId: $relationshipId}]->(target)
        SET r += $metadata
        RETURN r
      `, {
        sourceId: relValue.sourceInstanceId,
        targetId: relValue.targetInstanceId,
        sourceDataSetId: relationship.sourceDataSetId.toString(),
        targetDataSetId: relationship.targetDataSetId.toString(),
        relationshipId: relationship.id.toString(),
        metadata: {
          createdAt: relValue.createdAt.toISOString(),
          updatedAt: relValue.updatedAt.toISOString()
        }
      });
    }
  } finally {
    await session.close();
  }
}

async function migrateCrosswalk(crosswalk) {
  const session = driver.session();
  try {
    // Create crosswalk node
    await session.run(`
      MERGE (cw:Crosswalk {id: $id, name: $name})
      SET cw.description = $description,
          cw.sourceSystemId = $sourceSystemId,
          cw.targetSystemId = $targetSystemId,
          cw.updatedAt = $updatedAt
      RETURN cw
    `, {
      id: crosswalk.id.toString(),
      name: crosswalk.name,
      description: crosswalk.description || "",
      sourceSystemId: crosswalk.sourceSystemId.toString(),
      targetSystemId: crosswalk.targetSystemId.toString(),
      updatedAt: crosswalk.updatedAt.toISOString(),
    });
    
    // Create mapping relationships
    const mappingData = crosswalk.mappingData;
    for (const [sourceId, targetId] of Object.entries(mappingData)) {
      await session.run(`
        MATCH (source:DataItem {id: $sourceId, dataSetId: $sourceDataSetId})
        MATCH (target:DataItem {id: $targetId, dataSetId: $targetDataSetId})
        MERGE (source)-[r:MAPS_TO {crosswalkId: $crosswalkId}]->(target)
        RETURN r
      `, {
        sourceId,
        targetId,
        sourceDataSetId: crosswalk.sourceSystemId.toString(),
        targetDataSetId: crosswalk.targetSystemId.toString(),
        crosswalkId: crosswalk.id.toString(),
      });
    }
  } finally {
    await session.close();
  }
}

migrateData().catch(console.error);
