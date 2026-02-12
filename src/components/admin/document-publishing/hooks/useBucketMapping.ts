// Enterprise Document Resolution Engine - Bucket Mapping Hook
// Implements intelligent placeholder-to-database mapping with alias resolution

export interface PlaceholderItem {
  name: string;
  source: 'database' | 'ai';
  resolvedColumn: string | null;
  resolvedTable: string | null;
  status: 'resolved_db' | 'resolved_ai' | 'auto_mapped' | 'manual_override';
  confidence: number;
  originalBucket: string;
}

export interface Bucket {
  id: string;
  name: string;
  displayName: string;
  table: string;
  icon: string;
  prefixes: string[];
  columns: string[];
  placeholders: PlaceholderItem[];
}

// Fixed bucket definitions matching database tables
export const BUCKET_DEFINITIONS: Omit<Bucket, 'columns' | 'placeholders'>[] = [
  {
    id: 'vessel',
    name: 'Vessel',
    displayName: '🚢 Vessel',
    table: 'vessels',
    icon: '🚢',
    prefixes: ['vessel_', 'ship_', 'v_'],
  },
  {
    id: 'ports',
    name: 'Ports',
    displayName: '⚓ Ports',
    table: 'ports',
    icon: '⚓',
    prefixes: ['port_', 'departure_port_', 'destination_port_', 'loading_port_', 'discharge_port_'],
  },
  {
    id: 'refinery',
    name: 'Refinery',
    displayName: '🏭 Refinery',
    table: 'refineries',
    icon: '🏭',
    prefixes: ['refinery_', 'ref_'],
  },
  {
    id: 'seller_company',
    name: 'Seller Company',
    displayName: '🏢 Seller Company',
    table: 'seller_companies',
    icon: '🏢',
    prefixes: ['seller_', 'seller_company_'],
  },
  {
    id: 'buyer_company',
    name: 'Buyer Company',
    displayName: '🏬 Buyer Company',
    table: 'buyer_companies',
    icon: '🏬',
    prefixes: ['buyer_', 'buyer_company_'],
  },
  {
    id: 'seller_bank',
    name: 'Seller Bank',
    displayName: '🏦 Seller Bank',
    table: 'seller_company_bank_accounts',
    icon: '🏦',
    prefixes: ['seller_bank_'],
  },
  {
    id: 'buyer_bank',
    name: 'Buyer Bank',
    displayName: '💳 Buyer Bank',
    table: 'buyer_company_bank_accounts',
    icon: '💳',
    prefixes: ['buyer_bank_'],
  },
  {
    id: 'product',
    name: 'Oil/Product',
    displayName: '🛢️ Oil/Product',
    table: 'oil_products',
    icon: '🛢️',
    prefixes: ['product_', 'oil_', 'commodity_'],
  },
  {
    id: 'commercial',
    name: 'Commercial/Deal',
    displayName: '📋 Commercial/Deal',
    table: 'broker_deals',
    icon: '📋',
    prefixes: ['deal_', 'contract_', 'commercial_', 'trade_'],
  },
  {
    id: 'ai',
    name: 'AI Bucket',
    displayName: '🤖 AI Bucket',
    table: '',
    icon: '🤖',
    prefixes: [],
  },
];

