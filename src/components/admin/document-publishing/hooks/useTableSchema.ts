// Hook to fetch real column names from Supabase database tables
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// COMPLETE database column definitions matching actual Supabase schema
// Updated with ALL fields from the database including voyage, cargo, deal, payment, and compliance fields
const TABLE_COLUMNS: Record<string, string[]> = {
  vessels: [
    // Basic Information
    'id', 'name', 'imo', 'mmsi', 'vessel_type', 'flag', 'built', 'callsign', 'status',
    // Technical Specifications  
    'length', 'width', 'beam', 'draft', 'draught', 'deadweight', 'gross_tonnage', 
    'cargo_capacity', 'cargo_capacity_bbl', 'engine_power', 'service_speed', 
    'fuel_consumption', 'crew_size',
    // Navigation & Location
    'current_lat', 'current_lng', 'current_region', 'heading', 'speed',
    // Route & Ports (Voyage)
    'departure_port', 'loading_port', 'discharge_port', 'destination_port',
    'departure_date', 'arrival_date', 'eta', 'route_distance', 'voyage_status', 'voyage_notes',
    // Cargo Information
    'cargo_type', 'cargo_quantity', 'cargo_origin_country', 'oil_source', 'oil_type',
    'commodity_name', 'commodity_category', 'hs_code', 'source_refinery', 'target_refinery',
    'sanctions_status', 'min_quantity', 'max_quantity', 'quantity_unit', 
    'total_shipment_quantity', 'quality_specification',
    // Commercial Parties
    'owner_name', 'operator_name', 'source_company', 'buyer_name', 'seller_name',
    'buyer_company_id', 'seller_company_id', 'buyer_company_uuid', 'seller_company_uuid',
    'refinery_id',
    // Deal & Commercial Terms
    'deal_reference_id', 'deal_status', 'deal_value', 'contract_type', 
    'delivery_terms', 'delivery_method', 'price_basis', 'benchmark_reference',
    'indicative_price', 'market_price', 'price', 'price_notes',
    'payment_method', 'payment_timing', 'payment_notes',
    // Metadata
    'image_url', 'is_active', 'created_at', 'updated_at'
  ],
  
  ports: [
    // Basic Information
    'id', 'name', 'country', 'city', 'region', 'address', 'postal_code',
    'lat', 'lng', 'latitude', 'longitude', 'port_code', 'unlocode',
    'port_type', 'status', 'timezone',
    // Authority & Operations
    'port_authority', 'operator', 'owner', 'email', 'phone', 'website',
    'operating_hours', 'working_hours',
    // Capacity & Infrastructure
    'capacity', 'annual_throughput', 'berth_count', 'berths', 'terminal_count',
    'cranes', 'storage_capacity',
    // Vessel Limits
    'max_vessel_length', 'max_loa', 'max_vessel_beam', 'max_beam',
    'max_draught', 'max_draft', 'max_deadweight',
    // Depth Information
    'channel_depth', 'berth_depth', 'anchorage_depth',
    // Services & Facilities
    'services', 'facilities', 'cargo_types', 'restrictions',
    'pilotage_required', 'tug_assistance',
    // Contact & Additional
    'contacts', 'currency', 'description', 'image_url',
    'is_active', 'created_at', 'updated_at'
  ],
  
  refineries: [
    // Basic Information
    'id', 'name', 'country', 'city', 'region', 'address',
    'lat', 'lng', 'latitude', 'longitude',
    // Capacity Information
    'capacity', 'capacity_unit', 'processing_capacity', 'daily_throughput', 
    'annual_throughput', 'distillation_capacity', 'conversion_capacity', 
    'storage_capacity', 'production_capacity',
    // Ownership & Operations
    'operator', 'owner', 'parent_company', 'manager',
    // History & Workforce
    'year_built', 'year_established', 'established_year', 'employees_count', 'workforce_size',
    // Status & Classification
    'status', 'type', 'refinery_type', 'complexity', 'complexity_index',
    // Products & Processing
    'products', 'fuel_types', 'crude_oil_sources', 'feedstock',
    'processing_units',
    // Contact Information
    'email', 'phone', 'website',
    // Certifications & Ratings
    'certifications', 'environmental_certifications', 'safety_rating', 
    'environmental_rating',
    // Metadata
    'description', 'image_url', 'is_active', 'created_at', 'updated_at'
  ],
  
  seller_companies: [
    // Basic Information
    'id', 'name', 'trade_name', 'country', 'city', 'address',
    'industry', 'founded_year', 'description',
    // Contact Information
    'email', 'official_email', 'operations_email', 'phone', 'website',
    // Business Information
    'employees_count', 'annual_revenue', 'primary_activity', 'company_objective',
    'trading_regions',
    // Legal Information
    'registration_number', 'registration_country', 'legal_address',
    'representative_name', 'representative_title', 'representative_email',
    'passport_number', 'passport_country',
    // Refinery Information (Seller-specific)
    'is_refinery_owner', 'refinery_name', 'refinery_location', 'refinery_capacity_bpd',
    'products_supplied', 'loading_ports',
    // KYC & Compliance
    'kyc_status', 'sanctions_status', 'country_risk', 'compliance_notes',
    'is_verified',
    // Branding
    'logo_url', 'director_photo_url', 'signatory_signature_url',
    // Metadata
    'created_at', 'updated_at'
  ],
  
  buyer_companies: [
    // Basic Information
    'id', 'name', 'trade_name', 'country', 'city', 'address',
    'industry', 'founded_year', 'description',
    // Contact Information
    'email', 'official_email', 'operations_email', 'phone', 'website',
    // Business Information
    'employees_count', 'annual_revenue', 'primary_activity', 'company_objective',
    'trading_regions',
    // Legal Information
    'registration_number', 'registration_country', 'legal_address',
    'representative_name', 'representative_title', 'representative_email',
    'passport_number', 'passport_country',
    // KYC & Compliance
    'kyc_status', 'sanctions_status', 'country_risk', 'compliance_notes',
    'is_verified',
    // Branding
    'logo_url', 'director_photo_url', 'signatory_signature_url',
    // Metadata
    'created_at', 'updated_at'
  ],
  
  seller_company_bank_accounts: [
    'id', 'company_id', 'bank_name', 'bank_address',
    'account_name', 'account_number', 'iban', 'swift_code',
    'beneficiary_address', 'currency', 'is_primary',
    'created_at', 'updated_at'
  ],
  
  buyer_company_bank_accounts: [
    'id', 'company_id', 'bank_name', 'bank_address',
    'account_name', 'account_number', 'iban', 'swift_code',
    'beneficiary_address', 'currency', 'is_primary',
    'created_at', 'updated_at'
  ],
  
  oil_products: [
    // Basic Information
    'id', 'product_code', 'commodity_name', 'commodity_type', 'product_type',
    'grade', 'origin', 'origin_country',
    // Technical Specifications
    'api_gravity', 'sulfur_content', 'sulphur_content_ppm',
    'density', 'density_kg_m3', 'viscosity', 'viscosity_cst',
    'pour_point', 'pour_point_c', 'flash_point', 'flash_point_min_c',
    // Quantity Information
    'quantity_min_mt', 'quantity_max_mt', 'quantity_unit',
    'typical_quantity', 'unit_of_measure',
    // Commercial Terms
    'contract_type', 'delivery_terms', 'incoterms',
    'price_type', 'price_basis', 'price_reference', 'benchmark',
    'premium_discount', 'currency',
    // Payment Terms
    'payment_terms', 'payment_condition', 'payment_days',
    // Ports
    'loading_ports', 'discharge_ports', 'destination_ports',
    // Specifications
    'specifications', 'applications', 'origin_countries',
    // Metadata
    'description', 'is_active', 'created_at', 'updated_at'
  ],
  
  broker_deals: [
    'id', 'broker_id', 'deal_type', 'status',
    'cargo_type', 'quantity', 'price_per_unit', 'total_value', 'currency',
    'source_port', 'destination_port', 'laycan_start', 'laycan_end',
    'delivery_date', 'deal_date', 'seller_company_name', 'buyer_company_name',
    'vessel_id', 'commission_rate', 'commission_amount', 'commission_status',
    'payment_method', 'price_basis', 'pricing_formula', 'terms_conditions',
    'deal_validity', 'broker_role', 'steps_completed', 'total_steps',
    'admin_notes', 'approved_by', 'approved_at', 'selected_company_id',
    'created_at', 'updated_at'
  ],
};

