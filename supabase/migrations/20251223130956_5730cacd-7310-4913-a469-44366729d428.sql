-- Fix broker_profiles RLS: Remove overly permissive policy and restrict access

-- Drop the dangerous "Edge functions can manage profiles" policy that allows anyone to read all data
DROP POLICY IF EXISTS "Edge functions can manage profiles" ON public.broker_profiles;

-- Drop duplicate/redundant SELECT policies
DROP POLICY IF EXISTS "Admins can view all broker profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.broker_profiles;

-- Create consolidated, secure policies:

-- 1. Admins can do everything
CREATE POLICY "Admins have full access to broker profiles"
ON public.broker_profiles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Brokers can view their own full profile
CREATE POLICY "Brokers can view own profile"
ON public.broker_profiles
FOR SELECT
USING (user_id = auth.uid());

-- 3. Authenticated users can view LIMITED public info of verified brokers only
-- (They should use the broker_profiles_public VIEW instead for public data)
-- This policy restricts direct table access to own profile only

-- 4. Keep existing INSERT and UPDATE policies for users
-- (They were already correct)