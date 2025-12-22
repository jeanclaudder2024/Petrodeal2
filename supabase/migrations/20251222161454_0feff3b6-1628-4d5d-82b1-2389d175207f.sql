-- Add locking columns to subscribers table
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS locked_reason TEXT;

-- Add broker subscription tracking
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS has_broker_subscription BOOLEAN DEFAULT false;

-- Create function to lock expired trials (without auto-renewal)
CREATE OR REPLACE FUNCTION public.lock_expired_accounts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  locked_count integer;
  result json;
BEGIN
  -- Lock accounts where trial has expired AND no paid subscription
  UPDATE public.subscribers 
  SET 
    is_locked = true,
    locked_at = NOW(),
    locked_reason = 'Trial expired - payment required',
    is_trial_active = false
  WHERE 
    subscribed = false 
    AND is_locked = false
    AND (
      (unified_trial_end_date IS NOT NULL AND unified_trial_end_date < NOW()) 
      OR (trial_end_date IS NOT NULL AND trial_end_date < NOW())
    );

  GET DIAGNOSTICS locked_count = ROW_COUNT;

  result := json_build_object(
    'success', true,
    'locked_count', locked_count,
    'message', 'Expired accounts locked successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- Create function to manually extend trial days
CREATE OR REPLACE FUNCTION public.admin_extend_trial(
  subscriber_email text,
  additional_days integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
  new_end_date timestamptz;
BEGIN
  -- Calculate new end date from current end or from now
  SELECT 
    GREATEST(COALESCE(unified_trial_end_date, NOW()), NOW()) + (additional_days || ' days')::interval
  INTO new_end_date
  FROM subscribers WHERE email = subscriber_email;

  UPDATE public.subscribers 
  SET 
    trial_end_date = new_end_date,
    unified_trial_end_date = new_end_date,
    is_trial_active = true,
    is_locked = false,
    locked_at = NULL,
    locked_reason = NULL,
    updated_at = NOW()
  WHERE email = subscriber_email;

  result := json_build_object(
    'success', true,
    'new_trial_end_date', new_end_date,
    'message', 'Trial extended successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- Create function to manually lock/unlock account
CREATE OR REPLACE FUNCTION public.admin_toggle_account_lock(
  subscriber_email text,
  should_lock boolean,
  lock_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  UPDATE public.subscribers 
  SET 
    is_locked = should_lock,
    locked_at = CASE WHEN should_lock THEN NOW() ELSE NULL END,
    locked_reason = CASE WHEN should_lock THEN COALESCE(lock_reason, 'Locked by admin') ELSE NULL END,
    updated_at = NOW()
  WHERE email = subscriber_email;

  result := json_build_object(
    'success', true,
    'is_locked', should_lock,
    'message', CASE WHEN should_lock THEN 'Account locked' ELSE 'Account unlocked' END
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- Create function to check access with lock status (replaces auto-trial creation)
CREATE OR REPLACE FUNCTION public.check_user_access_with_lock(user_email text)
RETURNS TABLE(
  has_access boolean, 
  access_type text, 
  trial_days_left integer, 
  is_subscribed boolean, 
  subscription_tier text, 
  trial_end_date timestamp with time zone,
  is_locked boolean,
  locked_reason text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN s.is_locked = true THEN false
      WHEN s.subscribed = true THEN true
      WHEN s.is_trial_active = true AND s.unified_trial_end_date > NOW() THEN true
      ELSE false
    END as has_access,
    CASE 
      WHEN s.is_locked = true THEN 'locked'
      WHEN s.subscribed = true THEN 'subscription'
      WHEN s.is_trial_active = true AND s.unified_trial_end_date > NOW() THEN 'trial'
      ELSE 'expired'
    END as access_type,
    CASE 
      WHEN s.unified_trial_end_date IS NOT NULL AND s.unified_trial_end_date > NOW() THEN 
        GREATEST(0, EXTRACT(DAYS FROM s.unified_trial_end_date - NOW())::INTEGER)
      ELSE 0
    END as trial_days_left,
    COALESCE(s.subscribed, false) as is_subscribed,
    COALESCE(s.subscription_tier, 'trial') as subscription_tier,
    s.unified_trial_end_date as trial_end_date,
    COALESCE(s.is_locked, false) as is_locked,
    s.locked_reason
  FROM public.subscribers s
  WHERE s.email = user_email
  LIMIT 1;
$$;