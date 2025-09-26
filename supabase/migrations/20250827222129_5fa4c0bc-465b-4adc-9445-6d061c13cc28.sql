-- Fix function search path security issues by adding SET search_path to all functions missing it

-- Fix update_partnership_requests_updated_at function
CREATE OR REPLACE FUNCTION public.update_partnership_requests_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;