-- Fix subscribers RLS: Remove overly permissive policies

-- Drop the dangerous policies that allow anyone to access data
DROP POLICY IF EXISTS "Service role can manage subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Insert subscription" ON public.subscribers;

-- Create proper admin policy for full access
CREATE POLICY "Admins have full access to subscribers"
ON public.subscribers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create secure insert policy - users can only insert their own subscription
CREATE POLICY "Users can insert own subscription"
ON public.subscribers
FOR INSERT
WITH CHECK (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));