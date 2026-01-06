-- Create document_type_templates table for pre-configured document types
CREATE TABLE public.document_type_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    description TEXT,
    default_prompt TEXT,
    recommended_entity_types TEXT[] DEFAULT '{}',
    typical_page_range TEXT DEFAULT '8-15 pages',
    legal_sections JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create generated_documents table for storing AI-generated legal documents
CREATE TABLE public.generated_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    selected_entity_id TEXT,
    ai_prompt TEXT,
    generated_content TEXT,
    placeholders_from_db JSONB DEFAULT '[]',
    placeholders_generated JSONB DEFAULT '[]',
    estimated_pages INTEGER DEFAULT 10,
    status TEXT DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_type_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_type_templates
CREATE POLICY "Anyone can view active document templates"
ON public.document_type_templates
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage document templates"
ON public.document_type_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for generated_documents
CREATE POLICY "Admins can manage all generated documents"
ON public.generated_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own generated documents"
ON public.generated_documents
FOR SELECT
USING (created_by = auth.uid());

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_document_type_templates_updated_at
    BEFORE UPDATE ON public.document_type_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_documents_updated_at
    BEFORE UPDATE ON public.generated_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Seed document type templates
INSERT INTO public.document_type_templates (name, short_code, description, default_prompt, recommended_entity_types, typical_page_range, legal_sections) VALUES
('Irrevocable Corporate Purchase Order', 'ICPO', 'A legally binding document issued by a buyer to a seller, expressing intent to purchase commodities', 'Generate a professional ICPO document following ICC standards for international oil trading. Include all standard clauses for commodity purchase orders.', ARRAY['company_buyer', 'company_seller', 'vessel'], '12-15 pages', '["Definitions", "Product Specifications", "Quantity and Quality", "Price and Payment Terms", "Delivery Terms", "Inspection", "Force Majeure", "Dispute Resolution", "Governing Law", "Signatures"]'),
('SGS Inspection Certificate', 'SGS', 'Independent inspection and verification certificate for oil cargo quality and quantity', 'Generate a comprehensive SGS-style inspection certificate for oil cargo verification. Include all technical specifications and quality parameters.', ARRAY['vessel', 'port', 'company_seller'], '8-10 pages', '["Certificate Header", "Cargo Details", "Quality Analysis", "Quantity Verification", "Sampling Procedures", "Laboratory Results", "Certification Statement", "Inspector Details"]'),
('Standby Letter of Credit', 'SBLC', 'A bank guarantee document ensuring payment in international trade transactions', 'Generate a formal SBLC document following ICC UCP 600 and ISP98 standards. Include all banking and payment guarantee clauses.', ARRAY['company_buyer', 'company_seller'], '15-20 pages', '["Definitions", "Issuing Bank Details", "Beneficiary Details", "Amount and Currency", "Validity Period", "Drawing Conditions", "Documents Required", "Payment Terms", "Amendments", "Governing Law"]'),
('Letter of Intent', 'LOI', 'A preliminary document expressing serious interest in a business transaction', 'Generate a professional Letter of Intent for oil trading. Include non-binding terms and conditions with clear intention statements.', ARRAY['company_buyer', 'company_seller'], '8-10 pages', '["Parties", "Purpose", "Transaction Overview", "Price Indication", "Quantity", "Delivery Terms", "Conditions Precedent", "Confidentiality", "Non-Binding Nature", "Signatures"]'),
('Bank Comfort Letter', 'BCL', 'A letter from a bank confirming the financial standing of a client', 'Generate a formal Bank Comfort Letter confirming financial capability for oil trading transactions.', ARRAY['company_buyer', 'company_real'], '5-8 pages', '["Bank Details", "Client Details", "Financial Standing", "Account Status", "Credit Facilities", "Recommendation", "Disclaimers", "Bank Officer Signature"]'),
('Proof of Product', 'POP', 'Documentation proving the existence and availability of oil products', 'Generate a comprehensive Proof of Product document for oil commodities. Include all verification details and product specifications.', ARRAY['company_seller', 'refinery', 'vessel'], '10-12 pages', '["Product Details", "Storage Location", "Quantity Available", "Quality Specifications", "Ownership Proof", "Third-Party Verification", "Photographs/Evidence", "Seller Declaration"]'),
('Non-Circumvention Non-Disclosure Agreement', 'NCNDA', 'A legal agreement protecting business relationships and confidential information', 'Generate a comprehensive NCNDA for international oil trading. Include strong protection clauses and penalty provisions.', ARRAY['company_buyer', 'company_seller', 'company_real'], '15-18 pages', '["Definitions", "Confidential Information", "Non-Disclosure Obligations", "Non-Circumvention Obligations", "Protected Parties", "Commission Structure", "Duration", "Remedies", "Dispute Resolution", "Governing Law"]'),
('Sale and Purchase Agreement', 'SPA', 'A comprehensive contract for the sale and purchase of oil commodities', 'Generate a complete Sale and Purchase Agreement for oil trading following INCOTERMS 2020. Include all standard clauses for international commodity transactions.', ARRAY['company_buyer', 'company_seller', 'vessel', 'port'], '20-25 pages', '["Definitions", "Product Description", "Quantity", "Quality Specifications", "Price", "Payment Terms", "Delivery Terms", "Title Transfer", "Risk Transfer", "Inspection", "Claims", "Force Majeure", "Termination", "Dispute Resolution", "Governing Law", "Signatures"]'),
('Charter Party Agreement', 'CHARTER', 'A contract for the hire of a vessel for cargo transportation', 'Generate a comprehensive Charter Party Agreement for oil tanker transportation. Include all maritime law requirements and industry standards.', ARRAY['vessel', 'port', 'company_buyer', 'company_seller'], '18-22 pages', '["Vessel Details", "Charterer Details", "Loading Port", "Discharge Port", "Laycan", "Freight Rate", "Demurrage", "Laytime", "Cargo Specifications", "Bills of Lading", "Insurance", "Force Majeure", "Arbitration", "Governing Law"]'),
('Bill of Lading', 'BOL', 'A legal document issued by a carrier acknowledging receipt of cargo', 'Generate a standard Bill of Lading for oil cargo shipment. Include all required fields per maritime law and international shipping standards.', ARRAY['vessel', 'port', 'company_seller'], '8-10 pages', '["Shipper Details", "Consignee Details", "Notify Party", "Vessel Details", "Port of Loading", "Port of Discharge", "Cargo Description", "Container/Tank Details", "Freight Terms", "Date of Issue", "Carrier Signature"]'),
('Custom Document', 'CUSTOM', 'A custom legal document based on user specifications', 'Generate a professional legal document based on the provided specifications. Follow international oil trading standards and legal best practices.', ARRAY['company_buyer', 'company_seller', 'company_real', 'vessel', 'port', 'refinery'], '8-25 pages', '[]');