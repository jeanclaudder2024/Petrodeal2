
-- Table 1: referral_members
CREATE TABLE public.referral_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  bank_name text,
  bank_swift text,
  bank_account text,
  bank_holder_name text,
  total_earned numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  pending_balance numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table 2: referral_promo_codes
CREATE TABLE public.referral_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_member_id uuid NOT NULL REFERENCES public.referral_members(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  code_type text NOT NULL DEFAULT 'platform_subscription',
  status text NOT NULL DEFAULT 'pending',
  bonus_amount numeric NOT NULL DEFAULT 0,
  bonus_type text NOT NULL DEFAULT 'fixed',
  usage_count integer NOT NULL DEFAULT 0,
  max_uses integer,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table 3: referral_conversions
CREATE TABLE public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.referral_promo_codes(id) ON DELETE CASCADE,
  referral_member_id uuid NOT NULL REFERENCES public.referral_members(id) ON DELETE CASCADE,
  subscriber_user_id uuid,
  subscriber_email text,
  subscription_type text NOT NULL DEFAULT 'platform_subscription',
  subscription_amount numeric NOT NULL DEFAULT 0,
  bonus_earned numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table 4: referral_payout_requests
CREATE TABLE public.referral_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_member_id uuid NOT NULL REFERENCES public.referral_members(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS: referral_members
CREATE POLICY "Admins can manage all referral members"
  ON public.referral_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own referral membership"
  ON public.referral_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own bank details"
  ON public.referral_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS: referral_promo_codes
CREATE POLICY "Admins can manage all promo codes"
  ON public.referral_promo_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view own promo codes"
  ON public.referral_promo_codes FOR SELECT TO authenticated
  USING (referral_member_id IN (SELECT id FROM public.referral_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can insert own promo codes"
  ON public.referral_promo_codes FOR INSERT TO authenticated
  WITH CHECK (referral_member_id IN (SELECT id FROM public.referral_members WHERE user_id = auth.uid()));

-- RLS: referral_conversions
CREATE POLICY "Admins can manage all conversions"
  ON public.referral_conversions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view own conversions"
  ON public.referral_conversions FOR SELECT TO authenticated
  USING (referral_member_id IN (SELECT id FROM public.referral_members WHERE user_id = auth.uid()));

-- RLS: referral_payout_requests
CREATE POLICY "Admins can manage all payout requests"
  ON public.referral_payout_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view own payout requests"
  ON public.referral_payout_requests FOR SELECT TO authenticated
  USING (referral_member_id IN (SELECT id FROM public.referral_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can insert own payout requests"
  ON public.referral_payout_requests FOR INSERT TO authenticated
  WITH CHECK (referral_member_id IN (SELECT id FROM public.referral_members WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_referral_members_updated_at
  BEFORE UPDATE ON public.referral_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
