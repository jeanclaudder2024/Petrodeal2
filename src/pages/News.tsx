import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ArrowRight, Newspaper, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  readTime: string;
  category: string;
  featured: boolean;
  imageUrl?: string;
}

const News = () => {
  const newsArticles: NewsArticle[] = [
    {
      id: '1',
      title: 'Global Oil Markets Show Strong Recovery in Q3 2024',
      excerpt: 'Oil prices have stabilized around $85/barrel as global demand continues to recover from recent market volatility.',
      content: 'The global oil markets have demonstrated remarkable resilience...',
      author: 'Sarah Johnson',
      publishDate: '2024-08-20',
      readTime: '4 min read',
      category: 'Market Analysis',
      featured: true,
      imageUrl: '/hero-oil-trading.jpg'
    },
    {
      id: '2',
      title: 'New Maritime Regulations Impact Oil Shipping Routes',
      excerpt: 'Updated international maritime regulations are reshaping traditional oil shipping corridors.',
      content: 'The International Maritime Organization has announced...',
      author: 'Michael Chen',
      publishDate: '2024-08-18',
      readTime: '6 min read',
      category: 'Regulations',
      featured: false
    },
    {
      id: '3',
      title: 'Digital Transformation in Oil Trading Platforms',
      excerpt: 'How AI and blockchain are revolutionizing oil trading efficiency and transparency.',
      content: 'The oil trading industry is experiencing unprecedented digital transformation...',
      author: 'Emma Rodriguez',
      publishDate: '2024-08-15',
      readTime: '5 min read',
      category: 'Technology',
      featured: false
    },
    {
      id: '4',
      title: 'OPEC+ Production Decisions Shape Market Outlook',
      excerpt: 'Recent OPEC+ meetings result in new production quotas affecting global supply chains.',
      content: 'The Organization of Petroleum Exporting Countries...',
      author: 'Ahmed Al-Rashid',
      publishDate: '2024-08-12',
      readTime: '7 min read',
      category: 'Industry News',
      featured: false
    },
    {
      id: '5',
      title: 'Sustainable Oil Trading: Environmental Considerations',
      excerpt: 'Growing focus on environmental impact drives new sustainability standards in oil trading.',
      content: 'Environmental sustainability is becoming increasingly important...',
      author: 'Lisa Thompson',
      publishDate: '2024-08-10',
      readTime: '8 min read',
      category: 'Sustainability',
      featured: true
    }
  ];

  const categories = ['All', 'Market Analysis', 'Technology', 'Regulations', 'Industry News', 'Sustainability'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredArticles = selectedCategory === 'All' 
    ? newsArticles 
    : newsArticles.filter(article => article.category === selectedCategory);

  const featuredArticle = newsArticles.find(article => article.featured);
  const regularArticles = filteredArticles.filter(article => !article.featured);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Market Analysis': return 'bg-blue-100 text-blue-800';
      case 'Technology': return 'bg-purple-100 text-purple-800';
      case 'Regulations': return 'bg-orange-100 text-orange-800';
      case 'Industry News': return 'bg-green-100 text-green-800';
      case 'Sustainability': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Newspaper className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Oil Trading News
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay updated with the latest developments in oil trading markets, regulations, and industry insights
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="min-w-[100px]"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Featured Article */}
        {featuredArticle && selectedCategory === 'All' && (
          <Card className="trading-card mb-8 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src={featuredArticle.imageUrl || "/hero-oil-trading.jpg"}
                  alt={featuredArticle.title}
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getCategoryColor(featuredArticle.category)}>
                    {featuredArticle.category}
                  </Badge>
                  <Badge variant="outline" className="bg-gold text-gold-foreground">
                    Featured
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold mb-3 hover:text-primary transition-colors">
                  <Link to={`/news/${featuredArticle.id}`}>
                    {featuredArticle.title}
                  </Link>
                </h2>
                <p className="text-muted-foreground mb-4 text-lg">
                  {featuredArticle.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {featuredArticle.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(featuredArticle.publishDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {featuredArticle.readTime}
                  </div>
                </div>
                <Button className="group">
                  Read Full Article
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularArticles.map((article) => (
            <Card key={article.id} className="trading-card hover:shadow-lg transition-all group">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(article.category)}>
                    {article.category}
                  </Badge>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  <Link to={`/news/${article.id}`}>
                    {article.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {article.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.publishDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{article.readTime}</span>
                  <Button variant="ghost" size="sm" className="group">
                    Read More
                    <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Load More Articles
          </Button>
        </div>

        {/* Newsletter Signup */}
        <Card className="trading-card mt-12 text-center">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter and get the latest oil trading news and market insights delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button>Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default News;