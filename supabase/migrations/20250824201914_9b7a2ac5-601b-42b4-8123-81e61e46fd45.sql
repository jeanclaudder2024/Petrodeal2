-- Create subscription plans management table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  plan_tier TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2) NOT NULL,
  vessel_limit INTEGER NOT NULL DEFAULT 10,
  port_limit INTEGER NOT NULL DEFAULT 20,
  regions_limit INTEGER NOT NULL DEFAULT 1,
  refinery_limit INTEGER NOT NULL DEFAULT 5,
  document_access TEXT[] DEFAULT ARRAY['basic']::TEXT[],
  support_level TEXT DEFAULT 'email',
  user_seats INTEGER DEFAULT 1,
  api_access BOOLEAN DEFAULT false,
  real_time_analytics BOOLEAN DEFAULT false,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access
CREATE POLICY "Admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active plans (for pricing page)
CREATE POLICY "Anyone can view active plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.subscription_plans (
  plan_name, plan_tier, description, monthly_price, annual_price,
  vessel_limit, port_limit, regions_limit, refinery_limit,
  document_access, support_level, user_seats, api_access, real_time_analytics,
  features, is_popular, sort_order
) VALUES 
(
  'Basic Plan', 'basic', 'Perfect for newcomers and small brokers stepping into global oil trading',
  29.99, 299.90, 90, 30, 4, 15,
  ARRAY['basic']::TEXT[], 'email', 1, false, false,
  ARRAY['Geographic Coverage: 4 Regions', 'Ports Access: 30 Global Ports', 'Vessel Tracking: Up to 90 Vessels', 'Refinery Database: 15 Major Refineries', 'Core Documents: LOI, ICPO, BDN, Invoice Templates', 'Reports: Monthly Basic Reports', 'Support: Email Support', 'Deals: Direct Access to Oil Trading Deals']::TEXT[],
  false, 1
),
(
  'Professional Plan', 'professional', 'Designed for active brokers and medium-sized companies needing broader coverage',
  89.99, 899.90, 180, 100, 6, 70,
  ARRAY['basic', 'advanced']::TEXT[], 'priority', 5, false, true,
  ARRAY['Geographic Coverage: 6 Regions', 'Ports Access: 100+ Global Ports', 'Vessel Tracking: 180+ Vessels', 'Refinery Database: 70 Active Refineries', 'Advanced Documents: ICPO, SPA, B/L, SGS, CIF Templates', 'Reports: Weekly Detailed Reports + Smart Alerts', 'Support: Priority Email & Live Chat', 'Multi-User Access: Up to 5 Seats', 'Deals: Direct Global Oil Trading Opportunities', 'Networking: Connect with International Energy Companies']::TEXT[],
  true, 2
),
(
  'Enterprise Plan', 'enterprise', 'The ultimate solution for large corporations, global brokerage firms, and integrated trading networks',
  199.99, 1999.90, 500, 120, 7, 999,
  ARRAY['basic', 'advanced', 'complete']::TEXT[], 'dedicated', 20, true, true,
  ARRAY['Geographic Coverage: 7 Global Regions', 'Ports Access: 120+ Global Ports', 'Vessel Tracking: 500+ Vessels in Real-Time', 'Refinery Database: Full Global Refinery Access', 'Complete Documentation Suite: All Templates + API Sync', 'Reports: Real-Time Analytics & Forecasting', 'Integration: API Keys for Direct System-to-System Connectivity', 'Support: Dedicated Account Manager + 24/7 Support', 'Corporate Access: 20+ Users with Teams Management', 'Deals: Direct Global Oil Trading Opportunities', 'Networking: Advanced Access to Global Energy & Trading Companies']::TEXT[],
  false, 3
);