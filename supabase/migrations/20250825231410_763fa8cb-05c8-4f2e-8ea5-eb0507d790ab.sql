-- Fix coordinate fields precision to handle latitude/longitude values properly
-- Latitude: -90 to 90, Longitude: -180 to 180
-- Using precision 10, scale 6 allows values up to 9999.999999

ALTER TABLE vessels 
ALTER COLUMN current_lat TYPE NUMERIC(10,6),
ALTER COLUMN current_lng TYPE NUMERIC(10,6),
ALTER COLUMN destination_lat TYPE NUMERIC(10,6),
ALTER COLUMN destination_lng TYPE NUMERIC(10,6),
ALTER COLUMN departure_lat TYPE NUMERIC(10,6),
ALTER COLUMN departure_lng TYPE NUMERIC(10,6);

-- Also fix other coordinate fields in ports table if needed
ALTER TABLE ports
ALTER COLUMN lat TYPE NUMERIC(10,6),
ALTER COLUMN lng TYPE NUMERIC(10,6);

-- Fix refineries coordinate fields
ALTER TABLE refineries
ALTER COLUMN lat TYPE NUMERIC(10,6),
ALTER COLUMN lng TYPE NUMERIC(10,6);