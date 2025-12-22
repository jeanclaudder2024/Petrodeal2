-- ERROR 3: Add stripe_promo_code_id to subscription_discounts
ALTER TABLE public.subscription_discounts 
ADD COLUMN IF NOT EXISTS stripe_promo_code_id TEXT;

-- ERROR 6: Add is_global column to user_notifications and modify structure
ALTER TABLE public.user_notifications 
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS target_user_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_read_by UUID[] DEFAULT '{}';

-- Make sponsor_banners readable by anyone (fix RLS for public access)
DROP POLICY IF EXISTS "Anyone can view active sponsors" ON public.sponsor_banners;
CREATE POLICY "Anyone can view active sponsors" ON public.sponsor_banners
FOR SELECT USING (is_active = true);

-- Enable realtime for notifications if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
  END IF;
END $$;