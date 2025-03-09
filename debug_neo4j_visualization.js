import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "password";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function debugVisualization() {
  const session = driver.session();

  try {
    // First check total nodes and relationships
    console.log('\nChecking database statistics...');
    const statsQuery = `
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->()
      RETURN count(DISTINCT n) as nodes, count(DISTINCT r) as relationships,
             collect(DISTINCT labels(n)) as nodeTypes,
             collect(DISTINCT type(r)) as relationshipTypes
    `;
    const statsResult = await session.run(statsQuery);
    const stats = statsResult.records[0];
    console.log('Database stats:', {
      nodes: stats.get('nodes').toNumber(),
      relationships: stats.get('relationships').toNumber(),
      nodeTypes: stats.get('nodeTypes'),
      relationshipTypes: stats.get('relationshipTypes')
    });

    // Check relationship properties
    console.log('\nChecking relationship properties...');
    const propsQuery = `
      MATCH ()-[r]->()
      RETURN DISTINCT type(r) as type, 
             keys(r) as properties,
             count(r) as count
    `;
    const propsResult = await session.run(propsQuery);
    console.log('Relationship types and properties:');
    propsResult.records.forEach(record => {
      console.log({
        type: record.get('type'),
        properties: record.get('properties'),
        count: record.get('count').toNumber()
      });
    });

    // Sample a few paths
    console.log('\nSampling some paths...');
    const pathsQuery = `
      MATCH path = (start:DataItem)-[*1..3]->(end:DataItem)
      WHERE start.Site_Type = 'API' AND end.Site_Type = 'DP'
      RETURN path
      LIMIT 3
    `;
    const pathsResult = await session.run(pathsQuery);
    console.log('Sample paths:', pathsResult.records.map(record => {
      const path = record.get('path');
      return path.segments.map(segment => ({
        start: segment.start.properties.name,
        relationship: segment.relationship.type,
        end: segment.end.properties.name
      }));
    }));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugVisualization().catch(console.error);