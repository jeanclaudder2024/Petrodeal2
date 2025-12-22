import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema - allow empty strings and transform them to undefined
const vesselSearchSchema = z.object({
  vesselName: z.string().max(200).optional().transform(v => v?.trim() || undefined),
  imo: z.string().optional().transform(v => {
    const trimmed = v?.trim();
    if (!trimmed) return undefined;
    return /^\d{7}$/.test(trimmed) ? trimmed : undefined;
  }),
  mmsi: z.string().optional().transform(v => v?.trim() || undefined),
}).refine((data) => data.vesselName || data.imo, {
  message: "Either vessel name or IMO number is required"
});

// Data lists for autofill
const VESSEL_TYPES = ['Crude Tanker', 'Product Tanker', 'LNG Carrier', 'LPG Carrier', 'VLCC', 'Suezmax', 'Aframax', 'Panamax', 'Chemical Tanker', 'Bitumen Tanker'];
const FLAGS = ['Panama', 'Liberia', 'Marshall Islands', 'Hong Kong', 'Singapore', 'Bahamas', 'Malta', 'Cyprus', 'Greece', 'Norway', 'United Kingdom', 'Japan', 'China'];
const VESSEL_STATUSES = ['Active', 'In Transit', 'At Port', 'Anchored', 'Loading', 'Discharging', 'Waiting', 'Bunkering'];
const NAV_STATUSES = ['Underway Using Engine', 'At Anchor', 'Moored', 'Restricted Manoeuvrability', 'Constrained by Draught', 'Underway Sailing'];
const DEAL_STATUSES = ['Open', 'Negotiation', 'Reserved', 'Closed', 'Pending'];
const CARGO_TYPES = ['Crude Oil', 'Refined Product', 'LNG', 'LPG'];
const OIL_TYPES = ['Brent Crude', 'WTI Crude', 'Dubai Crude', 'Urals Crude', 'Arab Light', 'Bonny Light', 'Murban Crude'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    console.log('[ai-vessel-search] Received request:', rawBody);
    
    const validation = vesselSearchSchema.safeParse(rawBody);
    if (!validation.success) {
      console.log('[ai-vessel-search] Validation failed:', validation.error.issues);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input', 
          details: validation.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { vesselName, imo, mmsi } = validation.data;

    // Initialize Supabase client to fetch real data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch real ports, refineries, and companies from database
    const [portsResult, refineriesResult, companiesResult] = await Promise.all([
      supabase.from('ports').select('id, name, country, lat, lng').limit(50),
      supabase.from('refineries').select('id, name, country').limit(50),
      supabase.from('companies').select('id, name, country, company_type').limit(50)
    ]);

    const ports = portsResult.data || [];
    const refineries = refineriesResult.data || [];
    const companies = companiesResult.data || [];

    console.log('[ai-vessel-search] Loaded data - Ports:', ports.length, 'Refineries:', refineries.length, 'Companies:', companies.length);

    // Select random data from real database entries
    const departurePort = ports[Math.floor(Math.random() * ports.length)];
    const destinationPort = ports.filter(p => p.id !== departurePort?.id)[Math.floor(Math.random() * Math.max(1, ports.length - 1))] || ports[0];
    const targetRefinery = refineries[Math.floor(Math.random() * refineries.length)];
    
    const buyerCompanies = companies.filter(c => c.company_type === 'buyer');
    const sellerCompanies = companies.filter(c => c.company_type === 'seller');
    const realCompanies = companies.filter(c => c.company_type === 'real');
    
    const buyerCompany = buyerCompanies.length > 0 ? buyerCompanies[Math.floor(Math.random() * buyerCompanies.length)] : companies[0];
    const sellerCompany = sellerCompanies.length > 0 ? sellerCompanies[Math.floor(Math.random() * sellerCompanies.length)] : companies[1];
    const sourceCompany = realCompanies.length > 0 ? realCompanies[Math.floor(Math.random() * realCompanies.length)] : companies[2];

    // Generate vessel data with REAL database entries
    const vesselType = VESSEL_TYPES[Math.floor(Math.random() * VESSEL_TYPES.length)];
    const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
    const isLargeVessel = vesselType.includes('VLCC') || vesselType.includes('Suezmax');
    const deadweight = isLargeVessel ? Math.floor(Math.random() * 200000 + 150000) : Math.floor(Math.random() * 100000 + 30000);
    const length = isLargeVessel ? Math.floor(Math.random() * 100 + 300) : Math.floor(Math.random() * 100 + 150);
    const width = isLargeVessel ? Math.floor(Math.random() * 20 + 50) : Math.floor(Math.random() * 15 + 25);

    // Generate dates
    const now = new Date();
    const departureDate = new Date(now.getTime() - (Math.random() * 7 + 3) * 24 * 60 * 60 * 1000);
    const eta = new Date(now.getTime() + (Math.random() * 5 + 1) * 24 * 60 * 60 * 1000);

    // Generate coordinates in known shipping lanes
    const shippingLanes = [
      { lat: 26.5, lng: 52.0, region: 'Persian Gulf' },
      { lat: 35.5, lng: 18.0, region: 'Mediterranean' },
      { lat: 56.5, lng: 3.5, region: 'North Sea' },
      { lat: 1.5, lng: 104.5, region: 'Singapore Strait' },
    ];
    const lane = shippingLanes[Math.floor(Math.random() * shippingLanes.length)];
    const currentLat = lane.lat + (Math.random() * 2 - 1);
    const currentLng = lane.lng + (Math.random() * 2 - 1);

    const vesselData = {
      // BASIC INFO - REQUIRED FIELDS
      vessel_type: vesselType,
      flag: flag,
      status: VESSEL_STATUSES[Math.floor(Math.random() * VESSEL_STATUSES.length)],
      built: Math.floor(Math.random() * 20 + 2005),
      callsign: `${flag.substring(0, 2).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      
      // TECHNICAL SPECS
      length: length,
      width: width,
      beam: `${width} m`,
      draught: parseFloat((isLargeVessel ? Math.random() * 5 + 18 : Math.random() * 5 + 10).toFixed(1)),
      draft: `${(isLargeVessel ? Math.random() * 5 + 18 : Math.random() * 5 + 10).toFixed(1)} m`,
      deadweight: deadweight,
      gross_tonnage: Math.floor(deadweight * 0.55),
      cargo_capacity: Math.floor(deadweight * 0.95),
      engine_power: Math.floor(Math.random() * 20000 + 15000),
      crew_size: Math.floor(Math.random() * 15 + 20),
      fuel_consumption: parseFloat((Math.random() * 100 + 50).toFixed(1)),
      
      // NAVIGATION - REQUIRED
      current_lat: parseFloat(currentLat.toFixed(6)),
      current_lng: parseFloat(currentLng.toFixed(6)),
      speed: `${(Math.random() * 6 + 10).toFixed(1)} knots`,
      course: Math.floor(Math.random() * 360),
      nav_status: NAV_STATUSES[Math.floor(Math.random() * NAV_STATUSES.length)],
      current_region: lane.region,
      
      // ROUTE - CRITICAL REQUIRED FIELDS (from real database)
      departure_port: departurePort?.id || null,
      destination_port: destinationPort?.id || null,
      loading_port: departurePort?.name || 'Loading Port',
      discharge_port: destinationPort?.name || 'Discharge Port',
      departure_date: departureDate.toISOString(),
      eta: eta.toISOString(),
      route_distance: Math.floor(Math.random() * 8000 + 500),
      route_info: `${departurePort?.name || 'Origin'} → ${destinationPort?.name || 'Destination'}`,
      voyage_status: 'In Progress',
      
      // CARGO
      cargo_type: CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)],
      oil_type: OIL_TYPES[Math.floor(Math.random() * OIL_TYPES.length)],
      cargo_quantity: Math.floor(deadweight * 0.9),
      sanctions_status: 'Non-Sanctioned',
      
      // COMMERCIAL PARTIES - from real database
      owner_name: sourceCompany?.name || 'Shell Trading',
      operator_name: sourceCompany?.name || 'Shell Trading',
      source_company: sourceCompany?.name || 'Oil Supplier Inc',
      target_refinery: targetRefinery?.name || 'Refinery',
      buyer_name: buyerCompany?.name || 'Buyer Company',
      seller_name: sellerCompany?.name || 'Seller Company',
      buyer_company_id: buyerCompany?.id || null,
      seller_company_id: sellerCompany?.id || null,
      commodity_source_company_id: sourceCompany?.id || null,
      
      // DEAL - REQUIRED
      deal_status: DEAL_STATUSES[Math.floor(Math.random() * DEAL_STATUSES.length)],
      deal_reference_id: `PDH-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      contract_type: 'Spot',
      delivery_terms: 'FOB',
      market_price: Math.floor(Math.random() * 30 + 70),
      indicative_price: Math.floor(Math.random() * 30 + 70),
      deal_value: Math.floor(Math.random() * 50000000 + 10000000),
      
      ai_autofill_source: 'AIS'
    };

    console.log('[ai-vessel-search] Generated vessel data with real ports/refineries');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vessel data generated successfully with real database entries',
        vesselData: vesselData,
        isRealData: false,
        metadata: {
          departurePort: departurePort?.name,
          destinationPort: destinationPort?.name,
          targetRefinery: targetRefinery?.name,
          region: lane.region
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[ai-vessel-search] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function sanitizeVesselData(aiData: any): any {
  const sanitized: any = {};

  // Define field mappings with validation
  const fieldValidations = {
    vessel_type: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    flag: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    mmsi: (v: any) => typeof v === 'string' && /^\d{9}$/.test(v) ? v : null,
    imo: (v: any) => typeof v === 'string' && /^\d{7}$/.test(v) ? v : null,
    callsign: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    built: (v: any) => typeof v === 'number' && v >= 1980 && v <= 2024 ? v : null,
    length: (v: any) => typeof v === 'number' && v > 0 && v < 500 ? v : null,
    width: (v: any) => typeof v === 'number' && v > 0 && v < 100 ? v : null,
    beam: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    draught: (v: any) => typeof v === 'number' && v > 0 && v < 50 ? v : null,
    draft: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    deadweight: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    gross_tonnage: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    cargo_capacity: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    cargo_quantity: (v: any) => typeof v === 'number' && v >= 0 ? v : null,
    engine_power: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    crew_size: (v: any) => typeof v === 'number' && v > 0 && v < 100 ? v : null,
    fuel_consumption: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    speed: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    course: (v: any) => typeof v === 'number' && v >= 0 && v <= 360 ? v : null,
    nav_status: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    cargo_type: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    oil_type: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    oil_source: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    owner_name: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    operator_name: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    buyer_name: (v: any) => typeof v === 'string' ? v || null : null,
    seller_name: (v: any) => typeof v === 'string' ? v || null : null,
    source_company: (v: any) => typeof v === 'string' ? v || null : null,
    target_refinery: (v: any) => typeof v === 'string' ? v || null : null,
    current_lat: (v: any) => typeof v === 'number' && v >= -90 && v <= 90 ? v : null,
    current_lng: (v: any) => typeof v === 'number' && v >= -180 && v <= 180 ? v : null,
    current_region: (v: any) => typeof v === 'string' ? v || null : null,
    status: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    destination: (v: any) => typeof v === 'string' ? v || null : null,
    eta: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    departure_port: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    destination_port: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    departure_date: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    arrival_date: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    departure_lat: (v: any) => typeof v === 'number' && v >= -90 && v <= 90 ? v : null,
    departure_lng: (v: any) => typeof v === 'number' && v >= -180 && v <= 180 ? v : null,
    destination_lat: (v: any) => typeof v === 'number' && v >= -90 && v <= 90 ? v : null,
    destination_lng: (v: any) => typeof v === 'number' && v >= -180 && v <= 180 ? v : null,
    loading_port: (v: any) => typeof v === 'string' ? v || null : null,
    route_distance: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    route_info: (v: any) => typeof v === 'string' ? v || null : null,
    shipping_type: (v: any) => typeof v === 'string' ? v || null : null,
    deal_value: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    price: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    market_price: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    quantity: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    company_id: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    refinery_id: (v: any) => typeof v === 'string' && v.length > 0 ? v : null
  };

  // Apply validations
  for (const [field, validator] of Object.entries(fieldValidations)) {
    if (aiData[field] !== undefined) {
      const validatedValue = validator(aiData[field]);
      if (validatedValue !== null) {
        sanitized[field] = validatedValue;
      }
    }
  }

  return sanitized;
}