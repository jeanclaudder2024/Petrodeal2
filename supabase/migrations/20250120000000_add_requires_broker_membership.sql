-- Add requires_broker_membership column to document_templates table
ALTER TABLE public.document_templates 
ADD COLUMN IF NOT EXISTS requires_broker_membership BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.document_templates.requires_broker_membership IS 'If true, only users with broker membership can download this template';

