-- Fix: Broker Personal Information Exposed via Public RLS Policies
-- Drop the overly permissive policy that exposes sensitive broker data publicly

-- First, let's check existing policies and drop problematic ones
DROP POLICY IF EXISTS "Anyone can view active brokers" ON public.broker_profiles;
DROP POLICY IF EXISTS "Public can view verified broker profiles" ON public.broker_profiles;

-- The view broker_profiles_public should only expose safe, non-sensitive fields
-- Drop and recreate the view with limited fields
DROP VIEW IF EXISTS public.broker_profiles_public;

CREATE VIEW public.broker_profiles_public AS
SELECT 
  id,
  full_name,
  company_name,
  city,
  country,
  bio,
  specializations,
  preferred_regions,
  certifications,
  languages,
  years_experience,
  trading_volume,
  profile_image_url,
  verified_at,
  created_at
FROM public.broker_profiles
WHERE verified_at IS NOT NULL;

-- Grant access to the safe view
GRANT SELECT ON public.broker_profiles_public TO anon;
GRANT SELECT ON public.broker_profiles_public TO authenticated;

-- Add comment to document this is the public-safe view
COMMENT ON VIEW public.broker_profiles_public IS 'Public-safe view of broker profiles. Excludes sensitive PII like phone, email, addresses, passport numbers, ID documents, tax IDs, and business registration numbers.';