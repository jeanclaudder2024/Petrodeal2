-- Fix 1: Update stripe_configuration policy to be admin-only
DROP POLICY IF EXISTS "Admins can read stripe config" ON public.stripe_configuration;
DROP POLICY IF EXISTS "Only admins can read stripe config" ON public.stripe_configuration;

CREATE POLICY "Only admins can read stripe config" 
ON public.stripe_configuration 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update stripe config" 
ON public.stripe_configuration 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert stripe config" 
ON public.stripe_configuration 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete stripe config" 
ON public.stripe_configuration 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Enable RLS on broker_template_permissions
ALTER TABLE public.broker_template_permissions ENABLE ROW LEVEL SECURITY;

-- Fix 3: Enable RLS on plan_template_permissions  
ALTER TABLE public.plan_template_permissions ENABLE ROW LEVEL SECURITY;

-- Fix 4: Enable RLS on template_files (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'template_files') THEN
    ALTER TABLE public.template_files ENABLE ROW LEVEL SECURITY;
    
    -- Add admin policy for template_files
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'template_files' AND policyname = 'Admin access') THEN
      EXECUTE 'CREATE POLICY "Admin access" ON public.template_files FOR ALL USING (has_role(auth.uid(), ''admin''::app_role))';
    END IF;
  END IF;
END $$;