-- Fix support_tickets RLS: Remove overly permissive policies

-- Drop the dangerous policies that expose ticket data
DROP POLICY IF EXISTS "Anonymous users can view tickets by email" ON public.support_tickets;
DROP POLICY IF EXISTS "Anonymous users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;

-- Duplicate SELECT policies - clean up
DROP POLICY IF EXISTS "Users can read own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can read all tickets" ON public.support_tickets;

-- Create proper consolidated policies:

-- 1. Users can view their own tickets (by user_id or email match)
CREATE POLICY "Users can view own tickets"
ON public.support_tickets
FOR SELECT
USING (
  user_id = auth.uid() 
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Authenticated users can create tickets with their own user_id
CREATE POLICY "Authenticated users can create tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  OR user_id IS NULL
);