-- Drop the conflicting constraint that requires uppercase 'DATABASE'/'AI'
ALTER TABLE public.template_placeholders 
DROP CONSTRAINT IF EXISTS template_placeholders_random_option_check;

-- The existing source_check constraint already allows: 'random', 'custom', 'database', 'csv'
-- We need to add 'ai' as a valid source type for AI-generated placeholders
ALTER TABLE public.template_placeholders 
DROP CONSTRAINT IF EXISTS template_placeholders_source_check;

ALTER TABLE public.template_placeholders 
ADD CONSTRAINT template_placeholders_source_check 
CHECK (source = ANY (ARRAY['random', 'custom', 'database', 'csv', 'ai']));

-- Make random_option nullable to support database sources
ALTER TABLE public.template_placeholders 
ALTER COLUMN random_option DROP NOT NULL;