-- Insert seller companies so autofill can assign seller_company_id
INSERT INTO public.companies (name, company_type, country, industry, email, is_verified)
VALUES 
  ('Global Petrochemicals Trading LLC', 'seller', 'UAE', 'Oil & Gas', 'sales@globalpetrochem.ae', true),
  ('Meridian Oil Suppliers', 'seller', 'United States', 'Oil & Gas', 'info@meridianoil.com', true),
  ('North Sea Energy Trading', 'seller', 'Norway', 'Oil & Gas', 'trade@northseaenergy.no', true),
  ('Asian Petroleum Holdings', 'seller', 'Singapore', 'Oil & Gas', 'contact@asianpetrol.sg', true),
  ('Gulf States Oil Corp', 'seller', 'Saudi Arabia', 'Oil & Gas', 'sales@gulfstatesoil.sa', true)
ON CONFLICT DO NOTHING;