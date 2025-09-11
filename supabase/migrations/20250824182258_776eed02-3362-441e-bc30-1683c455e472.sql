-- Add logo_url column to companies table
ALTER TABLE public.companies 
ADD COLUMN logo_url TEXT;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);

-- Create RLS policies for company logos storage
CREATE POLICY "Anyone can view company logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload company logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update company logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete company logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
);

-- Add a check to ensure real companies have logos (using a trigger instead of CHECK constraint)
CREATE OR REPLACE FUNCTION validate_company_logo()
RETURNS TRIGGER AS $$
BEGIN
  -- For real companies, logo_url should not be null or empty
  IF NEW.company_type = 'real' AND (NEW.logo_url IS NULL OR NEW.logo_url = '') THEN
    RAISE EXCEPTION 'Logo is required for real companies';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_company_logo
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION validate_company_logo();