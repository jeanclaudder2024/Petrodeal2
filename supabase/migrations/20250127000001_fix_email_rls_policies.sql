-- Fix RLS Policies for Email System
-- This migration updates the RLS policies to use has_role() function instead of JWT claims
-- Run this in your Supabase SQL Editor

-- Drop old policies (use CASCADE to drop dependent policies if any)
DROP POLICY IF EXISTS "Admins can manage email configurations" ON email_configurations CASCADE;
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates CASCADE;
DROP POLICY IF EXISTS "Admins can view email logs" ON email_logs CASCADE;
DROP POLICY IF EXISTS "System can insert email logs" ON email_logs CASCADE;
DROP POLICY IF EXISTS "Admins can manage incoming emails" ON incoming_emails CASCADE;
DROP POLICY IF EXISTS "System can insert incoming emails" ON incoming_emails CASCADE;
DROP POLICY IF EXISTS "Admins can manage auto-reply rules" ON auto_reply_rules CASCADE;

-- Create new policies using has_role() function (same pattern as other admin tables)
CREATE POLICY "Admins can manage email configurations"
  ON email_configurations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- System can insert email logs (keep this one)
-- This policy should already exist, but ensure it's there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_logs' 
    AND policyname = 'System can insert email logs'
  ) THEN
    CREATE POLICY "System can insert email logs"
      ON email_logs FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

CREATE POLICY "Admins can manage incoming emails"
  ON incoming_emails FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- System can insert incoming emails (keep this one)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'incoming_emails' 
    AND policyname = 'System can insert incoming emails'
  ) THEN
    CREATE POLICY "System can insert incoming emails"
      ON incoming_emails FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

CREATE POLICY "Admins can manage auto-reply rules"
  ON auto_reply_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

