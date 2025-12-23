-- Fix remaining functions without search_path (excluding get_user_role_safe which references non-existent table)

-- Update has_user_downloaded_document function
CREATE OR REPLACE FUNCTION public.has_user_downloaded_document(p_user_id uuid, p_document_id uuid, p_vessel_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_document_storage
    WHERE user_id = p_user_id
    AND document_id = p_document_id
    AND vessel_id = p_vessel_id
  );
END;
$function$;

-- Update start_plan_trial function
CREATE OR REPLACE FUNCTION public.start_plan_trial(user_email text, user_id_param uuid, plan_tier_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix get_user_role_safe by removing reference to temp_admin_viewers (non-existent table)
CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_uuid uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1),
    'user'::app_role
  );
$function$;

-- Update can_user_download_template function
CREATE OR REPLACE FUNCTION public.can_user_download_template(p_user_id uuid, p_template_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_plan_id UUID;
  v_plan_tier TEXT;
  v_max_downloads INTEGER;
  v_per_template_limit INTEGER;
  v_current_downloads INTEGER;
  v_can_download BOOLEAN;
  v_result JSONB;
  v_has_broker_membership BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.broker_memberships bm
    WHERE bm.user_id = p_user_id
    AND bm.payment_status = 'paid'
    AND bm.membership_status = 'active'
  ) INTO v_has_broker_membership;
  
  IF v_has_broker_membership THEN
    DECLARE
      v_broker_membership_id UUID;
    BEGIN
      SELECT id INTO v_broker_membership_id
      FROM public.broker_memberships
      WHERE user_id = p_user_id
      AND payment_status = 'paid'
      AND membership_status = 'active'
      LIMIT 1;
      
      SELECT can_download, max_downloads_per_template INTO v_can_download, v_per_template_limit
      FROM public.broker_template_permissions
      WHERE broker_membership_id = v_broker_membership_id
      AND template_id = p_template_id;
      
      IF v_can_download IS NULL THEN
        SELECT requires_broker_membership INTO v_can_download
        FROM public.document_templates
        WHERE id = p_template_id;
        
        IF v_can_download IS NULL OR v_can_download = false THEN
          v_can_download := false;
        END IF;
      END IF;
      
      IF v_per_template_limit IS NOT NULL THEN
        v_max_downloads := v_per_template_limit;
      ELSE
        v_max_downloads := NULL;
      END IF;
      
      SELECT COUNT(*) INTO v_current_downloads
      FROM public.user_document_downloads
      WHERE user_id = p_user_id
      AND template_id = p_template_id
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
      
      v_result := jsonb_build_object(
        'can_download', v_can_download,
        'has_permission', v_can_download,
        'max_downloads', v_max_downloads,
        'current_downloads', v_current_downloads,
        'remaining_downloads', CASE 
          WHEN v_max_downloads IS NULL THEN NULL 
          ELSE GREATEST(0, v_max_downloads - v_current_downloads) 
        END,
        'limit_reached', CASE 
          WHEN v_max_downloads IS NULL THEN false 
          ELSE (v_current_downloads >= v_max_downloads) 
        END,
        'access_type', 'broker'
      );
      
      RETURN v_result;
    END;
  END IF;
  
  SELECT s.subscription_tier INTO v_plan_tier
  FROM public.subscribers s
  WHERE s.user_id = p_user_id
  AND (s.subscription_status = 'active' OR s.trial_with_subscription = true)
  LIMIT 1;
  
  IF v_plan_tier IS NULL THEN
    v_plan_tier := 'basic';
  END IF;
  
  SELECT sp.id INTO v_plan_id
  FROM public.subscription_plans sp
  WHERE sp.plan_tier = v_plan_tier
  AND sp.is_active = true
  LIMIT 1;
  
  IF v_plan_id IS NULL THEN
    SELECT sp.id INTO v_plan_id
    FROM public.subscription_plans sp
    WHERE sp.plan_tier = 'basic'
    AND sp.is_active = true
    LIMIT 1;
  END IF;
  
  SELECT can_download, max_downloads_per_template INTO v_can_download, v_per_template_limit
  FROM public.plan_template_permissions
  WHERE plan_id = v_plan_id
  AND template_id = p_template_id;
  
  IF v_can_download IS NULL THEN
    v_can_download := true;
  END IF;
  
  IF v_per_template_limit IS NOT NULL THEN
    v_max_downloads := v_per_template_limit;
  ELSE
    SELECT max_downloads_per_month INTO v_max_downloads
    FROM public.subscription_plans
    WHERE id = v_plan_id;
    
    IF v_max_downloads IS NULL THEN
      v_max_downloads := 10;
    END IF;
  END IF;
  
  SELECT COUNT(*) INTO v_current_downloads
  FROM public.user_document_downloads
  WHERE user_id = p_user_id
  AND template_id = p_template_id
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
  
  v_result := jsonb_build_object(
    'can_download', v_can_download,
    'has_permission', v_can_download,
    'max_downloads', v_max_downloads,
    'current_downloads', v_current_downloads,
    'remaining_downloads', CASE 
      WHEN v_max_downloads IS NULL THEN NULL 
      ELSE GREATEST(0, v_max_downloads - v_current_downloads) 
    END,
    'limit_reached', CASE 
      WHEN v_max_downloads IS NULL THEN false 
      ELSE (v_current_downloads >= v_max_downloads) 
    END,
    'access_type', 'subscription'
  );
  
  RETURN v_result;
