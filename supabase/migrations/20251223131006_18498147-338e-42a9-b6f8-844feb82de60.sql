-- Fix broker_memberships RLS: Remove overly permissive policy

-- Drop the dangerous "Service role can manage memberships" policy that uses USING (true)
DROP POLICY IF EXISTS "Service role can manage memberships" ON public.broker_memberships;

-- Create proper admin policy instead
CREATE POLICY "Admins can manage all memberships"
ON public.broker_memberships
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));