-- Migration: Add per-template download limits to plan_template_permissions
-- This allows each plan to have different download limits per template

-- Add max_downloads_per_template column to plan_template_permissions table
ALTER TABLE public.plan_template_permissions 
ADD COLUMN IF NOT EXISTS max_downloads_per_template INTEGER DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.plan_template_permissions.max_downloads_per_template IS 
'Maximum number of downloads allowed per month for this specific template and plan. NULL means unlimited.';

-- Create index for faster queries when checking limits
CREATE INDEX IF NOT EXISTS idx_plan_template_permissions_template_limit 
ON public.plan_template_permissions(plan_id, template_id, max_downloads_per_template);

-- Drop existing function first to allow return type change (if needed)
-- Note: JSONB return type should be compatible, but drop/recreate to be safe
DROP FUNCTION IF EXISTS public.can_user_download_template(UUID, UUID);

-- Update the can_user_download_template function to use per-template limits
CREATE OR REPLACE FUNCTION public.can_user_download_template(
  p_user_id UUID,
  p_template_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  -- Check if user has broker membership first
  SELECT EXISTS(
    SELECT 1 FROM public.broker_memberships bm
    WHERE bm.user_id = p_user_id
    AND bm.payment_status = 'paid'
    AND bm.membership_status = 'active'
  ) INTO v_has_broker_membership;
  
  -- If user has broker membership, check broker permissions
  IF v_has_broker_membership THEN
    -- Get broker membership ID
    DECLARE
      v_broker_membership_id UUID;
    BEGIN
      SELECT id INTO v_broker_membership_id
      FROM public.broker_memberships
      WHERE user_id = p_user_id
      AND payment_status = 'paid'
      AND membership_status = 'active'
      LIMIT 1;
      
      -- Check broker template permission
      SELECT can_download, max_downloads_per_template INTO v_can_download, v_per_template_limit
      FROM public.broker_template_permissions
      WHERE broker_membership_id = v_broker_membership_id
      AND template_id = p_template_id;
      
      -- If no explicit permission, check if template requires broker membership
      IF v_can_download IS NULL THEN
        SELECT requires_broker_membership INTO v_can_download
        FROM public.document_templates
        WHERE id = p_template_id;
        
        IF v_can_download IS NULL OR v_can_download = false THEN
          v_can_download := false; -- Template doesn't require broker, but user only has broker access
        END IF;
      END IF;
      
      -- Use per-template limit if set, otherwise unlimited
      IF v_per_template_limit IS NOT NULL THEN
        v_max_downloads := v_per_template_limit;
      ELSE
        v_max_downloads := NULL; -- Unlimited
      END IF;
      
      -- Count current month's downloads for this template
      SELECT COUNT(*) INTO v_current_downloads
      FROM public.user_document_downloads
      WHERE user_id = p_user_id
      AND template_id = p_template_id
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
      
      -- Build result
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
  
  -- Get user's current plan tier (for subscription plans)
  SELECT s.subscription_tier INTO v_plan_tier
  FROM public.subscribers s
  WHERE s.user_id = p_user_id
  AND (s.subscription_status = 'active' OR s.trial_with_subscription = true)
  LIMIT 1;
  
  -- If no active subscription, default to basic
  IF v_plan_tier IS NULL THEN
    v_plan_tier := 'basic';
  END IF;
  
  -- Get plan_id from tier
  SELECT sp.id INTO v_plan_id
  FROM public.subscription_plans sp
  WHERE sp.plan_tier = v_plan_tier
  AND sp.is_active = true
  LIMIT 1;
  
  -- If still no plan found, default to basic
  IF v_plan_id IS NULL THEN
    SELECT sp.id INTO v_plan_id
    FROM public.subscription_plans sp
    WHERE sp.plan_tier = 'basic'
    AND sp.is_active = true
    LIMIT 1;
  END IF;
  
  -- Check if plan has permission to download this template
  SELECT can_download, max_downloads_per_template INTO v_can_download, v_per_template_limit
  FROM public.plan_template_permissions
  WHERE plan_id = v_plan_id
  AND template_id = p_template_id;
  
  -- CRITICAL: If no explicit permission record, template is available to ALL users (default to true)
  -- Only templates WITH explicit plan permissions should be restricted
  IF v_can_download IS NULL THEN
    v_can_download := true;  -- No plan permissions = available to all users
  END IF;
  
  -- Use per-template limit if set, otherwise fall back to plan-level limit
  IF v_per_template_limit IS NOT NULL THEN
    v_max_downloads := v_per_template_limit;
  ELSE
    -- Fall back to plan-level max_downloads_per_month
    SELECT max_downloads_per_month INTO v_max_downloads
    FROM public.subscription_plans
    WHERE id = v_plan_id;
    
    IF v_max_downloads IS NULL THEN
      v_max_downloads := 10; -- Default limit
    END IF;
  END IF;
  
  -- Count current month's downloads for this specific template
  SELECT COUNT(*) INTO v_current_downloads
  FROM public.user_document_downloads
  WHERE user_id = p_user_id
  AND template_id = p_template_id
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
  
  -- Build result
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
$$;

-- Drop existing function first to allow return type change
DROP FUNCTION IF EXISTS public.get_user_downloadable_templates(UUID);

-- Update get_user_downloadable_templates to use per-template limits
CREATE OR REPLACE FUNCTION public.get_user_downloadable_templates(
  p_user_id UUID
)
RETURNS TABLE (
  template_id UUID,
  template_name TEXT,
  can_download BOOLEAN,
  max_downloads INTEGER,
  current_downloads INTEGER,
  remaining_downloads INTEGER,
  access_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id UUID;
  v_plan_tier TEXT;
  v_max_downloads_val INTEGER;
  v_has_broker_membership BOOLEAN;
  v_broker_membership_id UUID;
BEGIN
  -- Check if user has broker membership
  SELECT EXISTS(
    SELECT 1 FROM public.broker_memberships bm
    WHERE bm.user_id = p_user_id
    AND bm.payment_status = 'paid'
    AND bm.membership_status = 'active'
  ) INTO v_has_broker_membership;
  
  IF v_has_broker_membership THEN
    -- Get broker membership ID
    SELECT id INTO v_broker_membership_id
    FROM public.broker_memberships
    WHERE user_id = p_user_id
    AND payment_status = 'paid'
    AND membership_status = 'active'
    LIMIT 1;
    
    -- Return templates with broker permissions
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
      ) AS current_downloads,
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
        )
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
  
  -- Get user's plan tier (for subscription plans)
  SELECT s.subscription_tier INTO v_plan_tier
  FROM public.subscribers s
  WHERE s.user_id = p_user_id
  AND (s.subscription_status = 'active' OR s.trial_with_subscription = true)
  LIMIT 1;
  
  -- If no active subscription, default to basic
  IF v_plan_tier IS NULL THEN
    v_plan_tier := 'basic';
  END IF;
  
  -- Get plan_id and max_downloads from tier
  SELECT sp.id, sp.max_downloads_per_month INTO v_plan_id, v_max_downloads_val
  FROM public.subscription_plans sp
  WHERE sp.plan_tier = v_plan_tier
  AND sp.is_active = true
  LIMIT 1;
  
  -- If still no plan found, default to basic
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
  
  -- Return all templates with their download status
  RETURN QUERY
  SELECT 
    dt.id AS template_id,
    dt.title AS template_name,
    -- Check if template has ANY plan permissions at all
    CASE 
      -- First: Check if template has NO plan permissions at all (available to all)
      WHEN NOT EXISTS (
        SELECT 1 FROM public.plan_template_permissions 
        WHERE template_id = dt.id
      ) THEN true  -- Template has NO plan permissions = available to ALL users
      -- Second: Check if user's plan has permission
      WHEN ptp.id IS NOT NULL AND ptp.can_download = true THEN true  -- User's plan has permission
      ELSE false  -- Template has permissions but user's plan doesn't have access
    END AS can_download,
    -- Use per-template limit if set, otherwise plan-level limit
    COALESCE(ptp.max_downloads_per_template, v_max_downloads_val) AS max_downloads,
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.user_document_downloads 
       WHERE user_id = p_user_id 
       AND template_id = dt.id
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      ), 0
    ) AS current_downloads,
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
    ) AS remaining_downloads,
    'subscription'::TEXT AS access_type
  FROM public.document_templates dt
  LEFT JOIN public.plan_template_permissions ptp 
    ON ptp.template_id = dt.id AND ptp.plan_id = v_plan_id
  WHERE dt.is_active = true
  ORDER BY dt.title;
END;
$$;

