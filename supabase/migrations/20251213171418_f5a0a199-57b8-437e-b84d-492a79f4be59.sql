-- Phase 3: Email Marketing Campaigns table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email_account_id UUID REFERENCES public.email_accounts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  html_content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign recipients table
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  placeholders JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'opened', 'bounced')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 4: Deal step templates table
CREATE TABLE IF NOT EXISTS public.deal_step_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT,
  requires_file BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_step_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_campaigns
CREATE POLICY "Admins can manage all campaigns" ON public.email_campaigns
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for campaign_recipients  
CREATE POLICY "Admins can manage all recipients" ON public.campaign_recipients
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for deal_step_templates
CREATE POLICY "Admins can manage deal step templates" ON public.deal_step_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active deal step templates" ON public.deal_step_templates
  FOR SELECT USING (is_active = true);

-- Insert default deal step templates from existing hardcoded values
INSERT INTO public.deal_step_templates (step_number, step_name, step_description, requires_file, is_active)
VALUES
  (1, 'Buyer Acceptance', 'Buyer accepts soft corporate offer and seller''s procedure. Issues official ICPO addressed to the end seller.', true, true),
  (2, 'Contract Signing', 'Seller issues draft contract (SPA). Buyer signs and returns it. Seller legalizes it via Ministry of Energy at seller''s cost.', true, true),
  (3, 'PPOP Documents Released', 'Seller sends partial Proof of Product (PPOP) documents: Refinery Commitment, Certificate of Origin, Quality & Quantity Report, Product Availability Statement, Export License.', true, true),
  (4, 'Buyer Issues Bank Instrument', 'Buyer issues DLC MT700 or SBLC MT760 within 7 working days. If not, buyer sends 1% guarantee deposit to secure the deal.', true, true),
  (5, 'Full POP + 2% PB', 'Seller releases full POP + 2% PB upon instrument confirmation or guarantee deposit. Documents include: License to Export, Transnet Contract, Charter Party Agreement, Bill of Lading, SGS Report, Title Transfer, etc.', true, true),
  (6, 'Shipment Begins', 'Shipment begins according to contract. Estimated time to buyer''s port: 21–28 days.', false, true),
  (7, 'Final Inspection & Payment', 'Buyer conducts SGS/CIQ at discharge port. After confirmation, payment is released via MT103/TT within 3 banking days.', true, true),
  (8, 'Intermediary Commissions', 'Seller pays commission to all intermediaries within 2–4 days of receiving final payment.', false, true)
ON CONFLICT DO NOTHING;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_email_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_campaigns_timestamp
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_campaigns_updated_at();

CREATE TRIGGER update_deal_step_templates_timestamp
  BEFORE UPDATE ON public.deal_step_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_campaigns_updated_at();