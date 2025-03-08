import { db } from '../db';
import neo4j, { isNeo4jAvailable, runQuery } from '../neo4j';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

// Base class for graph data operations
export class GraphDataService {
  // Check if graph database is available
  static isAvailable() {
    return isNeo4jAvailable();
  }

  // Get Neo4j session
  static getSession() {
    if (!this.isAvailable()) {
      throw new Error("Neo4j not available");
    }
    return neo4j.getSession();
  }

  // Get statistics about dataset nodes and relationships
  static async getDatasetGraphStats(dataSetId: number) {
    if (!this.isAvailable()) {
      throw new Error("Neo4j not available");
    }

    // First make sure data exists by syncing
    await this.syncReferenceDataSet(dataSetId);

    // Get the dataset name
    const dataSet = await db.query.referenceDataSets.findFirst({
      where: eq(schema.referenceDataSets.id, dataSetId)
    });

    if (!dataSet) {
      throw new Error(`Dataset ${dataSetId} not found`);
    }

    // Query Neo4j for statistics
    const statsQuery = `
      MATCH (ds:DataSet {id: $dataSetId})
      OPTIONAL MATCH (ds)-[:CONTAINS]->(item:DataItem)
      OPTIONAL MATCH (item)-[r]-()
      RETURN 
        count(DISTINCT ds) + count(DISTINCT item) as totalNodes,
        count(DISTINCT item) as dataItems,
        count(DISTINCT r) as relationships
    `;

    const result = await runQuery(statsQuery, { dataSetId: dataSetId.toString() });
    const stats = result[0].get(0);

    return {
      totalNodes: stats.get('totalNodes').toNumber(),
      dataItems: stats.get('dataItems').toNumber(),
      relationships: stats.get('relationships').toNumber(),
      datasetName: dataSet.name
    };
  }

  // Create or update reference data set in Neo4j
  static async syncReferenceDataSet(dataSetId: number) {
    if (!this.isAvailable()) {
      console.warn("Neo4j not available, skipping graph sync");
      return null;
    }

    // Fetch the reference data set from PostgreSQL
    const dataSet = await db.query.referenceDataSets.findFirst({
      where: eq(schema.referenceDataSets.id, dataSetId),
      with: {
        type: {
          with: {
            schemas: true,
          },
        },
      },
    });

    if (!dataSet) {
      throw new Error(`Reference data set with ID ${dataSetId} not found`);
    }

    // Create the dataset node in Neo4j
    const createDataSetQuery = `
      MERGE (ds:DataSet {id: $id, name: $name})
      SET ds.description = $description, 
          ds.typeId = $typeId,
          ds.typeName = $typeName,
          ds.updatedAt = $updatedAt
      RETURN ds
    `;

    await runQuery(createDataSetQuery, {
      id: dataSet.id.toString(),
      name: dataSet.name,
      description: dataSet.description || "",
      typeId: dataSet.typeId.toString(),
      typeName: dataSet.type.name,
      updatedAt: dataSet.updatedAt.toISOString(),
    });

    // Create nodes for each item in the dataset
    const data = dataSet.data as Record<string, any>;

    for (const [itemId, item] of Object.entries(data)) {
      const createItemQuery = `
        MERGE (item:DataItem {id: $itemId, dataSetId: $dataSetId})
        SET item += $properties
        WITH item
        MATCH (ds:DataSet {id: $dataSetId})
        MERGE (ds)-[:CONTAINS]->(item)
        RETURN item
      `;

      // Prepare properties object, excluding _history
      const properties: Record<string, any> = {};
      for (const [key, value] of Object.entries(item)) {
        if (key !== '_history' && value !== null && value !== undefined) {
          properties[key] = value.toString();
        }
      }

      await runQuery(createItemQuery, {
        itemId,
        dataSetId: dataSet.id.toString(),
        properties,
      });
    }

    return dataSet.id;
  }

