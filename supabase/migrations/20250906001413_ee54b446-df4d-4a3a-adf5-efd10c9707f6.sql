-- First let's complete the subscription_plans table and add proper RLS policies for subscriptions

-- Complete the subscription_plans table if it's missing columns
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS vessel_limit integer DEFAULT 10;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS refinery_limit integer DEFAULT 15;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS regions_limit integer DEFAULT 4;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS monthly_price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS annual_price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS created_by uuid;

-- Enable RLS on subscription_plans if not already enabled
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active subscription plans (needed for pricing page)
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- Allow admins to manage subscription plans
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Make sure subscription_discounts table allows everyone to read active discounts (needed for pricing)
DROP POLICY IF EXISTS "Anyone can view active discounts" ON public.subscription_discounts;
CREATE POLICY "Anyone can view active discounts" 
ON public.subscription_discounts 
FOR SELECT 
USING (is_active = true);

-- Update subscribers table policies to ensure better access
DROP POLICY IF EXISTS "Service role can manage subscribers" ON public.subscribers;
CREATE POLICY "Service role can manage subscribers" 
ON public.subscribers 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view their own subscription data via email OR user_id
DROP POLICY IF EXISTS "Users can view their own subscription via email or user_id" ON public.subscribers;
CREATE POLICY "Users can view their own subscription via email or user_id" 
ON public.subscribers 
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  (email = auth.email()) OR
  (email IN (SELECT email FROM auth.users WHERE id = auth.uid()))
);