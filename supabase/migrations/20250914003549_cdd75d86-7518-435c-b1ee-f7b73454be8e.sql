-- Fix corrupted AI prompt for Documentary Letter of Credit document
UPDATE vessel_documents 
SET ai_prompt = 'Generate a professional Documentary Letter of Credit (DLC) – MT700 for the vessel transaction using the provided vessel data:

{vessel_data}

Create a comprehensive MT700 format DLC that includes:

1. **SWIFT Message Header:**
   - Message Type: MT700
   - Reference Number: Format "DLC-{vessel_name}-{timestamp}"
   - Date of Issue: Current date

2. **Issue Details:**
   - Issuing Bank information (use realistic bank details)
   - Applicant (buyer) details from vessel data
   - Beneficiary (seller) details from vessel data
   - Credit Amount: Based on deal_value from vessel data
   - Currency: USD

3. **Terms and Conditions:**
   - Commodity: Use cargo_type and oil_type from vessel data
   - Quantity: Use cargo_quantity from vessel data
   - Loading Port: Use loading_port_name from vessel data
   - Discharge Port: Use destination_port_name from vessel data
   - Shipment Date: Use departure_date from vessel data
   - Expiry Date: 30 days from shipment date

4. **Required Documents:**
   - Commercial Invoice
   - Bill of Lading
   - Insurance Certificate
   - Certificate of Origin
   - SGS Inspection Certificate

5. **Payment Terms:**
   - Sight payment or usance terms
   - Confirmation requirements
   - Negotiation instructions

6. **Special Conditions:**
   - Partial shipments allowed/not allowed
   - Transhipment allowed/not allowed
   - Tolerance for quantity (+/- 5%)

Format as official SWIFT MT700 message with proper field codes and structured layout.'
WHERE id = '7fe73e24-52b3-42dd-9b81-b4db10bb5488';