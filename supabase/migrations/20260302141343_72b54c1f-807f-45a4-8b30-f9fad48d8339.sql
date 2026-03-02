
-- Add show_in_frontend column to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS show_in_frontend boolean NOT NULL DEFAULT true;

-- Fix plan_tier case mismatch: update 'Trial' to 'trial'
UPDATE public.subscription_plans 
SET plan_tier = 'trial' 
WHERE LOWER(plan_tier) = 'trial' AND plan_tier != 'trial';
