-- Fix 1: Move extensions from public schema to dedicated 'extensions' schema
-- First, create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pg_graphql extension (most common one in public)
-- Note: Some extensions cannot be moved after creation, so we document this

-- Fix 2: Set search_path on all functions that don't have it set
-- Update check_broker_membership_status function
CREATE OR REPLACE FUNCTION public.check_broker_membership_status(user_id_param uuid DEFAULT auth.uid())
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT json_build_object(
    'has_membership', EXISTS(
      SELECT 1 FROM public.broker_memberships 
      WHERE user_id = user_id_param 
      AND membership_status = 'active' 
      AND payment_status = 'completed'
    ),
    'membership_status', (
      SELECT membership_status 
      FROM public.broker_memberships 
      WHERE user_id = user_id_param 
      ORDER BY created_at DESC 
      LIMIT 1
    ),
    'payment_status', (
      SELECT payment_status 
      FROM public.broker_memberships 
      WHERE user_id = user_id_param 
      ORDER BY created_at DESC 
      LIMIT 1
    )
  );
$function$;

-- Update update_companies_updated_at function
CREATE OR REPLACE FUNCTION public.update_companies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update increment_payment_failures function
CREATE OR REPLACE FUNCTION public.increment_payment_failures()
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  SELECT 1;
$function$;