// COMPREHENSIVE alias mappings for fuzzy matching - includes all field variations
export const ALIAS_MAPPINGS: Record<string, string> = {
  // Vessel aliases
  'imo': 'imo',
  'imo_number': 'imo',
  'dwt': 'deadweight',
  'gt': 'gross_tonnage',
  'loa': 'length',
  'nrt': 'net_tonnage',
  'grt': 'gross_tonnage',
  'mmsi_number': 'mmsi',
  'vessel': 'name',
  'ship': 'name',
  'ship_name': 'name',
  'year_built': 'built',
  'build_year': 'built',
  'call_sign': 'callsign',
  'type': 'vessel_type',
  'flag_state': 'flag',
  'owner': 'owner_name',
  'operator': 'operator_name',
  'cargo_bbl': 'cargo_capacity_bbl',
  'cargo_mt': 'cargo_capacity',
  
  // Voyage/Route aliases
  'dep_port': 'departure_port',
  'dest_port': 'destination_port',
  'load_port': 'loading_port',
  'disch_port': 'discharge_port',
  'etd': 'departure_date',
  'eta_date': 'eta',
  'arrival': 'arrival_date',
  'distance': 'route_distance',
  
  // Cargo aliases
  'commodity': 'commodity_name',
  'cargo': 'cargo_type',
  'hs': 'hs_code',
  'origin': 'cargo_origin_country',
  'quality_spec': 'quality_specification',
  'qty': 'cargo_quantity',
  'quantity': 'cargo_quantity',
  'min_qty': 'min_quantity',
  'max_qty': 'max_quantity',
  'shipment_qty': 'total_shipment_quantity',
  
  // Deal/Commercial aliases
  'deal_ref': 'deal_reference_id',
  'deal_id': 'deal_reference_id',
  'contract': 'contract_type',
  'delivery': 'delivery_terms',
  'pricing': 'price_basis',
  'benchmark': 'benchmark_reference',
  'value': 'deal_value',
  'price_usd': 'price',
  'market': 'market_price',
  'payment': 'payment_method',
  
  // Company aliases
  'company': 'name',
  'co': 'name',
  'company_name': 'name',
  'legal_name': 'name',
  'reg_number': 'registration_number',
  'reg_no': 'registration_number',
  'registration': 'registration_number',
  'rep_name': 'representative_name',
  'rep_title': 'representative_title',
  'representative': 'representative_name',
  'contact_person': 'representative_name',
  'signatory': 'representative_name',
  'passport': 'passport_number',
  'passport_no': 'passport_number',
  'founded': 'founded_year',
  'established': 'founded_year',
  'employees': 'employees_count',
  'revenue': 'annual_revenue',
  'activity': 'primary_activity',
  'objective': 'company_objective',
  'regions': 'trading_regions',
  'verified': 'is_verified',
  'kyc': 'kyc_status',
  'sanctions': 'sanctions_status',
  'risk': 'country_risk',
  'compliance': 'compliance_notes',
  'logo': 'logo_url',
  'photo': 'director_photo_url',
  'signature': 'signatory_signature_url',
  
  // Bank aliases
  'acc_number': 'account_number',
  'acc_no': 'account_number',
  'account': 'account_number',
  'swift': 'swift_code',
  'bic': 'swift_code',
  'bank': 'bank_name',
  'beneficiary': 'account_name',
  'beneficiary_name': 'account_name',
  
  // Address aliases
  'addr': 'address',
  'loc': 'city',
  'location': 'city',
  'city_name': 'city',
  'country_name': 'country',
  'legal_addr': 'legal_address',
  
  // Port aliases
  'port': 'name',
  'port_name': 'name',
  'loading': 'name',
  'discharge': 'name',
  'destination': 'name',
  'departure': 'name',
  'authority': 'port_authority',
  'max_length': 'max_vessel_length',
  'max_beam': 'max_vessel_beam',
  'throughput': 'annual_throughput',
  'berths': 'berth_count',
  'terminals': 'terminal_count',
  
  // Refinery aliases
  'refinery': 'name',
  'plant': 'name',
  'capacity_bpd': 'capacity',
  'processing': 'processing_capacity',
  'storage': 'storage_capacity',
  'production': 'production_capacity',
  'complexity_index': 'complexity',
  'certification': 'certifications',
  'env_rating': 'environmental_rating',
  'safety': 'safety_rating',
  
  // Product aliases
  'code': 'product_code',
  'grade_name': 'grade',
  'oil_type': 'product_type',
  'incoterm': 'incoterms',
  'api': 'api_gravity',
  'sulfur': 'sulfur_content',
  'sulphur': 'sulphur_content_ppm',
  'viscosity': 'viscosity_cst',
  'pour': 'pour_point_c',
  'flash': 'flash_point_min_c',
  'payment_days': 'payment_days',
  'payment_term': 'payment_terms',
};

