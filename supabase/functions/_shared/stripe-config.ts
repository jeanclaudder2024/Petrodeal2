import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  mode: 'test' | 'live';
}

export async function getStripeConfig(): Promise<StripeConfig> {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Fetch stripe mode from configuration table
  const { data: configData, error } = await supabaseClient
    .from('stripe_configuration')
    .select('stripe_mode')
    .single();

  // Default to test mode if no config found
  const mode = configData?.stripe_mode === 'live' ? 'live' : 'test';

  // Select the appropriate keys based on mode
  let secretKey: string | undefined;
  let webhookSecret: string | undefined;

  if (mode === 'live') {
    secretKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
    webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_LIVE");
  } else {
    secretKey = Deno.env.get("STRIPE_SECRET_KEY_TEST");
    webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST");
  }

  // Fallback to legacy single key if mode-specific keys not found
  if (!secretKey) {
    secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log(`[STRIPE-CONFIG] Using legacy STRIPE_SECRET_KEY (mode: ${mode})`);
  }

  if (!webhookSecret) {
    webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    console.log(`[STRIPE-CONFIG] Using legacy STRIPE_WEBHOOK_SECRET (mode: ${mode})`);
  }

  if (!secretKey) {
    throw new Error(`Stripe secret key not configured for ${mode} mode. Please set STRIPE_SECRET_KEY_${mode.toUpperCase()}`);
  }

  console.log(`[STRIPE-CONFIG] Using ${mode.toUpperCase()} mode`);

  return {
    secretKey,
    webhookSecret: webhookSecret || '',
    mode
  };
}
