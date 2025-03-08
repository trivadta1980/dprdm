import neo4j from 'neo4j-driver';
import { db } from './server/db.js';
import * as schema from './shared/schema.js';
import { eq, or } from 'drizzle-orm';

async function debugRelationships() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
  );
  
  const session = driver.session();
  
  try {
    // First verify both nodes exist
    console.log('\nVerifying nodes...');
    const nodesResult = await session.run(`
      MATCH (n:DataItem)
      WHERE n.name IN [$source, $target]
      RETURN n.name
    `, {
      source: 'Catalent Pharma Solutions Inc. - Madison, WI US',
      target: 'BioReliance - Glasgow UK'
    });
    
    console.log('Found nodes:', nodesResult.records.map(r => r.get('n.name')));
    
    // Get the relationship from database
    const relationships = await db.query.relationships.findMany({
      where: or(
        eq(schema.relationships.sourceDataSetId, 3),
        eq(schema.relationships.targetDataSetId, 3)
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

    console.log('\nFound relationships in PostgreSQL:', relationships.length);
    
    // Create relationship
    console.log('\nCreating relationship...');
    const createResult = await session.run(`
      MATCH (source:DataItem {name: $sourceName})
      MATCH (target:DataItem {name: $targetName})
      MERGE (source)-[r:ASSOCIATION]->(target)
      SET r.relationshipId = $relationshipId
      RETURN r
    `, {
      sourceName: 'Catalent Pharma Solutions Inc. - Madison, WI US',
      targetName: 'BioReliance - Glasgow UK',
      relationshipId: '1555' // From the SQL query we ran earlier
    });
    
    console.log('Relationship created:', createResult.records.length > 0);
    
    // Verify all relationships
    const verifyResult = await session.run(`
      MATCH p=()-[r:ASSOCIATION]->()
      RETURN count(r) as count
    `);
    
    console.log('\nTotal ASSOCIATION relationships:', verifyResult.records[0].get('count').toNumber());
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugRelationships().catch(console.error);
