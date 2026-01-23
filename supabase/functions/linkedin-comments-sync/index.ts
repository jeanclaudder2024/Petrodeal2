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

    const { action, pageId, postId, postUrn, commentText, parentCommentUrn, commentUrn } = await req.json();

    console.log(`LinkedIn Comments action: ${action}`);

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

    // Action: Fetch comments for a post
    if (action === 'fetch_comments') {
      console.log(`Fetching comments for post: ${postUrn}`);

      const commentsResponse = await fetch(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments?projection=(elements*(actor~(localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams)),created,id,message))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!commentsResponse.ok) {
        const errorText = await commentsResponse.text();
        console.error('Failed to fetch comments:', errorText);
        throw new Error(`Failed to fetch comments: ${errorText}`);
      }

      const commentsData = await commentsResponse.json();
      const comments = commentsData.elements || [];

      console.log(`Found ${comments.length} comments`);

      // Save/update comments in database
      for (const comment of comments) {
        const actor = comment['actor~'];
        const authorName = actor ? `${actor.localizedFirstName || ''} ${actor.localizedLastName || ''}`.trim() : 'Unknown';
        const authorImage = actor?.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier || null;

        await supabaseClient
          .from('linkedin_comments')
          .upsert({
            post_id: postId,
            comment_urn: comment.id || comment.$URN,
            author_name: authorName,
            author_image_url: authorImage,
            content: comment.message?.text || '',
            created_at_linkedin: comment.created?.time ? new Date(comment.created.time).toISOString() : null,
            is_reply: !!comment.parentComment,
            parent_comment_urn: comment.parentComment || null,
          }, {
            onConflict: 'comment_urn',
          });
      }

      // Return saved comments
      const { data: savedComments } = await supabaseClient
        .from('linkedin_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at_linkedin', { ascending: false });

      return new Response(
        JSON.stringify({ success: true, comments: savedComments }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Reply to a comment
    if (action === 'reply') {
      console.log(`Replying to comment on post: ${postUrn}`);

      const replyPayload = {
        actor: organizationUrn,
        message: {
          text: commentText,
        },
      };

      // If replying to a specific comment (threaded reply)
      if (parentCommentUrn) {
        (replyPayload as any).parentComment = parentCommentUrn;
      }

      const replyResponse = await fetch(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(replyPayload),
        }
      );

      if (!replyResponse.ok) {
        const errorText = await replyResponse.text();
        console.error('Failed to post reply:', errorText);
        throw new Error(`Failed to post reply: ${errorText}`);
      }

      const replyData = await replyResponse.json();
      console.log('Reply posted successfully');

      // If this is a reply to an existing comment, update the database
      if (parentCommentUrn) {
        await supabaseClient
          .from('linkedin_comments')
          .update({
            our_reply: commentText,
            our_reply_urn: replyData.id || replyData.$URN,
            replied_at: new Date().toISOString(),
          })
          .eq('comment_urn', parentCommentUrn);
      }

      return new Response(
        JSON.stringify({ success: true, replyUrn: replyData.id || replyData.$URN }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Delete a comment (only if we authored it)
    if (action === 'delete') {
      console.log(`Deleting comment: ${commentUrn}`);

      const deleteResponse = await fetch(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments/${encodeURIComponent(commentUrn)}`,
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
        throw new Error(`Failed to delete comment: ${errorText}`);
      }

      // Remove from database
      await supabaseClient
        .from('linkedin_comments')
        .delete()
        .eq('comment_urn', commentUrn);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Hide/show comment locally
    if (action === 'toggle_hidden') {
      const { isHidden } = await req.json().catch(() => ({}));

      await supabaseClient
        .from('linkedin_comments')
        .update({ is_hidden: isHidden })
        .eq('comment_urn', commentUrn);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Sync all comments for a page
    if (action === 'sync_all') {
      console.log('Syncing all comments for page...');

      // Get all published posts for this page
      const { data: posts } = await supabaseClient
        .from('linkedin_published_posts')
        .select('id, post_urn')
        .eq('page_id', pageId)
        .order('published_at', { ascending: false })
        .limit(50);

      let totalComments = 0;

      for (const post of posts || []) {
        try {
          const commentsResponse = await fetch(
            `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(post.post_urn)}/comments`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
              },
            }
          );

          if (commentsResponse.ok) {
            const data = await commentsResponse.json();
            const count = data.elements?.length || 0;
            totalComments += count;

            // Update comment count on published post
            await supabaseClient
              .from('linkedin_published_posts')
              .update({ comments_count: count })
              .eq('id', post.id);
          }

          // Rate limit delay
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error syncing comments for post ${post.id}:`, error);
        }
      }

      console.log(`Synced ${totalComments} total comments`);

      return new Response(
        JSON.stringify({ success: true, totalComments }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('LinkedIn Comments error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
