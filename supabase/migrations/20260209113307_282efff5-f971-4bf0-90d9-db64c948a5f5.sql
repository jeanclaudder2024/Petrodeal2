ALTER TABLE public.document_templates 
ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'docx',
ADD COLUMN IF NOT EXISTS file_url text DEFAULT '';