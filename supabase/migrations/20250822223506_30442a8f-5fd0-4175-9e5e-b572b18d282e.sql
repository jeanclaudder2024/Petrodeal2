-- Create user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'broker', 'trader', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'broker' THEN 2
      WHEN 'trader' THEN 3
      WHEN 'user' THEN 4
    END
  LIMIT 1
$$;

-- Create function to assign admin role to first user
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email_confirmed_at IS NOT NULL;
  
  -- If this is the first user, make them admin
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by, assigned_at)
    VALUES (NEW.id, 'admin', NEW.id, now());
  ELSE
    -- Otherwise, assign default user role
    INSERT INTO public.user_roles (user_id, role, assigned_at)
    VALUES (NEW.id, 'user', now());
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign roles on user creation
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user_role();

-- RLS Policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Edge functions can manage roles" ON public.user_roles
  FOR ALL
  USING (true);

-- Add admin_notes table for system management
CREATE TABLE public.admin_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage admin notes" ON public.admin_notes
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add system_settings table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage system settings" ON public.system_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('platform_name', '"MaritimeAI"', 'Platform display name'),
('max_deals_per_user', '100', 'Maximum deals per user'),
('enable_realtime_updates', 'true', 'Enable real-time data updates'),
('maintenance_mode', 'false', 'Platform maintenance mode'),
('registration_enabled', 'true', 'Allow new user registrations');

-- Add updated_at trigger for admin_notes
CREATE TRIGGER update_admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for system_settings
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();