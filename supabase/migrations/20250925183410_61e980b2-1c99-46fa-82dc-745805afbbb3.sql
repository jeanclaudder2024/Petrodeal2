-- Update document_templates table to support enhanced functionality
ALTER TABLE document_templates 
ADD COLUMN IF NOT EXISTS auto_mapped_fields JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mapping_confidence NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS template_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS fallback_data_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS supports_pdf BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_tested TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS test_results JSONB DEFAULT '{}';

-- Create function to generate realistic maritime random data
CREATE OR REPLACE FUNCTION public.generate_maritime_random_data(field_name TEXT, data_type TEXT DEFAULT 'text')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT;
  vessel_names TEXT[] := ARRAY['Ocean Explorer', 'Maritime Pioneer', 'Sea Navigator', 'Cargo Master', 'Blue Horizon', 'Atlantic Voyager', 'Pacific Star', 'Global Trader', 'Deep Water', 'Marine Spirit'];
  port_names TEXT[] := ARRAY['Port of Hamburg', 'Rotterdam Harbor', 'Singapore Port', 'Los Angeles Port', 'Shanghai Port', 'Antwerp Harbor', 'Dubai Port', 'Hong Kong Terminal'];
  company_names TEXT[] := ARRAY['Maritime Solutions Ltd', 'Ocean Trading Co', 'Global Shipping Inc', 'Nautical Services', 'Marine Logistics', 'Seaborne Transport', 'Atlantic Maritime', 'Pacific Carriers'];
  countries TEXT[] := ARRAY['Netherlands', 'Singapore', 'United States', 'Germany', 'China', 'Japan', 'South Korea', 'United Kingdom'];
BEGIN
  -- Generate realistic data based on field name patterns
  CASE 
    WHEN field_name ILIKE '%vessel%name%' OR field_name ILIKE '%ship%name%' THEN
      result := vessel_names[floor(random() * array_length(vessel_names, 1) + 1)];
    
    WHEN field_name ILIKE '%port%name%' OR field_name ILIKE '%port%' THEN
      result := port_names[floor(random() * array_length(port_names, 1) + 1)];
    
    WHEN field_name ILIKE '%company%name%' OR field_name ILIKE '%owner%' OR field_name ILIKE '%operator%' THEN
      result := company_names[floor(random() * array_length(company_names, 1) + 1)];
    
    WHEN field_name ILIKE '%country%' THEN
      result := countries[floor(random() * array_length(countries, 1) + 1)];
    
    WHEN field_name ILIKE '%date%' OR field_name ILIKE '%time%' THEN
      result := to_char(current_date + (floor(random() * 365 - 180) || ' days')::interval, 'YYYY-MM-DD');
    
    WHEN field_name ILIKE '%year%' OR field_name ILIKE '%built%' THEN
      result := (1990 + floor(random() * 34))::TEXT;
    
    WHEN field_name ILIKE '%length%' OR field_name ILIKE '%loa%' THEN
      result := (150 + floor(random() * 250))::TEXT || ' m';
    
    WHEN field_name ILIKE '%beam%' OR field_name ILIKE '%width%' THEN
      result := (20 + floor(random() * 40))::TEXT || ' m';
    
    WHEN field_name ILIKE '%draft%' OR field_name ILIKE '%draught%' THEN
      result := (8 + floor(random() * 15))::TEXT || ' m';
    
    WHEN field_name ILIKE '%tonnage%' OR field_name ILIKE '%dwt%' OR field_name ILIKE '%deadweight%' THEN
      result := (10000 + floor(random() * 150000))::TEXT || ' DWT';
    
    WHEN field_name ILIKE '%imo%' THEN
      result := (1000000 + floor(random() * 8999999))::TEXT;
    
    WHEN field_name ILIKE '%mmsi%' THEN
      result := (100000000 + floor(random() * 899999999))::TEXT;
    
    WHEN field_name ILIKE '%flag%' THEN
      result := countries[floor(random() * array_length(countries, 1) + 1)];
    
    WHEN field_name ILIKE '%capacity%' OR field_name ILIKE '%cargo%' THEN
      result := (5000 + floor(random() * 100000))::TEXT || ' tons';
    
    WHEN field_name ILIKE '%speed%' OR field_name ILIKE '%knots%' THEN
      result := (12 + floor(random() * 18))::TEXT || ' knots';
    
    WHEN field_name ILIKE '%crew%' OR field_name ILIKE '%personnel%' THEN
      result := (15 + floor(random() * 25))::TEXT;
    
    WHEN field_name ILIKE '%class%' OR field_name ILIKE '%classification%' THEN
      result := CASE floor(random() * 4)
                  WHEN 0 THEN 'DNV GL'
                  WHEN 1 THEN 'Lloyd''s Register'
                  WHEN 2 THEN 'ABS'
                  ELSE 'Bureau Veritas'
                END;
    
    ELSE
      -- Default fallback for unknown fields
      result := 'N/A';
  END CASE;
  
  RETURN result;
END;
$$;