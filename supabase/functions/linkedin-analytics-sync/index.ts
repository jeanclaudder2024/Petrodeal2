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

    const { action, pageId, postUrn, startDate, endDate } = await req.json();

    console.log(`LinkedIn Analytics action: ${action}`);

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

    // Action: Sync post analytics
    if (action === 'sync_post_analytics') {
      console.log(`Syncing analytics for post: ${postUrn}`);

      // Get social actions (likes, comments, shares)
      const socialActionsResponse = await fetch(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!socialActionsResponse.ok) {
        throw new Error('Failed to fetch social actions');
      }

      const socialData = await socialActionsResponse.json();

      // Get share statistics
      const statsResponse = await fetch(
        `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(organizationUrn)}&shares=List(${encodeURIComponent(postUrn)})`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      let impressions = 0;
      let clicks = 0;
      let engagement = 0;

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const shareStats = statsData.elements?.[0]?.totalShareStatistics;
        if (shareStats) {
          impressions = shareStats.impressionCount || 0;
          clicks = shareStats.clickCount || 0;
          engagement = shareStats.engagement || 0;
        }
      }

      // Update post analytics
      const { data: updatedPost, error: updateError } = await supabaseClient
        .from('linkedin_published_posts')
        .update({
          likes: socialData.likesSummary?.totalLikes || 0,
          comments_count: socialData.commentsSummary?.totalFirstLevelComments || 0,
          shares: socialData.sharesSummary?.totalShares || 0,
          impressions: impressions,
          clicks: clicks,
          engagement_rate: engagement,
          last_synced_at: new Date().toISOString(),
        })
        .eq('post_urn', postUrn)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update analytics:', updateError);
      }

      console.log('Analytics synced successfully');

      return new Response(
        JSON.stringify({ success: true, post: updatedPost }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Sync all posts analytics for a page
    if (action === 'sync_all') {
      console.log('Syncing all post analytics for page...');

      // Get all published posts
      const { data: posts } = await supabaseClient
        .from('linkedin_published_posts')
        .select('*')
        .eq('page_id', pageId)
        .order('published_at', { ascending: false })
        .limit(100);

      let syncedCount = 0;

      for (const post of posts || []) {
        try {
          // Get social actions
          const socialActionsResponse = await fetch(
            `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(post.post_urn)}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
              },
            }
          );

          if (socialActionsResponse.ok) {
            const socialData = await socialActionsResponse.json();

            await supabaseClient
              .from('linkedin_published_posts')
              .update({
                likes: socialData.likesSummary?.totalLikes || 0,
                comments_count: socialData.commentsSummary?.totalFirstLevelComments || 0,
                shares: socialData.sharesSummary?.totalShares || 0,
                last_synced_at: new Date().toISOString(),
              })
              .eq('id', post.id);

            syncedCount++;
          }

          // Rate limit delay
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error syncing analytics for post ${post.id}:`, error);
        }
      }

      console.log(`Synced analytics for ${syncedCount} posts`);

      return new Response(
        JSON.stringify({ success: true, syncedCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get page follower statistics
    if (action === 'get_followers') {
      console.log('Fetching follower statistics...');

      const followersResponse = await fetch(
        `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(organizationUrn)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!followersResponse.ok) {
        const errorText = await followersResponse.text();
        console.error('Failed to fetch followers:', errorText);
        throw new Error(`Failed to fetch followers: ${errorText}`);
      }

      const followersData = await followersResponse.json();
      const totalFollowers = followersData.elements?.[0]?.followerCounts?.organicFollowerCount || 0;

      // Update page follower count
      await supabaseClient
        .from('linkedin_connected_pages')
        .update({ 
          follower_count: totalFollowers,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId);

      return new Response(
        JSON.stringify({ success: true, totalFollowers, data: followersData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get page share statistics over time
    if (action === 'get_page_stats') {
      console.log('Fetching page share statistics...');

      const timeGranularity = 'DAY';
      const start = startDate ? new Date(startDate).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;
      const end = endDate ? new Date(endDate).getTime() : Date.now();

      const statsResponse = await fetch(
        `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(organizationUrn)}&timeIntervals.timeGranularityType=${timeGranularity}&timeIntervals.timeRange.start=${start}&timeIntervals.timeRange.end=${end}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        console.error('Failed to fetch page stats:', errorText);
        throw new Error(`Failed to fetch page stats: ${errorText}`);
      }

      const statsData = await statsResponse.json();

      return new Response(
        JSON.stringify({ success: true, data: statsData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get aggregated analytics summary
    if (action === 'get_summary') {
      // Get from database
      const { data: posts } = await supabaseClient
        .from('linkedin_published_posts')
        .select('*')
        .eq('page_id', pageId);

      const summary = {
        totalPosts: posts?.length || 0,
        totalImpressions: posts?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0,
        totalLikes: posts?.reduce((sum, p) => sum + (p.likes || 0), 0) || 0,
        totalComments: posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0,
        totalShares: posts?.reduce((sum, p) => sum + (p.shares || 0), 0) || 0,
        totalClicks: posts?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0,
        averageEngagement: posts?.length 
          ? (posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / posts.length).toFixed(2)
          : 0,
        followerCount: page.follower_count || 0,
      };

      return new Response(
        JSON.stringify({ success: true, summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('LinkedIn Analytics error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
