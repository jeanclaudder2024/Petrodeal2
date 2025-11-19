-- Migration: Template-Plan Permissions and Download Tracking
-- This migration creates the necessary tables to manage template download permissions per plan
-- and tracks user downloads to enforce monthly limits
--
-- NOTE: If you encounter errors about existing objects, run this cleanup first:
-- DROP TRIGGER IF EXISTS update_plan_template_permissions_updated_at ON public.plan_template_permissions;
-- DROP POLICY IF EXISTS "Anyone can view plan template permissions" ON public.plan_template_permissions;
-- DROP POLICY IF EXISTS "Admins can manage plan template permissions" ON public.plan_template_permissions;
-- DROP POLICY IF EXISTS "Users can view their own downloads" ON public.user_document_downloads;
-- DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.user_document_downloads;
-- DROP POLICY IF EXISTS "Admins can view all downloads" ON public.user_document_downloads;

-- 1. Add max_downloads_per_month column to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS max_downloads_per_month INTEGER DEFAULT 10;

-- 2. Create plan_template_permissions table
-- Links plans to templates and defines which templates each plan can download
CREATE TABLE IF NOT EXISTS public.plan_template_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  can_download BOOLEAN DEFAULT true, -- If false, plan can view but not download
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(plan_id, template_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_plan_template_permissions_plan_id 
ON public.plan_template_permissions(plan_id);

CREATE INDEX IF NOT EXISTS idx_plan_template_permissions_template_id 
ON public.plan_template_permissions(template_id);

-- Enable RLS
ALTER TABLE public.plan_template_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active permissions (for checking what they can download)
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view plan template permissions" ON public.plan_template_permissions;
CREATE POLICY "Anyone can view plan template permissions" 
ON public.plan_template_permissions 
FOR SELECT 
USING (true);

-- Policy: Admins can manage all permissions
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage plan template permissions" ON public.plan_template_permissions;
CREATE POLICY "Admins can manage plan template permissions" 
ON public.plan_template_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Create user_document_downloads table
-- Tracks individual document downloads per user per month
CREATE TABLE IF NOT EXISTS public.user_document_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  vessel_imo TEXT, -- Optional: track which vessel was used
  download_type TEXT DEFAULT 'pdf', -- pdf, docx, etc.
  file_size INTEGER, -- Size in bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_document_downloads_user_id 
ON public.user_document_downloads(user_id);

CREATE INDEX IF NOT EXISTS idx_user_document_downloads_template_id 
ON public.user_document_downloads(template_id);

CREATE INDEX IF NOT EXISTS idx_user_document_downloads_created_at 
ON public.user_document_downloads(created_at);

-- Composite index for user_id and created_at (used for monthly queries)
CREATE INDEX IF NOT EXISTS idx_user_document_downloads_user_created 
ON public.user_document_downloads(user_id, created_at);

-- Enable RLS
ALTER TABLE public.user_document_downloads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own downloads
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.user_document_downloads;
CREATE POLICY "Users can view their own downloads" 
ON public.user_document_downloads 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own downloads
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.user_document_downloads;
CREATE POLICY "Users can insert their own downloads" 
ON public.user_document_downloads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all downloads
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all downloads" ON public.user_document_downloads;
CREATE POLICY "Admins can view all downloads" 
ON public.user_document_downloads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create trigger for updated_at on plan_template_permissions
-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_plan_template_permissions_updated_at ON public.plan_template_permissions;
CREATE TRIGGER update_plan_template_permissions_updated_at
BEFORE UPDATE ON public.plan_template_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create helper function to check if user can download template
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
  v_current_downloads INTEGER;
  v_can_download BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get user's current plan tier
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
  SELECT can_download INTO v_can_download
  FROM public.plan_template_permissions
  WHERE plan_id = v_plan_id
  AND template_id = p_template_id;
  
  -- CRITICAL: If no explicit permission record, template is available to ALL users (default to true)
  -- Only templates WITH explicit plan permissions should be restricted
  IF v_can_download IS NULL THEN
    v_can_download := true;  -- No plan permissions = available to all users
  END IF;
  
  -- Get max downloads per month for the plan
  SELECT max_downloads_per_month INTO v_max_downloads
  FROM public.subscription_plans
  WHERE id = v_plan_id;
  
  IF v_max_downloads IS NULL THEN
    v_max_downloads := 10; -- Default limit
  END IF;
  
  -- Count current month's downloads
  SELECT COUNT(*) INTO v_current_downloads
  FROM public.user_document_downloads
  WHERE user_id = p_user_id
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
  
  -- Build result
  v_result := jsonb_build_object(
    'can_download', v_can_download,
    'has_permission', v_can_download,
    'max_downloads', v_max_downloads,
    'current_downloads', v_current_downloads,
    'remaining_downloads', GREATEST(0, v_max_downloads - v_current_downloads),
    'limit_reached', (v_current_downloads >= v_max_downloads)
  );
  
  RETURN v_result;
END;
$$;

-- 6. Create function to get user's downloadable templates
CREATE OR REPLACE FUNCTION public.get_user_downloadable_templates(
  p_user_id UUID
)
RETURNS TABLE (
  template_id UUID,
  template_name TEXT,
  can_download BOOLEAN,
  max_downloads INTEGER,
  current_downloads INTEGER,
  remaining_downloads INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id UUID;
  v_plan_tier TEXT;
  v_max_downloads_val INTEGER;
BEGIN
  -- Get user's plan tier
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
  -- CRITICAL: Templates WITHOUT plan permissions should be available to ALL users (can_download = true)
  -- Only templates WITH explicit plan permissions should be restricted
  RETURN QUERY
  WITH template_permission_check AS (
    SELECT 
      dt.id AS template_id,
      dt.title AS template_name,
      -- Check if template has ANY plan permissions at all
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.plan_template_permissions 
          WHERE template_id = dt.id
        ) THEN true  -- Template HAS plan permissions
        ELSE false   -- Template has NO plan permissions
      END AS has_any_permissions,
      ptp.id AS permission_id,
      ptp.can_download AS permission_can_download
    FROM public.document_templates dt
    LEFT JOIN public.plan_template_permissions ptp 
      ON ptp.template_id = dt.id AND ptp.plan_id = v_plan_id
    WHERE dt.is_active = true
  )
  SELECT 
    tpc.template_id,
    tpc.template_name,
    -- If template has NO plan permissions, it's available to ALL users (true)
    -- If template HAS plan permissions, check if user's plan has permission
    CASE 
      WHEN tpc.has_any_permissions = false THEN true  -- No permissions = available to all
      WHEN tpc.permission_id IS NOT NULL AND tpc.permission_can_download = true THEN true  -- User's plan has permission
      ELSE false  -- Template has permissions but user's plan doesn't have access
    END AS can_download,
    COALESCE(v_max_downloads_val, 10) AS max_downloads,
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.user_document_downloads 
       WHERE user_id = p_user_id 
       AND template_id = tpc.template_id
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      ), 0
    ) AS current_downloads,
    GREATEST(0, 
      COALESCE(v_max_downloads_val, 10) - 
      COALESCE(
        (SELECT COUNT(*) 
         FROM public.user_document_downloads 
         WHERE user_id = p_user_id 
         AND template_id = tpc.template_id
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0
      )
    ) AS remaining_downloads
  FROM template_permission_check tpc
  ORDER BY tpc.template_name;
END;
$$;

-- 7. Set default max_downloads_per_month for existing plans
-- Update ALL plans to ensure correct values based on plan_tier
UPDATE public.subscription_plans
SET max_downloads_per_month = CASE
  WHEN plan_tier = 'basic' THEN 10
  WHEN plan_tier = 'professional' THEN 50
  WHEN plan_tier = 'enterprise' THEN 999
  ELSE 10
END
WHERE max_downloads_per_month IS NULL 
   OR (plan_tier = 'enterprise' AND max_downloads_per_month < 999)  -- Fix Enterprise if incorrectly set
   OR (plan_tier = 'professional' AND max_downloads_per_month < 50);  -- Fix Professional if incorrectly set

