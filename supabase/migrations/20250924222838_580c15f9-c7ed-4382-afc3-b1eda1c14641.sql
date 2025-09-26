-- Remove AI-related fields from vessel_documents table to keep only basic document info
ALTER TABLE vessel_documents 
DROP COLUMN IF EXISTS ai_prompt,
DROP COLUMN IF EXISTS json_template_id,
DROP COLUMN IF EXISTS word_template_id,
DROP COLUMN IF EXISTS uses_custom_template,
DROP COLUMN IF EXISTS template_file_url;

-- Ensure we keep only the basic fields: id, title, description, subscription_level, is_active, created_at, created_by