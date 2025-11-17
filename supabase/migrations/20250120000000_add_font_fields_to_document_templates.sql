-- Add font_family and font_size columns to document_templates table
ALTER TABLE public.document_templates 
ADD COLUMN IF NOT EXISTS font_family TEXT,
ADD COLUMN IF NOT EXISTS font_size INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.document_templates.font_family IS 'Font family for document template (e.g., Arial, Times New Roman)';
COMMENT ON COLUMN public.document_templates.font_size IS 'Font size for document template in points';

