import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, pageId, fileUrl, fileName, fileType, fileSize } = await req.json();

    console.log(`LinkedIn Media Upload action: ${action}, pageId: ${pageId}`);

    // Get page access token
    const { data: page, error: pageError } = await supabaseClient
      .from('linkedin_connected_pages')
      .select('*')
      .eq('id', pageId)
      .eq('is_active', true)
      .single();

    if (pageError || !page) {
      throw new Error('Page not found or inactive');
    }

    const accessToken = page.access_token;
    const organizationUrn = page.organization_urn;

    // Action: Initialize upload for image
    if (action === 'init_image_upload') {
      console.log('Initializing image upload...');

      const registerResponse = await fetch(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: organizationUrn,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent',
                },
              ],
            },
          }),
        }
      );

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        console.error('Failed to register upload:', errorText);
        throw new Error(`Failed to register upload: ${errorText}`);
      }

      const registerData = await registerResponse.json();
      const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
      const assetUrn = registerData.value?.asset;

      console.log('Image upload initialized, asset URN:', assetUrn);

      return new Response(
        JSON.stringify({ uploadUrl, assetUrn }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Initialize upload for video
    if (action === 'init_video_upload') {
      console.log('Initializing video upload...');

      const registerResponse = await fetch(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
              owner: organizationUrn,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent',
                },
              ],
            },
          }),
        }
      );

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        throw new Error(`Failed to register video upload: ${errorText}`);
      }

      const registerData = await registerResponse.json();
      const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
      const assetUrn = registerData.value?.asset;

      console.log('Video upload initialized, asset URN:', assetUrn);

      return new Response(
        JSON.stringify({ uploadUrl, assetUrn }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Upload file to LinkedIn (proxy upload)
    if (action === 'upload_file') {
      const { uploadUrl, fileBase64, contentType } = await req.json().catch(() => ({}));

      console.log('Uploading file to LinkedIn...');

      // Decode base64 to binary
      const binaryData = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': contentType,
        },
        body: binaryData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload file: ${errorText}`);
      }

      console.log('File uploaded successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Save to media library
    if (action === 'save_to_library') {
      const authHeader = req.headers.get('Authorization');
      const { data: { user } } = await supabaseClient.auth.getUser(
        authHeader?.replace('Bearer ', '') || ''
      );

      const { assetUrn, thumbnailUrl, width, height, duration } = await req.json().catch(() => ({}));

      const { data, error } = await supabaseClient
        .from('linkedin_media_library')
        .insert({
          page_id: pageId,
          file_name: fileName,
          file_type: fileType,
          file_url: fileUrl,
          file_size: fileSize,
          linkedin_asset_urn: assetUrn,
          thumbnail_url: thumbnailUrl,
          width,
          height,
          duration_seconds: duration,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save to library: ${error.message}`);
      }

      console.log('Media saved to library:', data.id);

      return new Response(
        JSON.stringify({ success: true, media: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Check upload status
    if (action === 'check_status') {
      const { assetUrn } = await req.json().catch(() => ({}));

      const statusResponse = await fetch(
        `https://api.linkedin.com/v2/assets/${encodeURIComponent(assetUrn)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error('Failed to check upload status');
      }

      const statusData = await statusResponse.json();
      const status = statusData.recipes?.[0]?.status || 'UNKNOWN';

      return new Response(
        JSON.stringify({ status, data: statusData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('LinkedIn Media Upload error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
