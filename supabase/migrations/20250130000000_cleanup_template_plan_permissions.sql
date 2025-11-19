-- Cleanup script: Remove existing objects before migration
-- Run this BEFORE running 20250130000001_template_plan_permissions.sql if you encounter conflicts

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_plan_template_permissions_updated_at ON public.plan_template_permissions CASCADE;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Anyone can view plan template permissions" ON public.plan_template_permissions;
DROP POLICY IF EXISTS "Admins can manage plan template permissions" ON public.plan_template_permissions;
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.user_document_downloads;
DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.user_document_downloads;
DROP POLICY IF EXISTS "Admins can view all downloads" ON public.user_document_downloads;

-- Note: We do NOT drop functions or tables here, only triggers and policies
-- The main migration will handle functions with CREATE OR REPLACE