// Semantic similarity patterns for fuzzy matching
const SEMANTIC_PATTERNS: Record<string, string[]> = {
  'name': ['title', 'label', 'designation', 'identifier'],
  'address': ['location', 'addr', 'street', 'place', 'hq'],
  'phone': ['tel', 'telephone', 'mobile', 'contact_number'],
  'email': ['mail', 'e_mail', 'contact_email'],
  'date': ['dt', 'timestamp', 'when', 'day'],
  'amount': ['value', 'total', 'sum', 'qty', 'quantity'],
  'country': ['nation', 'state', 'region'],
  'description': ['desc', 'details', 'notes', 'info'],
  'capacity': ['cap', 'volume', 'size', 'throughput'],
  'status': ['state', 'condition', 'situation'],
};

/**
 * Detect which bucket a placeholder belongs to based on prefix matching AND keyword detection
 */
export function detectBucket(placeholder: string): string {
  const lowerPlaceholder = placeholder.toLowerCase();
  
  // Check each bucket's prefixes first (exact prefix match)
  for (const bucket of BUCKET_DEFINITIONS) {
    if (bucket.id === 'ai') continue; // Skip AI bucket for auto-detection
    
    for (const prefix of bucket.prefixes) {
      if (lowerPlaceholder.startsWith(prefix)) {
        return bucket.id;
      }
    }
  }
  
  // If no prefix match, check for keywords ANYWHERE in the placeholder name
  // Priority order matters - check more specific matches first
  const keywordMappings: Record<string, string[]> = {
    'buyer_bank': ['buyer_bank'],
    'seller_bank': ['seller_bank'],
    'buyer_company': ['buyer_', 'buyer', 'purchaser', 'buyer_company'],
    'seller_company': ['seller_', 'seller', 'vendor', 'seller_company'],
    'vessel': ['vessel', 'ship', 'imo', 'mmsi', 'dwt', 'deadweight', 'flag', 'voyage', 'cargo'],
    'ports': ['port', 'departure', 'destination', 'loading', 'discharge', 'berth', 'terminal'],
    'refinery': ['refinery', 'ref_', 'plant', 'processing', 'distillation'],
    'product': ['product', 'oil_', 'commodity', 'grade', 'incoterm', 'sulphur', 'viscosity'],
    'commercial': ['deal', 'contract', 'commercial', 'trade', 'payment', 'delivery', 'price', 'commission'],
  };
  
  const priorityOrder = ['buyer_bank', 'seller_bank', 'buyer_company', 'seller_company', 'vessel', 'ports', 'refinery', 'product', 'commercial'];
  
  for (const bucketId of priorityOrder) {
    const keywords = keywordMappings[bucketId];
    if (keywords) {
      for (const keyword of keywords) {
        if (lowerPlaceholder.includes(keyword)) {
          return bucketId;
        }
      }
    }
  }
  
  // No match found - defaults to AI bucket
  return 'ai';
}

/**
 * Extract the field name from a placeholder after removing the prefix
 */
export function extractFieldName(placeholder: string, bucketId: string): string {
  const bucket = BUCKET_DEFINITIONS.find(b => b.id === bucketId);
  if (!bucket) return placeholder;
  
  const lowerPlaceholder = placeholder.toLowerCase();
  
  // Find and remove the matching prefix
  for (const prefix of bucket.prefixes) {
    if (lowerPlaceholder.startsWith(prefix)) {
      return placeholder.slice(prefix.length);
    }
  }
  
  return placeholder;
}

/**
 * Intelligent column matching within a specific table
 * Returns the best matching column with confidence score
 */
