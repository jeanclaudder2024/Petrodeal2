-- Fix broker-documents storage bucket policies

-- Drop existing policies
DROP POLICY IF EXISTS "Brokers can upload their documents" ON storage.objects;
DROP POLICY IF EXISTS "Brokers can view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all broker documents" ON storage.objects;

-- Create improved storage policies for broker documents
-- Policy for uploading documents (brokers can upload to their own folder)
CREATE POLICY "Brokers can upload their documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'broker-documents' 
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for viewing documents (brokers can view their own documents)
CREATE POLICY "Brokers can view their documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'broker-documents' 
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for updating documents (brokers can update their own documents)
CREATE POLICY "Brokers can update their documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'broker-documents' 
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for deleting documents (brokers can delete their own documents)
CREATE POLICY "Brokers can delete their documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'broker-documents' 
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for admins to view all broker documents
CREATE POLICY "Admins can view all broker documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'broker-documents' 
    AND auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Policy for admins to manage all broker documents
CREATE POLICY "Admins can manage all broker documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'broker-documents' 
    AND auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('broker-documents', 'broker-documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];