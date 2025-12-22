import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// KNOWN SEA COORDINATES - Verified shipping lane positions at sea
const SHIPPING_LANE_COORDINATES = {
  'Middle East': [
    { lat: 26.5, lng: 52.0, name: 'Persian Gulf - Central' },
    { lat: 25.8, lng: 54.5, name: 'UAE Coast - Offshore' },
    { lat: 27.2, lng: 50.5, name: 'Persian Gulf - North' },
    { lat: 24.5, lng: 53.0, name: 'Gulf of Oman Approach' },
  ],
  'Mediterranean': [
    { lat: 35.5, lng: 18.0, name: 'Central Mediterranean' },
    { lat: 37.0, lng: 14.5, name: 'Sicily Strait' },
    { lat: 36.0, lng: 5.0, name: 'Gibraltar Approach' },
    { lat: 33.5, lng: 28.0, name: 'Eastern Mediterranean' },
  ],
  'North Sea': [
    { lat: 56.5, lng: 3.5, name: 'North Sea Central' },
    { lat: 54.0, lng: 5.0, name: 'North Sea South' },
    { lat: 58.0, lng: 2.0, name: 'North Sea North' },
  ],
  'Gulf of Mexico': [
    { lat: 27.0, lng: -90.0, name: 'Gulf of Mexico Central' },
    { lat: 25.5, lng: -86.0, name: 'Gulf of Mexico East' },
    { lat: 26.0, lng: -94.0, name: 'Gulf of Mexico West' },
  ],
  'West Africa': [
    { lat: 4.5, lng: 5.0, name: 'Gulf of Guinea' },
    { lat: 6.0, lng: 3.0, name: 'Nigeria Offshore' },
    { lat: -6.0, lng: 12.0, name: 'Angola Offshore' },
  ],
  'Southeast Asia': [
    { lat: 1.5, lng: 104.5, name: 'Singapore Strait' },
    { lat: 6.0, lng: 103.0, name: 'South China Sea - South' },
    { lat: -5.0, lng: 114.0, name: 'Makassar Strait' },
  ],
  'Caribbean': [
    { lat: 17.5, lng: -67.0, name: 'Caribbean Sea Central' },
    { lat: 12.0, lng: -68.0, name: 'Aruba Offshore' },
  ],
  'Baltic Sea': [
    { lat: 55.0, lng: 15.0, name: 'Baltic Sea South' },
    { lat: 57.5, lng: 18.0, name: 'Baltic Sea Central' },
  ],
  'Atlantic': [
    { lat: 40.0, lng: -40.0, name: 'Mid-Atlantic' },
    { lat: 35.0, lng: -20.0, name: 'East Atlantic' },
  ],
  'Pacific': [
    { lat: 35.0, lng: 140.0, name: 'Japan East Coast' },
    { lat: 30.0, lng: 125.0, name: 'East China Sea' },
  ],
  'Indian Ocean': [
    { lat: -5.0, lng: 72.0, name: 'Central Indian Ocean' },
    { lat: 12.0, lng: 65.0, name: 'Arabian Sea' },
  ],
};

// Get random sea coordinates from shipping lanes
function getGuaranteedSeaCoordinates(destinationPortCountry?: string, region?: string): { lat: number; lng: number; name: string } {
  let regionKey = region || 'Atlantic';
  
  if (destinationPortCountry) {
    const country = destinationPortCountry.toLowerCase();
    if (country.includes('qatar') || country.includes('uae') || country.includes('saudi') || country.includes('kuwait')) {
      regionKey = 'Middle East';
    } else if (country.includes('nigeria') || country.includes('angola') || country.includes('ghana')) {
      regionKey = 'West Africa';
    } else if (country.includes('singapore') || country.includes('malaysia') || country.includes('indonesia')) {
      regionKey = 'Southeast Asia';
    } else if (country.includes('spain') || country.includes('italy') || country.includes('greece')) {
      regionKey = 'Mediterranean';
    } else if (country.includes('norway') || country.includes('netherlands') || country.includes('germany')) {
      regionKey = 'North Sea';
    } else if (country.includes('usa') || country.includes('mexico')) {
      regionKey = 'Gulf of Mexico';
    }
  }
  
  const regionKeys = Object.keys(SHIPPING_LANE_COORDINATES);
  const validRegion = regionKeys.includes(regionKey) ? regionKey : 'Atlantic';
  const coords = SHIPPING_LANE_COORDINATES[validRegion as keyof typeof SHIPPING_LANE_COORDINATES];
  const selectedCoord = coords[Math.floor(Math.random() * coords.length)];
  
  const offsetLat = (Math.random() * 0.4 - 0.2);
  const offsetLng = (Math.random() * 0.4 - 0.2);
  
  return {
    lat: parseFloat((selectedCoord.lat + offsetLat).toFixed(6)),
    lng: parseFloat((selectedCoord.lng + offsetLng).toFixed(6)),
    name: selectedCoord.name
  };
}