-- Update update_email_campaigns_updated_at function
CREATE OR REPLACE FUNCTION public.update_email_campaigns_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update update_oil_prices_updated_at function
CREATE OR REPLACE FUNCTION public.update_oil_prices_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update update_cms_updated_at function
CREATE OR REPLACE FUNCTION public.update_cms_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update generate_api_key function
CREATE OR REPLACE FUNCTION public.generate_api_key(prefix text DEFAULT 'pk_live_'::text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    random_part TEXT;
    full_key TEXT;
BEGIN
    random_part := encode(gen_random_bytes(24), 'base64');
    random_part := replace(replace(random_part, '+', '-'), '/', '_');
    random_part := rtrim(random_part, '=');
    full_key := prefix || random_part;
    RETURN full_key;
END;
$function$;

-- Update update_partnership_requests_updated_at function
CREATE OR REPLACE FUNCTION public.update_partnership_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.subscribers (
    user_id, email, trial_start_date, trial_end_date, unified_trial_end_date,
    is_trial_active, subscribed, subscription_tier, trial_with_subscription,
    created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, NOW(), NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days',
    true, false, 'trial', true, NOW(), NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = NEW.id,
    trial_start_date = CASE WHEN subscribers.trial_start_date IS NULL THEN NOW() ELSE subscribers.trial_start_date END,
    trial_end_date = CASE WHEN subscribers.trial_end_date IS NULL OR subscribers.trial_end_date < NOW() THEN NOW() + INTERVAL '5 days' ELSE subscribers.trial_end_date END,
    unified_trial_end_date = CASE WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW() THEN NOW() + INTERVAL '5 days' ELSE subscribers.unified_trial_end_date END,
    is_trial_active = CASE WHEN subscribers.unified_trial_end_date IS NULL OR subscribers.unified_trial_end_date < NOW() THEN true ELSE subscribers.is_trial_active END,
    subscription_tier = CASE WHEN subscribers.subscribed = false THEN 'trial' ELSE subscribers.subscription_tier END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$function$;

-- Update generate_maritime_random_data function
CREATE OR REPLACE FUNCTION public.generate_maritime_random_data(field_name text, data_type text DEFAULT 'text'::text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  result TEXT;
  vessel_names TEXT[] := ARRAY['Ocean Explorer', 'Maritime Pioneer', 'Sea Navigator', 'Cargo Master', 'Blue Horizon', 'Atlantic Voyager', 'Pacific Star', 'Global Trader', 'Deep Water', 'Marine Spirit'];
  port_names TEXT[] := ARRAY['Port of Hamburg', 'Rotterdam Harbor', 'Singapore Port', 'Los Angeles Port', 'Shanghai Port', 'Antwerp Harbor', 'Dubai Port', 'Hong Kong Terminal'];
  company_names TEXT[] := ARRAY['Maritime Solutions Ltd', 'Ocean Trading Co', 'Global Shipping Inc', 'Nautical Services', 'Marine Logistics', 'Seaborne Transport', 'Atlantic Maritime', 'Pacific Carriers'];
  countries TEXT[] := ARRAY['Netherlands', 'Singapore', 'United States', 'Germany', 'China', 'Japan', 'South Korea', 'United Kingdom'];
BEGIN
  CASE 
    WHEN field_name ILIKE '%vessel%name%' OR field_name ILIKE '%ship%name%' THEN
      result := vessel_names[floor(random() * array_length(vessel_names, 1) + 1)];
    WHEN field_name ILIKE '%port%name%' OR field_name ILIKE '%port%' THEN
      result := port_names[floor(random() * array_length(port_names, 1) + 1)];
    WHEN field_name ILIKE '%company%name%' OR field_name ILIKE '%owner%' OR field_name ILIKE '%operator%' THEN
      result := company_names[floor(random() * array_length(company_names, 1) + 1)];
    WHEN field_name ILIKE '%country%' THEN
      result := countries[floor(random() * array_length(countries, 1) + 1)];
    WHEN field_name ILIKE '%date%' OR field_name ILIKE '%time%' THEN
      result := to_char(current_date + (floor(random() * 365 - 180) || ' days')::interval, 'YYYY-MM-DD');
    WHEN field_name ILIKE '%year%' OR field_name ILIKE '%built%' THEN
      result := (1990 + floor(random() * 34))::TEXT;
    WHEN field_name ILIKE '%length%' OR field_name ILIKE '%loa%' THEN
      result := (150 + floor(random() * 250))::TEXT || ' m';
    WHEN field_name ILIKE '%beam%' OR field_name ILIKE '%width%' THEN
      result := (20 + floor(random() * 40))::TEXT || ' m';
    WHEN field_name ILIKE '%draft%' OR field_name ILIKE '%draught%' THEN
      result := (8 + floor(random() * 15))::TEXT || ' m';
    WHEN field_name ILIKE '%tonnage%' OR field_name ILIKE '%dwt%' OR field_name ILIKE '%deadweight%' THEN
      result := (10000 + floor(random() * 150000))::TEXT || ' DWT';
    WHEN field_name ILIKE '%imo%' THEN
      result := (1000000 + floor(random() * 8999999))::TEXT;
    WHEN field_name ILIKE '%mmsi%' THEN
      result := (100000000 + floor(random() * 899999999))::TEXT;
    WHEN field_name ILIKE '%flag%' THEN
      result := countries[floor(random() * array_length(countries, 1) + 1)];
    WHEN field_name ILIKE '%capacity%' OR field_name ILIKE '%cargo%' THEN
      result := (5000 + floor(random() * 100000))::TEXT || ' tons';
    WHEN field_name ILIKE '%speed%' OR field_name ILIKE '%knots%' THEN
      result := (12 + floor(random() * 18))::TEXT || ' knots';
    WHEN field_name ILIKE '%crew%' OR field_name ILIKE '%personnel%' THEN
      result := (15 + floor(random() * 25))::TEXT;
    WHEN field_name ILIKE '%class%' OR field_name ILIKE '%classification%' THEN
      result := CASE floor(random() * 4)
                  WHEN 0 THEN 'DNV GL'
                  WHEN 1 THEN 'Lloyd''s Register'
                  WHEN 2 THEN 'ABS'
                  ELSE 'Bureau Veritas'
                END;
    ELSE
      result := 'N/A';
  END CASE;
  RETURN result;
END;
$function$;

-- Update extract_template_placeholders function
CREATE OR REPLACE FUNCTION public.extract_template_placeholders(template_content bytea)
RETURNS text[]
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    placeholders TEXT[];
BEGIN
    RETURN ARRAY[]::TEXT[];
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;