-- Add file_name column to template_placeholders for direct Replit lookup (no UUID confusion)
ALTER TABLE public.template_placeholders 
ADD COLUMN IF NOT EXISTS template_file_name text;

-- Create index for fast lookup by file_name
CREATE INDEX IF NOT EXISTS idx_template_placeholders_file_name 
ON public.template_placeholders(template_file_name);

-- Create document_template_fields table for comprehensive per-template field management
CREATE TABLE IF NOT EXISTS public.document_template_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_file_name TEXT NOT NULL,
  placeholder_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'database' CHECK (source IN ('database', 'ai')),
  database_table TEXT,
  database_column TEXT,
  ai_prompt TEXT,
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_template_placeholder UNIQUE(template_file_name, placeholder_name)
);

-- Enable RLS
ALTER TABLE public.document_template_fields ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin can manage template fields" 
ON public.document_template_fields 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_document_template_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_document_template_fields_timestamp
BEFORE UPDATE ON public.document_template_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_document_template_fields_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.document_template_fields IS 'Per-template placeholder field registry for Replit document generation';
COMMENT ON COLUMN public.document_template_fields.template_file_name IS 'Exact file name for Replit lookup (e.g., "VERY NEW AML TEDST 2026.docx")';
COMMENT ON COLUMN public.document_template_fields.placeholder_name IS 'Placeholder name without curly braces (e.g., "vessel_name")';
COMMENT ON COLUMN public.document_template_fields.source IS 'Data source: database or ai';
COMMENT ON COLUMN public.document_template_fields.database_table IS 'Source table for database placeholders';
COMMENT ON COLUMN public.document_template_fields.database_column IS 'Source column for database placeholders';