// @ts-check
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function deleteAllRelationshipValues(relationshipId) {
  console.log(`Starting deletion for relationship ID: ${relationshipId}`);

  try {
    await db.transaction(async (tx) => {
      // First delete attribute values
      const attrResult = await tx.execute(sql`
        DELETE FROM relationship_attribute_values 
        WHERE relationship_value_id IN (
          SELECT id FROM relationship_values 
          WHERE relationship_id = ${relationshipId}
        )
      `);
      console.log('Deleted attribute values');

      // Then delete relationship values
      const relResult = await tx.execute(sql`
        DELETE FROM relationship_values 
        WHERE relationship_id = ${relationshipId}
      `);
      console.log('Deleted relationship values');
    });

    console.log('Successfully deleted all values');
  } catch (error) {
    console.error('Error during deletion:', error);
    throw error;
  }
}

// Execute test
const relationshipId = process.argv[2];
if (!relationshipId) {
  console.error('Please provide a relationship ID as argument');
  process.exit(1);
}

deleteAllRelationshipValues(Number(relationshipId))
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });