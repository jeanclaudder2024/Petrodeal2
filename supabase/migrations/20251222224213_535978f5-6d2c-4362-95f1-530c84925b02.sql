-- Fix 1: SUPA_security_definer_view - Recreate broker_profiles_public as SECURITY INVOKER
-- Drop the existing security definer view
DROP VIEW IF EXISTS public.broker_profiles_public;

-- Recreate with security_invoker = true to use querying user's permissions
CREATE VIEW public.broker_profiles_public 
WITH (security_invoker = true) AS
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
COMMENT ON VIEW public.broker_profiles_public IS 'Public-safe view of broker profiles with SECURITY INVOKER. Excludes sensitive PII like phone, email, addresses, passport numbers, ID documents, tax IDs, and business registration numbers.';

-- Fix 2: subscribers_public_exposure - Remove email-based access from RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription via email or user_id" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

-- Create new strict policies using only user_id
CREATE POLICY "Users can view their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());