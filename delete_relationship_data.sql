-- First, store the relationship ID we want to work with
WITH rel AS (
  SELECT "id" 
  FROM "relationships" 
  WHERE "relationship_name" = 'Test Relationship'
)
-- Delete attribute values first (to maintain referential integrity)
DELETE FROM "relationship_attribute_values" 
WHERE "relationship_value_id" IN (
  SELECT "id" 
  FROM "relationship_values" 
  WHERE "relationship_id" = (SELECT id FROM rel)
);

-- Then delete the relationship values
WITH rel AS (
  SELECT "id" 
  FROM "relationships" 
  WHERE "relationship_name" = 'Test Relationship'
)
DELETE FROM "relationship_values" 
WHERE "relationship_id" = (SELECT id FROM rel);