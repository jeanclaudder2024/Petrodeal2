-- Create vessels table with all detailed fields
CREATE TABLE public.vessels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    mmsi TEXT,                         -- Maritime Mobile Service Identity
    imo TEXT,                          -- International Maritime Organization number
    vessel_type TEXT,                  -- Tanker, cargo, etc.
    flag TEXT,                         -- Vessel flag (country)
    built INTEGER,                     -- Year built
    deadweight INTEGER,                -- Deadweight tonnage (DWT)
    cargo_capacity INTEGER,            -- Max cargo capacity
    current_lat NUMERIC(10,6),
    current_lng NUMERIC(10,6),
    speed NUMERIC(5,2),                -- Speed in knots
    status TEXT,                       -- Current vessel status
    departure_port TEXT,
    destination_port TEXT,
    departure_date TIMESTAMP WITH TIME ZONE,
    arrival_date TIMESTAMP WITH TIME ZONE,
    eta TIMESTAMP WITH TIME ZONE,      -- Estimated Time of Arrival
    company_id UUID,
    cargo_type TEXT,
    cargo_quantity NUMERIC(15,2),
    oil_source TEXT,
    route_info TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    departure_lat NUMERIC(10,6),
    departure_lng NUMERIC(10,6),
    destination_lat NUMERIC(10,6),
    destination_lng NUMERIC(10,6),
    buyer_name TEXT,
    seller_name TEXT,
    owner_name TEXT,
    operator_name TEXT,
    last_updated TIMESTAMP WITH TIME ZONE,
    current_region TEXT,
    oil_type TEXT,
    quantity NUMERIC(15,2),
    deal_value NUMERIC(20,2),
    loading_port TEXT,
    price NUMERIC(20,2),
    market_price NUMERIC(20,2),
    source_company TEXT,
    target_refinery TEXT,
    shipping_type TEXT,
    route_distance NUMERIC(10,2),
    callsign TEXT,
    course NUMERIC(6,2),
    nav_status TEXT,
    draught NUMERIC(5,2),
    length NUMERIC(6,2),
    width NUMERIC(6,2),
    engine_power INTEGER,
    fuel_consumption NUMERIC(10,2),
    crew_size INTEGER,
    gross_tonnage INTEGER,
    dealvalue NUMERIC(20,2),           -- (duplicate of deal_value, may need cleanup)
    marketprice NUMERIC(20,2),         -- (duplicate of market_price)
    routedistance NUMERIC(10,2),       -- (duplicate of route_distance)
    currentport TEXT,
    vesselstatus TEXT,
    destination TEXT,
    beam NUMERIC(6,2),                 -- duplicate of width (beam = width)
    draft NUMERIC(6,2)                 -- duplicate of draught
);

-- Enable Row Level Security
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;

-- Create policies for vessel access
CREATE POLICY "Authenticated users can view vessels" 
ON public.vessels 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert vessels" 
ON public.vessels 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update vessels" 
ON public.vessels 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete vessels" 
ON public.vessels 
FOR DELETE 
TO authenticated
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_vessels_updated_at
BEFORE UPDATE ON public.vessels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample vessel data
INSERT INTO public.vessels (
    name, mmsi, imo, vessel_type, flag, built, deadweight, cargo_capacity,
    current_lat, current_lng, speed, status, departure_port, destination_port,
    cargo_type, cargo_quantity, oil_type, current_region, owner_name, operator_name
) VALUES
('Atlantic Voyager', '123456789', 'IMO1234567', 'Oil Tanker', 'Liberia', 2015, 120000, 110000,
 25.2048, 55.2708, 12.5, 'At Sea', 'Houston TX', 'Rotterdam', 
 'Crude Oil', 95000.50, 'Brent Crude', 'Gulf of Mexico', 'Maritime Corp', 'Ocean Shipping Ltd'),
('Pacific Star', '987654321', 'IMO7654321', 'Product Tanker', 'Panama', 2018, 75000, 68000,
 51.5074, -0.1278, 8.2, 'Anchored', 'Singapore', 'London', 
 'Refined Products', 52000.75, 'Diesel', 'North Sea', 'Global Maritime', 'Star Operations'),
('Gulf Pioneer', '456789123', 'IMO4567891', 'VLCC', 'Marshall Islands', 2020, 320000, 300000,
 29.3117, 47.4818, 15.8, 'Loading', 'Kuwait', 'Shanghai', 
 'Crude Oil', 280000.00, 'Arabian Light', 'Persian Gulf', 'Pioneer Shipping', 'Gulf Maritime'),
('Nordic Wind', '789123456', 'IMO7891234', 'Aframax', 'Norway', 2017, 115000, 105000,
 60.1699, 24.9384, 11.3, 'Discharging', 'Stavanger', 'Helsinki', 
 'Crude Oil', 98000.25, 'North Sea Crude', 'Baltic Sea', 'Nordic Fleet', 'Wind Maritime'),
('Arabian Pearl', '321654987', 'IMO3216549', 'Suezmax', 'UAE', 2019, 165000, 155000,
 25.276987, 55.296249, 13.7, 'En Route', 'Dubai', 'Marseille', 
 'Crude Oil', 145000.80, 'Dubai Crude', 'Arabian Sea', 'Pearl Shipping', 'Arabian Maritime'),
('Mediterranean Queen', '654987321', 'IMO6549873', 'Product Tanker', 'Greece', 2016, 55000, 48000,
 35.9375, 14.3754, 9.4, 'Berthed', 'Trieste', 'Algiers', 
 'Refined Products', 42000.60, 'Gasoline', 'Mediterranean', 'Queen Maritime', 'Med Shipping Co');