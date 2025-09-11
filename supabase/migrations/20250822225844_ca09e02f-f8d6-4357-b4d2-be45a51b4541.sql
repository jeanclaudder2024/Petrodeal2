-- Create refineries table with all detailed fields
CREATE TABLE public.refineries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    country TEXT,
    region TEXT,
    lat NUMERIC(10,6),
    lng NUMERIC(10,6),
    capacity BIGINT,                          -- barrels per day or tonnes
    products TEXT,                            -- fuels/chemicals produced
    description TEXT,
    processing_capacity BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    type TEXT,                                -- Crude Oil Refinery, etc.
    status TEXT,                              -- Operational, Idle, etc.
    last_updated TIMESTAMP WITH TIME ZONE,
    operator TEXT,
    owner TEXT,
    year_built INTEGER,
    last_maintenance DATE,
    next_maintenance DATE,
    complexity TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    technical_specs TEXT,
    photo TEXT,
    city TEXT,
    utilization NUMERIC(5,2),
    active_vessels INTEGER,
    crude_oil_sources TEXT,
    processing_units TEXT,
    storage_capacity BIGINT,
    pipeline_connections TEXT,
    shipping_terminals TEXT,
    rail_connections TEXT,
    environmental_certifications TEXT,
    fuel_types TEXT,
    refinery_complexity TEXT,
    daily_throughput BIGINT,
    annual_revenue NUMERIC(20,2),
    employees_count INTEGER,
    established_year INTEGER,
    parent_company TEXT,
    safety_rating TEXT,
    environmental_rating TEXT,
    production_capacity BIGINT,
    maintenance_schedule TEXT,
    certifications TEXT,
    compliance_status TEXT,
    market_position TEXT,
    strategic_partnerships TEXT,
    expansion_plans TEXT,
    technology_upgrades TEXT,
    operational_efficiency NUMERIC(5,2),
    supply_chain_partners TEXT,
    distribution_network TEXT,
    financial_performance TEXT,
    investment_plans TEXT,
    sustainability_initiatives TEXT,
    regulatory_compliance TEXT,
    quality_standards TEXT,
    innovation_projects TEXT,
    market_trends TEXT,
    competitive_analysis TEXT,
    future_outlook TEXT,
    safety_record TEXT,
    workforce_size INTEGER,
    annual_throughput BIGINT,
    investment_cost NUMERIC(20,2),
    operating_costs NUMERIC(20,2),
    revenue NUMERIC(20,2),
    profit_margin NUMERIC(5,2),
    market_share NUMERIC(5,2),
    distillation_capacity BIGINT,
    conversion_capacity BIGINT,
    hydrogen_capacity BIGINT,
    sulfur_recovery NUMERIC(10,2),
    octane_rating NUMERIC(5,2),
    diesel_specifications TEXT,
    environmental_compliance TEXT,
    regulatory_status TEXT,
    permits_licenses TEXT,
    inspection_schedule TEXT,
    modernization_projects TEXT,
    technology_partnerships TEXT,
    supply_contracts TEXT,
    efficiency_rating NUMERIC(5,2),
    energy_consumption BIGINT,
    water_usage BIGINT,
    emissions_data TEXT,
    downtime_statistics TEXT,
    nearest_port TEXT,
    nearest_airport TEXT,
    transportation_links TEXT,
    utilities_infrastructure TEXT,
    local_suppliers TEXT,
    competitive_advantages TEXT,
    major_customers TEXT,
    export_markets TEXT,
    domestic_market_share NUMERIC(5,2),
    data_source TEXT,
    last_verified TIMESTAMP WITH TIME ZONE,
    confidence_level NUMERIC(5,2),
    notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.refineries ENABLE ROW LEVEL SECURITY;

