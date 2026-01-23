import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID') || '';
const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET') || '';
const LINKEDIN_REDIRECT_URI = Deno.env.get('LINKEDIN_REDIRECT_URI') || '';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, code, state } = await req.json();

    console.log(`LinkedIn OAuth action: ${action}`);

    // Action: Generate authorization URL
    if (action === 'get_auth_url') {
      const scopes = [
        'r_organization_social',
        'w_organization_social', 
        'r_organization_admin',
        'rw_organization_admin'
      ].join(' ');

      const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', LINKEDIN_REDIRECT_URI);
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('state', crypto.randomUUID());

      console.log('Generated LinkedIn auth URL');

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Exchange code for tokens
    if (action === 'exchange_code') {
      if (!code) {
        throw new Error('Authorization code is required');
      }

      console.log('Exchanging authorization code for tokens...');

      // Exchange code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: LINKEDIN_REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Failed to exchange code: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token exchange successful');

      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in; // seconds
      const refreshToken = tokenData.refresh_token || null;

      // Get user's organizations they can admin
      const orgsResponse = await fetch(
        'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(localizedName,logoV2(cropped~:playableStreams))))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!orgsResponse.ok) {
        const errorText = await orgsResponse.text();
        console.error('Failed to fetch organizations:', errorText);
        throw new Error(`Failed to fetch organizations: ${errorText}`);
      }

      const orgsData = await orgsResponse.json();
      console.log('Organizations fetched:', JSON.stringify(orgsData));

      // Extract organization details
      const organizations = orgsData.elements?.map((element: any) => {
        const org = element['organization~'];
        const orgUrn = element.organization;
        return {
          urn: orgUrn,
          name: org?.localizedName || 'Unknown Organization',
          logo: org?.logoV2?.['cropped~']?.elements?.[0]?.identifiers?.[0]?.identifier || null,
        };
      }) || [];

      return new Response(
        JSON.stringify({
          accessToken,
          refreshToken,
          expiresIn,
          organizations,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Save connected page
    if (action === 'save_page') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization required');
      }

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (userError || !user) {
        throw new Error('Invalid user');
      }

      const { pageName, organizationUrn, accessToken, refreshToken, expiresIn, profileImageUrl } = await req.json().catch(() => ({}));

      // Calculate token expiration
      const tokenExpiresAt = new Date(Date.now() + (expiresIn || 3600) * 1000);

      // Upsert the page connection
      const { data, error } = await supabaseClient
        .from('linkedin_connected_pages')
        .upsert({
          page_name: pageName,
          organization_urn: organizationUrn,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          profile_image_url: profileImageUrl,
          is_active: true,
          connected_by: user.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_urn',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save page:', error);
        throw new Error(`Failed to save page: ${error.message}`);
      }

      console.log('Page saved successfully:', data.id);

      return new Response(
        JSON.stringify({ success: true, page: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Refresh token
    if (action === 'refresh_token') {
      const { pageId } = await req.json().catch(() => ({}));

      const { data: page, error: pageError } = await supabaseClient
        .from('linkedin_connected_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (pageError || !page) {
        throw new Error('Page not found');
      }

      if (!page.refresh_token) {
        throw new Error('No refresh token available');
      }

      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: page.refresh_token,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenData = await tokenResponse.json();
      const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      await supabaseClient
        .from('linkedin_connected_pages')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || page.refresh_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Disconnect page
    if (action === 'disconnect') {
      const { pageId } = await req.json().catch(() => ({}));

      const { error } = await supabaseClient
        .from('linkedin_connected_pages')
        .update({ is_active: false })
        .eq('id', pageId);

      if (error) {
        throw new Error(`Failed to disconnect: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('LinkedIn OAuth error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
