-- Fix security vulnerability in broker_memberships table
-- Remove the overly permissive policy that allows anyone to access all data
DROP POLICY IF EXISTS "Edge functions can manage memberships" ON broker_memberships;

-- Create a proper policy that only allows service role (edge functions) to manage memberships
-- This prevents public access while still allowing our edge functions to work
CREATE POLICY "Service role can manage memberships" 
ON broker_memberships 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Add a policy for authenticated users to insert their own membership records
-- This is needed for the membership creation flow
CREATE POLICY "Users can create their own membership" 
ON broker_memberships 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());