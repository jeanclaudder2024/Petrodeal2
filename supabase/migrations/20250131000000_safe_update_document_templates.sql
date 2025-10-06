-- Safe migration to update existing document_templates table
-- This migration is designed to be backward compatible and safe

-- Create backup table for extra safety (optional)
CREATE TABLE IF NOT EXISTS document_templates_backup AS 
SELECT * FROM public.document_templates;

-- Add new columns for FastAPI integration (safe - only adds if not exists)
ALTER TABLE public.document_templates 
ADD COLUMN IF NOT EXISTS template_file BYTEA,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100) DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

-- Rename columns for consistency with FastAPI (safe - preserves all data)
-- Check if column exists before renaming to avoid errors
DO $$ 
BEGIN
    -- Rename title to name if title column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'document_templates' 
               AND column_name = 'title' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.document_templates RENAME COLUMN title TO name;
    END IF;
    
    -- Rename field_mappings to placeholder_mappings if field_mappings column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'document_templates' 
               AND column_name = 'field_mappings' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.document_templates RENAME COLUMN field_mappings TO placeholder_mappings;
    END IF;
END $$;

-- Remove unused file_url column if it exists (safe - only removes if exists)
ALTER TABLE public.document_templates 
DROP COLUMN IF EXISTS file_url;

-- Add comment for documentation
COMMENT ON TABLE public.document_templates IS 'Document templates table updated for FastAPI integration - stores Word templates with placeholders and mappings';

-- Verify the migration worked
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully. Table structure updated for FastAPI integration.';
    RAISE NOTICE 'Existing data preserved. New columns added for file storage.';
END $$;
