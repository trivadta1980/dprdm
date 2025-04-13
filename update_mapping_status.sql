-- SQL script to update the status of individual mappings in crosswalk_mappings.mapping_data to match the overall status
-- For all mappings that have an approval_status set but individual mapping items don't have a status

-- Get all crosswalk mappings
WITH mappings AS (
  SELECT 
    id, 
    name, 
    approval_status, 
    mapping_data
  FROM 
    crosswalk_mappings
),
-- Process each mapping: update the mappingData JSON to set status on all individual mappings
updated_mappings AS (
  SELECT 
    id,
    name, 
    approval_status,
    jsonb_set(
      mapping_data,
      '{mappings}',
      (
        SELECT 
          jsonb_agg(
            jsonb_set(mapping, '{status}', to_jsonb(m.approval_status))
          )
        FROM 
          jsonb_array_elements(mapping_data->'mappings') AS mapping
        WHERE
          mapping->>'status' IS NULL OR mapping->>'status' != m.approval_status
      )
    ) AS updated_mapping_data
  FROM 
    mappings m
  WHERE 
    mapping_data->>'mappings' IS NOT NULL
)
-- Finally update the database with the processed data
UPDATE crosswalk_mappings c
SET 
  mapping_data = u.updated_mapping_data,
  updated_at = NOW()
FROM 
  updated_mappings u
WHERE 
  c.id = u.id
RETURNING 
  c.id, c.name, c.approval_status;