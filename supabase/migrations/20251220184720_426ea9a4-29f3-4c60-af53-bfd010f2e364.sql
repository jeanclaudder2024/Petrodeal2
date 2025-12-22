-- Create support_faqs table for FAQ management
CREATE TABLE IF NOT EXISTS public.support_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;

-- Public read access for active FAQs
CREATE POLICY "Anyone can view active FAQs"
ON public.support_faqs
FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage FAQs"
ON public.support_faqs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create support_contact_info table for contact info management
CREATE TABLE IF NOT EXISTS public.support_contact_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_support TEXT NOT NULL DEFAULT 'support@petrodeallhub.com',
  phone_support TEXT NOT NULL DEFAULT '+1 (555) 123-4567',
  business_hours TEXT NOT NULL DEFAULT 'Mon-Fri: 9AM-6PM EST',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.support_contact_info ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view contact info"
ON public.support_contact_info
FOR SELECT
USING (true);

-- Admin write access
CREATE POLICY "Admins can update contact info"
ON public.support_contact_info
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default contact info
INSERT INTO public.support_contact_info (email_support, phone_support, business_hours)
VALUES ('support@petrodeallhub.com', '+1 (555) 123-4567', 'Mon-Fri: 9AM-6PM EST')
ON CONFLICT DO NOTHING;

-- Create broker_membership_content table for broker pricing management
CREATE TABLE IF NOT EXISTS public.broker_membership_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Become a Verified Broker',
  description TEXT NOT NULL DEFAULT 'Join our network of professional oil trading brokers',
  price DECIMAL(10,2) NOT NULL DEFAULT 499.00,
  billing_cycle TEXT NOT NULL DEFAULT 'lifetime',
  features JSONB NOT NULL DEFAULT '["Access to exclusive deals", "Verified broker badge", "Priority support"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_membership_content ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view broker membership content"
ON public.broker_membership_content
FOR SELECT
USING (is_active = true);

-- Admin write access
CREATE POLICY "Admins can manage broker membership content"
ON public.broker_membership_content
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default broker membership content
INSERT INTO public.broker_membership_content (title, description, price, features)
VALUES (
  'Become a Verified Broker',
  'Join our network of professional oil trading brokers and gain access to exclusive opportunities.',
  499.00,
  '["Create and manage trading deals", "Access verified broker badge", "Priority customer support", "Access to exclusive documents", "Connect with verified traders"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Add subscription_duration_months to subscribers if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscribers' 
    AND column_name = 'subscription_duration_months'
  ) THEN
    ALTER TABLE public.subscribers ADD COLUMN subscription_duration_months INTEGER DEFAULT 1;
  END IF;
END $$;