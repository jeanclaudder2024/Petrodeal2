-- Corrected deal_steps table structure with proper constraints and indexes
-- This file contains the complete table structure you need for the deal_steps functionality

-- Drop existing table if you need to recreate it (CAUTION: This will delete all data)
-- DROP TABLE IF EXISTS public.deal_steps CASCADE;

-- Create the deal_steps table with proper structure
CREATE TABLE IF NOT EXISTS public.deal_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.broker_deals(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT,
  status TEXT DEFAULT 'not_started' NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add proper status constraint
ALTER TABLE public.deal_steps 
DROP CONSTRAINT IF EXISTS deal_steps_status_check;

ALTER TABLE public.deal_steps 
ADD CONSTRAINT deal_steps_status_check 
CHECK (status IN ('not_started', 'pending', 'completed', 'failed', 'rejected'));

-- Add unique constraint to prevent duplicate step numbers per deal
ALTER TABLE public.deal_steps 
DROP CONSTRAINT IF EXISTS deal_steps_unique_step_per_deal;

ALTER TABLE public.deal_steps 
ADD CONSTRAINT deal_steps_unique_step_per_deal 
UNIQUE (deal_id, step_number);

-- Add constraint to ensure step_number is positive
ALTER TABLE public.deal_steps 
DROP CONSTRAINT IF EXISTS deal_steps_step_number_positive;

ALTER TABLE public.deal_steps 
ADD CONSTRAINT deal_steps_step_number_positive 
CHECK (step_number > 0);

-- Add constraint to ensure completed_at is set when status is completed
ALTER TABLE public.deal_steps 
DROP CONSTRAINT IF EXISTS deal_steps_completed_at_check;

ALTER TABLE public.deal_steps 
ADD CONSTRAINT deal_steps_completed_at_check 
CHECK (
  (status = 'completed' AND completed_at IS NOT NULL) OR 
  (status != 'completed')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deal_steps_deal_id ON public.deal_steps(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_steps_status ON public.deal_steps(status);
CREATE INDEX IF NOT EXISTS idx_deal_steps_step_number ON public.deal_steps(step_number);
CREATE INDEX IF NOT EXISTS idx_deal_steps_deal_step ON public.deal_steps(deal_id, step_number);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deal_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_deal_steps_updated_at ON public.deal_steps;
CREATE TRIGGER trigger_update_deal_steps_updated_at
  BEFORE UPDATE ON public.deal_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_steps_updated_at();

-- Enable Row Level Security
ALTER TABLE public.deal_steps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view deal steps" ON public.deal_steps;
DROP POLICY IF EXISTS "Admins can manage deal steps" ON public.deal_steps;
DROP POLICY IF EXISTS "Brokers can manage their deal steps" ON public.deal_steps;

-- Create RLS policies
CREATE POLICY "Users can view deal steps" ON public.deal_steps
  FOR SELECT USING (
    deal_id IN (
      SELECT bd.id FROM public.broker_deals bd
      JOIN public.broker_profiles bp ON bd.broker_id = bp.id
      WHERE bp.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Brokers can manage their deal steps" ON public.deal_steps
  FOR ALL USING (
    deal_id IN (
      SELECT bd.id FROM public.broker_deals bd
      JOIN public.broker_profiles bp ON bd.broker_id = bp.id
      WHERE bp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all deal steps" ON public.deal_steps
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default steps for existing deals that don't have steps
-- (Run this only if you have existing deals without steps)
/*
INSERT INTO public.deal_steps (deal_id, step_number, step_name, step_description, status)
SELECT 
  bd.id as deal_id,
  step_data.step_number,
  step_data.step_name,
  step_data.step_description,
  CASE WHEN step_data.step_number = 1 THEN 'pending' ELSE 'not_started' END as status
FROM public.broker_deals bd
CROSS JOIN (
  VALUES 
    (1, 'Buyer Acceptance', 'Buyer accepts soft corporate offer and seller''s procedure. Issues official ICPO addressed to the end seller.'),
    (2, 'Contract Signing', 'Seller issues draft contract (SPA). Buyer signs and returns it. Seller legalizes it via Ministry of Energy at seller''s cost.'),
    (3, 'PPOP Documents Released', 'Seller sends partial Proof of Product (PPOP) documents: Refinery Commitment, Certificate of Origin, Quality & Quantity Report, Product Availability Statement, Export License.'),
    (4, 'Buyer Issues Bank Instrument', 'Buyer issues DLC MT700 or SBLC MT760 within 7 working days. If not, buyer sends 1% guarantee deposit to secure the deal.'),
    (5, 'Full POP + 2% PB', 'Seller releases full POP + 2% PB upon instrument confirmation or guarantee deposit. Documents include: License to Export, Transnet Contract, Charter Party Agreement, Bill of Lading, SGS Report, Title Transfer, etc.'),
    (6, 'Shipment Begins', 'Shipment begins according to contract. Estimated time to buyer''s port: 21–28 days.'),
    (7, 'Final Inspection & Payment', 'Buyer conducts SGS/CIQ at discharge port. After confirmation, payment is released via MT103/TT within 3 banking days.'),
    (8, 'Intermediary Commissions', 'Seller pays commission to all intermediaries within 2–4 days of receiving final payment.')
) AS step_data(step_number, step_name, step_description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.deal_steps ds 
  WHERE ds.deal_id = bd.id
);
*/

-- Update any existing steps that might have invalid status
UPDATE public.deal_steps 
SET status = 'not_started' 
WHERE status NOT IN ('not_started', 'pending', 'completed', 'failed', 'rejected');

-- Comments explaining the table structure:
-- 
-- COLUMNS:
-- - id: Primary key (UUID)
-- - deal_id: Foreign key to broker_deals table
-- - step_number: Sequential step number (1-8)
-- - step_name: Name of the step
-- - step_description: Detailed description of what needs to be done
-- - status: Current status of the step (not_started, pending, completed, failed, rejected)
-- - completed_at: Timestamp when step was completed (required when status is 'completed')
-- - notes: Optional notes from the broker
-- - file_url: URL to uploaded document for this step
-- - created_at: When the step was created
-- - updated_at: When the step was last updated (auto-updated via trigger)
--
-- CONSTRAINTS:
-- - Status must be one of the allowed values
-- - Each deal can only have one step with each step_number
-- - Step numbers must be positive
-- - completed_at must be set when status is 'completed'
--
-- INDEXES:
-- - Performance indexes on commonly queried columns
--
-- RLS POLICIES:
-- - Brokers can only see/manage steps for their own deals
-- - Admins can see/manage all steps
--
-- WORKFLOW:
-- 1. When a deal is created, 8 steps are automatically created
-- 2. Step 1 starts as 'pending', others as 'not_started'
-- 3. When a step is completed, the next step becomes 'pending'
-- 4. Only 'pending' and 'rejected' steps are interactive
-- 5. Completed steps are always visible for reference