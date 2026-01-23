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

    const { action, pageId, content, mediaType, mediaUrns, scheduledFor, postId } = await req.json();

    console.log(`LinkedIn Post Publisher action: ${action}`);

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

    // Action: Publish post immediately
    if (action === 'publish_now') {
      console.log('Publishing post to LinkedIn...');

      // Build post payload
      const postPayload: any = {
        author: organizationUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: mediaType === 'none' ? 'NONE' : mediaType.toUpperCase(),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      // Add media if present
      if (mediaUrns && mediaUrns.length > 0) {
        if (mediaType === 'image' || mediaType === 'multi_image') {
          postPayload.specificContent['com.linkedin.ugc.ShareContent'].media = mediaUrns.map((urn: string) => ({
            status: 'READY',
            media: urn,
          }));
        } else if (mediaType === 'video') {
          postPayload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
            status: 'READY',
            media: mediaUrns[0],
          }];
        }
      }

      console.log('Post payload:', JSON.stringify(postPayload, null, 2));

      const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postPayload),
      });

      if (!postResponse.ok) {
        const errorText = await postResponse.text();
        console.error('Failed to publish post:', errorText);
        throw new Error(`Failed to publish post: ${errorText}`);
      }

      const postData = await postResponse.json();
      const postUrn = postData.id;

      console.log('Post published successfully, URN:', postUrn);

      // Save to published posts
      const { data: publishedPost, error: saveError } = await supabaseClient
        .from('linkedin_published_posts')
        .insert({
          page_id: pageId,
          post_urn: postUrn,
          content: content,
          media_type: mediaType,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save published post:', saveError);
      }

      return new Response(
        JSON.stringify({ success: true, postUrn, publishedPost }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Schedule post for later
    if (action === 'schedule') {
      const authHeader = req.headers.get('Authorization');
      const { data: { user } } = await supabaseClient.auth.getUser(
        authHeader?.replace('Bearer ', '') || ''
      );

      console.log('Scheduling post for:', scheduledFor);

      const { data: scheduledPost, error } = await supabaseClient
        .from('linkedin_scheduled_posts')
        .insert({
          page_id: pageId,
          content: content,
          media_type: mediaType || 'none',
          media_urns: mediaUrns || [],
          scheduled_for: scheduledFor,
          status: 'scheduled',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to schedule post: ${error.message}`);
      }

      console.log('Post scheduled successfully:', scheduledPost.id);

      return new Response(
        JSON.stringify({ success: true, scheduledPost }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Update scheduled post
    if (action === 'update_scheduled') {
      const { data, error } = await supabaseClient
        .from('linkedin_scheduled_posts')
        .update({
          content: content,
          media_type: mediaType,
          media_urns: mediaUrns,
          scheduled_for: scheduledFor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('status', 'scheduled')
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update scheduled post: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, post: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Cancel scheduled post
    if (action === 'cancel_scheduled') {
      const { error } = await supabaseClient
        .from('linkedin_scheduled_posts')
        .update({ status: 'cancelled' })
        .eq('id', postId)
        .eq('status', 'scheduled');

      if (error) {
        throw new Error(`Failed to cancel post: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Delete post from LinkedIn
    if (action === 'delete_post') {
      const { postUrn } = await req.json().catch(() => ({}));

      const deleteResponse = await fetch(
        `https://api.linkedin.com/v2/ugcPosts/${encodeURIComponent(postUrn)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete post: ${errorText}`);
      }

      // Remove from database
      await supabaseClient
        .from('linkedin_published_posts')
        .delete()
        .eq('post_urn', postUrn);

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
    console.error('LinkedIn Post Publisher error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
