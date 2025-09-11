-- Create landing page content management table
CREATE TABLE public.landing_page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content JSONB,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;

-- Create policies - Only admins can manage landing page content
CREATE POLICY "Anyone can view landing page content" 
ON public.landing_page_content 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage landing page content" 
ON public.landing_page_content 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Insert default content for hero section
INSERT INTO public.landing_page_content (section_name, title, subtitle, description, content) VALUES
('hero', 'PETRODEALHUB', 'INDUSTRIAL GRADE PETROLEUM TRADING PLATFORM', 'Advanced vessel tracking • Real-time market intelligence • Secure transaction protocols', 
 '{"metrics": [{"value": "99.9%", "label": "SYSTEM UPTIME"}, {"value": "$2.4B+", "label": "SECURED VOLUME"}, {"value": "15K+", "label": "ACTIVE TERMINALS"}]}'::jsonb),

('about', 'Why Choose PetroDealHub', 'The Future of Oil Trading', 'Connect with verified brokers, access real-time market data, and execute deals with confidence through our advanced trading platform.',
 '{"features": [{"title": "Verified Brokers", "description": "All brokers are ICC & UNCITRAL certified"}, {"title": "Secure Transactions", "description": "GAFTA & FOSFA commission protection"}]}'::jsonb),

('pricing', 'Choose Your Trading Power', 'Subscription Plans', 'Scale your oil trading operations with flexible plans designed for every level of business, from independent traders to global enterprises.',
 '{"plans": [{"name": "Starter", "price": "Free", "period": "5-day trial"}, {"name": "Professional", "price": "$299", "period": "per month"}, {"name": "Enterprise", "price": "Custom", "period": "tailored pricing"}]}'::jsonb);

-- Create storage bucket for landing page images
INSERT INTO storage.buckets (id, name, public) VALUES ('landing-images', 'landing-images', true);

-- Create storage policies for landing page images
CREATE POLICY "Landing images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'landing-images');

CREATE POLICY "Only admins can manage landing images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'landing-images' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update landing images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'landing-images' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete landing images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'landing-images' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create function to update timestamps
CREATE TRIGGER update_landing_page_content_updated_at
BEFORE UPDATE ON public.landing_page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();