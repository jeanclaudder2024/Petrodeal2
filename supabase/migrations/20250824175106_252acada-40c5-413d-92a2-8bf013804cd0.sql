-- Insert vessel documents into the vessel_documents table
INSERT INTO public.vessel_documents (title, description, ai_prompt, subscription_level, is_active) VALUES
(
  'Letter of Intent (LOI)',
  'A formal document expressing intent to charter or purchase a vessel',
  'Generate a professional Letter of Intent for vessel charter/purchase. Include vessel details, charter terms, commercial conditions, and legal clauses. Format as a formal business document with proper headers, parties identification, and signature blocks.',
  'basic',
  true
),
(
  'Charter Party Agreement',
  'Comprehensive charter agreement for vessel rental',
  'Create a detailed Charter Party Agreement including vessel specifications, charter period, hire rates, delivery/redelivery conditions, performance warranties, and dispute resolution clauses. Include standard maritime law provisions.',
  'premium',
  true
),
(
  'Bill of Lading',
  'Document acknowledging receipt of cargo for shipment',
  'Generate a Bill of Lading document with cargo details, shipper/consignee information, port of loading/discharge, freight terms, and standard shipping conditions. Include proper legal disclaimers and liability clauses.',
  'basic',
  true
),
(
  'Vessel Inspection Report',
  'Comprehensive technical inspection report',
  'Create a detailed vessel inspection report covering hull condition, machinery status, safety equipment, certifications, and overall seaworthiness. Include technical specifications, maintenance records, and compliance status.',
  'premium',
  true
),
(
  'Time Charter Agreement',
  'Time-based vessel charter contract',
  'Generate a Time Charter Agreement with vessel delivery terms, charter hire calculations, bunker provisions, maintenance responsibilities, insurance requirements, and off-hire clauses.',
  'premium',
  true
),
(
  'Voyage Charter Agreement',
  'Single voyage charter contract',
  'Create a Voyage Charter Agreement including cargo specifications, loading/discharge terms, laytime provisions, demurrage/despatch clauses, and freight payment terms.',
  'basic',
  true
),
(
  'Bunker Delivery Note',
  'Fuel delivery documentation',
  'Generate a Bunker Delivery Note with fuel specifications, quantities delivered, quality certificates, and delivery conditions. Include standard bunker trading terms.',
  'basic',
  true
),
(
  'Port Agency Agreement',
  'Agreement for port services',
  'Create a Port Agency Agreement covering port services, agency fees, responsibilities, disbursement procedures, and liability provisions for vessel port calls.',
  'premium',
  true
),
(
  'Cargo Manifest',
  'Detailed cargo documentation',
  'Generate a comprehensive Cargo Manifest listing all cargo items, quantities, weights, packaging details, and consignee information for customs and port authorities.',
  'basic',
  true
),
(
  'Ship Sale Agreement',
  'Vessel purchase/sale contract',
  'Create a Ship Sale Agreement including vessel details, purchase price, payment terms, delivery conditions, warranties, and transfer of ownership procedures.',
  'enterprise',
  true
),
(
  'Marine Insurance Certificate',
  'Vessel insurance documentation',
  'Generate a Marine Insurance Certificate with coverage details, policy terms, insured values, and claims procedures for vessel protection and indemnity.',
  'premium',
  true
),
(
  'Crew Employment Contract',
  'Seafarer employment agreement',
  'Create a Crew Employment Contract with position details, salary terms, working conditions, repatriation provisions, and compliance with maritime labor conventions.',
  'premium',
  true
);