export function resolveColumn(
  fieldName: string,
  columns: string[]
): { column: string; confidence: number } {
  const lowerField = fieldName.toLowerCase();
  
  // 1. Exact match
  const exactMatch = columns.find(c => c.toLowerCase() === lowerField);
  if (exactMatch) {
    return { column: exactMatch, confidence: 1.0 };
  }
  
  // 2. Alias mapping
  const aliasTarget = ALIAS_MAPPINGS[lowerField];
  if (aliasTarget) {
    const aliasMatch = columns.find(c => c.toLowerCase() === aliasTarget.toLowerCase());
    if (aliasMatch) {
      return { column: aliasMatch, confidence: 0.95 };
    }
  }
  
  // 3. Partial match (contains)
  const partialMatches = columns.filter(c => 
    c.toLowerCase().includes(lowerField) || lowerField.includes(c.toLowerCase())
  );
  if (partialMatches.length === 1) {
    return { column: partialMatches[0], confidence: 0.85 };
  }
  
  // 4. Semantic similarity
  for (const [semantic, patterns] of Object.entries(SEMANTIC_PATTERNS)) {
    if (patterns.includes(lowerField) || lowerField.includes(semantic)) {
      const semanticMatch = columns.find(c => c.toLowerCase().includes(semantic));
      if (semanticMatch) {
        return { column: semanticMatch, confidence: 0.75 };
      }
    }
  }
  
  // 5. Word overlap scoring
  const fieldWords = lowerField.split(/[_\s-]+/);
  let bestMatch = { column: '', score: 0 };
  
  for (const column of columns) {
    const colWords = column.toLowerCase().split(/[_\s-]+/);
    const overlap = fieldWords.filter(w => colWords.some(cw => cw.includes(w) || w.includes(cw))).length;
    const score = overlap / Math.max(fieldWords.length, colWords.length);
    
    if (score > bestMatch.score) {
      bestMatch = { column, score };
    }
  }
  
  if (bestMatch.score >= 0.4) {
    return { column: bestMatch.column, confidence: 0.6 + (bestMatch.score * 0.2) };
  }
  
  // 6. Fallback to first column with similar type (name, id, etc.)
  const typeIndicators = ['name', 'id', 'number', 'code', 'value', 'date'];
  for (const indicator of typeIndicators) {
    if (lowerField.includes(indicator)) {
      const typeMatch = columns.find(c => c.toLowerCase().includes(indicator));
      if (typeMatch) {
        return { column: typeMatch, confidence: 0.6 };
      }
    }
  }
  
  // Ultimate fallback - return 'name' column if exists, else first column
  const nameCol = columns.find(c => c.toLowerCase() === 'name');
  if (nameCol) {
    return { column: nameCol, confidence: 0.5 };
  }
  
  return { column: columns[0] || 'unknown', confidence: 0.4 };
}

/**
 * Initialize buckets with placeholders auto-mapped to their correct locations
 */
export function initializeBuckets(
  placeholders: string[],
  tableColumns: Record<string, string[]>
): Bucket[] {
  const buckets: Bucket[] = BUCKET_DEFINITIONS.map(def => ({
    ...def,
    columns: tableColumns[def.table] || [],
    placeholders: [],
  }));
  
  // Map each placeholder to its bucket
  for (const placeholder of placeholders) {
    const bucketId = detectBucket(placeholder);
    const bucket = buckets.find(b => b.id === bucketId);
    
    if (!bucket) continue;
    
    if (bucketId === 'ai') {
      // AI bucket - no database resolution
      bucket.placeholders.push({
        name: placeholder,
        source: 'ai',
        resolvedColumn: null,
        resolvedTable: null,
        status: 'resolved_ai',
        confidence: 1.0,
        originalBucket: 'ai',
      });
    } else {
      // Database bucket - resolve column
      const fieldName = extractFieldName(placeholder, bucketId);
      const { column, confidence } = resolveColumn(fieldName, bucket.columns);
      
      bucket.placeholders.push({
        name: placeholder,
        source: 'database',
        resolvedColumn: column,
        resolvedTable: bucket.table,
        status: confidence >= 0.8 ? 'resolved_db' : 'auto_mapped',
        confidence,
        originalBucket: bucketId,
      });
    }
  }
  
  return buckets;
}

/**
 * Move a placeholder from its current bucket to the AI bucket
 */
export function moveToAI(
  buckets: Bucket[],
  placeholderName: string
): Bucket[] {
  const newBuckets = buckets.map(bucket => ({
    ...bucket,
    placeholders: [...bucket.placeholders],
  }));
  
  // Find and remove from current bucket
  let placeholder: PlaceholderItem | null = null;
  for (const bucket of newBuckets) {
    const idx = bucket.placeholders.findIndex(p => p.name === placeholderName);
    if (idx >= 0) {
      placeholder = { ...bucket.placeholders[idx] };
      bucket.placeholders.splice(idx, 1);
      break;
    }
  }
  
  if (!placeholder) return buckets;
  
  // Add to AI bucket with manual override status
  const aiBucket = newBuckets.find(b => b.id === 'ai');
  if (aiBucket) {
    aiBucket.placeholders.push({
      ...placeholder,
      source: 'ai',
      resolvedColumn: null,
      resolvedTable: null,
      status: 'manual_override',
    });
  }
  
  return newBuckets;
}

