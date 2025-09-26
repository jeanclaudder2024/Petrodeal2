import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OilPriceData {
  oil_type: string;
  symbol: string;
  current_price: number;
  previous_price?: number;
  price_change?: number;
  price_change_percent?: number;
  currency: string;
  unit: string;
  exchange?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const oilPriceApiKey = Deno.env.get('OIL_PRICE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!oilPriceApiKey) {
      console.error('OIL_PRICE_API_KEY not found');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(JSON.stringify({ error: 'Database configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Oil price symbols to track
    const oilSymbols = [
      { symbol: 'BRENT_CRUDE_OIL', name: 'Brent Crude Oil', unit: 'barrel' },
      { symbol: 'WTI_CRUDE_OIL', name: 'WTI Crude Oil', unit: 'barrel' },
      { symbol: 'NATURAL_GAS', name: 'Natural Gas', unit: 'MMBtu' },
      { symbol: 'HEATING_OIL', name: 'Heating Oil', unit: 'gallon' },
      { symbol: 'GASOLINE', name: 'Gasoline', unit: 'gallon' },
      { symbol: 'DIESEL', name: 'Diesel', unit: 'gallon' },
      { symbol: 'JET_FUEL', name: 'Jet Fuel', unit: 'gallon' },
      { symbol: 'FUEL_OIL', name: 'Fuel Oil', unit: 'gallon' },
      { symbol: 'PROPANE', name: 'Propane', unit: 'gallon' },
      { symbol: 'ETHANOL', name: 'Ethanol', unit: 'gallon' }
    ];

    console.log(`Fetching oil prices for ${oilSymbols.length} commodities`);
    
    const updatedPrices: OilPriceData[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Fetch prices for each oil type
    for (const oil of oilSymbols) {
      try {
        // Using oilpriceapi.com format - adjust URL based on your actual API
        const apiUrl = `https://api.oilpriceapi.com/v1/prices/latest?access_key=${oilPriceApiKey}&symbols=${oil.symbol}`;
        
        console.log(`Fetching price for ${oil.name}...`);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`API request failed for ${oil.name}:`, response.status, response.statusText);
          errorCount++;
          continue;
        }

        const data = await response.json();
        console.log(`API response for ${oil.name}:`, data);

        // Adjust this parsing based on your actual API response format
        let priceData: any;
        if (data.data && data.data[oil.symbol]) {
          priceData = data.data[oil.symbol];
        } else if (data[oil.symbol]) {
          priceData = data[oil.symbol];
        } else if (data.price) {
          priceData = data;
        } else {
          console.error(`Price data not found for ${oil.name}`, data);
          errorCount++;
          continue;
        }

        const currentPrice = parseFloat(priceData.price || priceData.current || priceData.last || priceData.value);
        const previousPrice = parseFloat(priceData.previous_price || priceData.previous || priceData.prev);
        
        if (isNaN(currentPrice)) {
          console.error(`Invalid price data for ${oil.name}:`, priceData);
          errorCount++;
          continue;
        }

        const priceChange = previousPrice ? currentPrice - previousPrice : null;
        const priceChangePercent = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : null;

        const oilPriceRecord: OilPriceData = {
          oil_type: oil.name,
          symbol: oil.symbol,
          current_price: currentPrice,
          previous_price: previousPrice || undefined,
          price_change: priceChange || undefined,
          price_change_percent: priceChangePercent ? parseFloat(priceChangePercent.toFixed(2)) : undefined,
          currency: 'USD',
          unit: oil.unit,
          exchange: priceData.exchange || undefined
        };

        updatedPrices.push(oilPriceRecord);
        successCount++;

        console.log(`Successfully processed ${oil.name}: $${currentPrice}`);

      } catch (error) {
        console.error(`Error fetching price for ${oil.name}:`, error);
        errorCount++;
      }
    }

    if (updatedPrices.length === 0) {
      console.error('No oil prices were successfully fetched');
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch any oil prices',
        details: `Attempted ${oilSymbols.length} symbols, all failed`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update database with fetched prices
    console.log(`Updating database with ${updatedPrices.length} oil prices...`);
    
    for (const priceData of updatedPrices) {
      const { error } = await supabase
        .from('oil_prices')
        .upsert(
          {
            ...priceData,
            last_updated: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            onConflict: 'oil_type,symbol',
            ignoreDuplicates: false 
          }
        );

      if (error) {
        console.error(`Database error for ${priceData.oil_type}:`, error);
      } else {
        console.log(`Updated ${priceData.oil_type} in database: $${priceData.current_price}`);
      }
    }

    console.log(`Oil price update completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Updated ${successCount} oil prices successfully`,
      updated_count: successCount,
      error_count: errorCount,
      prices: updatedPrices
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fatal error in fetch-oil-prices function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});