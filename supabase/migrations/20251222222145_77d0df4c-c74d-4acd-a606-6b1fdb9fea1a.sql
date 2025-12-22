-- Fix 1: Create a secure view for public broker profiles (excluding sensitive PII)
-- First, drop existing public SELECT policy that exposes sensitive data
DROP POLICY IF EXISTS "Anyone can view active brokers" ON public.broker_profiles;

-- Create a new policy that only allows authenticated users to see non-sensitive fields
-- Profile owners and admins can see full profile
CREATE POLICY "Users can view their own full profile" 
ON public.broker_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all broker profiles" 
ON public.broker_profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create a safe public view with only non-sensitive fields for public browsing
CREATE OR REPLACE VIEW public.broker_profiles_public AS
SELECT 
  id,
  full_name,
  company_name,
  specializations,
  bio,
  city,
  country,
  years_experience,
  certifications,
  languages,
  profile_image_url,
  preferred_regions,
  trading_volume,
  verified_at,
  created_at
FROM public.broker_profiles
WHERE verified_at IS NOT NULL;

-- Grant read access to the public view
GRANT SELECT ON public.broker_profiles_public TO anon, authenticated;