-- Insert a sample SGS Inspection Certificate template
INSERT INTO vessel_documents (
  title,
  description,
  ai_prompt,
  subscription_level,
  broker_membership_required,
  is_active
) VALUES (
  'SGS Inspection Certificate',
  'Professional vessel inspection certificate with cargo analysis and quality certification',
  'Create an official SGS Inspection Certificate for the vessel using the following data:

{vessel_data}

Generate a professional certificate document that includes:

1. Certificate header with "SGS Inspection Certificate"
2. Certificate number in format "SGS-PDH-YYYY-XXXXX" (use current year and random 5-digit number)
3. Issue date (use today''s date)
4. Vessel details using the EXACT vessel name, IMO number, flag, and deadweight from the data
5. Cargo information based on the vessel''s cargo type and quantity
6. Realistic technical specifications (density, sulfur content, flash point, viscosity)
7. Inspection locations using the departure and destination ports from vessel data
8. Inspection date (1 day before issue date)
9. SGS reference number
10. Professional certification section
11. Authorized signatures (Senior Marine Inspector and Client Representative)
12. Legal disclaimer
13. Footer with verification number

Use professional maritime terminology and ensure all vessel-specific data (name, IMO, ports, cargo details) from the provided vessel information is accurately incorporated. Make the certificate look authentic and official.',
  'basic',
  false,
  true
) ON CONFLICT DO NOTHING;

-- Insert a Bill of Lading template
INSERT INTO vessel_documents (
  title,
  description,
  ai_prompt,
  subscription_level,
  broker_membership_required,
  is_active
) VALUES (
  'Bill of Lading',
  'Official bill of lading document for cargo shipment',
  'Create an official Bill of Lading using the vessel data provided:

{vessel_data}

Generate a professional Bill of Lading that includes:

1. "BILL OF LADING" header
2. B/L number in format "PDH-BL-YYYY-XXXXX"
3. Vessel name, flag, and IMO number from the provided data
4. Shipper, consignee, and notify party information
5. Port of loading and port of discharge from vessel data
6. Cargo description using the vessel''s cargo type and quantity
7. Freight terms and payment details
8. Date of shipment
9. Master''s signature section
10. Agent signature section
11. Terms and conditions

Ensure all vessel-specific information is accurately used from the provided data.',
  'premium',
  true,
  true
) ON CONFLICT DO NOTHING;