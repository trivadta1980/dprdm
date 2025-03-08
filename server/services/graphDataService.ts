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

    console.log('Starting getDatasetGraphStats for dataset:', dataSetId);

    // First make sure data exists by syncing
    try {
      await this.syncReferenceDataSet(dataSetId);
    } catch (error) {
      console.error('Error during sync:', error);
      throw error;
    }

    // Get the dataset name using raw SQL
    const datasetQuery = `
      SELECT id, name, data 
      FROM reference_data_sets 
      WHERE id = $1
    `;
    const datasetResult = await db.execute(datasetQuery, [dataSetId]);
    const dataSet = datasetResult.rows[0];

    if (!dataSet) {
      throw new Error(`Dataset ${dataSetId} not found`);
    }

    console.log('Dataset found:', dataSet.name);

    // Query Neo4j for statistics and visualization data
    const vizQuery = `
      MATCH (item:DataItem)
      WHERE item.dataSetId = '${dataSetId}'
      WITH collect(item) as items
      OPTIONAL MATCH (source:DataItem)-[r]->(target:DataItem)
      WHERE source IN items OR target IN items
      WITH items, collect({source: source.name, target: target.name, type: type(r)}) as relationships
      RETURN {
        nodes: [node in items | {
          id: node.name,
          label: node.name,
          type: labels(node)[0]
        }],
        links: relationships
      } as result
    `;

    console.log('Executing visualization query for dataset:', dataSetId);
    const result = await runQuery(vizQuery);
    const graphData = result[0].get('result');

    console.log('Visualization data summary:', {
      nodeCount: graphData.nodes.length,
      linkCount: graphData.links.length
    });

    return {
      totalNodes: graphData.nodes.length,
      dataItems: graphData.nodes.length,
      relationships: graphData.links.length,
      datasetName: dataSet.name,
      visualization: graphData
    };
  }

  static async syncReferenceDataSet(dataSetId: number) {
    if (!this.isAvailable()) {
      console.warn("Neo4j not available, skipping graph sync");
      return null;
    }

    // Fetch the reference data set using raw SQL
    const datasetQuery = `
      SELECT id, name, data 
      FROM reference_data_sets 
      WHERE id = $1
    `;
    const datasetResult = await db.execute(datasetQuery, [dataSetId]);
    const dataSet = datasetResult.rows[0];

    if (!dataSet) {
      throw new Error(`Reference data set with ID ${dataSetId} not found`);
    }

    console.log(`Syncing dataset ${dataSetId} (${dataSet.name}) to Neo4j`);

    // Create nodes for each instance in the dataset
    const data = dataSet.data as Record<string, any>;
    let nodesCreated = 0;

    try {
      // First clear any existing nodes for this dataset
      const clearQuery = `
        MATCH (n:DataItem)
        WHERE n.dataSetId = '${dataSetId}'
        DETACH DELETE n
      `;
      await runQuery(clearQuery);
      console.log(`Cleared existing nodes for dataset ${dataSetId}`);

      // Create nodes for the dataset
      for (const [_, item] of Object.entries(data)) {
        const siteName = item.Site_Name || item.name || JSON.stringify(item);
        const label = Object.entries(item)
          .filter(([key, value]) => key !== '_history' && value !== null && value !== undefined)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

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

        await runQuery(createItemQuery, {
          siteName,
          dataSetId: dataSetId.toString(),
          label,
          properties
        });
        nodesCreated++;
      }

      console.log(`Successfully created ${nodesCreated} nodes for dataset ${dataSetId}`);

      // Find relationships where this dataset is either source or target
      const relationshipsQuery = `
        SELECT DISTINCT 
          r.id as relationship_id,
          r.relationship_type,
          rv.id as value_id,
          rv.source_instance_id,
          rv.target_instance_id,
          CASE WHEN COUNT(rad.id) > 0 THEN
            json_agg(
              json_build_object(
                'name', rad.name,
                'value', rav.value
              )
            ) filter (where rad.name is not null)
          ELSE
            NULL
          END as attributes
        FROM relationships r
        JOIN relationship_values rv ON rv.relationship_id = r.id
        LEFT JOIN relationship_attribute_values rav ON rv.id = rav.relationship_value_id
        LEFT JOIN relationship_attribute_definitions rad ON rav.attribute_definition_id = rad.id
        WHERE r.source_data_set_id = $1 OR r.target_data_set_id = $1
        GROUP BY r.id, r.relationship_type, rv.id, rv.source_instance_id, rv.target_instance_id
      `;

      const relationships = await db.execute(relationshipsQuery, [dataSetId]);
      console.log(`Found ${relationships.rows.length} relationships for dataset ${dataSetId}`);

      // Process each relationship with its attributes
      for (const row of relationships.rows) {
        console.log('\nProcessing relationship:', {
          id: row.relationship_id,
          type: row.relationship_type,
          source: row.source_instance_id,
          target: row.target_instance_id,
          hasAttributes: row.attributes !== null
        });

        try {
          // Skip if source or target is missing
          if (!row.source_instance_id || !row.target_instance_id) {
            console.log('Skipping relationship - missing source or target');
            continue;
          }

          // Verify nodes exist first
          const verifyNodesQuery = `
            MATCH (source:DataItem {name: $sourceName})
            MATCH (target:DataItem {name: $targetName})
            RETURN source, target
          `;

          const nodesExist = await runQuery(verifyNodesQuery, {
            sourceName: row.source_instance_id,
            targetName: row.target_instance_id
          });

          if (nodesExist.length === 0) {
            console.warn(`Skipping relationship - Nodes not found: source=${row.source_instance_id}, target=${row.target_instance_id}`);
            continue;
          }

          // Build attributes object starting with base attributes
          const attributes: Record<string, any> = {
            relationshipId: row.relationship_id.toString(),
            type: row.relationship_type
          };

          // Add additional attributes only if they exist
          if (row.attributes && Array.isArray(row.attributes)) {
            console.log(`Adding ${row.attributes.length} attributes to relationship`);
            for (const attr of row.attributes) {
              if (attr.value !== null && attr.name) {
                attributes[attr.name] = attr.value;
              }
            }
          } else {
            console.log(`No additional attributes for ${row.relationship_type} relationship`);
          }

          console.log('Creating Neo4j relationship with attributes:', {
            source: row.source_instance_id,
            target: row.target_instance_id,
            type: row.relationship_type,
            attributes: JSON.stringify(attributes, null, 2)
          });

          // Create or update relationship with attributes in Neo4j
          const createRelQuery = `
            MATCH (source:DataItem {name: $sourceName})
            MATCH (target:DataItem {name: $targetName})
            MERGE (source)-[r:${row.relationship_type.toUpperCase()} {relationshipId: $relationshipId}]->(target)
            SET r = $attributes
            RETURN r
          `;

          await runQuery(createRelQuery, {
            sourceName: row.source_instance_id,
            targetName: row.target_instance_id,
            relationshipId: attributes.relationshipId,
            attributes
          });

          console.log('Successfully created relationship');
        } catch (error) {
          console.error('Error creating relationship:', error);
          console.error('Relationship data:', row);
        }
      }

    } catch (error) {
      console.error(`Error syncing dataset ${dataSetId} to Neo4j:`, error);
      throw error;
    }

    return dataSet.id;
  }

  static async debugRelationships() {
    if (!this.isAvailable()) {
      throw new Error("Neo4j not available");
    }

    const session = this.getSession();
    try {
      // Count nodes and relationships
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