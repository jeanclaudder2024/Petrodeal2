-- Create job_listings table
CREATE TABLE public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT '{}',
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  salary_range TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT NOT NULL,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create career_settings table for CMS
CREATE TABLE public.career_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title TEXT DEFAULT 'Join Our Team',
  hero_subtitle TEXT DEFAULT 'Shape the Future of Energy with Industry Leaders',
  hero_image_url TEXT,
  show_salary_ranges BOOLEAN DEFAULT true,
  application_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_job_listings_status ON public.job_listings(status);
CREATE INDEX idx_job_listings_department ON public.job_listings(department);
CREATE INDEX idx_job_listings_slug ON public.job_listings(slug);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

-- Enable RLS
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_listings
-- Public can read published jobs
CREATE POLICY "Public can view published jobs"
ON public.job_listings
FOR SELECT
USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins can manage all jobs"
ON public.job_listings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS Policies for job_applications
-- Anyone can insert (apply for jobs)
CREATE POLICY "Anyone can submit applications"
ON public.job_applications
FOR INSERT
WITH CHECK (true);

-- Admins can read and manage applications
CREATE POLICY "Admins can manage applications"
ON public.job_applications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS Policies for career_settings
-- Public can read settings
CREATE POLICY "Public can view career settings"
ON public.career_settings
FOR SELECT
USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can manage career settings"
ON public.career_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_job_listings_updated_at
BEFORE UPDATE ON public.job_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_career_settings_updated_at
BEFORE UPDATE ON public.career_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default career settings
INSERT INTO public.career_settings (hero_title, hero_subtitle, show_salary_ranges)
VALUES ('Join Our Team', 'Shape the Future of Energy with Industry Leaders', true);

-- Create storage bucket for career documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-documents', 'career-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for career-documents bucket
CREATE POLICY "Anyone can upload career documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'career-documents');

CREATE POLICY "Admins can view career documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'career-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);