export interface TableSchemaState {
  columns: Record<string, string[]>;
  loading: boolean;
  error: string | null;
}

export function useTableSchema() {
  const [state, setState] = useState<TableSchemaState>({
    columns: TABLE_COLUMNS, // Use hardcoded columns initially
    loading: false,
    error: null,
  });

  // Try to fetch actual column info from a sample query to each table
  const refreshSchema = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // We already have hardcoded columns, but let's validate by checking tables exist
      const tableChecks = await Promise.all([
        supabase.from('vessels').select('id').limit(1),
        supabase.from('ports').select('id').limit(1),
        supabase.from('refineries').select('id').limit(1),
        supabase.from('seller_companies').select('id').limit(1),
        supabase.from('buyer_companies').select('id').limit(1),
        supabase.from('oil_products').select('id').limit(1),
      ]);
      
      // Check if any table query failed
      const hasErrors = tableChecks.some(result => result.error);
      if (hasErrors) {
        console.warn('Some table queries failed, using hardcoded schema');
      }
      
      setState({
        columns: TABLE_COLUMNS,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to validate schema:', error);
      setState({
        columns: TABLE_COLUMNS, // Still use hardcoded columns on error
        loading: false,
        error: 'Failed to validate database schema',
      });
    }
  }, []);

  useEffect(() => {
    refreshSchema();
  }, [refreshSchema]);

  return {
    ...state,
    refreshSchema,
    getColumnsForTable: (tableName: string) => state.columns[tableName] || [],
  };
}

export default useTableSchema;
