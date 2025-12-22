-- Create promotion_frames table for Step 5 promotions
CREATE TABLE IF NOT EXISTS public.promotion_frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'Limited-Time Offer',
  description TEXT,
  eligible_plans TEXT[] DEFAULT ARRAY['professional'],
  billing_cycle VARCHAR(20) DEFAULT 'both', -- monthly, annual, both
  discount_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed
  discount_value NUMERIC(10,2) DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  show_countdown BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  placement VARCHAR(50) DEFAULT 'step5', -- step5, subscription_page
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create banner_configs table for homepage banner
CREATE TABLE IF NOT EXISTS public.banner_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'BLACK FRIDAY SALE',
  subtitle VARCHAR(255) DEFAULT 'Up to 70% OFF',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  show_countdown BOOLEAN DEFAULT true,
  cta_text VARCHAR(100) DEFAULT 'Shop Now',
  cta_link VARCHAR(255) DEFAULT '#pricing',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add selected_plan_tier to subscribers for trial display
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS selected_plan_tier VARCHAR(50);

-- Enable RLS
ALTER TABLE public.promotion_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotion_frames (admin only for write, public read)
CREATE POLICY "Anyone can view active promotions" 
ON public.promotion_frames 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage promotions" 
ON public.promotion_frames 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- RLS policies for banner_configs (admin only for write, public read)
CREATE POLICY "Anyone can view active banners" 
ON public.banner_configs 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage banners" 
ON public.banner_configs 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- Insert default banner config
INSERT INTO public.banner_configs (title, subtitle, start_date, end_date, show_countdown, cta_text, cta_link, is_active)
VALUES ('BLACK FRIDAY SALE', 'Up to 70% OFF', now(), now() + interval '7 days', true, 'Shop Now', '#pricing', true)
ON CONFLICT DO NOTHING;