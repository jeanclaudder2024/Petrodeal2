-- CRITICAL: Create trigger to auto-create subscriber with 5-day trial on user registration
-- This ensures every new user gets a subscriber record immediately

-- First, ensure the handle_new_user function is up-to-date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- CRITICAL: Create subscriber record with 5-day trial
  INSERT INTO public.subscribers (
    user_id, 
    email, 
    trial_start_date, 
    trial_end_date, 
    unified_trial_end_date,
    is_trial_active, 
    subscribed, 
    subscription_tier, 
    subscription_status,
    trial_with_subscription,
    trial_used,
    vessel_limit,
    port_limit,
    regions_limit,
    refinery_limit,
    document_access,
    support_level,
    user_seats,
    api_access,
    real_time_analytics,
    is_locked,
    preview_access,
    created_at, 
    updated_at
  ) VALUES (
    NEW.id, 
    NEW.email, 
    NOW(), 
    NOW() + INTERVAL '5 days', 
    NOW() + INTERVAL '5 days',
    true, 
    false, 
    'trial', 
    'trialing',
    true,
    false,
    10,
    20,
    1,
    5,
    ARRAY['basic']::TEXT[],
    'email',
    1,
    false,
    false,
    false,
    true,
    NOW(), 
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = NEW.id,
    trial_start_date = CASE WHEN subscribers.trial_start_date IS NULL THEN NOW() ELSE subscribers.trial_start_date END,
    trial_end_date = CASE WHEN subscribers.trial_end_date IS NULL OR subscribers.trial_end_date < NOW() THEN NOW() + INTERVAL '5 days' ELSE subscribers.trial_end_date END,
    unified_trial_end_date = CASE WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW() THEN NOW() + INTERVAL '5 days' ELSE subscribers.unified_trial_end_date END,
    is_trial_active = CASE WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW() THEN true ELSE subscribers.is_trial_active END,
    subscription_tier = CASE WHEN subscribers.subscribed = false THEN 'trial' ELSE subscribers.subscription_tier END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists (to avoid errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();