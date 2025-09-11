-- Add passport_document_url column to broker_profiles table
ALTER TABLE public.broker_profiles 
ADD COLUMN passport_document_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.broker_profiles.passport_document_url IS 'URL to uploaded passport document for verification';