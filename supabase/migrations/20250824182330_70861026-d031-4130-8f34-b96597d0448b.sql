-- Fix the validate_company_logo function with proper search_path
CREATE OR REPLACE FUNCTION validate_company_logo()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- For real companies, logo_url should not be null or empty
  IF NEW.company_type = 'real' AND (NEW.logo_url IS NULL OR NEW.logo_url = '') THEN
    RAISE EXCEPTION 'Logo is required for real companies';
  END IF;
  
  RETURN NEW;
END;
$$;