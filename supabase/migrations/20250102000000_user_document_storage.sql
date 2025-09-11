-- Create user document storage table to track downloaded documents
CREATE TABLE public.user_document_storage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.vessel_documents(id) ON DELETE CASCADE,
  vessel_id INTEGER REFERENCES public.vessels(id) ON DELETE CASCADE,
  document_title TEXT NOT NULL,
  vessel_name TEXT,
  file_url TEXT NOT NULL, -- URL to the stored PDF file
  file_size INTEGER,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate downloads
CREATE UNIQUE INDEX idx_user_document_unique 
ON public.user_document_storage(user_id, document_id, vessel_id);

-- Create indexes for better performance
CREATE INDEX idx_user_document_storage_user_id ON public.user_document_storage(user_id);
CREATE INDEX idx_user_document_storage_document_id ON public.user_document_storage(document_id);
CREATE INDEX idx_user_document_storage_vessel_id ON public.user_document_storage(vessel_id);
CREATE INDEX idx_user_document_storage_downloaded_at ON public.user_document_storage(downloaded_at DESC);

-- Enable RLS
ALTER TABLE public.user_document_storage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own stored documents" 
ON public.user_document_storage 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own document storage records" 
ON public.user_document_storage 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own document storage records" 
ON public.user_document_storage 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all document storage records" 
ON public.user_document_storage 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for user documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all user documents"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'user-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_user_document_storage_updated_at
  BEFORE UPDATE ON public.user_document_storage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has already downloaded a document
CREATE OR REPLACE FUNCTION public.has_user_downloaded_document(
  p_user_id UUID,
  p_document_id UUID,
  p_vessel_id INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_document_storage
    WHERE user_id = p_user_id
    AND document_id = p_document_id
    AND vessel_id = p_vessel_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_user_downloaded_document(UUID, UUID, INTEGER) TO authenticated;