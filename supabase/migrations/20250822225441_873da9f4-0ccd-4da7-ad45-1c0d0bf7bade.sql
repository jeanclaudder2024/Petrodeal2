-- Create ports table with all detailed fields
CREATE TABLE public.ports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    country TEXT,
    region TEXT,
    lat NUMERIC(10,6),
    lng NUMERIC(10,6),
    port_type TEXT,
    capacity BIGINT,                      -- throughput capacity
    description TEXT,
    facilities TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    type TEXT,                            -- oil, commercial, etc.
    status TEXT,                          -- active, inactive
    last_updated TIMESTAMP WITH TIME ZONE,
    city TEXT,
    timezone TEXT,
    port_authority TEXT,
    operator TEXT,
    owner TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    postal_code TEXT,
    annual_throughput BIGINT,
    operating_hours TEXT,
    max_vessel_length NUMERIC(10,2),
    max_vessel_beam NUMERIC(10,2),
    max_draught NUMERIC(10,2),
    max_deadweight BIGINT,
    berth_count INTEGER,
    terminal_count INTEGER,
    channel_depth NUMERIC(10,2),
    berth_depth NUMERIC(10,2),
    anchorage_depth NUMERIC(10,2),
    services TEXT,
    cargo_types TEXT,
    security_level TEXT,
    pilotage_required BOOLEAN,
    tug_assistance BOOLEAN,
    quarantine_station BOOLEAN,
    environmental_certifications TEXT,
    customs_office BOOLEAN,
    free_trade_zone BOOLEAN,
    rail_connection BOOLEAN,
    road_connection BOOLEAN,
    airport_distance NUMERIC(10,2),
    average_wait_time NUMERIC(10,2),
    weather_restrictions TEXT,
    tidal_range NUMERIC(10,2),
    port_charges NUMERIC(15,2),
    currency TEXT,
    connected_refineries TEXT,
    nearby_ports TEXT,
    vessel_count INTEGER,
    total_cargo BIGINT,
    established INTEGER,
    last_inspection DATE,
    next_inspection DATE,
    photo TEXT
);

-- Enable Row Level Security
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;

-- Create policies for port access
CREATE POLICY "Authenticated users can view ports" 
ON public.ports 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert ports" 
ON public.ports 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update ports" 
ON public.ports 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete ports" 
ON public.ports 
FOR DELETE 
TO authenticated
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_ports_updated_at
BEFORE UPDATE ON public.ports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample port data
INSERT INTO public.ports (
    name, country, region, lat, lng, port_type, capacity, description, 
    type, status, city, timezone, port_authority, operator, owner,
    annual_throughput, max_vessel_length, max_vessel_beam, max_draught,
    berth_count, terminal_count, channel_depth, berth_depth,
    cargo_types, security_level, pilotage_required, tug_assistance,
    customs_office, rail_connection, road_connection, vessel_count,
    established, port_charges, currency
) VALUES
('Port of Rotterdam', 'Netherlands', 'Europe', 51.9225, 4.4792, 'Commercial', 469000000, 
 'Largest port in Europe, major oil and petrochemical hub', 'Oil & Commercial', 'Active',
 'Rotterdam', 'CET', 'Port of Rotterdam Authority', 'Havenbedrijf Rotterdam N.V.', 'Port of Rotterdam Authority',
 469000000, 400.0, 59.0, 24.0, 85, 12, 24.0, 23.0,
 'Crude Oil, Refined Products, Containers, Bulk Cargo', 'ISPS Level 1', true, true,
 true, true, true, 142, 1872, 2500.00, 'EUR'),

('Port of Houston', 'United States', 'North America', 29.7604, -95.3698, 'Oil Terminal', 285000000,
 'Largest petrochemical port in the US, major oil refining center', 'Oil & Petrochemical', 'Active',
 'Houston', 'CST', 'Port of Houston Authority', 'Port Houston', 'Port of Houston Authority',
 285000000, 366.0, 45.7, 13.7, 78, 8, 13.7, 12.8,
 'Crude Oil, Refined Products, Petrochemicals, LNG', 'ISPS Level 1', true, true,
 true, true, true, 98, 1914, 1800.00, 'USD'),

('Port of Singapore', 'Singapore', 'Asia Pacific', 1.2966, 103.8518, 'Multi-Purpose', 630000000,
 'Worlds busiest transshipment hub and major oil trading center', 'Commercial & Oil', 'Active',
 'Singapore', 'SGT', 'Maritime and Port Authority of Singapore', 'PSA Singapore', 'PSA International',
 630000000, 400.0, 58.0, 25.0, 95, 15, 25.0, 18.0,
 'Containers, Crude Oil, Refined Products, Chemicals', 'ISPS Level 1', true, true,
 true, true, true, 156, 1819, 3200.00, 'SGD'),

('Port of Antwerp', 'Belgium', 'Europe', 51.2194, 4.4025, 'Petrochemical', 235000000,
 'Major European petrochemical cluster and oil refining hub', 'Oil & Petrochemical', 'Active',
 'Antwerp', 'CET', 'Antwerp Port Authority', 'Port of Antwerp-Bruges', 'Antwerp Port Authority',
 235000000, 350.0, 45.0, 17.5, 68, 9, 17.5, 16.8,
 'Crude Oil, Refined Products, Petrochemicals, Containers', 'ISPS Level 1', true, true,
 true, true, true, 89, 1803, 2100.00, 'EUR'),

('Ras Tanura Terminal', 'Saudi Arabia', 'Middle East', 26.7056, 50.1664, 'Oil Terminal', 180000000,
 'Major crude oil export terminal operated by Saudi Aramco', 'Crude Oil Export', 'Active',
 'Ras Tanura', 'AST', 'Saudi Ports Authority', 'Saudi Aramco', 'Saudi Aramco',
 180000000, 450.0, 68.0, 30.0, 15, 3, 30.0, 28.0,
 'Crude Oil, Refined Products', 'ISPS Level 2', true, true,
 true, false, true, 45, 1945, 1200.00, 'SAR'),

('Port of Fujairah', 'UAE', 'Middle East', 25.1212, 56.3261, 'Oil Terminal', 95000000,
 'Strategic oil storage and bunkering hub outside the Strait of Hormuz', 'Oil Storage & Bunkering', 'Active',
 'Fujairah', 'GST', 'Fujairah Port Authority', 'Port of Fujairah', 'Fujairah Port Authority',
 95000000, 380.0, 55.0, 22.0, 28, 6, 22.0, 20.0,
 'Crude Oil, Marine Fuel Oil, Bunkering', 'ISPS Level 1', true, true,
 true, false, true, 67, 1978, 1500.00, 'AED');