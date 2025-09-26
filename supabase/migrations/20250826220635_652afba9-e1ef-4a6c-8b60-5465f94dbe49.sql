-- Add proper foreign key relationships and missing fields for vessels

-- Ensure proper foreign key constraints for vessel relationships
ALTER TABLE vessels 
  ADD CONSTRAINT fk_vessels_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE vessels 
  ADD CONSTRAINT fk_vessels_departure_port 
  FOREIGN KEY (departure_port) REFERENCES ports(id) ON DELETE SET NULL;

ALTER TABLE vessels 
  ADD CONSTRAINT fk_vessels_destination_port 
  FOREIGN KEY (destination_port) REFERENCES ports(id) ON DELETE SET NULL;

-- Add refinery_id field for better refinery linking
ALTER TABLE vessels ADD COLUMN refinery_id uuid REFERENCES refineries(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vessels_company_id ON vessels(company_id);
CREATE INDEX IF NOT EXISTS idx_vessels_departure_port ON vessels(departure_port);
CREATE INDEX IF NOT EXISTS idx_vessels_destination_port ON vessels(destination_port);
CREATE INDEX IF NOT EXISTS idx_vessels_refinery_id ON vessels(refinery_id);

-- Ensure RLS policies allow proper access
DROP POLICY IF EXISTS "Authenticated users can view vessels" ON vessels;
DROP POLICY IF EXISTS "Authenticated users can insert vessels" ON vessels;
DROP POLICY IF EXISTS "Authenticated users can update vessels" ON vessels;
DROP POLICY IF EXISTS "Authenticated users can delete vessels" ON vessels;

CREATE POLICY "Authenticated users can view vessels" ON vessels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vessels" ON vessels
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vessels" ON vessels
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vessels" ON vessels
  FOR DELETE USING (auth.role() = 'authenticated');