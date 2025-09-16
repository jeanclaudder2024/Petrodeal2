-- Add trial_days column to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN trial_days INTEGER DEFAULT 5;

-- Update existing plans to have 5-day trials
UPDATE public.subscription_plans 
SET trial_days = 5 
WHERE plan_tier IN ('basic', 'professional', 'enterprise');

-- Add trial tracking to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN plan_trial_used BOOLEAN DEFAULT false,
ADD COLUMN plan_trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN plan_trial_end_date TIMESTAMP WITH TIME ZONE;

-- Create function to start plan trial
CREATE OR REPLACE FUNCTION start_plan_trial(
  user_email TEXT,
  user_id_param UUID,
  plan_tier_param TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.subscribers (
    user_id, email, subscription_tier, 
    is_trial_active, trial_start_date, trial_end_date,
    plan_trial_used, plan_trial_start_date, plan_trial_end_date,
    created_at, updated_at
  ) VALUES (
    user_id_param, user_email, plan_tier_param,
    true, now(), now() + interval '5 days',
    true, now(), now() + interval '5 days',
    now(), now()
  )
  ON CONFLICT (email) DO UPDATE SET
    subscription_tier = plan_tier_param,
    is_trial_active = true,
    trial_start_date = now(),
    trial_end_date = now() + interval '5 days',
    plan_trial_used = true,
    plan_trial_start_date = now(),
    plan_trial_end_date = now() + interval '5 days',
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;