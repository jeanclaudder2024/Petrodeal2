-- Fix deal_steps status to include 'not_started' status
-- This addresses the issue where steps were showing as completed when they should be not_started

ALTER TABLE public.deal_steps 
DROP CONSTRAINT IF EXISTS deal_steps_status_check;

ALTER TABLE public.deal_steps 
ADD CONSTRAINT deal_steps_status_check 
CHECK (status IN ('not_started', 'pending', 'completed', 'failed', 'rejected'));

-- Update any existing steps that might have invalid status
UPDATE public.deal_steps 
SET status = 'not_started' 
WHERE status NOT IN ('not_started', 'pending', 'completed', 'failed', 'rejected');