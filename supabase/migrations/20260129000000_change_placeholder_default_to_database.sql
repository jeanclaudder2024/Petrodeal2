-- Change default source from 'random' to 'database' for template placeholders
-- This ensures new placeholders default to pulling data from database tables
-- instead of generating random values

-- Change the column default
ALTER TABLE public.template_placeholders 
ALTER COLUMN source SET DEFAULT 'database';

-- Update existing records: change 'random', null, or empty to 'database'
-- This updates any existing placeholders that were using random data
UPDATE public.template_placeholders 
SET source = 'database' 
WHERE source IS NULL OR source = '' OR source = 'random';

-- Update the comment to reflect the new default
COMMENT ON COLUMN public.template_placeholders.source IS 'Data source type: custom, database, csv, or random. Default is database.';