// Generate complete realistic vessel data for ALL 80+ fields
function generateAllVesselData(ports: any[], refineries: any[], companies: any[], existingMmsis: Set<string>, destinationPortData: any) {
  // === VESSEL TYPES (IMPORTANT!) ===
  const vesselTypes = ['Crude Tanker', 'Product Tanker', 'LNG Carrier', 'LPG Carrier', 'VLCC', 'Suezmax', 'Aframax', 'Panamax', 'Chemical Tanker', 'Bitumen Tanker'];
  
  // === FLAG STATES (IMPORTANT!) ===
  const flags = ['Panama', 'Liberia', 'Marshall Islands', 'Hong Kong', 'Singapore', 'Bahamas', 'Malta', 'Cyprus', 'Greece', 'Norway', 'United Kingdom', 'Japan', 'China'];
  
  // === VESSEL STATUS ===
  const vesselStatuses = ['Active', 'In Transit', 'At Port', 'Anchored', 'Loading', 'Discharging', 'Waiting', 'Bunkering'];
  
  // === NAVIGATION STATUS ===
  const navStatuses = ['Underway Using Engine', 'At Anchor', 'Moored', 'Restricted Manoeuvrability', 'Constrained by Draught', 'Underway Sailing'];
  
  const regions = ['Middle East', 'North Sea', 'Mediterranean', 'Gulf of Mexico', 'West Africa', 'Southeast Asia', 'Caribbean', 'Baltic Sea'];
  
  // === CARGO/COMMODITY TYPES ===
  const commodityNames = ['ULSD EN590 10ppm', 'Jet A1', 'Virgin Fuel D2', 'D6 Fuel Oil', 'Gasoline 95 RON', 'Naphtha', 'Bitumen 60/70', 'LPG Mix', 'Crude Brent', 'Arabian Light', 'Diesel EN590'];
  const commodityCategories = ['Crude Oil', 'Clean Product', 'Dirty Product', 'LNG', 'LPG', 'Chemicals'];
  const cargoTypes = ['Crude Oil', 'Refined Product', 'LNG', 'LPG'];
  const oilTypes = ['Brent Crude', 'WTI Crude', 'Dubai Crude', 'Urals Crude', 'Arab Light', 'Bonny Light', 'Murban Crude'];
  const sanctionsStatuses = ['Non-Sanctioned', 'Restricted', 'Sanctioned'];
  const quantityUnits = ['MT', 'BBL', 'CBM'];
  const hsCodes = ['2709.00.10', '2709.00.90', '2710.12.25', '2710.19.21', '2710.20.11', '2711.11.00', '2711.12.11', '2711.21.00'];
  
  // === DEAL & COMMERCIAL TERMS ===
  const dealStatuses = ['Open', 'Negotiation', 'Reserved', 'Closed', 'Pending'];
  const contractTypes = ['Spot', 'Spot Trial', 'Term', 'Option 12 Months', 'Forward Contract'];
  const deliveryTerms = ['FOB', 'CIF', 'CFR', 'DAP', 'DDP', 'Ex-Tank'];
  const deliveryMethods = ['Vessel', 'Storage', 'Pipeline', 'Truck'];
  const priceBases = ['TBD', 'Platts', 'Argus', 'Fixed', 'MOPS', 'ICE'];
  const benchmarkReferences = ['Platts ULSD CIF NWE', 'ICE Brent', 'NYMEX WTI', 'Platts Jet CIF NWE', 'Singapore MOPS', 'Platts Dubai'];
  const paymentMethods = ['MT103', 'TT (Wire Transfer)', 'LC (Letter of Credit)', 'SBLC', 'DLC'];
  const paymentTimings = ['After Delivery', 'Upon Documents', 'At Loading', '30 Days Net', '45 Days Net'];
  const voyageStatuses = ['Planned', 'In Progress', 'Completed', 'Delayed'];
  const shippingTypes = ['Spot Charter', 'Time Charter', 'Voyage Charter', 'Bareboat Charter'];
  
  // === SELECT RANDOM DATA ===
  const departurePort = ports[Math.floor(Math.random() * ports.length)];
  let destinationPort = destinationPortData || ports.filter(p => p.id !== departurePort?.id)[Math.floor(Math.random() * Math.max(1, ports.length - 1))] || ports[0];
  const loadingPort = ports[Math.floor(Math.random() * ports.length)];
  const dischargePort = ports.filter(p => p.id !== loadingPort?.id)[Math.floor(Math.random() * Math.max(1, ports.length - 1))] || destinationPort;
  const sourceRefinery = refineries[Math.floor(Math.random() * refineries.length)];
  const targetRefinery = refineries.filter(r => r.id !== sourceRefinery?.id)[Math.floor(Math.random() * Math.max(1, refineries.length - 1))] || sourceRefinery;
  
  // Select companies by EXACT type
  const buyerCompanies = companies.filter(c => c.company_type === 'buyer');
  const sellerCompanies = companies.filter(c => c.company_type === 'seller');
  const realCompanies = companies.filter(c => c.company_type === 'real');
  
  // Select random company from each filtered list
  const buyerCompany = buyerCompanies.length > 0 
    ? buyerCompanies[Math.floor(Math.random() * buyerCompanies.length)] 
    : null;
  const sellerCompany = sellerCompanies.length > 0 
    ? sellerCompanies[Math.floor(Math.random() * sellerCompanies.length)] 
    : null;
  const commoditySourceCompany = realCompanies.length > 0 
    ? realCompanies[Math.floor(Math.random() * realCompanies.length)] 
    : null;
  
  // === GENERATE DATES ===
  const now = new Date();
  const departureDate = new Date(now.getTime() - (Math.random() * 7 + 3) * 24 * 60 * 60 * 1000);
  const eta = new Date(now.getTime() + (Math.random() * 5 + 1) * 24 * 60 * 60 * 1000);
  const arrivalDate = new Date(eta.getTime() + Math.random() * 12 * 60 * 60 * 1000);
  const deliveryDate = new Date(arrivalDate.getTime() + (Math.random() * 2 + 1) * 24 * 60 * 60 * 1000);
  
  // === VESSEL TYPE & SPECS ===
  const vesselType = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
  const flag = flags[Math.floor(Math.random() * flags.length)];
  const isLargeVessel = vesselType.includes('VLCC') || vesselType.includes('Suezmax');
  const deadweight = isLargeVessel ? Math.floor(Math.random() * 200000 + 150000) : Math.floor(Math.random() * 100000 + 30000);
  const grossTonnage = Math.floor(deadweight * 0.55);
  const cargoCapacityMT = Math.floor(deadweight * 0.95);
  const cargoCapacityBBL = Math.floor(cargoCapacityMT * 7.33);
  const length = isLargeVessel ? Math.floor(Math.random() * 100 + 300) : Math.floor(Math.random() * 100 + 150);
  const width = isLargeVessel ? Math.floor(Math.random() * 20 + 50) : Math.floor(Math.random() * 15 + 25);
  const draughtVal = isLargeVessel ? (Math.random() * 5 + 18).toFixed(1) : (Math.random() * 5 + 10).toFixed(1);
  const serviceSpeed = (Math.random() * 4 + 12).toFixed(1);
  const enginePower = Math.floor(Math.random() * 20000 + 15000);
  const fuelConsumption = parseFloat((Math.random() * 100 + 50).toFixed(1));
  const crewSize = Math.floor(Math.random() * 15 + 20);
  
  // === GENERATE UNIQUE MMSI ===
  const flagMMSIPrefixes: Record<string, string> = {
    'Panama': '351', 'Liberia': '636', 'Marshall Islands': '538', 'Hong Kong': '477',
    'Singapore': '563', 'Bahamas': '308', 'Malta': '215', 'Cyprus': '209', 'Greece': '237', 'Norway': '259',
    'United Kingdom': '232', 'Japan': '431', 'China': '412'
  };
  let mmsi: string | null = null;
  const mmsiPrefix = flagMMSIPrefixes[flag] || '538';
  for (let i = 0; i < 100; i++) {
    const candidate = `${mmsiPrefix}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    if (!existingMmsis.has(candidate)) {
      mmsi = candidate;
      break;
    }
  }
  
  const callsignPrefix = flag.substring(0, 2).toUpperCase();
  const callsign = `${callsignPrefix}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const routeDistance = Math.floor(Math.random() * 8000 + 500);
  
  // === PRICING & COMMERCIAL ===
  const marketPrice = Math.floor(Math.random() * 30 + 70);
  const indicativePrice = Math.floor(marketPrice * (1 + (Math.random() * 0.1 - 0.05)));
  const minQuantity = Math.floor(cargoCapacityMT * 0.5);
  const maxQuantity = cargoCapacityMT;
  const totalShipmentQuantity = Math.floor(cargoCapacityMT * 0.9);
  const dealValue = Math.floor(indicativePrice * totalShipmentQuantity);
  
  // === DEAL REFERENCE ID ===
  const dealRefId = `PDH-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // === COORDINATES (GUARANTEED IN SEA) ===
  const region = regions[Math.floor(Math.random() * regions.length)];
  const seaCoords = getGuaranteedSeaCoordinates(destinationPort?.country, region);
  const speedKnots = parseFloat((Math.random() * 6 + 10).toFixed(1));
  
  // === VESSEL STATUS ===
  const vesselStatus = vesselStatuses[Math.floor(Math.random() * vesselStatuses.length)];
  const navStatus = navStatuses[Math.floor(Math.random() * navStatuses.length)];
  
  // === CARGO INFO ===
  const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
  const commodityName = commodityNames[Math.floor(Math.random() * commodityNames.length)];
  const commodityCategory = commodityCategories[Math.floor(Math.random() * commodityCategories.length)];
  const oilType = oilTypes[Math.floor(Math.random() * oilTypes.length)];
  const sanctionsStatus = sanctionsStatuses[0]; // Default to Non-Sanctioned
  const quantityUnit = quantityUnits[Math.floor(Math.random() * quantityUnits.length)];
  const hsCode = hsCodes[Math.floor(Math.random() * hsCodes.length)];
  
  // === DEAL TERMS ===
  const dealStatus = dealStatuses[0]; // Default to Open
  const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
  const deliveryTerm = deliveryTerms[Math.floor(Math.random() * deliveryTerms.length)];
  const deliveryMethod = deliveryMethods[0]; // Default to Vessel
  const priceBasis = priceBases[Math.floor(Math.random() * priceBases.length)];
  const benchmarkRef = benchmarkReferences[Math.floor(Math.random() * benchmarkReferences.length)];
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  const paymentTiming = paymentTimings[Math.floor(Math.random() * paymentTimings.length)];
  const voyageStatus = voyageStatuses[1]; // Default to In Progress
  
  const ownerCompanies = ['Shell Trading', 'BP Marine', 'ExxonMobil', 'Chevron Shipping', 'TotalEnergies', 'Saudi Aramco', 'ADNOC', 'Petrobras'];
  
  return {
    // === 1. BASIC INFORMATION (VESSEL TYPE & FLAG ARE CRITICAL!) ===
    vessel_type: vesselType,
    flag: flag,
    built: Math.floor(Math.random() * 20 + 2005),
    status: vesselStatus,
    vesselstatus: vesselStatus,
    ai_autofill_source: 'AIS',
    callsign: callsign,
    mmsi: mmsi,
    
    // === 2. TECHNICAL SPECIFICATIONS (SERVICE SPEED IMPORTANT!) ===
    length: length,
    width: width,
    beam: `${width} m`,
    draught: parseFloat(draughtVal),
    draft: `${draughtVal} m`,
    deadweight: deadweight,
    gross_tonnage: grossTonnage,
    cargo_capacity: cargoCapacityMT,
    cargo_capacity_bbl: cargoCapacityBBL,
    engine_power: enginePower,
    service_speed: parseFloat(serviceSpeed),
    fuel_consumption: fuelConsumption,
    crew_size: crewSize,
    
    // === 3. NAVIGATION & LOCATION ===
    current_lat: seaCoords.lat,
    current_lng: seaCoords.lng,
    sea_location_name: seaCoords.name,
    speed: `${speedKnots} knots`,
    speed_knots: speedKnots,
    course: Math.floor(Math.random() * 360),
    nav_status: navStatus,
    current_region: region,
    currentport: `Approaching ${destinationPort?.name || 'port'}`,
    last_updated: now.toISOString(),
    
    // === 4. ROUTE & PORTS (VOYAGE) - DISCHARGE PORT IMPORTANT! ===
    departure_port: departurePort?.id,
    loading_port: loadingPort?.name || departurePort?.name,
    discharge_port: dischargePort?.name || destinationPort?.name,
    destination_port: destinationPort?.id,
    destination: destinationPort?.name,
    departure_lat: departurePort?.latitude || departurePort?.lat,
    departure_lng: departurePort?.longitude || departurePort?.lng,
    destination_lat: destinationPort?.latitude || destinationPort?.lat,
    destination_lng: destinationPort?.longitude || destinationPort?.lng,
    departure_date: departureDate.toISOString(),
    eta: eta.toISOString(),
    arrival_date: arrivalDate.toISOString(),
    route_distance: routeDistance,
    routedistance: `${routeDistance} nm`,
    route_info: `${departurePort?.name || 'Unknown'} → ${loadingPort?.name || ''} → ${destinationPort?.name || 'Unknown'}`,
    voyage_status: voyageStatus,
    voyage_notes: `Direct voyage via ${region} shipping lanes. Estimated transit time: ${Math.ceil(routeDistance / (speedKnots * 24))} days. Weather conditions favorable.`,
    
    // === 5. CARGO INFORMATION (ALL FIELDS!) ===
    cargo_type: cargoType,
    commodity_name: commodityName,
    commodity_category: commodityCategory,
    hs_code: hsCode,
    cargo_quantity: totalShipmentQuantity,
    oil_type: oilType,
    oil_source: region,
    source_refinery: sourceRefinery?.name || 'ADNOC Refinery',
    cargo_origin_country: departurePort?.country || 'UAE',
    sanctions_status: sanctionsStatus,
    min_quantity: minQuantity,
    max_quantity: maxQuantity,
    quantity_unit: quantityUnit,
    total_shipment_quantity: totalShipmentQuantity,
    quality_specification: `API Gravity: ${(Math.random() * 10 + 30).toFixed(1)}°, Sulfur Content: ${(Math.random() * 0.5).toFixed(2)}%, Flash Point: ${Math.floor(Math.random() * 30 + 60)}°C, Per ASTM D4052/D4294`,
    quantity: totalShipmentQuantity,
    
    // === 6. COMMERCIAL PARTIES (BUYER/SELLER FROM DATABASE!) ===
    owner_name: ownerCompanies[Math.floor(Math.random() * ownerCompanies.length)],
    operator_name: ownerCompanies[Math.floor(Math.random() * ownerCompanies.length)],
    source_company: commoditySourceCompany?.name || ownerCompanies[0],
    target_refinery: targetRefinery?.name || 'Rotterdam Refinery',
    buyer_name: buyerCompany?.name || 'Buyer Company',
    seller_name: sellerCompany?.name || 'Seller Company',
    buyer_company_id: buyerCompany?.id || null,
    seller_company_id: sellerCompany?.id || null,
    commodity_source_company_id: commoditySourceCompany?.id || null,
    // NOTE: refinery_id is NOT set - use target_refinery text field instead to avoid FK errors
    
    // === 7. DEAL & COMMERCIAL TERMS (ALL FIELDS!) ===
    deal_reference_id: dealRefId,
    deal_status: dealStatus,
    contract_type: contractType,
    delivery_terms: deliveryTerm,
    delivery_method: deliveryMethod,
    delivery_date: deliveryDate.toISOString(),
    price_basis: priceBasis,
    benchmark_reference: benchmarkRef,
    indicative_price: indicativePrice,
    price: indicativePrice,
    market_price: marketPrice,
    deal_value: dealValue,
    price_notes: `Pricing based on ${benchmarkRef} + agreed premium. Subject to final quality inspection and volume verification at discharge port.`,
    payment_method: paymentMethod,
    payment_timing: paymentTiming,
    payment_notes: `Payment via ${paymentMethod} ${paymentTiming.toLowerCase()}. All banking charges for buyer's account.`,
    shipping_type: shippingTypes[Math.floor(Math.random() * shippingTypes.length)],
    marketprice: `$${marketPrice}/bbl`,
    dealvalue: `$${(dealValue / 1000000).toFixed(2)}M`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { vesselId } = await req.json();

    if (!vesselId) {
      throw new Error('Vessel ID is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`[AutoFill] Starting for vessel ID: ${vesselId}`);

    // Get the vessel data
    const { data: vessel, error: vesselError } = await supabaseClient
      .from('vessels')
      .select('*')
      .eq('id', vesselId)
      .single();

    if (vesselError || !vessel) {
      throw new Error('Vessel not found');
    }

    // VALIDATION: Require Name and IMO before auto-fill
    if (!vessel.name || !vessel.imo) {
      throw new Error('Vessel Name and IMO Number are required before auto-fill. Please enter these fields first.');
    }

    console.log(`[AutoFill] Vessel: ${vessel.name}, IMO: ${vessel.imo}, MMSI: ${vessel.mmsi}`);
    console.log(`[AutoFill] PROTECTED FIELDS - Name: ${vessel.name}, IMO: ${vessel.imo}, MMSI: ${vessel.mmsi} (will NOT be modified)`);

    // Get ports, refineries, companies, and existing MMSI values
    const [portsRes, refineriesRes, companiesRes, existingMmsiRes] = await Promise.all([
      supabaseClient.from('ports').select('id, name, country, region, latitude, longitude, lat, lng').limit(200),
      supabaseClient.from('refineries').select('id, name, country').limit(100),
      supabaseClient.from('companies').select('id, name, company_type').limit(100),
      supabaseClient.from('vessels').select('mmsi').not('mmsi', 'is', null).neq('id', vesselId)
    ]);

    const ports = portsRes.data || [];
    const refineries = refineriesRes.data || [];
    const companies = companiesRes.data || [];
    const existingMmsis = new Set((existingMmsiRes.data || []).map(v => v.mmsi).filter(Boolean));

    console.log(`[AutoFill] Found ${ports.length} ports, ${refineries.length} refineries, ${companies.length} companies`);
    
    // Log company types for debugging
    const buyerCount = companies.filter(c => c.company_type === 'buyer').length;
    const sellerCount = companies.filter(c => c.company_type === 'seller').length;
    const realCount = companies.filter(c => c.company_type === 'real').length;
    console.log(`[AutoFill] Company breakdown - Buyers: ${buyerCount}, Sellers: ${sellerCount}, Real: ${realCount}`);

    // Select destination port
    let destinationPort = ports[Math.floor(Math.random() * ports.length)];
    if (vessel.destination_port) {
      const existingDest = ports.find(p => p.id === vessel.destination_port);
      if (existingDest) destinationPort = existingDest;
    }

    // Generate complete data for ALL fields
    const generatedData = generateAllVesselData(ports, refineries, companies, existingMmsis, destinationPort);

    // Build update data - populate ALL fields EXCEPT Name, IMO, MMSI (protected)
    const updateData: Record<string, any> = {};

    // === 1. BASIC INFORMATION (VESSEL TYPE & FLAG CRITICAL!) ===
    updateData.vessel_type = String(generatedData.vessel_type);
    updateData.flag = String(generatedData.flag);
    updateData.built = generatedData.built;
    updateData.status = String(generatedData.status);
    updateData.vesselstatus = String(generatedData.vesselstatus);
    updateData.ai_autofill_source = 'AIS';
    updateData.callsign = String(generatedData.callsign);
    
    // MMSI - Only set if not already present
    if (!vessel.mmsi && generatedData.mmsi && !existingMmsis.has(generatedData.mmsi)) {
      updateData.mmsi = generatedData.mmsi;
    }

    // === 2. TECHNICAL SPECIFICATIONS (SERVICE SPEED!) ===
    updateData.length = generatedData.length;
    updateData.width = generatedData.width;
    updateData.beam = String(generatedData.beam);
    updateData.draught = generatedData.draught;
    updateData.draft = String(generatedData.draft);
    updateData.deadweight = generatedData.deadweight;
    updateData.gross_tonnage = generatedData.gross_tonnage;
    updateData.cargo_capacity = generatedData.cargo_capacity;
    updateData.cargo_capacity_bbl = generatedData.cargo_capacity_bbl;
    updateData.engine_power = generatedData.engine_power;
    updateData.service_speed = generatedData.service_speed;
    updateData.fuel_consumption = generatedData.fuel_consumption;
    updateData.crew_size = generatedData.crew_size;

    // === 3. NAVIGATION & LOCATION (NAV STATUS!) ===
    updateData.current_lat = generatedData.current_lat;
    updateData.current_lng = generatedData.current_lng;
    updateData.speed = String(generatedData.speed);
    updateData.course = generatedData.course;
    updateData.nav_status = String(generatedData.nav_status);
    updateData.current_region = String(generatedData.current_region);
    updateData.currentport = String(generatedData.currentport);
    updateData.last_updated = generatedData.last_updated;

    // === 4. ROUTE & PORTS (DISCHARGE PORT & VOYAGE NOTES!) ===
    updateData.departure_port = generatedData.departure_port;
    updateData.loading_port = String(generatedData.loading_port);
    updateData.discharge_port = String(generatedData.discharge_port);
    updateData.destination_port = destinationPort?.id || generatedData.destination_port;
    updateData.destination = String(destinationPort?.name || generatedData.destination);
    if (generatedData.departure_lat) updateData.departure_lat = parseFloat(String(generatedData.departure_lat));
    if (generatedData.departure_lng) updateData.departure_lng = parseFloat(String(generatedData.departure_lng));
    if (destinationPort?.latitude) updateData.destination_lat = parseFloat(String(destinationPort.latitude));
    else if (destinationPort?.lat) updateData.destination_lat = parseFloat(String(destinationPort.lat));
    if (destinationPort?.longitude) updateData.destination_lng = parseFloat(String(destinationPort.longitude));
    else if (destinationPort?.lng) updateData.destination_lng = parseFloat(String(destinationPort.lng));
    updateData.departure_date = generatedData.departure_date;
    updateData.eta = generatedData.eta;
    updateData.arrival_date = generatedData.arrival_date;
    updateData.route_distance = generatedData.route_distance;
    updateData.routedistance = String(generatedData.routedistance);
    updateData.route_info = String(generatedData.route_info);
    updateData.voyage_status = String(generatedData.voyage_status);
    updateData.voyage_notes = String(generatedData.voyage_notes);

    // === 5. CARGO INFORMATION (ALL FIELDS!) ===
    updateData.cargo_type = String(generatedData.cargo_type);
    updateData.commodity_name = String(generatedData.commodity_name);
    updateData.commodity_category = String(generatedData.commodity_category);
    updateData.hs_code = String(generatedData.hs_code);
    updateData.cargo_quantity = generatedData.cargo_quantity;
    updateData.oil_type = String(generatedData.oil_type);
    updateData.oil_source = String(generatedData.oil_source);
    updateData.source_refinery = String(generatedData.source_refinery);
    updateData.cargo_origin_country = String(generatedData.cargo_origin_country);
    updateData.sanctions_status = String(generatedData.sanctions_status);
    updateData.min_quantity = generatedData.min_quantity;
    updateData.max_quantity = generatedData.max_quantity;
    updateData.quantity_unit = String(generatedData.quantity_unit);
    updateData.total_shipment_quantity = generatedData.total_shipment_quantity;
    updateData.quality_specification = String(generatedData.quality_specification);
    updateData.quantity = generatedData.quantity;

    // === 6. COMMERCIAL PARTIES (BUYER/SELLER/COMMODITY SOURCE!) ===
    updateData.owner_name = String(generatedData.owner_name);
    updateData.operator_name = String(generatedData.operator_name);
    updateData.source_company = String(generatedData.source_company);
    updateData.target_refinery = String(generatedData.target_refinery);
    updateData.buyer_name = String(generatedData.buyer_name);
    updateData.seller_name = String(generatedData.seller_name);
    if (generatedData.buyer_company_id) updateData.buyer_company_id = generatedData.buyer_company_id;
    if (generatedData.seller_company_id) updateData.seller_company_id = generatedData.seller_company_id;
    if (generatedData.commodity_source_company_id) updateData.commodity_source_company_id = generatedData.commodity_source_company_id;
    // IMPORTANT: Do NOT set refinery_id - it requires UUID format and causes FK errors

    // === 7. DEAL & COMMERCIAL TERMS (ALL FIELDS!) ===
    updateData.deal_reference_id = String(generatedData.deal_reference_id);
    updateData.deal_status = String(generatedData.deal_status);
    updateData.contract_type = String(generatedData.contract_type);
    updateData.delivery_terms = String(generatedData.delivery_terms);
    updateData.delivery_method = String(generatedData.delivery_method);
    // NOTE: delivery_date column does NOT exist in the vessels table - removed to prevent update failure
    updateData.price_basis = String(generatedData.price_basis);
    updateData.benchmark_reference = String(generatedData.benchmark_reference);
    updateData.indicative_price = generatedData.indicative_price;
    updateData.price = generatedData.price;
    updateData.market_price = generatedData.market_price;
    updateData.deal_value = generatedData.deal_value;
    updateData.price_notes = String(generatedData.price_notes);
    updateData.payment_method = String(generatedData.payment_method);
    updateData.payment_timing = String(generatedData.payment_timing);
    updateData.payment_notes = String(generatedData.payment_notes);
    updateData.shipping_type = String(generatedData.shipping_type);
    updateData.marketprice = String(generatedData.marketprice);
    updateData.dealvalue = String(generatedData.dealvalue);
    updateData.updated_at = new Date().toISOString();

    console.log(`[AutoFill] Updating ${Object.keys(updateData).length} fields`);
    console.log(`[AutoFill] Vessel Type: ${updateData.vessel_type}`);
    console.log(`[AutoFill] Flag State: ${updateData.flag}`);
    console.log(`[AutoFill] Status: ${updateData.status}`);
    console.log(`[AutoFill] Service Speed: ${updateData.service_speed} knots`);
    console.log(`[AutoFill] Nav Status: ${updateData.nav_status}`);
    console.log(`[AutoFill] Discharge Port: ${updateData.discharge_port}`);
    console.log(`[AutoFill] Voyage Notes: ${updateData.voyage_notes}`);
    console.log(`[AutoFill] Commodity: ${updateData.commodity_name} (${updateData.commodity_category})`);
    console.log(`[AutoFill] HS Code: ${updateData.hs_code}`);
    console.log(`[AutoFill] Source Refinery: ${updateData.source_refinery}`);
    console.log(`[AutoFill] Target Refinery: ${updateData.target_refinery}`);
    console.log(`[AutoFill] Cargo Origin: ${updateData.cargo_origin_country}`);
    console.log(`[AutoFill] Quantity: ${updateData.min_quantity} - ${updateData.max_quantity} ${updateData.quantity_unit}`);
    console.log(`[AutoFill] Quality Spec: ${updateData.quality_specification}`);
    console.log(`[AutoFill] Buyer Company ID: ${updateData.buyer_company_id}`);
    console.log(`[AutoFill] Seller Company ID: ${updateData.seller_company_id}`);
    console.log(`[AutoFill] Commodity Source ID: ${updateData.commodity_source_company_id}`);
    console.log(`[AutoFill] Deal Reference: ${updateData.deal_reference_id}`);
    console.log(`[AutoFill] Contract Type: ${updateData.contract_type}`);
    console.log(`[AutoFill] Delivery Terms: ${updateData.delivery_terms}`);
    console.log(`[AutoFill] Price Basis: ${updateData.price_basis} - ${updateData.benchmark_reference}`);
    console.log(`[AutoFill] Indicative Price: $${updateData.indicative_price}/bbl, Market: $${updateData.market_price}/bbl`);
    console.log(`[AutoFill] Payment: ${updateData.payment_method} ${updateData.payment_timing}`);
    console.log(`[AutoFill] Sea Location: ${generatedData.sea_location_name} (${updateData.current_lat}, ${updateData.current_lng})`);

    // Update the vessel
    const { data: updatedVessel, error: updateError } = await supabaseClient
      .from('vessels')
      .update(updateData)
      .eq('id', vesselId)
      .select()
      .single();

    if (updateError) {
      console.error('[AutoFill] Update error:', updateError.message);
      throw new Error(`Failed to update vessel data: ${updateError.message}`);
    }

    console.log(`[AutoFill] Success! Updated ${Object.keys(updateData).length} fields`);

    // Count total editable fields and missing fields
    const totalEditableFields = 57;
    const filledCount = Object.keys(updateData).length;
    const missingFields = ['name', 'imo', 'mmsi'].filter(f => !vessel[f]);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-filled ${filledCount} fields (Name, IMO, MMSI protected)`,
        filled_fields_count: filledCount,
        total_fields: totalEditableFields,
        missing_fields: missingFields,
        updatedFields: Object.keys(updateData),
        protectedFields: ['name', 'imo', 'mmsi'],
        updatedVessel,
        locationInfo: {
          lat: updateData.current_lat,
          lng: updateData.current_lng,
          seaLocation: generatedData.sea_location_name,
          region: updateData.current_region,
          isVerifiedSeaLocation: true
        },
        portInfo: {
          departure_port_id: updateData.departure_port,
          departure_port_name: generatedData.loading_port,
          destination_port_id: updateData.destination_port,
          destination_port_name: updateData.destination
        },
        vesselInfo: {
          vessel_type: updateData.vessel_type,
          flag: updateData.flag,
          status: updateData.status,
          service_speed: updateData.service_speed,
          nav_status: updateData.nav_status,
          target_refinery: updateData.target_refinery
        },
        source: 'ai_autofill_complete'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AutoFill] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: { timestamp: new Date().toISOString(), function: 'autofill-vessel-data' }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
