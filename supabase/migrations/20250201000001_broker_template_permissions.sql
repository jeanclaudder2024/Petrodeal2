-- Migration: Create broker_template_permissions table
-- This table manages template access and per-template download limits for broker memberships

-- Create broker_template_permissions table
CREATE TABLE IF NOT EXISTS public.broker_template_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_membership_id UUID NOT NULL REFERENCES public.broker_memberships(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  can_download BOOLEAN DEFAULT true, -- If false, broker can view but not download
  max_downloads_per_template INTEGER DEFAULT NULL, -- NULL means unlimited for this template
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(broker_membership_id, template_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_broker_template_permissions_membership_id 
ON public.broker_template_permissions(broker_membership_id);

CREATE INDEX IF NOT EXISTS idx_broker_template_permissions_template_id 
ON public.broker_template_permissions(template_id);

CREATE INDEX IF NOT EXISTS idx_broker_template_permissions_template_limit 
ON public.broker_template_permissions(broker_membership_id, template_id, max_downloads_per_template);

-- Enable RLS
ALTER TABLE public.broker_template_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active permissions (for checking what they can download)
DROP POLICY IF EXISTS "Anyone can view broker template permissions" ON public.broker_template_permissions;
CREATE POLICY "Anyone can view broker template permissions" 
ON public.broker_template_permissions 
FOR SELECT 
USING (true);

-- Policy: Admins can manage all permissions
DROP POLICY IF EXISTS "Admins can manage broker template permissions" ON public.broker_template_permissions;
CREATE POLICY "Admins can manage broker template permissions" 
ON public.broker_template_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_broker_template_permissions_updated_at ON public.broker_template_permissions;
CREATE TRIGGER update_broker_template_permissions_updated_at
BEFORE UPDATE ON public.broker_template_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.broker_template_permissions IS 
'Manages template access and per-template download limits for broker memberships. Each broker membership can have different templates and different download limits per template.';

