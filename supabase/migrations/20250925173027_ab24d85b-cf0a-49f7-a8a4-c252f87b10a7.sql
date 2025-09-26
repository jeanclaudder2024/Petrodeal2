-- Fix the subscription tier constraint to include 'professional' 
ALTER TABLE public.subscribers DROP CONSTRAINT subscribers_subscription_tier_check;

-- Add updated constraint with all valid tiers
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_subscription_tier_check 
CHECK (subscription_tier = ANY (ARRAY['trial'::text, 'basic'::text, 'professional'::text, 'premium'::text, 'enterprise'::text]));

-- Update the user's record to fix the current state
UPDATE public.subscribers 
SET subscription_tier = 'trial',
    is_trial_active = false,
    trial_used = true,
    subscription_status = 'expired'
WHERE email = 'jeanclaudedergham1@gmail.com' AND subscription_tier IS NULL;