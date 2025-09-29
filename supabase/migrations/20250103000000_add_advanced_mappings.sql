-- Add advanced_mappings column to document_templates table
ALTER TABLE document_templates 
ADD COLUMN IF NOT EXISTS advanced_mappings JSONB DEFAULT '{}';

-- Update existing templates to have empty advanced_mappings
UPDATE document_templates 
SET advanced_mappings = '{}' 
WHERE advanced_mappings IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN document_templates.advanced_mappings IS 'Advanced placeholder mappings with database fields, fixed text, and choices';