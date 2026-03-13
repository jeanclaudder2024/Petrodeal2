
-- 1. Create verification_eligible_companies table
CREATE TABLE IF NOT EXISTS public.verification_eligible_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id integer REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  added_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.verification_eligible_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on eligible companies" 
  ON public.verification_eligible_companies 
  FOR ALL 
  TO authenticated 
  USING (public.is_admin());

CREATE POLICY "Authenticated can read eligible companies" 
  ON public.verification_eligible_companies 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- 2. Update generate_broker_unique_id to use random 6-digit numbers
CREATE OR REPLACE FUNCTION public.generate_broker_unique_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  random_id INTEGER;
  new_id TEXT;
BEGIN
  LOOP
    random_id := 100000 + floor(random() * 900000)::INTEGER;
    new_id := 'PDH-BRK-' || random_id::TEXT;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.broker_profiles WHERE broker_unique_id = new_id
    );
  END LOOP;
  NEW.broker_unique_id := new_id;
  RETURN NEW;
END;
$$;
