-- Add trial tracking fields to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN trial_start_date TIMESTAMPTZ,
ADD COLUMN trial_end_date TIMESTAMPTZ,
ADD COLUMN is_trial_active BOOLEAN DEFAULT false,
ADD COLUMN registration_step INTEGER DEFAULT 0,
ADD COLUMN preview_access BOOLEAN DEFAULT true;

-- Create function to check if trial has expired
CREATE OR REPLACE FUNCTION public.is_trial_expired(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN trial_end_date IS NULL THEN false
      WHEN trial_end_date < NOW() THEN true
      ELSE false
    END
  FROM public.subscribers 
  WHERE email = user_email
  LIMIT 1;
$$;

-- Create function to start trial period
CREATE OR REPLACE FUNCTION public.start_trial_period(user_email TEXT, user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
    trial_start_date = NOW(),
    trial_end_date = NOW() + INTERVAL '5 days',
    is_trial_active = true,
    subscription_tier = 'trial',
    updated_at = NOW();
END;
$$;

-- Create function to check access permissions
CREATE OR REPLACE FUNCTION public.check_user_access(user_email TEXT)
RETURNS TABLE (
  has_access BOOLEAN,
  access_type TEXT,
  trial_days_left INTEGER,
  is_subscribed BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN s.subscribed = true THEN true
      WHEN s.is_trial_active = true AND s.trial_end_date > NOW() THEN true
      ELSE false
    END as has_access,
    CASE 
      WHEN s.subscribed = true THEN 'subscription'
      WHEN s.is_trial_active = true AND s.trial_end_date > NOW() THEN 'trial'
      ELSE 'expired'
    END as access_type,
    CASE 
      WHEN s.trial_end_date IS NOT NULL THEN 
        GREATEST(0, EXTRACT(DAYS FROM s.trial_end_date - NOW())::INTEGER)
      ELSE 0
    END as trial_days_left,
    COALESCE(s.subscribed, false) as is_subscribed
  FROM public.subscribers s
  WHERE s.email = user_email
  LIMIT 1;
$$;