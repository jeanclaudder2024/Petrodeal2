-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage subscription discounts" ON public.subscription_discounts;
DROP POLICY IF EXISTS "Anyone can view active discounts" ON public.subscription_discounts;

-- Create policies
CREATE POLICY "Admins can manage subscription discounts"
  ON public.subscription_discounts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active discounts"
  ON public.subscription_discounts FOR SELECT
  USING (is_active = true AND valid_until > now());

-- Add unique constraint on email_configurations.type if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_configurations_type_key'
  ) THEN
    ALTER TABLE public.email_configurations ADD CONSTRAINT email_configurations_type_key UNIQUE (type);
  END IF;
END $$;

-- Create email_accounts table for multiple email configurations
CREATE TABLE IF NOT EXISTS public.email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  email_address TEXT NOT NULL,
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password TEXT,
  imap_host TEXT,
  imap_port INTEGER DEFAULT 993,
  imap_username TEXT,
  imap_password TEXT,
  enable_tls BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  test_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on email_accounts
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for email_accounts
DROP POLICY IF EXISTS "Admins can manage email accounts" ON public.email_accounts;
CREATE POLICY "Admins can manage email accounts"
  ON public.email_accounts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add columns to email_templates if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'variables') THEN
    ALTER TABLE public.email_templates ADD COLUMN variables JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'email_account_id') THEN
    ALTER TABLE public.email_templates ADD COLUMN email_account_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'html_source') THEN
    ALTER TABLE public.email_templates ADD COLUMN html_source TEXT;
  END IF;
END $$;

-- Create email_automation_rules table
CREATE TABLE IF NOT EXISTS public.email_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  conditions JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  delay_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on email_automation_rules
ALTER TABLE public.email_automation_rules ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Admins can manage email automation rules" ON public.email_automation_rules;
CREATE POLICY "Admins can manage email automation rules"
  ON public.email_automation_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create email_sending_history table
CREATE TABLE IF NOT EXISTS public.email_sending_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  automation_rule_id UUID REFERENCES public.email_automation_rules(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on email_sending_history
ALTER TABLE public.email_sending_history ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Admins can view email sending history" ON public.email_sending_history;
DROP POLICY IF EXISTS "System can insert email sending history" ON public.email_sending_history;
CREATE POLICY "Admins can view email sending history"
  ON public.email_sending_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert email sending history"
  ON public.email_sending_history FOR INSERT
  WITH CHECK (true);

-- Add vessel_connections table for tracking vessel arrival/departure events
CREATE TABLE IF NOT EXISTS public.vessel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id INTEGER REFERENCES public.vessels(id) ON DELETE CASCADE,
  departure_port_id INTEGER REFERENCES public.ports(id),
  destination_port_id INTEGER REFERENCES public.ports(id),
  target_refinery_id UUID,
  current_lat NUMERIC,
  current_lng NUMERIC,
  etd TIMESTAMPTZ,
  eta TIMESTAMPTZ,
  cargo_type TEXT,
  cargo_quantity NUMERIC,
  load_status TEXT,
  charterer TEXT,
  shipper TEXT,
  receiver TEXT,
  buyer_company TEXT,
  seller_company TEXT,
  freight_rate NUMERIC,
  market_price NUMERIC,
  charter_type TEXT,
  payment_terms TEXT,
  currency TEXT DEFAULT 'USD',
  arrival_detected BOOLEAN DEFAULT false,
  arrival_detected_at TIMESTAMPTZ,
  voyage_status TEXT DEFAULT 'active' CHECK (voyage_status IN ('active', 'completed', 'cancelled')),
  ai_confidence TEXT,
  ai_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on vessel_connections
ALTER TABLE public.vessel_connections ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Authenticated users can view vessel connections" ON public.vessel_connections;
DROP POLICY IF EXISTS "Admins can manage vessel connections" ON public.vessel_connections;
CREATE POLICY "Authenticated users can view vessel connections"
  ON public.vessel_connections FOR SELECT
  USING (true);
CREATE POLICY "Admins can manage vessel connections"
  ON public.vessel_connections FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));