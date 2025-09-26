-- Add new fields to broker_profiles table for enhanced broker setup
ALTER TABLE public.broker_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS trading_volume TEXT,
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC,
ADD COLUMN IF NOT EXISTS preferred_regions TEXT[],
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS company_type TEXT,
ADD COLUMN IF NOT EXISTS business_registration TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Update the RLS policies to allow users to read these new fields
-- The existing policies should already handle this, but let's make sure they're comprehensive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.broker_profiles;
CREATE POLICY "Users can view their own profile" 
ON public.broker_profiles 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.broker_profiles;
CREATE POLICY "Users can update their own profile" 
ON public.broker_profiles 
FOR UPDATE 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.broker_profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.broker_profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());