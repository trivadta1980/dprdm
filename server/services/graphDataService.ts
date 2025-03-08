import { db } from '../db';
import neo4j, { isNeo4jAvailable, runQuery } from '../neo4j';
import * as schema from '@shared/schema';
import { eq, or } from 'drizzle-orm';

export class GraphDataService {
  static isAvailable() {
    return isNeo4jAvailable();
  }

  static getSession() {
    if (!this.isAvailable()) {
      throw new Error("Neo4j not available");
    }
    return neo4j.getSession();
  }

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
      MATCH (item:DataItem {dataSetId: $dataSetId})
      OPTIONAL MATCH (item)-[r]-()
      RETURN 
        count(DISTINCT item) as dataItems,
        count(DISTINCT r) as relationships
    `;

    const result = await runQuery(statsQuery, { dataSetId: dataSetId.toString() });
    const stats = result[0];

    return {
      totalNodes: stats.get('dataItems').toNumber(),
      dataItems: stats.get('dataItems').toNumber(),
      relationships: stats.get('relationships').toNumber(),
      datasetName: dataSet.name
    };
  }

  static async syncReferenceDataSet(dataSetId: number) {
    if (!this.isAvailable()) {
      console.warn("Neo4j not available, skipping graph sync");
      return null;
    }

    // Fetch the reference data set
    const dataSet = await db.query.referenceDataSets.findFirst({
      where: eq(schema.referenceDataSets.id, dataSetId)
    });

    if (!dataSet) {
      throw new Error(`Reference data set with ID ${dataSetId} not found`);
    }

    console.log(`Syncing dataset ${dataSetId} (${dataSet.name}) to Neo4j`);

    // Create nodes for each instance in the dataset
    const data = dataSet.data as Record<string, any>;
    for (const [_, item] of Object.entries(data)) {
      // Use the site name as the unique identifier
      const siteName = item.Site_Name || item.name || JSON.stringify(item);

      // Create a meaningful label from the item's properties
      const label = Object.entries(item)
        .filter(([key, value]) => key !== '_history' && value !== null && value !== undefined)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      // Create or update the item node
      const createItemQuery = `
        MERGE (item:DataItem {name: $siteName})
        SET item.dataSetId = $dataSetId,
            item.label = $label,
            item += $properties
        RETURN item
      `;

      const properties: Record<string, any> = {};
      for (const [key, value] of Object.entries(item)) {
        if (key !== '_history' && value !== null && value !== undefined) {
          properties[key] = value.toString();
        }
      }

      try {
        await runQuery(createItemQuery, {
          siteName,
          dataSetId: dataSetId.toString(),
          label,
          properties
        });
        console.log(`Created/Updated node for ${siteName}`);
      } catch (error) {
        console.error(`Error creating node for ${siteName}:`, error);
      }
    }

    // Find and sync all relationships where this dataset is either source or target
    const relationships = await db.query.relationships.findMany({
      where: or(
        eq(schema.relationships.sourceDataSetId, dataSetId),
        eq(schema.relationships.targetDataSetId, dataSetId)
      ),
      with: {
        values: {
          with: {
            attributeValues: {
              with: {
                definition: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${relationships.length} relationships for dataset ${dataSetId}`);

    // Get relationship values and their attributes for each relationship
    for (const relationship of relationships) {
      console.log(`Processing relationship ${relationship.id} (${relationship.relationshipType})`);

      for (const value of relationship.values) {
        console.log(`Creating relationship between "${value.sourceInstanceId}" and "${value.targetInstanceId}"`);

        // Collect all attributes for this relationship value
        const attributes: Record<string, string> = {};
        if (value.attributeValues) {
          for (const attrValue of value.attributeValues) {
            if (attrValue.definition?.name) {
              attributes[attrValue.definition.name] = attrValue.value;
            }
          }
        }

        // Create relationship using site names instead of IDs
        const createRelInstanceQuery = `
          MATCH (source:DataItem {name: $sourceId})
          MATCH (target:DataItem {name: $targetId})
          MERGE (source)-[r:${relationship.relationshipType.toUpperCase()} {
            relationshipId: $relationshipId
          }]->(target)
          SET r += $attributes
          RETURN r
        `;

        try {
          await runQuery(createRelInstanceQuery, {
            sourceId: value.sourceInstanceId,
            targetId: value.targetInstanceId,
            relationshipId: relationship.id.toString(),
            attributes
          });

          console.log(`Successfully created relationship from "${value.sourceInstanceId}" to "${value.targetInstanceId}" with attributes:`, attributes);
        } catch (error) {
          console.error(`Error creating relationship from "${value.sourceInstanceId}" to "${value.targetInstanceId}":`, error);
        }
      }
    }

    return dataSet.id;
  }

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
  static async debugRelationships() {
    if (!this.isAvailable()) {
      throw new Error("Neo4j not available");
    }

    const session = this.getSession();
    try {
      // Count nodes and relationships separately
      const countQuery = `
        MATCH (n) 
        OPTIONAL MATCH ()-[r]->()
        RETURN count(DISTINCT n) as nodeCount, count(DISTINCT r) as relationshipCount
      `;
      const countResult = await runQuery(countQuery);

      // Get sample relationships with their properties
      const sampleQuery = `
        MATCH (source:DataItem)-[r]->(target:DataItem)
        RETURN 
          source.name as sourceNode, 
          type(r) as relType, 
          target.name as targetNode,
          properties(r) as attributes
        LIMIT 5
      `;
      const sampleResult = await runQuery(sampleQuery);

      return {
        totalNodes: countResult[0].get('nodeCount').toNumber(),
        totalRelationships: countResult[0].get('relationshipCount').toNumber(),
        sampleRelationships: sampleResult.map(record => ({
          source: record.get('sourceNode'),
          type: record.get('relType'),
          target: record.get('targetNode'),
          attributes: record.get('attributes')
        }))
      };
    } finally {
      await session.close();
    }
  }
  static async findProductShippingPaths(productId: string, sourceLocation?: string, targetLocation?: string) {
    if (!this.isAvailable()) {
      throw new Error("Neo4j not available");
    }

    let query: string;
    const params: Record<string, any> = { productId };

    if (sourceLocation && targetLocation) {
      // Find paths between specific source and target locations
      query = `
        MATCH path = (source:DataItem {name: $sourceLocation})-[r:ASSOCIATION*]->(target:DataItem {name: $targetLocation})
        WHERE ALL(rel IN r WHERE rel.product = $productId)
        RETURN path, 
               [node IN nodes(path) | node.name] as nodeNames,
               [rel IN relationships(path) | type(rel)] as relationshipTypes,
               length(path) as pathLength
        ORDER BY pathLength
      `;
      params.sourceLocation = sourceLocation;
      params.targetLocation = targetLocation;
    } else if (sourceLocation) {
      // Find all possible destinations from a source
      query = `
        MATCH path = (source:DataItem {name: $sourceLocation})-[r:ASSOCIATION*]->(target:DataItem)
        WHERE ALL(rel IN r WHERE rel.product = $productId)
        RETURN path,
               [node IN nodes(path) | node.name] as nodeNames,
               [rel IN relationships(path) | type(rel)] as relationshipTypes,
               length(path) as pathLength
        ORDER BY pathLength
      `;
      params.sourceLocation = sourceLocation;
    } else {
      // Find all paths for a product
      query = `
        MATCH path = (source:DataItem)-[r:ASSOCIATION*]->(target:DataItem)
        WHERE ALL(rel IN r WHERE rel.product = $productId)
        RETURN path,
               [node IN nodes(path) | node.name] as nodeNames,
               [rel IN relationships(path) | type(rel)] as relationshipTypes,
               length(path) as pathLength
        ORDER BY pathLength
      `;
    }

    const result = await runQuery(query, params);
    return result.map(record => ({
      nodes: record.get('nodeNames'),
      relationships: record.get('relationshipTypes'),
      length: record.get('pathLength').toNumber()
    }));
  }
}

export default GraphDataService;