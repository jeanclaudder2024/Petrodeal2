-- First, let's check if companies table exists, if not create it
CREATE TABLE IF NOT EXISTS public.companies (
  id serial PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create a new vessels table with the desired structure
DROP TABLE IF EXISTS public.vessels_new;
CREATE TABLE public.vessels_new (
  id serial NOT NULL,
  name character varying(255) NOT NULL,
  mmsi character varying(20) NULL,
  imo character varying(20) NULL,
  vessel_type character varying(100) NULL,
  flag character varying(100) NULL,
  built integer NULL,
  deadweight integer NULL,
  cargo_capacity integer NULL,
  current_lat numeric(10, 8) NULL,
  current_lng numeric(11, 8) NULL,
  speed character varying(20) NULL,
  status character varying(100) NULL,
  departure_port integer NULL,
  destination_port integer NULL,
  departure_date timestamp without time zone NULL,
  arrival_date timestamp without time zone NULL,
  eta timestamp without time zone NULL,
  company_id integer NULL,
  cargo_type character varying(100) NULL,
  cargo_quantity integer NULL,
  oil_source character varying(100) NULL,
  route_info text NULL,
  metadata jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  departure_lat numeric(10, 6) NULL,
  departure_lng numeric(10, 6) NULL,
  destination_lat numeric(10, 6) NULL,
  destination_lng numeric(10, 6) NULL,
  buyer_name text NULL DEFAULT 'NA'::text,
  seller_name text NULL,
  owner_name text NULL,
  operator_name text NULL,
  last_updated timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP,
  current_region text NULL,
  oil_type text NULL,
  quantity numeric(15, 2) NULL,
  deal_value numeric(15, 2) NULL,
  loading_port text NULL,
  price numeric(15, 2) NULL,
  market_price numeric(15, 2) NULL,
  source_company text NULL,
  target_refinery text NULL,
  shipping_type text NULL,
  route_distance numeric(10, 2) NULL,
  callsign text NULL,
  course integer NULL,
  nav_status text NULL,
  draught numeric(5, 2) NULL,
  length numeric(8, 2) NULL,
  width numeric(6, 2) NULL,
  engine_power integer NULL,
  fuel_consumption numeric(8, 2) NULL,
  crew_size integer NULL,
  gross_tonnage integer NULL,
  dealvalue text NULL,
  marketprice text NULL,
  routedistance text NULL,
  currentport text NULL,
  vesselstatus text NULL,
  destination text NULL,
  beam text NULL,
  draft text NULL,
  CONSTRAINT vessels_new_pkey PRIMARY KEY (id)
);

-- Copy existing data from old vessels table to new one
INSERT INTO public.vessels_new (
  name, mmsi, imo, vessel_type, flag, built, deadweight, cargo_capacity,
  current_lat, current_lng, speed, status, cargo_type, cargo_quantity,
  oil_source, route_info, metadata, created_at, updated_at,
  departure_lat, departure_lng, destination_lat, destination_lng,
  buyer_name, seller_name, owner_name, operator_name, last_updated,
  current_region, oil_type, quantity, deal_value, loading_port,
  price, market_price, source_company, target_refinery, shipping_type,
  route_distance, callsign, nav_status, draught, length, width,
  engine_power, fuel_consumption, crew_size, gross_tonnage,
  currentport, vesselstatus, destination, beam, draft
)
SELECT 
  name, mmsi, imo, vessel_type, flag, built, deadweight, cargo_capacity,
  current_lat, current_lng, 
  CASE WHEN speed IS NOT NULL THEN speed::text ELSE NULL END,
  status, cargo_type, 
  CASE WHEN cargo_quantity IS NOT NULL THEN cargo_quantity::integer ELSE NULL END,
  oil_source, route_info, metadata, created_at, updated_at,
  departure_lat, departure_lng, destination_lat, destination_lng,
  buyer_name, seller_name, owner_name, operator_name, last_updated,
  current_region, oil_type, quantity, deal_value, loading_port,
  price, market_price, source_company, target_refinery, shipping_type,
  routedistance, callsign, nav_status, draught, length, width,
  engine_power, fuel_consumption, crew_size, gross_tonnage,
  currentport, vesselstatus, destination, 
  CASE WHEN beam IS NOT NULL THEN beam::text ELSE NULL END,
  CASE WHEN draft IS NOT NULL THEN draft::text ELSE NULL END
FROM public.vessels;

-- Drop old table and rename new one
DROP TABLE public.vessels;
ALTER TABLE public.vessels_new RENAME TO vessels;

-- Add constraints
ALTER TABLE public.vessels ADD CONSTRAINT vessels_imo_key UNIQUE (imo);
ALTER TABLE public.vessels ADD CONSTRAINT vessels_mmsi_key UNIQUE (mmsi);

-- Add foreign key constraints (commented out since ports table structure might be different)
-- ALTER TABLE public.vessels ADD CONSTRAINT vessels_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id);
-- ALTER TABLE public.vessels ADD CONSTRAINT vessels_departure_port_fkey FOREIGN KEY (departure_port) REFERENCES ports (id);
-- ALTER TABLE public.vessels ADD CONSTRAINT vessels_destination_port_fkey FOREIGN KEY (destination_port) REFERENCES ports (id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vessels_mmsi ON public.vessels USING btree (mmsi);
CREATE INDEX IF NOT EXISTS idx_vessels_imo ON public.vessels USING btree (imo);
CREATE INDEX IF NOT EXISTS idx_vessels_status ON public.vessels USING btree (status);
CREATE INDEX IF NOT EXISTS idx_vessels_company ON public.vessels USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_vessels_vessel_status ON public.vessels USING btree (vesselstatus);

-- Enable RLS
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Authenticated users can view vessels" ON public.vessels FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert vessels" ON public.vessels FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update vessels" ON public.vessels FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete vessels" ON public.vessels FOR DELETE USING (true);