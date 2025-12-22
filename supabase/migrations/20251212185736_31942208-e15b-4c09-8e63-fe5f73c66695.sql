-- Add unique constraint on email_configurations.type if missing
DO $$
BEGIN
  -- Check if unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'email_configurations_type_key' 
    AND conrelid = 'public.email_configurations'::regclass
  ) THEN
    -- Add unique constraint
    ALTER TABLE public.email_configurations ADD CONSTRAINT email_configurations_type_key UNIQUE (type);
  END IF;
END $$;

-- Add admin policies for broker_template_permissions if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'broker_template_permissions' AND policyname = 'Admin full access') THEN
    CREATE POLICY "Admin full access" ON public.broker_template_permissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Add admin policies for plan_template_permissions if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_template_permissions' AND policyname = 'Admin full access') THEN
    CREATE POLICY "Admin full access" ON public.plan_template_permissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;