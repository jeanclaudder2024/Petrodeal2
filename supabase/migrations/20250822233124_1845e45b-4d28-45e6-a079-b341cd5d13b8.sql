-- First, let's backup existing data and update table structures

-- Update companies table to use integer ID
DROP TABLE IF EXISTS public.companies_backup;
CREATE TABLE public.companies_backup AS SELECT * FROM public.companies;

-- Create new companies table with integer ID
DROP TABLE public.companies CASCADE;
CREATE TABLE public.companies (
  id serial PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Update ports table to use integer ID  
DROP TABLE IF EXISTS public.ports_backup;
CREATE TABLE public.ports_backup AS SELECT * FROM public.ports;

-- Create new ports table with integer ID
DROP TABLE public.ports CASCADE;
CREATE TABLE public.ports (
  id serial PRIMARY KEY,
  name text,
  country text,
  region text,
  port_type text,
  description text,
  facilities text,
  type text,
  status text,
  city text,
  timezone text,
  port_authority text,
  operator text,
  owner text,
  email text,
  phone text,
  website text,
  address text,
  postal_code text,
  operating_hours text,
  services text,
  cargo_types text,
  security_level text,
  environmental_certifications text,
  tug_assistance boolean,
  lat numeric,
  lng numeric,
  capacity bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone,
  annual_throughput bigint,
  max_vessel_length numeric,
  max_vessel_beam numeric,
  max_draught numeric,
  max_deadweight bigint,
  berth_count integer,
  terminal_count integer,
  channel_depth numeric,
  berth_depth numeric,
  anchorage_depth numeric,
  pilotage_required boolean,
  established integer,
  total_cargo bigint,
  vessel_count integer,
  port_charges numeric,
  tidal_range numeric,
  average_wait_time numeric,
  airport_distance numeric,
  road_connection boolean,
  rail_connection boolean,
  free_trade_zone boolean,
  customs_office boolean,
  quarantine_station boolean,
  photo text,
  nearby_ports text,
  connected_refineries text,
  currency text,
  weather_restrictions text,
  next_inspection date,
  last_inspection date
);

-- Backup existing vessels data
DROP TABLE IF EXISTS public.vessels_backup;
CREATE TABLE public.vessels_backup AS SELECT * FROM public.vessels;