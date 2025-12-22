-- 1. Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'footer',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on newsletter_subscribers
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
CREATE POLICY "Admins can manage all subscribers" ON public.newsletter_subscribers
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
FOR INSERT WITH CHECK (true);

-- 4. Add settings for contact form and social links (skip if exists)
INSERT INTO public.cms_settings (key, value_en, group_name, type, description) VALUES
('contact_form_email', 'support@petrodealhub.com', 'contact', 'text', 'Email to receive contact form submissions'),
('quick_contact_email', 'support@petrodealhub.com', 'contact', 'text', 'Email for quick contact section'),
('linkedin_url', 'https://linkedin.com', 'social', 'text', 'LinkedIn company page URL'),
('twitter_url', '', 'social', 'text', 'Twitter/X company page URL'),
('facebook_url', '', 'social', 'text', 'Facebook company page URL'),
('instagram_url', '', 'social', 'text', 'Instagram company page URL')
ON CONFLICT (key) DO NOTHING;