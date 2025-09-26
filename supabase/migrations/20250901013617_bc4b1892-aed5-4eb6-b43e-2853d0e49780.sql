-- Update storage policies for edge functions access to document templates
-- First, remove existing restrictive policy for edge functions
DROP POLICY IF EXISTS "Edge functions can access document templates" ON storage.objects;

-- Create more permissive policy for service role access (used by edge functions)
CREATE POLICY "Service role can access document templates"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'document-templates');

-- Also ensure edge functions can list files in the bucket
CREATE POLICY "Service role can list document templates"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'document-templates');