  // Sync relationship data to Neo4j
  static async syncRelationship(relationshipId: number) {
    if (!this.isAvailable()) {
      console.warn("Neo4j not available, skipping relationship sync");
      return null;
    }

    // Fetch relationship data from PostgreSQL
    const relationship = await db.query.relationships.findFirst({
      where: eq(schema.relationships.id, relationshipId),
      with: {
        sourceDataSet: true,
        targetDataSet: true,
        values: true,
      },
    });

    if (!relationship) {
      throw new Error(`Relationship with ID ${relationshipId} not found`);
    }

    // Create relationship type in Neo4j
    const createRelTypeQuery = `
      MERGE (rel:RelationshipType {id: $id, name: $name})
      SET rel.relationshipType = $relType,
          rel.cardinality = $cardinality,
          rel.sourceField = $sourceField,
          rel.targetField = $targetField,
          rel.updatedAt = $updatedAt
      RETURN rel
    `;

    await runQuery(createRelTypeQuery, {
      id: relationship.id.toString(),
      name: relationship.name,
      relType: relationship.relationshipType,
      cardinality: relationship.cardinality,
      sourceField: relationship.sourceField,
      targetField: relationship.targetField,
      updatedAt: relationship.updatedAt.toISOString(),
    });

    // Create relationship instances between data items
    for (const relValue of relationship.values) {
      const createRelInstanceQuery = `
        MATCH (source:DataItem {id: $sourceId, dataSetId: $sourceDataSetId})
        MATCH (target:DataItem {id: $targetId, dataSetId: $targetDataSetId})
        MERGE (source)-[r:${relationship.relationshipType.toUpperCase()} {relationshipId: $relationshipId}]->(target)
        SET r += $metadata
        RETURN r
      `;

      await runQuery(createRelInstanceQuery, {
        sourceId: relValue.sourceInstanceId,
        targetId: relValue.targetInstanceId,
        sourceDataSetId: relationship.sourceDataSetId.toString(),
        targetDataSetId: relationship.targetDataSetId.toString(),
        relationshipId: relationship.id.toString(),
        metadata: relValue.metadata || {},
      });
    }

    return relationship.id;
  }

  // Sync crosswalk mappings to Neo4j
  static async syncCrosswalkMapping(crosswalkId: number) {
    if (!this.isAvailable()) {
      console.warn("Neo4j not available, skipping crosswalk sync");
      return null;
    }

    // Fetch crosswalk data from PostgreSQL
    const crosswalk = await db.query.crosswalkMappings.findFirst({
      where: eq(schema.crosswalkMappings.id, crosswalkId),
      with: {
        sourceSystem: true,
        targetSystem: true,
      },
    });

    if (!crosswalk) {
      throw new Error(`Crosswalk with ID ${crosswalkId} not found`);
    }

    // Create crosswalk in Neo4j
    const createCrosswalkQuery = `
      MERGE (cw:Crosswalk {id: $id, name: $name})
      SET cw.description = $description,
          cw.sourceSystemId = $sourceSystemId,
          cw.targetSystemId = $targetSystemId,
          cw.updatedAt = $updatedAt
      RETURN cw
    `;

    await runQuery(createCrosswalkQuery, {
      id: crosswalk.id.toString(),
      name: crosswalk.name,
      description: crosswalk.description || "",
      sourceSystemId: crosswalk.sourceSystemId.toString(),
      targetSystemId: crosswalk.targetSystemId.toString(),
      updatedAt: crosswalk.updatedAt.toISOString(),
    });

    // Create mappings between items
    const mappingData = crosswalk.mappingData as Record<string, string>;

    for (const [sourceId, targetId] of Object.entries(mappingData)) {
      const createMappingQuery = `
        MATCH (source:DataItem {id: $sourceId, dataSetId: $sourceDataSetId})
        MATCH (target:DataItem {id: $targetId, dataSetId: $targetDataSetId})
        MERGE (source)-[r:MAPS_TO {crosswalkId: $crosswalkId}]->(target)
        RETURN r
      `;

      await runQuery(createMappingQuery, {
        sourceId,
        targetId,
        sourceDataSetId: crosswalk.sourceSystemId.toString(),
        targetDataSetId: crosswalk.targetSystemId.toString(),
        crosswalkId: crosswalk.id.toString(),
      });
    }

    return crosswalk.id;
  }
}

export default GraphDataService;