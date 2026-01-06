-- Fix 1: Create function to get user email safely and fix RLS policies for support_tickets
-- Also create marketing popup tables

-- Create a security definer function to get user email by id
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = user_uuid LIMIT 1;
$$;

-- Drop existing problematic RLS policies on support_tickets if they exist
DROP POLICY IF EXISTS "Admins can manage all support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;

-- Create new RLS policies for support_tickets that don't query auth.users directly
CREATE POLICY "Admins can manage all support tickets" 
ON public.support_tickets 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (user_id = auth.uid() OR email = public.get_user_email_by_id(auth.uid()));

CREATE POLICY "Users can create their own tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (
  user_id IS NULL OR 
  user_id = auth.uid() OR 
  email = public.get_user_email_by_id(auth.uid())
);

CREATE POLICY "Anyone can create tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (true);

-- Marketing Popup Tables
CREATE TABLE IF NOT EXISTS public.marketing_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_type text NOT NULL DEFAULT 'newsletter', -- newsletter, promotion, announcement, discount, custom
  title text NOT NULL,
  subtitle text,
  content text,
  image_url text,
  button_text text DEFAULT 'Subscribe',
  button_link text,
  style_config jsonb DEFAULT '{"backgroundColor": "#ffffff", "textColor": "#000000", "buttonColor": "#3b82f6"}'::jsonb,
  trigger_pages text[] DEFAULT '{}', -- Array of page paths where popup should show
  show_on_all_pages boolean DEFAULT false,
  display_delay_seconds integer DEFAULT 3,
  show_once_per_session boolean DEFAULT true,
  collect_name boolean DEFAULT true,
  collect_email boolean DEFAULT true,
  collect_phone boolean DEFAULT false,
  is_active boolean DEFAULT false,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Popup subscribers table
CREATE TABLE IF NOT EXISTS public.popup_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id uuid REFERENCES public.marketing_popups(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  page_subscribed_from text,
  user_agent text,
  ip_address text,
  subscribed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on marketing tables
ALTER TABLE public.marketing_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketing_popups
CREATE POLICY "Admins can manage all popups" 
ON public.marketing_popups 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active popups" 
ON public.marketing_popups 
FOR SELECT 
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now()) 
  AND (end_date IS NULL OR end_date >= now())
);

-- RLS policies for popup_subscribers
CREATE POLICY "Admins can view all subscribers" 
ON public.popup_subscribers 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can subscribe to popups" 
ON public.popup_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster popup lookups
CREATE INDEX IF NOT EXISTS idx_marketing_popups_active ON public.marketing_popups(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_popup_subscribers_popup_id ON public.popup_subscribers(popup_id);