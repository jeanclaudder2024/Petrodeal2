-- Add template file support to vessel_documents table
ALTER TABLE vessel_documents 
ADD COLUMN template_file_url TEXT,
ADD COLUMN uses_custom_template BOOLEAN DEFAULT FALSE;

-- Create storage bucket for document templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('document-templates', 'document-templates', false);

-- Create RLS policies for document templates bucket
CREATE POLICY "Admins can upload document templates"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'document-templates' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view document templates"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'document-templates' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update document templates"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'document-templates' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete document templates"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'document-templates' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Edge functions need access to templates for document generation
CREATE POLICY "Edge functions can access document templates"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'document-templates');

-- Update existing documents to indicate they don't use custom templates
UPDATE vessel_documents SET uses_custom_template = FALSE WHERE uses_custom_template IS NULL;