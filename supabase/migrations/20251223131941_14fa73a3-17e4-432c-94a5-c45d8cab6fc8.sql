-- Clean up redundant policies on subscribers table
-- The "Admins have full access to subscribers" policy already covers admin SELECT and UPDATE

DROP POLICY IF EXISTS "Admins can update subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.subscribers;