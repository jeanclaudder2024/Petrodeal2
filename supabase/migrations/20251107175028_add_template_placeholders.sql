-- Create template_placeholders table for storing placeholder configuration
CREATE TABLE IF NOT EXISTS public.template_placeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  placeholder TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'random', -- 'custom', 'database', 'csv', 'random'
  custom_value TEXT, -- For 'custom' source
  database_table TEXT, -- For 'database' source: table name (vessels, ports, refineries, etc.)
  database_field TEXT, -- For 'database' source: column name
  csv_id TEXT, -- For 'csv' source: CSV dataset ID
  csv_field TEXT, -- For 'csv' source: column name
  csv_row INTEGER DEFAULT 0, -- For 'csv' source: row index
  random_option TEXT DEFAULT 'auto', -- For 'random' source: 'auto' or 'fixed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_id, placeholder)
);

-- Add database_table column if it doesn't exist (for existing tables)
ALTER TABLE public.template_placeholders 
ADD COLUMN IF NOT EXISTS database_table TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_template_placeholders_template_id 
ON public.template_placeholders(template_id);

CREATE INDEX IF NOT EXISTS idx_template_placeholders_placeholder 
ON public.template_placeholders(placeholder);

-- Enable RLS
ALTER TABLE public.template_placeholders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Anyone can view template placeholders" ON public.template_placeholders;
DROP POLICY IF EXISTS "Admins can manage template placeholders" ON public.template_placeholders;

-- Policy: Anyone can view placeholder settings (needed for document generation)
CREATE POLICY "Anyone can view template placeholders" 
ON public.template_placeholders 
FOR SELECT 
USING (true);

-- Policy: Admins can manage all placeholder settings
CREATE POLICY "Admins can manage template placeholders" 
ON public.template_placeholders 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_template_placeholders_updated_at ON public.template_placeholders;

-- Create trigger for updated_at
CREATE TRIGGER update_template_placeholders_updated_at
BEFORE UPDATE ON public.template_placeholders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.template_placeholders IS 'Stores placeholder configuration for document templates';
COMMENT ON COLUMN public.template_placeholders.source IS 'Data source type: custom, database, csv, or random';
COMMENT ON COLUMN public.template_placeholders.database_table IS 'Database table name for database source (e.g., vessels, ports, refineries)';
COMMENT ON COLUMN public.template_placeholders.database_field IS 'Database column name for database source';
COMMENT ON COLUMN public.template_placeholders.csv_id IS 'CSV dataset ID for CSV source';
COMMENT ON COLUMN public.template_placeholders.csv_field IS 'CSV column name for CSV source';
COMMENT ON COLUMN public.template_placeholders.csv_row IS 'CSV row index (0-based) for CSV source';

