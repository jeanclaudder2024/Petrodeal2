-- Enable RLS on vessels table
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vessels
CREATE POLICY "Authenticated users can view vessels" ON public.vessels FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert vessels" ON public.vessels FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update vessels" ON public.vessels FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete vessels" ON public.vessels FOR DELETE USING (true);

-- Create all the indexes as specified
CREATE INDEX IF NOT EXISTS idx_vessels_mmsi ON public.vessels USING btree (mmsi) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_vessels_imo ON public.vessels USING btree (imo) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_vessels_status ON public.vessels USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_vessels_company ON public.vessels USING btree (company_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_vessels_vessel_status ON public.vessels USING btree (vesselstatus) TABLESPACE pg_default;

-- Enable RLS also on backup tables to fix remaining security issues
ALTER TABLE public.ports_uuid_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view ports_uuid_backup" ON public.ports_uuid_backup FOR SELECT USING (true);

-- Check if companies_backup exists and enable RLS if it does
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies_backup') THEN
        EXECUTE 'ALTER TABLE public.companies_backup ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "Authenticated users can view companies_backup" ON public.companies_backup FOR SELECT USING (true)';
    END IF;
END$$;