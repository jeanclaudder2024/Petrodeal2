-- تبسيط نظام الاشتراكات وإصلاح المشاكل الهيكلية

-- إضافة عمود جديد لتبسيط إدارة التجربة
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS unified_trial_end_date timestamp with time zone;

-- دمج بيانات التجربة في عمود موحد
UPDATE public.subscribers 
SET unified_trial_end_date = COALESCE(
  plan_trial_end_date, 
  trial_end_date,
  CASE 
    WHEN subscription_tier != 'trial' AND subscribed = true 
    THEN created_at + interval '5 days'
    ELSE trial_end_date
  END
);

-- إضافة عمود لتتبع حالة التجربة بوضوح
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_with_subscription boolean DEFAULT true;

-- تحديث الحالة الجديدة: كل اشتراك يحتوي على فترة تجربة 5 أيام
UPDATE public.subscribers 
SET trial_with_subscription = true,
    is_trial_active = CASE 
      WHEN unified_trial_end_date > NOW() THEN true 
      ELSE false 
    END;

-- إنشاء دالة محسنة لفحص الوصول
CREATE OR REPLACE FUNCTION public.check_user_access_unified(user_email text)
RETURNS TABLE(
  has_access boolean,
  access_type text,
  trial_days_left integer,
  is_subscribed boolean,
  subscription_tier text,
  trial_end_date timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN s.subscribed = true OR (s.unified_trial_end_date IS NOT NULL AND s.unified_trial_end_date > NOW()) THEN true
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
    s.unified_trial_end_date as trial_end_date
  FROM public.subscribers s
  WHERE s.email = user_email
  LIMIT 1;
$function$;

-- إنشاء دالة لبدء فترة تجربة مع اشتراك
CREATE OR REPLACE FUNCTION public.start_subscription_with_trial(
  user_email text, 
  user_id_param uuid, 
  plan_tier_param text,
  trial_days integer DEFAULT 5
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  -- إدراج أو تحديث الاشتراك مع فترة تجربة 5 أيام
  INSERT INTO public.subscribers (
    email, 
    user_id, 
    subscription_tier,
    trial_start_date,
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
    NOW() + INTERVAL '1 day' * trial_days,
    true,
    true,
    false, -- سيصبح true بعد الدفع الناجح
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    subscription_tier = plan_tier_param,
    trial_start_date = COALESCE(subscribers.trial_start_date, NOW()),
    unified_trial_end_date = CASE 
      WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW()
      THEN NOW() + INTERVAL '1 day' * trial_days
      ELSE subscribers.unified_trial_end_date 
    END,
    trial_with_subscription = true,
    is_trial_active = true,
    updated_at = NOW();

  result := json_build_object(
    'success', true,
    'message', 'Subscription with trial started successfully',
    'trial_days', trial_days
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
$function$;