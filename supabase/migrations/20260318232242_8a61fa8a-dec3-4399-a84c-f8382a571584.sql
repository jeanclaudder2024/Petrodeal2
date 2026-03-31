
-- Add new columns to imfpa_agreements
ALTER TABLE public.imfpa_agreements ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.imfpa_agreements ADD COLUMN IF NOT EXISTS assigned_to_broker_id uuid;

-- Create IMFPA status history table for audit trail
CREATE TABLE IF NOT EXISTS public.imfpa_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imfpa_id uuid REFERENCES public.imfpa_agreements(imfpa_id) ON DELETE CASCADE NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.imfpa_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for imfpa_status_history
CREATE POLICY "Admins can manage imfpa status history" ON public.imfpa_status_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own imfpa status history" ON public.imfpa_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.imfpa_agreements ia
      JOIN public.broker_deals bd ON ia.deal_id = bd.id
      JOIN public.broker_profiles bp ON bd.broker_id = bp.id
      WHERE ia.imfpa_id = imfpa_status_history.imfpa_id
      AND bp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.imfpa_agreements ia
      WHERE ia.imfpa_id = imfpa_status_history.imfpa_id
      AND ia.assigned_to_broker_id IN (
        SELECT id FROM public.broker_profiles WHERE user_id = auth.uid()
      )
    )
  );