-- Create policies for refinery access
CREATE POLICY "Authenticated users can view refineries" 
ON public.refineries 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert refineries" 
ON public.refineries 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update refineries" 
ON public.refineries 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete refineries" 
ON public.refineries 
FOR DELETE 
TO authenticated
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_refineries_updated_at
BEFORE UPDATE ON public.refineries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample refinery data
INSERT INTO public.refineries (
    name, country, region, city, lat, lng, capacity, processing_capacity, 
    description, type, status, operator, owner, year_built, utilization,
    products, fuel_types, complexity, employees_count, annual_throughput,
    storage_capacity, nearest_port, safety_rating, environmental_rating,
    annual_revenue, operational_efficiency, established_year, parent_company
) VALUES
('Saudi Aramco Ras Tanura Refinery', 'Saudi Arabia', 'Middle East', 'Ras Tanura', 
 26.7056, 50.1664, 550000, 550000,
 'One of the worlds largest oil refineries, operated by Saudi Aramco', 
 'Crude Oil Refinery', 'Operational', 'Saudi Aramco', 'Saudi Aramco', 1945, 95.5,
 'Gasoline, Diesel, Jet Fuel, Heavy Fuel Oil, Asphalt', 'Gasoline, Diesel, Jet Fuel, Bunker Fuel',
 'High Complexity', 8500, 550000, 12000000, 'Ras Tanura Port', 'Excellent', 'Good',
 15000000000.00, 94.2, 1945, 'Saudi Aramco'),

('ExxonMobil Baytown Refinery', 'United States', 'North America', 'Baytown',
 29.7355, -94.9777, 560000, 560000,
 'Largest refinery in the United States, major petrochemical production center',
 'Integrated Refinery', 'Operational', 'ExxonMobil', 'ExxonMobil Corporation', 1920, 92.8,
 'Gasoline, Diesel, Jet Fuel, Petrochemicals, Lubricants', 'Premium Gasoline, Ultra-Low Sulfur Diesel',
 'Very High Complexity', 7200, 560000, 15000000, 'Houston Ship Channel', 'Excellent', 'Good',
 18500000000.00, 91.5, 1920, 'ExxonMobil Corporation'),

('Shell Pernis Refinery', 'Netherlands', 'Europe', 'Rotterdam',
 51.8583, 4.3878, 416000, 416000,
 'Largest refinery in Europe, major petrochemical complex in Rotterdam',
 'Integrated Refinery', 'Operational', 'Shell', 'Royal Dutch Shell', 1961, 88.4,
 'Gasoline, Diesel, Jet Fuel, Petrochemicals, Aromatics', 'Euro VI Diesel, High-Octane Gasoline',
 'High Complexity', 4800, 416000, 8500000, 'Port of Rotterdam', 'Very Good', 'Excellent',
 12800000000.00, 89.7, 1961, 'Royal Dutch Shell'),

('Reliance Jamnagar Refinery', 'India', 'Asia Pacific', 'Jamnagar',
 22.4707, 70.0577, 1240000, 1240000,
 'Worlds largest oil refinery complex, twin refineries operated by Reliance',
 'Export Refinery', 'Operational', 'Reliance Industries', 'Reliance Industries Limited', 1999, 96.2,
 'Gasoline, Diesel, Jet Fuel, Petrochemicals, Polymers', 'Export-Grade Fuels, Petrochemicals',
 'Very High Complexity', 35000, 1240000, 25000000, 'Sikka Port', 'Good', 'Good',
 28000000000.00, 93.8, 1999, 'Reliance Industries Limited'),

('Total Antwerp Refinery', 'Belgium', 'Europe', 'Antwerp',
 51.2768, 4.3517, 338000, 338000,
 'Major European refinery in Antwerp petrochemical cluster',
 'Integrated Refinery', 'Operational', 'TotalEnergies', 'TotalEnergies SE', 1951, 90.5,
 'Gasoline, Diesel, Jet Fuel, Aromatics, Solvents', 'Euro Standards Fuels, Aviation Fuel',
 'High Complexity', 3200, 338000, 6800000, 'Port of Antwerp', 'Very Good', 'Very Good',
 9500000000.00, 88.9, 1951, 'TotalEnergies SE'),

('Chevron Richmond Refinery', 'United States', 'North America', 'Richmond',
 37.9358, -122.3477, 245000, 245000,
 'West Coast refinery serving California market with cleaner fuels',
 'Conventional Refinery', 'Operational', 'Chevron', 'Chevron Corporation', 1902, 85.7,
 'Gasoline, Diesel, Jet Fuel, Lubricants', 'CARB Gasoline, Low-Carbon Diesel',
 'Medium Complexity', 2800, 245000, 4200000, 'San Francisco Bay', 'Good', 'Very Good',
 7200000000.00, 86.3, 1902, 'Chevron Corporation');