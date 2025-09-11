-- Create tutorials table for dynamic tutorial content
CREATE TABLE public.tutorials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  video_url text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active tutorials" 
ON public.tutorials 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all tutorials" 
ON public.tutorials 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_tutorials_updated_at
BEFORE UPDATE ON public.tutorials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample tutorial content
INSERT INTO public.tutorials (title, video_url, description, created_by) VALUES 
('Getting Started with PetroDealHub', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Learn the basics of navigating PetroDealHub platform and accessing key features for petroleum trading.', (SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL LIMIT 1)),
('How to Track Vessels', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Complete guide on using our vessel tracking system to monitor tanker movements and cargo deliveries.', (SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL LIMIT 1)),
('Managing Oil Deals', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Step-by-step tutorial on creating, managing, and tracking oil deals through our platform.', (SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL LIMIT 1));