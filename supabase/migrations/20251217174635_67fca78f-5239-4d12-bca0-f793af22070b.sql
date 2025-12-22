-- Create sponsor_banners table for Innovation & Youth Support
CREATE TABLE IF NOT EXISTS public.sponsor_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_name TEXT NOT NULL,
  sponsor_logo_url TEXT,
  sponsor_text TEXT NOT NULL CHECK (char_length(sponsor_text) <= 120),
  sponsor_website_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_on_registration BOOLEAN NOT NULL DEFAULT false,
  show_on_footer BOOLEAN NOT NULL DEFAULT false,
  show_on_dashboard_map BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsor_banners ENABLE ROW LEVEL SECURITY;

-- Public read access for active sponsors (for display on frontend)
CREATE POLICY "Anyone can view active sponsor banners"
  ON public.sponsor_banners
  FOR SELECT
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage sponsor banners"
  ON public.sponsor_banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_sponsor_banners_updated_at
  BEFORE UPDATE ON public.sponsor_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.sponsor_banners IS 'Stores sponsor/innovation support banner configurations for display across the platform';