/**
 * Move a placeholder from AI bucket back to a database bucket
 */
export function moveToDatabase(
  buckets: Bucket[],
  placeholderName: string,
  targetBucketId: string
): Bucket[] {
  const newBuckets = buckets.map(bucket => ({
    ...bucket,
    placeholders: [...bucket.placeholders],
  }));
  
  // Find and remove from AI bucket
  const aiBucket = newBuckets.find(b => b.id === 'ai');
  if (!aiBucket) return buckets;
  
  const idx = aiBucket.placeholders.findIndex(p => p.name === placeholderName);
  if (idx < 0) return buckets;
  
  const placeholder = aiBucket.placeholders[idx];
  aiBucket.placeholders.splice(idx, 1);
  
  // Add to target bucket with database resolution
  const targetBucket = newBuckets.find(b => b.id === targetBucketId);
  if (!targetBucket || targetBucket.id === 'ai') return buckets;
  
  const fieldName = extractFieldName(placeholderName, targetBucketId);
  const { column, confidence } = resolveColumn(fieldName, targetBucket.columns);
  
  targetBucket.placeholders.push({
    name: placeholderName,
    source: 'database',
    resolvedColumn: column,
    resolvedTable: targetBucket.table,
    status: confidence >= 0.8 ? 'resolved_db' : 'auto_mapped',
    confidence,
    originalBucket: placeholder.originalBucket,
  });
  
  return newBuckets;
}

/**
 * Update a specific placeholder's column mapping manually
 */
export function updatePlaceholderColumn(
  buckets: Bucket[],
  placeholderName: string,
  newColumn: string
): Bucket[] {
  return buckets.map(bucket => ({
    ...bucket,
    placeholders: bucket.placeholders.map(p => {
      if (p.name === placeholderName) {
        return {
          ...p,
          resolvedColumn: newColumn,
          confidence: 1.0,
          status: 'manual_override' as const,
        };
      }
      return p;
    }),
  }));
}

/**
 * Move all low-confidence placeholders from a bucket to AI
 */
export function moveUnmatchedToAI(
  buckets: Bucket[],
  bucketId: string,
  threshold: number = 0.5
): { buckets: Bucket[]; movedCount: number } {
  let movedCount = 0;
  let newBuckets = buckets.map(bucket => ({
    ...bucket,
    placeholders: [...bucket.placeholders],
  }));
  
  const sourceBucket = newBuckets.find(b => b.id === bucketId);
  if (!sourceBucket || sourceBucket.id === 'ai') {
    return { buckets, movedCount: 0 };
  }
  
  const placeholdersToMove = sourceBucket.placeholders.filter(
    p => p.confidence < threshold
  );
  
  for (const placeholder of placeholdersToMove) {
    newBuckets = moveToAI(newBuckets, placeholder.name);
    movedCount++;
  }
  
  return { buckets: newBuckets, movedCount };
}

/**
 * Get placeholder mappings for API payload
 */
export function getPlaceholderMappings(buckets: Bucket[]): Record<string, { source: 'database' | 'ai'; table?: string; column?: string }> {
  const mappings: Record<string, { source: 'database' | 'ai'; table?: string; column?: string }> = {};
  
  for (const bucket of buckets) {
    for (const placeholder of bucket.placeholders) {
      if (placeholder.source === 'database') {
        mappings[placeholder.name] = {
          source: 'database',
          table: placeholder.resolvedTable || undefined,
          column: placeholder.resolvedColumn || undefined,
        };
      } else {
        mappings[placeholder.name] = {
          source: 'ai',
        };
      }
    }
  }
  
  return mappings;
}

/**
 * Get bucket ID from database table name (reverse lookup)
 */
export function getBucketIdFromTable(tableName: string | null): string {
  if (!tableName) return 'ai';
  
  const bucket = BUCKET_DEFINITIONS.find(b => b.table === tableName);
  return bucket?.id || 'ai';
}
