-- Fix user_roles RLS: Remove overly permissive policy

-- Drop the dangerous "Edge functions can manage roles" policy that allows anyone to read all roles
DROP POLICY IF EXISTS "Edge functions can manage roles" ON public.user_roles;