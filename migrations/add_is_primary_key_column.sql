-- Add is_primary_key column to reference_data_type_schemas table
ALTER TABLE reference_data_type_schemas 
ADD COLUMN IF NOT EXISTS is_primary_key BOOLEAN NOT NULL DEFAULT FALSE;