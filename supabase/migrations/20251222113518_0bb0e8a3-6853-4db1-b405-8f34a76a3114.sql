-- =============================================
-- CMS PAGES MANAGEMENT SYSTEM
-- =============================================

-- Full page content management table
CREATE TABLE IF NOT EXISTS public.cms_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  page_category TEXT DEFAULT 'general',
  meta_title TEXT,
  meta_description TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image_url TEXT,
  hero_cta_text TEXT,
  hero_cta_link TEXT,
  content_sections JSONB DEFAULT '[]'::jsonb,
  seo_keywords TEXT[],
  is_editable BOOLEAN DEFAULT true,
  is_in_sitemap BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Footer content management table
CREATE TABLE IF NOT EXISTS public.cms_footer_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_name TEXT NOT NULL,
  column_order INTEGER DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Navigation menu items table
CREATE TABLE IF NOT EXISTS public.cms_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_location TEXT DEFAULT 'header',
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES public.cms_menu_items(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  requires_auth BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add email_account_id to email_templates if not exists
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS email_account_id UUID REFERENCES public.email_accounts(id);

-- Add source column to email_sending_history if not exists
ALTER TABLE public.email_sending_history 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

ALTER TABLE public.email_sending_history 
ADD COLUMN IF NOT EXISTS template_name TEXT;

ALTER TABLE public.email_sending_history 
ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE public.email_sending_history 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Enable RLS on new tables
ALTER TABLE public.cms_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cms_page_content
CREATE POLICY "Admins can manage all pages" ON public.cms_page_content
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published pages" ON public.cms_page_content
  FOR SELECT USING (is_published = true);

-- RLS Policies for cms_footer_content
CREATE POLICY "Admins can manage footer content" ON public.cms_footer_content
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active footer content" ON public.cms_footer_content
  FOR SELECT USING (is_active = true);

-- RLS Policies for cms_menu_items
CREATE POLICY "Admins can manage menu items" ON public.cms_menu_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active menu items" ON public.cms_menu_items
  FOR SELECT USING (is_active = true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_cms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cms_page_content_updated_at
  BEFORE UPDATE ON public.cms_page_content
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_cms_footer_content_updated_at
  BEFORE UPDATE ON public.cms_footer_content
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_cms_menu_items_updated_at
  BEFORE UPDATE ON public.cms_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

-- =============================================
-- SEED ALL 49 PAGES
-- =============================================

INSERT INTO public.cms_page_content (page_slug, page_name, page_category, meta_title, meta_description, is_editable, is_in_sitemap, sort_order) VALUES
-- Public/Marketing Pages
('/', 'Home', 'public', 'PetroDealHub - Global Oil Trading Platform', 'Connect with verified oil traders, track vessels, and access real-time market data', true, true, 1),
('about', 'About Us', 'public', 'About PetroDealHub', 'Learn about our mission to transform oil trading', true, true, 2),
('careers', 'Careers', 'public', 'Careers at PetroDealHub', 'Join our team and shape the future of oil trading', true, true, 3),
('contact', 'Contact Us', 'public', 'Contact PetroDealHub', 'Get in touch with our team', true, true, 4),
('blog', 'Blog', 'public', 'PetroDealHub Blog', 'Latest news and insights from the oil trading industry', true, true, 5),

-- News Pages
('news', 'News', 'news', 'Oil Industry News', 'Latest news from the oil and gas industry', true, true, 10),
('vessel-news', 'Vessel News', 'news', 'Vessel & Shipping News', 'Latest maritime and vessel news', true, true, 11),
('port-news', 'Port News', 'news', 'Port & Terminal News', 'Latest port and terminal news', true, true, 12),
('refinery-news', 'Refinery News', 'news', 'Refinery News', 'Latest refinery industry news', true, true, 13),
('support-news', 'Support News', 'news', 'Support Updates', 'Latest platform updates and announcements', true, true, 14),

-- Legal Pages
('policies', 'Terms & Policies', 'legal', 'Terms of Service', 'PetroDealHub terms and policies', true, true, 20),
('privacy-policy', 'Privacy Policy', 'legal', 'Privacy Policy', 'How we protect your data', true, true, 21),
('cookie-policy', 'Cookie Policy', 'legal', 'Cookie Policy', 'Our cookie usage policy', true, true, 22),

-- Subscription Pages
('subscription', 'Subscription', 'subscription', 'Choose Your Plan', 'Select the best subscription plan for your needs', true, true, 30),
('broker-membership', 'Broker Membership', 'subscription', 'Become a Verified Broker', 'Join our network of verified oil trading brokers', true, true, 31),
('payment-success', 'Payment Success', 'subscription', 'Payment Successful', 'Your payment has been processed', false, false, 32),

-- Auth Pages
('auth', 'Sign In / Sign Up', 'auth', 'Sign In to PetroDealHub', 'Access your account', false, false, 40),
('broker-setup', 'Broker Setup', 'auth', 'Complete Your Broker Profile', 'Set up your broker account', false, false, 41),
('broker-verification-waiting', 'Broker Verification', 'auth', 'Verification Pending', 'Your broker application is being reviewed', false, false, 42),

-- Dashboard Pages (Limited editing - mostly functional)
('dashboard', 'Dashboard', 'dashboard', 'Your Dashboard', 'Access your trading dashboard', false, false, 50),
('vessels', 'Vessels', 'dashboard', 'Vessel Tracking', 'Track and monitor vessels', true, true, 51),
('ports', 'Ports', 'dashboard', 'Port Directory', 'Browse global ports', true, true, 52),
('refineries', 'Refineries', 'dashboard', 'Refinery Database', 'Explore refineries worldwide', true, true, 53),
('companies', 'Companies', 'dashboard', 'Company Network', 'Discover oil trading companies', true, true, 54),
('brokers', 'Brokers', 'dashboard', 'Verified Brokers', 'Connect with verified brokers', true, true, 55),
('oil-prices', 'Oil Prices', 'dashboard', 'Real-Time Oil Prices', 'Live oil market data and analytics', true, true, 56),
('map', 'Interactive Map', 'dashboard', 'Global Maritime Map', 'Track vessels and ports on interactive map', true, true, 57),
('future-trading', 'Future Trading', 'dashboard', 'Futures Market', 'Oil futures trading data', true, true, 58),
('connections', 'Connections', 'dashboard', 'Your Network', 'Manage your business connections', false, false, 59),

-- Detail Pages
('vessel-detail', 'Vessel Detail', 'detail', 'Vessel Information', 'Detailed vessel information', false, false, 60),
('port-detail', 'Port Detail', 'detail', 'Port Information', 'Detailed port information', false, false, 61),
('refinery-detail', 'Refinery Detail', 'detail', 'Refinery Information', 'Detailed refinery information', false, false, 62),
('company-detail', 'Company Detail', 'detail', 'Company Information', 'Detailed company information', false, false, 63),
('broker-detail', 'Broker Detail', 'detail', 'Broker Profile', 'Detailed broker information', false, false, 64),

-- User Pages
('profile', 'Profile', 'user', 'Your Profile', 'Manage your account profile', false, false, 70),
('settings', 'Settings', 'user', 'Account Settings', 'Configure your account settings', false, false, 71),
('broker-dashboard', 'Broker Dashboard', 'user', 'Broker Dashboard', 'Manage your broker activities', false, false, 72),

-- Support Pages
('support', 'Support', 'support', 'Support Center', 'Get help with PetroDealHub', true, true, 80),
('support-center', 'Support Center', 'support', 'Help Center', 'Browse support articles and FAQs', true, true, 81),
('tutorials', 'Tutorials', 'support', 'Platform Tutorials', 'Learn how to use PetroDealHub', true, true, 82),
('documentation', 'Documentation', 'support', 'API Documentation', 'Technical documentation and guides', true, true, 83),
('my-tickets', 'My Tickets', 'support', 'Support Tickets', 'View your support tickets', false, false, 84),
('new-ticket', 'New Ticket', 'support', 'Submit a Ticket', 'Create a new support ticket', false, false, 85),
('ticket-detail', 'Ticket Detail', 'support', 'Ticket Details', 'View ticket details', false, false, 86),

-- Admin Pages (Not editable via CMS)
('admin', 'Admin Panel', 'admin', 'Admin Dashboard', 'System administration', false, false, 90),
('support-admin', 'Support Admin', 'admin', 'Support Management', 'Manage support tickets', false, false, 91),

-- API Integration
('api-integration', 'API Integration', 'developer', 'API Integration', 'Integrate with PetroDealHub API', true, true, 100)

ON CONFLICT (page_slug) DO NOTHING;

-- =============================================
-- SEED DEFAULT EMAIL TEMPLATES
-- =============================================

INSERT INTO public.email_templates (name, subject, body, html_source, category, active) VALUES
('subscription_confirmation', 'Welcome to PetroDealHub - Subscription Confirmed', 
'Welcome {{user_name}}! Your {{plan_name}} subscription has been confirmed.',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🛢️ PetroDealHub</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Subscription Confirmed</p>
  </div>
  <div style="background: white; padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background: #22c55e; color: white; padding: 10px 20px; border-radius: 50px; font-weight: bold;">✓ Payment Successful</span>
    </div>
    <h2 style="color: #1f2937;">Welcome aboard, {{user_name}}!</h2>
    <p>Your <strong>{{plan_name}}</strong> subscription is now active.</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p><strong>Plan:</strong> {{plan_name}}</p>
      <p><strong>Amount:</strong> {{amount}}</p>
      <p><strong>Billing Cycle:</strong> {{billing_cycle}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{platform_url}}/dashboard" style="background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Dashboard</a>
    </div>
  </div>
  <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af;">
    <p style="margin: 0; font-size: 12px;">© {{current_year}} PetroDealHub. All rights reserved.</p>
  </div>
</body>
</html>', 'subscription', true),

('account_verification', 'Activate Your PetroDealHub Account', 
'Welcome {{user_name}}! Please activate your account by visiting: {{confirmation_url}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🛢️ PetroDealHub</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Activate Your Account</p>
  </div>
  <div style="background: white; padding: 40px 30px;">
    <h2 style="color: #333;">Welcome {{user_name}}!</h2>
    <p>Thank you for signing up. Please activate your account to start your free trial.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{confirmation_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">✨ Activate Your Account</a>
    </div>
    <p style="color: #6c757d; font-size: 14px;">Or copy this link: {{confirmation_url}}</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
      <h4>What''s waiting for you:</h4>
      <ul style="color: #6c757d;">
        <li>Real-time vessel and port tracking</li>
        <li>Advanced refinery and company databases</li>
        <li>5-day free trial to explore all features</li>
      </ul>
    </div>
  </div>
  <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af;">
    <p style="margin: 0; font-size: 12px;">© {{current_year}} PetroDealHub. All rights reserved.</p>
  </div>
</body>
</html>', 'subscription', true),

('broker_membership_approved', 'Broker Membership Approved - PetroDealHub', 
'Congratulations {{user_name}}! Your broker membership has been approved.',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">🎉 Membership Approved!</h1>
  </div>
  <div style="background: white; padding: 40px 30px;">
    <h2>Congratulations, {{broker_name}}!</h2>
    <p>Your broker membership has been approved. You now have access to:</p>
    <ul>
      <li>Verified Broker Badge</li>
      <li>Deal creation and management</li>
      <li>Priority support</li>
      <li>Exclusive document templates</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{platform_url}}/broker-dashboard" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Broker Dashboard</a>
    </div>
  </div>
</body>
</html>', 'broker', true),

('trial_started', 'Your Free Trial Has Started - PetroDealHub', 
'Welcome {{user_name}}! Your 5-day free trial has started.',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">🚀 Trial Started!</h1>
  </div>
  <div style="background: white; padding: 40px 30px;">
    <h2>Welcome, {{user_name}}!</h2>
    <p>Your <strong>5-day free trial</strong> is now active. Explore all premium features:</p>
    <ul>
      <li>✅ Unlimited vessel tracking</li>
      <li>✅ Full port and refinery access</li>
      <li>✅ Real-time oil prices</li>
      <li>✅ Document generation</li>
    </ul>
    <p><strong>Trial ends:</strong> {{trial_end_date}}</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{platform_url}}/dashboard" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Exploring</a>
    </div>
  </div>
</body>
</html>', 'subscription', true),

('payment_failed', 'Payment Failed - Action Required', 
'Hi {{user_name}}, we could not process your payment. Please update your payment method.',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">⚠️ Payment Failed</h1>
  </div>
  <div style="background: white; padding: 40px 30px;">
    <h2>Hi {{user_name}},</h2>
    <p>We were unable to process your payment for <strong>{{plan_name}}</strong>.</p>
    <p>Please update your payment method to continue your subscription.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{platform_url}}/subscription" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Update Payment Method</a>
    </div>
    <p style="color: #6b7280;">If you believe this is an error, please contact our support team.</p>
  </div>
</body>
</html>', 'payment', true)

ON CONFLICT DO NOTHING;

-- =============================================
-- SEED FOOTER CONTENT
-- =============================================

INSERT INTO public.cms_footer_content (column_name, column_order, items, is_active) VALUES
('Company', 1, '[{"title": "About Us", "link": "/about"}, {"title": "Careers", "link": "/careers"}, {"title": "Contact", "link": "/contact"}]'::jsonb, true),
('Resources', 2, '[{"title": "Documentation", "link": "/documentation"}, {"title": "Tutorials", "link": "/tutorials"}, {"title": "API", "link": "/api-integration"}]'::jsonb, true),
('Legal', 3, '[{"title": "Privacy Policy", "link": "/privacy-policy"}, {"title": "Terms of Service", "link": "/policies"}, {"title": "Cookie Policy", "link": "/cookie-policy"}]'::jsonb, true),
('Support', 4, '[{"title": "Help Center", "link": "/support"}, {"title": "Contact Support", "link": "/new-ticket"}, {"title": "Status", "link": "/support-news"}]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED MENU ITEMS
-- =============================================

INSERT INTO public.cms_menu_items (menu_location, title, link, order_index, is_active, requires_auth) VALUES
('header', 'Dashboard', '/dashboard', 1, true, true),
('header', 'Vessels', '/vessels', 2, true, true),
('header', 'Ports', '/ports', 3, true, true),
('header', 'Companies', '/companies', 4, true, true),
('header', 'Brokers', '/brokers', 5, true, true),
('header', 'Oil Prices', '/oil-prices', 6, true, true),
('footer', 'About', '/about', 1, true, false),
('footer', 'Careers', '/careers', 2, true, false),
('footer', 'Support', '/support', 3, true, false),
('footer', 'Privacy', '/privacy-policy', 4, true, false),
('mobile', 'Dashboard', '/dashboard', 1, true, true),
('mobile', 'Map', '/map', 2, true, true),
('mobile', 'Prices', '/oil-prices', 3, true, true),
('mobile', 'Profile', '/profile', 4, true, true)
ON CONFLICT DO NOTHING;