END;
$function$;

-- Update get_user_downloadable_templates function
CREATE OR REPLACE FUNCTION public.get_user_downloadable_templates(p_user_id uuid)
RETURNS TABLE(template_id uuid, template_name text, can_download boolean, max_downloads integer, current_downloads integer, remaining_downloads integer, access_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_plan_id UUID;
  v_plan_tier TEXT;
  v_max_downloads_val INTEGER;
  v_has_broker_membership BOOLEAN;
  v_broker_membership_id UUID;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.broker_memberships bm
    WHERE bm.user_id = p_user_id
    AND bm.payment_status = 'paid'
    AND bm.membership_status = 'active'
  ) INTO v_has_broker_membership;
  
  IF v_has_broker_membership THEN
    SELECT id INTO v_broker_membership_id
    FROM public.broker_memberships
    WHERE user_id = p_user_id
    AND payment_status = 'paid'
    AND membership_status = 'active'
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
      dt.id AS template_id,
      dt.title AS template_name,
      CASE 
        WHEN btp.id IS NOT NULL AND btp.can_download = true THEN true
        WHEN dt.requires_broker_membership = true THEN true
        ELSE false
      END AS can_download,
      COALESCE(btp.max_downloads_per_template, NULL) AS max_downloads,
      COALESCE(
        (SELECT COUNT(*) 
         FROM public.user_document_downloads 
         WHERE user_id = p_user_id 
         AND template_id = dt.id
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0
      )::integer AS current_downloads,
      CASE 
        WHEN btp.max_downloads_per_template IS NULL THEN NULL
        ELSE GREATEST(0, 
          btp.max_downloads_per_template - 
          COALESCE(
            (SELECT COUNT(*) 
             FROM public.user_document_downloads 
             WHERE user_id = p_user_id 
             AND template_id = dt.id
             AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
            ), 0
          )
        )::integer
      END AS remaining_downloads,
      'broker'::TEXT AS access_type
    FROM public.document_templates dt
    LEFT JOIN public.broker_template_permissions btp 
      ON btp.template_id = dt.id AND btp.broker_membership_id = v_broker_membership_id
    WHERE dt.is_active = true
    AND (btp.can_download = true OR dt.requires_broker_membership = true)
    ORDER BY dt.title;
    
    RETURN;
  END IF;
  
  SELECT s.subscription_tier INTO v_plan_tier
  FROM public.subscribers s
  WHERE s.user_id = p_user_id
  AND (s.subscription_status = 'active' OR s.trial_with_subscription = true)
  LIMIT 1;
  
  IF v_plan_tier IS NULL THEN
    v_plan_tier := 'basic';
  END IF;
  
  SELECT sp.id, sp.max_downloads_per_month INTO v_plan_id, v_max_downloads_val
  FROM public.subscription_plans sp
  WHERE sp.plan_tier = v_plan_tier
  AND sp.is_active = true
  LIMIT 1;
  
  IF v_plan_id IS NULL THEN
    SELECT sp.id, sp.max_downloads_per_month INTO v_plan_id, v_max_downloads_val
    FROM public.subscription_plans sp
    WHERE sp.plan_tier = 'basic'
    AND sp.is_active = true
    LIMIT 1;
  END IF;
  
  IF v_max_downloads_val IS NULL THEN
    v_max_downloads_val := 10;
  END IF;
  
  RETURN QUERY
  SELECT 
    dt.id AS template_id,
    dt.title AS template_name,
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM public.plan_template_permissions 
        WHERE template_id = dt.id
      ) THEN true
      WHEN ptp.id IS NOT NULL AND ptp.can_download = true THEN true
      ELSE false
    END AS can_download,
    COALESCE(ptp.max_downloads_per_template, v_max_downloads_val) AS max_downloads,
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.user_document_downloads 
       WHERE user_id = p_user_id 
       AND template_id = dt.id
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      ), 0
    )::integer AS current_downloads,
    GREATEST(0, 
      COALESCE(ptp.max_downloads_per_template, v_max_downloads_val) - 
      COALESCE(
        (SELECT COUNT(*) 
         FROM public.user_document_downloads 
         WHERE user_id = p_user_id 
         AND template_id = dt.id
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0
      )
    )::integer AS remaining_downloads,
    'subscription'::TEXT AS access_type
  FROM public.document_templates dt
  LEFT JOIN public.plan_template_permissions ptp 
    ON ptp.template_id = dt.id AND ptp.plan_id = v_plan_id
  WHERE dt.is_active = true
  ORDER BY dt.title;
END;
$function$;