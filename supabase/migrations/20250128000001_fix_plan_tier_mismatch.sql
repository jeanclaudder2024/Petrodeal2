-- Fix plan tier mismatch between frontend and database
-- Frontend uses 'premium' but database has 'professional'
UPDATE public.subscription_plans 
SET plan_tier = 'premium' 
WHERE plan_tier = 'professional';