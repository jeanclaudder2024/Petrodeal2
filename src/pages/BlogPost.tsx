import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import LandingNavbar from '@/components/landing/LandingNavbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Eye, Tag, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Helper function to clean HTML content from markdown artifacts
const cleanHTMLContent = (content: string): string => {
  let cleaned = content;
  // Remove markdown code fences
  cleaned = cleaned.replace(/^```html\s*/gi, '');
  cleaned = cleaned.replace(/^```\s*/gi, '');
  cleaned = cleaned.replace(/```\s*$/gi, '');
  // Remove full HTML document wrapper if present
  cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');
  cleaned = cleaned.replace(/<html[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/html>/gi, '');
  cleaned = cleaned.replace(/<head>[\s\S]*?<\/head>/gi, '');
  cleaned = cleaned.replace(/<body[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/body>/gi, '');
  return cleaned.trim();
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  tags: string[];
  status: string;
  publish_date: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  views: number;
  created_at: string;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: post?.title || 'PetroDealHub Article',
      text: post?.excerpt || 'Check out this article on PetroDealHub',
      url: shareUrl
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied!", description: "Article link copied to clipboard" });
      }
    } catch (error) {
      console.log('Share cancelled or failed:', error);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (fetchError) throw fetchError;
        
        if (data) {
          setPost(data as BlogPost);
          
          // Increment view count
          await supabase
            .from('blog_posts')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', data.id);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Clean and sanitize the post content
  const sanitizedContent = useMemo(() => {
    if (!post?.content) return '';
    const cleaned = cleanHTMLContent(post.content);
    return DOMPurify.sanitize(cleaned, {
      ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'blockquote', 'cite', 'br'],
      ALLOWED_ATTR: ['href', 'class', 'target', 'rel']
    });
  }, [post?.content]);

  // Clean title from any HTML artifacts
  const cleanTitle = useMemo(() => {
    if (!post?.title) return '';
    return post.title
      .replace(/^```html\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }, [post?.title]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LandingNavbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-[400px] w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <LandingNavbar />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{post.meta_title || cleanTitle} | PetroDealHub Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt || ''} />
        {post.meta_keywords && (
          <meta name="keywords" content={post.meta_keywords.join(', ')} />
        )}
        <meta property="og:title" content={post.meta_title || cleanTitle} />
        <meta property="og:description" content={post.meta_description || post.excerpt || ''} />
        {post.featured_image && post.featured_image !== '/placeholder.svg' && (
          <meta property="og:image" content={post.featured_image} />
        )}
        <link rel="canonical" href={`https://petrodealhub.com/blog/${post.slug}`} />
      </Helmet>

      <LandingNavbar />
      
      <article className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="max-w-4xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
              {cleanTitle}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
              {post.publish_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(post.publish_date), 'MMMM dd, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{post.views} views</span>
              </div>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              className="mt-4 w-fit"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Article
            </Button>
          </header>

          {/* Featured Image */}
          {post.featured_image && post.featured_image !== '/placeholder.svg' && (
            <div className="max-w-4xl mx-auto mb-12">
              <img 
                src={post.featured_image} 
                alt={cleanTitle}
                className="w-full rounded-2xl shadow-lg object-cover aspect-video"
              />
            </div>
          )}

          {/* Content with enhanced styling */}
          <div 
            className="max-w-4xl mx-auto prose-blog"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {/* CTA */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="p-8 text-center bg-gradient-to-r from-primary/10 via-accent/10 to-accent-green/10 border-0 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4 text-foreground">Ready to Transform Your Oil Trading?</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Join PetroDealHub today and experience the future of petroleum trading.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-accent to-accent-green hover:opacity-90 transition-opacity">
                  Get Started Free
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
