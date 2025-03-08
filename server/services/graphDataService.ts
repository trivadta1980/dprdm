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

    await this.syncReferenceDataSet(dataSetId);

    const dataSet = await db.query.referenceDataSets.findFirst({
      where: eq(schema.referenceDataSets.id, dataSetId)
    });

    if (!dataSet) {
      throw new Error(`Dataset ${dataSetId} not found`);
    }

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

    const dataSet = await db.query.referenceDataSets.findFirst({
      where: eq(schema.referenceDataSets.id, dataSetId)
    });

    if (!dataSet) {
      throw new Error(`Reference data set with ID ${dataSetId} not found`);
    }

    console.log(`Syncing dataset ${dataSetId} (${dataSet.name}) to Neo4j`);

    // Create nodes first
    const data = dataSet.data as Record<string, any>;
    for (const [_, item] of Object.entries(data)) {
      const siteId = item.Site_Name || item.name || JSON.stringify(item);

      const properties: Record<string, any> = {};
      for (const [key, value] of Object.entries(item)) {
        if (key !== '_history' && value !== null && value !== undefined) {
          properties[key] = value.toString();
        }
      }

      const createNodeQuery = `
        MERGE (item:DataItem {id: $siteId})
        SET item.dataSetId = $dataSetId,
            item.name = $siteId,
            item += $properties
        RETURN item
      `;

      try {
        await runQuery(createNodeQuery, {
          siteId,
          dataSetId: dataSetId.toString(),
          properties
        });
        console.log(`Created/Updated node: ${siteId}`);
      } catch (error) {
        console.error(`Error creating node for ${siteId}:`, error);
      }
    }

    // Now handle relationships
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

    console.log(`Found ${relationships.length} relationships to process for dataset ${dataSetId}`);

    for (const relationship of relationships) {
      console.log(`Processing relationship ${relationship.id} (${relationship.relationshipType})`);

      for (const value of relationship.values) {
        const sourceId = value.sourceInstanceId;
        const targetId = value.targetInstanceId;

        // First verify both nodes exist - using names for matching
        const verifyNodesQuery = `
          MATCH (source:DataItem {name: $sourceId})
          MATCH (target:DataItem {name: $targetId})
          RETURN source, target
        `;

        try {
          const nodesExist = await runQuery(verifyNodesQuery, {
            sourceId,
            targetId
          });

          if (nodesExist.length === 0) {
            console.error(`Cannot create relationship - nodes not found: ${sourceId} -> ${targetId}`);
            continue;
          }

          // Collect relationship attributes
          const attributes: Record<string, string> = {};
          if (value.attributeValues) {
            for (const attrValue of value.attributeValues) {
              if (attrValue.definition?.name) {
                attributes[attrValue.definition.name] = attrValue.value;
              }
            }
          }

          // Add metadata and relationship properties
          const allAttributes = {
            ...attributes,
            ...value.metadata,
            relationshipId: relationship.id.toString(),
            type: relationship.relationshipType,
            sourceDataSetId: relationship.sourceDataSetId.toString(),
            targetDataSetId: relationship.targetDataSetId.toString()
          };

          // Create the relationship - using names for matching
          const createRelationshipQuery = `
            MATCH (source:DataItem {name: $sourceId})
            MATCH (target:DataItem {name: $targetId})
            CREATE (source)-[r:${relationship.relationshipType.toUpperCase()}]->(target)
            SET r = $attributes
            RETURN r
          `;

          await runQuery(createRelationshipQuery, {
            sourceId,
            targetId,
            attributes: allAttributes
          });

          console.log(`Created relationship: ${sourceId} -[${relationship.relationshipType}]-> ${targetId}`);
        } catch (error) {
          console.error(`Error creating relationship:`, error);
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

    console.log(`Starting to sync relationship ${relationshipId}`);

    const relationship = await db.query.relationships.findFirst({
      where: eq(schema.relationships.id, relationshipId),
      with: {
        sourceDataSet: true,
        targetDataSet: true,
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

    if (!relationship) {
      throw new Error(`Relationship with ID ${relationshipId} not found`);
    }

    console.log(`Found relationship: ${JSON.stringify(relationship, null, 2)}`);

    for (const relValue of relationship.values) {
      console.log(`Processing relationship value: ${JSON.stringify(relValue, null, 2)}`);

      const attributes: Record<string, string> = {};
      if (relValue.attributeValues) {
        console.log(`Found ${relValue.attributeValues.length} attribute values`);
        for (const attrValue of relValue.attributeValues) {
          if (attrValue.definition?.name) {
            console.log(`Adding attribute ${attrValue.definition.name}: ${attrValue.value}`);
            attributes[attrValue.definition.name] = attrValue.value;
          }
        }
      }

      console.log(`Final attributes object: ${JSON.stringify(attributes, null, 2)}`);

      // Verify nodes exist using names
      const verifyNodesQuery = `
        MATCH (source:DataItem {name: $sourceId})
        MATCH (target:DataItem {name: $targetId})
        RETURN source, target
      `;

      try {
        const nodesExist = await runQuery(verifyNodesQuery, {
          sourceId: relValue.sourceInstanceId,
          targetId: relValue.targetInstanceId
        });

        if (nodesExist.length === 0) {
          console.error(`Cannot create relationship - nodes not found: ${relValue.sourceInstanceId} -> ${relValue.targetInstanceId}`);
          continue;
        }

        // Create relationship using names for matching nodes
        const createRelationshipQuery = `
          MATCH (source:DataItem {name: $sourceId})
          MATCH (target:DataItem {name: $targetId})
          MERGE (source)-[r:${relationship.relationshipType.toUpperCase()} {relationshipId: $relationshipId}]->(target)
          SET r = $attributes
          RETURN r
        `;

        await runQuery(createRelationshipQuery, {
          sourceId: relValue.sourceInstanceId,
          targetId: relValue.targetInstanceId,
          relationshipId: relationship.id.toString(),
          attributes: {
            ...attributes,
            ...relValue.metadata,
            type: relationship.relationshipType,
            sourceDataSetId: relationship.sourceDataSetId.toString(),
            targetDataSetId: relationship.targetDataSetId.toString()
          }
        });

        console.log(`Successfully created relationship with attributes`);
      } catch (error) {
        console.error(`Error creating relationship:`, error);
      }
    }

    return relationship.id;
  }

  static async syncCrosswalkMapping(crosswalkId: number) {
    if (!this.isAvailable()) {
      console.warn("Neo4j not available, skipping crosswalk sync");
      return null;
    }

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
      const countQuery = `
        MATCH (n) 
        OPTIONAL MATCH ()-[r]->()
        RETURN count(DISTINCT n) as nodeCount, count(DISTINCT r) as relationshipCount
      `;
      const countResult = await runQuery(countQuery);

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