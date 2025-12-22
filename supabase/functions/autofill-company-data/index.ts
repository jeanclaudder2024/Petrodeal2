import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema
const companyDataSchema = z.object({
  companyName: z.string().min(1).max(200),
  country: z.string().max(100).optional(),
  companyType: z.string().max(50).optional(),
});

// Country-specific data for realistic generation
const COUNTRY_DATA: Record<string, {
  firstNames: string[];
  lastNames: string[];
  cities: string[];
  passportPrefix: string;
  phonePrefix: string;
  ibanPrefix: string;
  ibanLength: number;
  banks: { name: string; swift: string }[];
}> = {
  'France': {
    firstNames: ['François', 'Jean-Pierre', 'Marie', 'Philippe', 'Isabelle', 'Laurent', 'Sophie', 'Nicolas'],
    lastNames: ['Dupont', 'Martin', 'Bernard', 'Dubois', 'Moreau', 'Lefebvre', 'Leroy', 'Roux'],
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux'],
    passportPrefix: 'FR',
    phonePrefix: '+33',
    ibanPrefix: 'FR76',
    ibanLength: 27,
    banks: [
      { name: 'BNP Paribas', swift: 'BNPAFRPP' },
      { name: 'Société Générale', swift: 'SOGEFRPP' },
      { name: 'Crédit Agricole', swift: 'AGRIFRPP' }
    ]
  },
  'Germany': {
    firstNames: ['Hans', 'Klaus', 'Wolfgang', 'Petra', 'Monika', 'Stefan', 'Sabine', 'Thomas'],
    lastNames: ['Müller', 'Schmidt', 'Weber', 'Fischer', 'Wagner', 'Becker', 'Hoffmann', 'Koch'],
    cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Düsseldorf'],
    passportPrefix: 'DE',
    phonePrefix: '+49',
    ibanPrefix: 'DE89',
    ibanLength: 22,
    banks: [
      { name: 'Deutsche Bank', swift: 'DEUTDEFF' },
      { name: 'Commerzbank', swift: 'COBADEFF' },
      { name: 'DZ Bank', swift: 'GENODEFF' }
    ]
  },
  'United Kingdom': {
    firstNames: ['James', 'William', 'Oliver', 'Charlotte', 'Emma', 'George', 'Sophie', 'Henry'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson'],
    cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Liverpool'],
    passportPrefix: 'GB',
    phonePrefix: '+44',
    ibanPrefix: 'GB82',
    ibanLength: 22,
    banks: [
      { name: 'HSBC UK', swift: 'HBUKGB4B' },
      { name: 'Barclays', swift: 'BARCGB22' },
      { name: 'Lloyds Bank', swift: 'LOYDGB2L' }
    ]
  },
  'UAE': {
    firstNames: ['Mohammed', 'Ahmed', 'Khalid', 'Fatima', 'Mariam', 'Sultan', 'Rashid', 'Omar'],
    lastNames: ['Al-Maktoum', 'Al-Nahyan', 'Al-Thani', 'Al-Sabah', 'Al-Falasi', 'Al-Nuaimi'],
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah'],
    passportPrefix: 'ARE',
    phonePrefix: '+971',
    ibanPrefix: 'AE07',
    ibanLength: 23,
    banks: [
      { name: 'Emirates NBD', swift: 'EABORAEA' },
      { name: 'First Abu Dhabi Bank', swift: 'NBABOREA' },
      { name: 'Dubai Islamic Bank', swift: 'DUIBAEAD' }
    ]
  },
  'Saudi Arabia': {
    firstNames: ['Abdullah', 'Mohammed', 'Salman', 'Faisal', 'Noura', 'Khalid', 'Turki', 'Nasser'],
    lastNames: ['Al-Saud', 'Al-Rashid', 'Al-Dosari', 'Al-Ghamdi', 'Al-Qahtani', 'Al-Harbi'],
    cities: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar'],
    passportPrefix: 'SA',
    phonePrefix: '+966',
    ibanPrefix: 'SA03',
    ibanLength: 24,
    banks: [
      { name: 'Saudi National Bank', swift: 'NCBKSAJE' },
      { name: 'Al Rajhi Bank', swift: 'RJHISARI' },
      { name: 'Riyad Bank', swift: 'RIABORIX' }
    ]
  },
  'Netherlands': {
    firstNames: ['Jan', 'Pieter', 'Willem', 'Anna', 'Maria', 'Hendrik', 'Elisabeth', 'Cornelis'],
    lastNames: ['de Vries', 'van den Berg', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Groot'],
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen'],
    passportPrefix: 'NL',
    phonePrefix: '+31',
    ibanPrefix: 'NL91',
    ibanLength: 18,
    banks: [
      { name: 'ING Bank', swift: 'INGBNL2A' },
      { name: 'ABN AMRO', swift: 'ABNANL2A' },
      { name: 'Rabobank', swift: 'RABONL2U' }
    ]
  },
  'Singapore': {
    firstNames: ['Wei', 'Ming', 'Jia', 'Hui', 'Xiu', 'Chen', 'Liang', 'Jun'],
    lastNames: ['Tan', 'Lee', 'Wong', 'Lim', 'Ng', 'Goh', 'Ong', 'Koh'],
    cities: ['Singapore'],
    passportPrefix: 'SG',
    phonePrefix: '+65',
    ibanPrefix: 'SG',
    ibanLength: 20,
    banks: [
      { name: 'DBS Bank', swift: 'DBSSSGSG' },
      { name: 'OCBC Bank', swift: 'OCBCSGSG' },
      { name: 'United Overseas Bank', swift: 'UOVBSGSG' }
    ]
  },
  'United States': {
    firstNames: ['John', 'Michael', 'Robert', 'Jennifer', 'Elizabeth', 'David', 'Sarah', 'William'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'],
    cities: ['New York', 'Houston', 'Los Angeles', 'Chicago', 'Dallas', 'Miami'],
    passportPrefix: 'US',
    phonePrefix: '+1',
    ibanPrefix: 'US',
    ibanLength: 17,
    banks: [
      { name: 'JPMorgan Chase', swift: 'CHASUS33' },
      { name: 'Bank of America', swift: 'BOFAUS3N' },
      { name: 'Citibank', swift: 'CITIUS33' }
    ]
  }
};

// Default data for countries not in the list
const DEFAULT_DATA = {
  firstNames: ['Alexander', 'Victoria', 'Christopher', 'Elizabeth'],
  lastNames: ['Anderson', 'Thompson', 'Richardson', 'Morrison'],
  cities: ['Capital City'],
  passportPrefix: 'XX',
  phonePrefix: '+1',
  ibanPrefix: 'XX00',
  ibanLength: 22,
  banks: [
    { name: 'International Bank', swift: 'INTLXXXX' }
  ]
};

function getCountryData(country: string) {
  return COUNTRY_DATA[country] || DEFAULT_DATA;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDigits(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function generatePassportNumber(country: string): string {
  const data = getCountryData(country);
  return `${data.passportPrefix}${generateDigits(8)}`;
}

function generatePhoneNumber(country: string): string {
  const data = getCountryData(country);
  return `${data.phonePrefix} ${generateDigits(2)} ${generateDigits(3)} ${generateDigits(4)}`;
}

function generateIBAN(country: string): string {
  const data = getCountryData(country);
  const remainingLength = data.ibanLength - data.ibanPrefix.length;
  return `${data.ibanPrefix} ${generateDigits(4)} ${generateDigits(4)} ${generateDigits(4)} ${generateDigits(Math.min(remainingLength - 12, 4))}`.trim();
}

function generateAccountNumber(): string {
  return generateDigits(10);
}

function generateRegistrationNumber(country: string): string {
  const data = getCountryData(country);
  return `${data.passportPrefix}-${generateDigits(4)}-${generateDigits(6)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const rawBody = await req.json()
    
    // Validate input
    const validation = companyDataSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { companyName, country = 'United States', companyType } = validation.data;

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isTestCompany = companyType === 'buyer_test' || companyType === 'seller_test';
    const isSeller = companyType === 'seller' || companyType === 'seller_test';
    const countryData = getCountryData(country || 'United States');

    // Generate country-specific data
    const firstName = randomFrom(countryData.firstNames);
    const lastName = randomFrom(countryData.lastNames);
    const representativeName = `${firstName} ${lastName}`;
    const city = randomFrom(countryData.cities);
    const bank = randomFrom(countryData.banks);

    const prompt = `Generate realistic company information for: "${companyName}" based in ${country || 'United States'}.
Company type: ${companyType || 'real'}
${isSeller ? 'This is a SELLER/REFINERY company - include refinery details.' : ''}

Provide ONLY the following JSON (no markdown, no explanation):
{
  "trade_name": "Trading name if different from legal name",
  "description": "2-3 sentence company description for oil/energy industry",
  "company_objective": "Clear company objective/mission statement for oil trading business",
  "industry": "Oil & Gas specific industry",
  "city": "${city}",
  "website": "https://www.realistic-domain.com",
  "official_email": "info@realistic-domain.com",
  "operations_email": "operations@realistic-domain.com",
  "address": "Realistic street address in ${city}, ${country}",
  "employees_count": realistic_number,
  "annual_revenue": realistic_number_in_usd,
  "founded_year": realistic_year_between_1950_2020,
  "primary_activity": "Primary business activity",
  "trading_regions": ["Region1", "Region2", "Region3"],
  "compliance_notes": "Internal compliance notes about the company verification status"${isSeller ? `,
  "refinery_name": "Realistic refinery name",
  "refinery_location": "City, Country",
  "refinery_capacity_bpd": realistic_barrels_per_day,
  "products_supplied": ["Crude Oil", "Gasoline", "Diesel"],
  "loading_ports": ["Port1", "Port2"]` : ''}
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates realistic company information for oil and energy companies. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    let content = data.choices[0].message.content.trim()
    
    // Clean markdown if present
    if (content.startsWith('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    }
    
    let aiData = JSON.parse(content)

    // Add country-specific generated data
    const websiteDomain = (aiData.website || 'company.com').replace('https://www.', '').replace('https://', '').replace('http://', '');
    
    const companyData: Record<string, unknown> = {
      ...aiData,
      phone: generatePhoneNumber(country),
      // Always generate legal fields for all company types
      registration_number: generateRegistrationNumber(country),
      registration_country: country,
      legal_address: aiData.address || `${generateDigits(3)} Business Street, ${city}, ${country}`,
      representative_name: representativeName,
      representative_title: randomFrom(['Chief Executive Officer', 'Managing Director', 'President', 'Chairman']),
      passport_number: generatePassportNumber(country),
      passport_country: country,
      representative_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${websiteDomain}`,
      // Always generate bank account
      bankAccounts: [{
        bank_name: bank.name,
        bank_address: `${generateDigits(3)} Banking District, ${city}, ${country}`,
        account_name: companyName,
        account_number: generateAccountNumber(),
        iban: generateIBAN(country),
        swift_code: bank.swift,
        beneficiary_address: aiData.address || `${generateDigits(3)} Business Street, ${city}, ${country}`,
        currency: country === 'United Kingdom' ? 'GBP' : (country === 'UAE' || country === 'Saudi Arabia') ? 'USD' : 'EUR',
        is_primary: true
      }]
    };

    // Add refinery owner flag for seller types
    if (isSeller) {
      companyData.is_refinery_owner = true;
    }

    console.log('Generated company data for:', companyName, 'Country:', country, 'Type:', companyType);

    return new Response(
      JSON.stringify({ success: true, data: companyData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in autofill-company-data function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate company data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
