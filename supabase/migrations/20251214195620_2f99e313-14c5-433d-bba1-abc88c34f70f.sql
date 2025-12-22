-- Issue 6: Create system_settings table if not exists
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view system settings" ON public.system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('allow_registrations', 'true', 'Allow new user registrations'),
  ('default_trial_days', '14', 'Default trial period in days'),
  ('email_notifications_enabled', 'true', 'Enable email notifications')
ON CONFLICT (setting_key) DO NOTHING;

-- Create admin_notes table if not exists
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text,
  category text DEFAULT 'general',
  priority text DEFAULT 'normal',
  admin_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage admin notes" ON public.admin_notes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));