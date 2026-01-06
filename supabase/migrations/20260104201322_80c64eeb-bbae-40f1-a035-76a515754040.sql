-- Create marketing_settings table for storing tracking pixel configurations
CREATE TABLE public.marketing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  tracking_id TEXT NOT NULL,
  name TEXT,
  is_enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(provider, tracking_id)
);

-- Create marketing_events table for tracking custom events configuration
CREATE TABLE public.marketing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_enabled BOOLEAN DEFAULT true,
  providers TEXT[] DEFAULT ARRAY['ga4'],
  event_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create utm_tracking table for storing UTM parameters with user sessions
CREATE TABLE public.utm_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  landing_page TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_settings (admin only via user_roles table)
CREATE POLICY "Admins can view marketing settings" 
ON public.marketing_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert marketing settings" 
ON public.marketing_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update marketing settings" 
ON public.marketing_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete marketing settings" 
ON public.marketing_settings 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- RLS Policies for marketing_events
CREATE POLICY "Admins can manage marketing events" 
ON public.marketing_events 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view marketing events" 
ON public.marketing_events 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- RLS Policies for utm_tracking
CREATE POLICY "Users can view their own UTM tracking" 
ON public.utm_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own UTM tracking" 
ON public.utm_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all UTM tracking" 
ON public.utm_tracking 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_marketing_settings_updated_at
BEFORE UPDATE ON public.marketing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_events_updated_at
BEFORE UPDATE ON public.marketing_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default events
INSERT INTO public.marketing_events (event_name, display_name, description, category, providers) VALUES
('sign_up_complete', 'Sign Up Complete', 'User completed registration', 'conversion', ARRAY['ga4', 'facebook_pixel', 'linkedin']),
('trial_started', 'Trial Started', 'User started trial period', 'conversion', ARRAY['ga4', 'facebook_pixel']),
('subscription_success', 'Subscription Success', 'User completed subscription payment', 'conversion', ARRAY['ga4', 'facebook_pixel', 'linkedin']),
('document_download', 'Document Download', 'User downloaded a document', 'engagement', ARRAY['ga4']),
('contact_submit', 'Contact Form Submit', 'User submitted contact form', 'conversion', ARRAY['ga4', 'facebook_pixel']),
('deal_view', 'Deal View', 'User viewed deal details', 'engagement', ARRAY['ga4']),
('search_used', 'Search Used', 'User performed a search', 'engagement', ARRAY['ga4']),
('feature_locked_view', 'Feature Locked View', 'Free user tried to access locked feature', 'engagement', ARRAY['ga4']),
('pricing_view', 'Pricing View', 'User viewed pricing page', 'conversion', ARRAY['ga4', 'facebook_pixel']),
('product_viewed', 'Product Viewed', 'User viewed product details', 'engagement', ARRAY['ga4']),
('company_contacted', 'Company Contacted', 'User initiated contact with company', 'conversion', ARRAY['ga4', 'linkedin']),
('broker_profile_viewed', 'Broker Profile Viewed', 'User viewed broker profile', 'engagement', ARRAY['ga4']);