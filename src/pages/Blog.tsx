import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  TrendingUp, 
  FileText, 
  BookOpen, 
  Users, 
  Zap,
  Globe,
  Edit3,
  Mail,
  Lightbulb,
  Calendar,
  ArrowRight,
  Eye
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  publish_date: string | null;
  views: number | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogData();
  }, []);

  const fetchBlogData = async () => {
    try {
      // Fetch published posts
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          publish_date,
          views,
          category:blog_categories(name, slug)
        `)
        .eq('status', 'published')
        .lte('publish_date', new Date().toISOString())
        .order('publish_date', { ascending: false });

      if (postsError) throw postsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      setPosts(postsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = selectedCategory
    ? posts.filter(post => post.category?.slug === selectedCategory)
    : posts;

  const blogValues = [
    {
      icon: TrendingUp,
      title: "Industry Intelligence",
      description: "Stay ahead with insights into market trends, global price shifts, refinery movements, and regulatory updates."
    },
    {
      icon: BookOpen,
      title: "Platform How-To Guides",
      description: "Deep dives into using PetroDealHub's features — from uploading a deal to reviewing a vessel's route."
    },
    {
      icon: Users,
      title: "Expert Commentary",
      description: "Articles from seasoned professionals with real experience in crude, refined products, tankers, and risk management."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-accent to-accent-green text-white">
               Industry Insights
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Blog – Insights That Fuel Global Oil Trade
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Expert Articles. Real-World Value. PetroDealHub Perspective.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      {categories.length > 0 && (
        <section className="py-6 border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Posts
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.slug)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {filteredPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="overflow-hidden h-full hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-0 bg-background/80 backdrop-blur-sm group">
                    {post.featured_image ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <FileText className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        {post.category && (
                          <Badge variant="secondary" className="text-xs">
                            {post.category.name}
                          </Badge>
                        )}
                        {post.publish_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.publish_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-accent transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-accent font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read More <ArrowRight className="h-4 w-4" />
                        </span>
                        {post.views !== null && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">No Posts Yet</h3>
              <p className="text-muted-foreground mb-8">
                We're working on creating valuable content for you. Check back soon for expert insights on oil trading, market analysis, and industry trends.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why Our Blog Matters */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
               Why Our Blog Matters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {blogValues.map((value, index) => (
              <Card 
                key={index}
                className="p-8 text-center hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-0 bg-background/80 backdrop-blur-sm"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-accent-green flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-foreground">
                  {value.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Global Focus */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <Globe className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                 Global Focus. Local Relevance.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our content reflects every region where oil moves — from the Americas and Europe, 
                to the Middle East, Asia, and Africa. Whether you're closing a deal in Texas or 
                verifying documents from Singapore, our insights translate across borders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contribute Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-accent-green/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <div className="mb-6">
                <Edit3 className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                   Want to Contribute?
                </h2>
              </div>
              
              <div className="space-y-4 mb-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We welcome articles from professionals in the industry.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Submit a piece and let your experience become part of the global conversation.
                </p>
              </div>

              <Button 
                size="lg"
                className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
              >
                <Mail className="w-5 h-5 mr-2" />
                blog@petrodealhub.com
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Final Tagline */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-accent-green/10 rounded-2xl border border-border/50">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Lightbulb className="w-8 h-8 text-accent" />
                <h3 className="text-2xl font-bold text-foreground">PetroDealHub Blog</h3>
              </div>
              
              <div className="space-y-2 text-lg">
                <p className="text-muted-foreground">
                  Where Trading Meets Insight.
                </p>
                <p className="text-muted-foreground">
                  Where Documents Meet Strategy.
                </p>
                <p className="bg-gradient-to-r from-accent to-accent-green bg-clip-text text-transparent font-semibold">
                  Where Oil Moves Smarter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;