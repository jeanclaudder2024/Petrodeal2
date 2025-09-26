-- First, let's check and fix the subscription tier constraint issue
-- Allow 'trial' as a valid subscription tier
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_subscription_tier_check;

-- Add the correct constraint that includes 'trial'
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_subscription_tier_check 
CHECK (subscription_tier IN ('trial', 'basic', 'premium', 'enterprise'));

-- Update the start_trial_period function to handle errors better
CREATE OR REPLACE FUNCTION public.start_trial_period(user_email text, user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  -- Try to insert or update the trial
  INSERT INTO public.subscribers (
    email, 
    user_id, 
    trial_start_date, 
    trial_end_date, 
    is_trial_active,
    subscribed,
    subscription_tier,
    created_at,
    updated_at
  ) VALUES (
    user_email,
    user_id_param,
    NOW(),
    NOW() + INTERVAL '5 days',
    true,
    false,
    'trial',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    trial_start_date = CASE 
      WHEN EXCLUDED.trial_start_date IS NULL OR subscribers.trial_start_date IS NULL 
      THEN NOW() 
      ELSE subscribers.trial_start_date 
    END,
    trial_end_date = CASE 
      WHEN EXCLUDED.trial_end_date IS NULL OR subscribers.trial_end_date IS NULL OR subscribers.trial_end_date < NOW()
      THEN NOW() + INTERVAL '5 days'
      ELSE subscribers.trial_end_date 
    END,
    is_trial_active = CASE 
      WHEN subscribers.trial_end_date IS NULL OR subscribers.trial_end_date < NOW()
      THEN true
      ELSE subscribers.is_trial_active
    END,
    subscription_tier = CASE 
      WHEN subscribers.subscribed = false AND (subscribers.trial_end_date IS NULL OR subscribers.trial_end_date < NOW())
      THEN 'trial'
      ELSE subscribers.subscription_tier
    END,
    updated_at = NOW();

  -- Return success result
  result := json_build_object(
    'success', true,
    'message', 'Trial started successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;