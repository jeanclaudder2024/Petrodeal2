-- =============================================
-- LinkedIn Social Media Management Tables
-- =============================================

-- 1. LinkedIn Connected Pages - Store OAuth tokens and page info
CREATE TABLE public.linkedin_connected_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL,
  organization_urn TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  profile_image_url TEXT,
  follower_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  connected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. LinkedIn Scheduled Posts - Posts queued for future publishing
CREATE TABLE public.linkedin_scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.linkedin_connected_pages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_type TEXT DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video', 'document', 'multi_image')),
  media_urls TEXT[] DEFAULT '{}',
  media_urns TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  error_message TEXT,
  published_post_urn TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. LinkedIn Published Posts - Track all published posts with metrics
CREATE TABLE public.linkedin_published_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.linkedin_connected_pages(id) ON DELETE CASCADE,
  post_urn TEXT NOT NULL UNIQUE,
  content TEXT,
  media_type TEXT,
  media_urls TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. LinkedIn Comments - Store and manage comments
CREATE TABLE public.linkedin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.linkedin_published_posts(id) ON DELETE CASCADE,
  comment_urn TEXT NOT NULL UNIQUE,
  parent_comment_urn TEXT,
  author_name TEXT,
  author_profile_url TEXT,
  author_image_url TEXT,
  content TEXT NOT NULL,
  created_at_linkedin TIMESTAMPTZ,
  is_reply BOOLEAN DEFAULT false,
  our_reply TEXT,
  our_reply_urn TEXT,
  replied_at TIMESTAMPTZ,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. LinkedIn Media Library - Store uploaded media assets
CREATE TABLE public.linkedin_media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.linkedin_connected_pages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  linkedin_asset_urn TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.linkedin_connected_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_published_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_media_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only access (using user_roles table)
CREATE POLICY "Admin access for linkedin_connected_pages"
ON public.linkedin_connected_pages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin access for linkedin_scheduled_posts"
ON public.linkedin_scheduled_posts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin access for linkedin_published_posts"
ON public.linkedin_published_posts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin access for linkedin_comments"
ON public.linkedin_comments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin access for linkedin_media_library"
ON public.linkedin_media_library
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_linkedin_scheduled_posts_scheduled_for ON public.linkedin_scheduled_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_linkedin_scheduled_posts_status ON public.linkedin_scheduled_posts(status);
CREATE INDEX idx_linkedin_published_posts_page_id ON public.linkedin_published_posts(page_id);
CREATE INDEX idx_linkedin_published_posts_published_at ON public.linkedin_published_posts(published_at DESC);
CREATE INDEX idx_linkedin_comments_post_id ON public.linkedin_comments(post_id);
CREATE INDEX idx_linkedin_media_library_page_id ON public.linkedin_media_library(page_id);

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_linkedin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_linkedin_connected_pages_updated_at
  BEFORE UPDATE ON public.linkedin_connected_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_linkedin_updated_at();

CREATE TRIGGER update_linkedin_scheduled_posts_updated_at
  BEFORE UPDATE ON public.linkedin_scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_linkedin_updated_at();