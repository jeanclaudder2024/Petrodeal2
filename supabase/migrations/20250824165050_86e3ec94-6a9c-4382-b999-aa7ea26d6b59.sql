-- Create table for managing filter options
CREATE TABLE public.filter_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filter_type TEXT NOT NULL, -- 'oil_type', 'region', 'vessel_status', etc.
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(filter_type, value)
);

-- Enable Row Level Security
ALTER TABLE public.filter_options ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active filter options" 
ON public.filter_options 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all filter options" 
ON public.filter_options 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_filter_options_updated_at
BEFORE UPDATE ON public.filter_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default filter options
INSERT INTO public.filter_options (filter_type, value, label, description) VALUES
('oil_type', 'crude_oil', 'Crude Oil', 'Unrefined petroleum oil extracted from underground reservoirs'),
('oil_type', 'diesel', 'Diesel', 'Refined petroleum fuel for diesel engines'),
('oil_type', 'gasoline', 'Gasoline', 'Refined petroleum fuel for gasoline engines'),
('oil_type', 'jet_fuel', 'Jet Fuel', 'Aviation turbine fuel for aircraft engines'),
('oil_type', 'fuel_oil', 'Fuel Oil', 'Heavy petroleum fuel for industrial use'),
('oil_type', 'lpg', 'LPG', 'Liquefied Petroleum Gas'),

('region', 'middle_east', 'Middle East', 'Oil-rich region including Gulf countries'),
('region', 'north_america', 'North America', 'USA, Canada, and Mexico'),
('region', 'europe', 'Europe', 'European Union and surrounding countries'),
('region', 'asia_pacific', 'Asia Pacific', 'Asian and Pacific region countries'),
('region', 'africa', 'Africa', 'African continent countries'),
('region', 'south_america', 'South America', 'South American countries'),

('vessel_status', 'active', 'Active', 'Vessel is currently operational'),
('vessel_status', 'maintenance', 'Maintenance', 'Vessel is under maintenance'),
('vessel_status', 'inactive', 'Inactive', 'Vessel is not currently operational'),
('vessel_status', 'loading', 'Loading', 'Vessel is loading cargo'),
('vessel_status', 'transit', 'In Transit', 'Vessel is traveling between ports'),
('vessel_status', 'unloading', 'Unloading', 'Vessel is unloading cargo');