-- Migration: Fix subscription plans and 5-day trial system
-- Date: 2025-09-26

-- 1. إصلاح دالة handle_new_user لإضافة المستخدمين الجدد إلى جدول subscribers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- إضافة إلى profiles
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- إضافة إلى subscribers مع trial 5 أيام
  INSERT INTO public.subscribers (
    user_id, 
    email, 
    trial_start_date, 
    trial_end_date, 
    unified_trial_end_date,
    is_trial_active,
    subscribed,
    subscription_tier,
    trial_with_subscription,
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
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = NEW.id,
    trial_start_date = CASE 
      WHEN subscribers.trial_start_date IS NULL THEN NOW()
      ELSE subscribers.trial_start_date 
    END,
    trial_end_date = CASE 
      WHEN subscribers.trial_end_date IS NULL OR subscribers.trial_end_date < NOW() THEN NOW() + INTERVAL '5 days'
      ELSE subscribers.trial_end_date 
    END,
    unified_trial_end_date = CASE 
      WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW() THEN NOW() + INTERVAL '5 days'
      ELSE subscribers.unified_trial_end_date 
    END,
    is_trial_active = CASE 
      WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW() THEN true
      ELSE subscribers.is_trial_active 
    END,
    subscription_tier = CASE 
      WHEN subscribers.subscribed = false THEN 'trial'
      ELSE subscribers.subscription_tier 
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. إنشاء دالة محسنة لبدء التجربة مع أي خطة
CREATE OR REPLACE FUNCTION public.start_trial_with_plan(
  user_email text, 
  user_id_param uuid, 
  plan_tier_param text DEFAULT 'basic',
  trial_days integer DEFAULT 5
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
  trial_end_date timestamp with time zone;
BEGIN
  trial_end_date := NOW() + INTERVAL '1 day' * trial_days;
  
  -- إدراج أو تحديث الاشتراك مع فترة تجربة
  INSERT INTO public.subscribers (
    email, 
    user_id, 
    subscription_tier,
    trial_start_date,
    trial_end_date,
    unified_trial_end_date,
    trial_with_subscription,
    is_trial_active,
    subscribed,
    created_at,
    updated_at
  ) VALUES (
    user_email,
    user_id_param,
    plan_tier_param,
    NOW(),
    trial_end_date,
    trial_end_date,
    true,
    true,
    false, -- سيصبح true بعد الدفع الناجح
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    subscription_tier = plan_tier_param,
    trial_start_date = CASE 
      WHEN subscribers.trial_start_date IS NULL OR subscribers.unified_trial_end_date < NOW()
      THEN NOW() 
      ELSE subscribers.trial_start_date 
    END,
    trial_end_date = CASE 
      WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW()
      THEN trial_end_date
      ELSE subscribers.trial_end_date 
    END,
    unified_trial_end_date = CASE 
      WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW()
      THEN trial_end_date
      ELSE subscribers.unified_trial_end_date 
    END,
    trial_with_subscription = true,
    is_trial_active = CASE 
      WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW()
      THEN true
      ELSE subscribers.is_trial_active 
    END,
    updated_at = NOW();

  result := json_build_object(
    'success', true,
    'message', 'Trial with plan started successfully',
    'plan_tier', plan_tier_param,
    'trial_days', trial_days,
    'trial_end_date', trial_end_date
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

-- 3. إنشاء دالة لتحديث التجارب المنتهية تلقائياً
CREATE OR REPLACE FUNCTION public.update_expired_trials()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer;
  result json;
BEGIN
  -- تحديث جميع التجارب المنتهية
  UPDATE public.subscribers 
  SET 
    is_trial_active = false,
    trial_used = true,
    subscription_status = 'expired',
    updated_at = NOW()
  WHERE 
    subscribed = false 
    AND (
      (unified_trial_end_date IS NOT NULL AND unified_trial_end_date < NOW()) 
      OR (trial_end_date IS NOT NULL AND trial_end_date < NOW())
    )
    AND is_trial_active = true;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  result := json_build_object(
    'success', true,
    'updated_count', updated_count,
    'message', 'Expired trials updated successfully'
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

-- 4. إنشاء دالة محسنة للتحقق من الوصول
CREATE OR REPLACE FUNCTION public.check_user_access_enhanced(user_email text)
RETURNS TABLE(
  has_access boolean,
  access_type text,
  trial_days_left integer,
  is_subscribed boolean,
  subscription_tier text,
  trial_end_date timestamp with time zone,
  can_upgrade boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN s.subscribed = true THEN true
      WHEN s.unified_trial_end_date IS NOT NULL AND s.unified_trial_end_date > NOW() THEN true
      ELSE false
    END as has_access,
    CASE 
      WHEN s.subscribed = true THEN 'subscription'
      WHEN s.unified_trial_end_date IS NOT NULL AND s.unified_trial_end_date > NOW() THEN 'trial'
      ELSE 'expired'
    END as access_type,
    CASE 
      WHEN s.unified_trial_end_date IS NOT NULL THEN 
        GREATEST(0, EXTRACT(DAYS FROM s.unified_trial_end_date - NOW())::INTEGER)
      ELSE 0
    END as trial_days_left,
    COALESCE(s.subscribed, false) as is_subscribed,
    COALESCE(s.subscription_tier, 'trial') as subscription_tier,
    s.unified_trial_end_date as trial_end_date,
    CASE 
      WHEN s.subscribed = false AND (s.unified_trial_end_date IS NULL OR s.unified_trial_end_date <= NOW()) THEN true
      ELSE false
    END as can_upgrade
  FROM public.subscribers s
  WHERE s.email = user_email
  LIMIT 1;
$$;
