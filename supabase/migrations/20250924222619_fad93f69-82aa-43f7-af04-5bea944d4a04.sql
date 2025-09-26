-- Remove AI document generation related tables
DROP TABLE IF EXISTS document_generation_logs CASCADE;
DROP TABLE IF EXISTS json_templates CASCADE;
DROP TABLE IF EXISTS word_templates CASCADE;
DROP TABLE IF EXISTS word_document_templates CASCADE;
DROP TABLE IF EXISTS vessel_document_prompts CASCADE;

-- Keep only essential document tables
-- user_document_storage and vessel_documents will remain for basic document management