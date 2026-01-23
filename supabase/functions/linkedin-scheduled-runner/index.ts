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

    console.log('LinkedIn Scheduled Runner - Starting...');

    // Get all scheduled posts that are due
    const now = new Date().toISOString();
    const { data: duePosts, error: fetchError } = await supabaseClient
      .from('linkedin_scheduled_posts')
      .select(`
        *,
        page:linkedin_connected_pages(*)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(10); // Process max 10 at a time to stay within rate limits

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled posts: ${fetchError.message}`);
    }

    console.log(`Found ${duePosts?.length || 0} posts to publish`);

    const results = [];

    for (const post of duePosts || []) {
      console.log(`Processing post ${post.id}...`);

      // Mark as publishing
      await supabaseClient
        .from('linkedin_scheduled_posts')
        .update({ status: 'publishing' })
        .eq('id', post.id);

      try {
        const page = post.page;
        if (!page || !page.is_active) {
          throw new Error('Page not found or inactive');
        }

        const accessToken = page.access_token;
        const organizationUrn = page.organization_urn;

        // Build post payload
        const postPayload: any = {
          author: organizationUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: post.content,
              },
              shareMediaCategory: post.media_type === 'none' ? 'NONE' : post.media_type.toUpperCase(),
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        };

        // Add media if present
        if (post.media_urns && post.media_urns.length > 0) {
          postPayload.specificContent['com.linkedin.ugc.ShareContent'].media = post.media_urns.map((urn: string) => ({
            status: 'READY',
            media: urn,
          }));
        }

        // Publish to LinkedIn
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
          throw new Error(`LinkedIn API error: ${errorText}`);
        }

        const postData = await postResponse.json();
        const postUrn = postData.id;

        console.log(`Post ${post.id} published successfully, URN: ${postUrn}`);

        // Update scheduled post as published
        await supabaseClient
          .from('linkedin_scheduled_posts')
          .update({
            status: 'published',
            published_post_urn: postUrn,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        // Save to published posts
        await supabaseClient
          .from('linkedin_published_posts')
          .insert({
            page_id: page.id,
            post_urn: postUrn,
            content: post.content,
            media_type: post.media_type,
            media_urls: post.media_urls || [],
            published_at: new Date().toISOString(),
          });

        results.push({ postId: post.id, success: true, postUrn });

      } catch (publishError: any) {
        console.error(`Failed to publish post ${post.id}:`, publishError.message);

        // Mark as failed
        await supabaseClient
          .from('linkedin_scheduled_posts')
          .update({
            status: 'failed',
            error_message: publishError.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        results.push({ postId: post.id, success: false, error: publishError.message });
      }

      // Small delay between posts to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('LinkedIn Scheduled Runner - Completed');

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('LinkedIn Scheduled Runner error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
