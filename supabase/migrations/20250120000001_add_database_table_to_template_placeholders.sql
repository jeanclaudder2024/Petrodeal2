-- Add database_table column to template_placeholders table if it doesn't exist
ALTER TABLE public.template_placeholders 
ADD COLUMN IF NOT EXISTS database_table TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.template_placeholders.database_table IS 'Database table name for database source (e.g., vessels, ports, refineries, companies)';

