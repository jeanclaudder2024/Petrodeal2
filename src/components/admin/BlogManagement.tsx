import React, { useState, useEffect } from 'react'; // Blog Management Component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Sparkles, 
  RefreshCw,
  Image,
  Upload,
  Calendar as CalendarIcon,
  Search,
  FileText,
  Globe,
  Bot,
  MessageSquareText,
  HelpCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  category_id: string | null;
  author_id: string | null;
  tags: string[];
  status: 'draft' | 'scheduled' | 'published';
  publish_date: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  views: number;
  created_at: string;
  updated_at: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const BlogManagement = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState<'content' | 'image' | 'seo' | 'geo' | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_id: '',
    tags: '',
    status: 'draft' as 'draft' | 'scheduled' | 'published',
    publish_date: null as Date | null,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    // GEO fields
    geo_ai_summary: '',
    geo_qa_block: '[]',
    geo_authority_statement: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts((postsData || []) as BlogPost[]);

      const { data: catsData, error: catsError } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (catsError) throw catsError;
      setCategories((catsData || []) as BlogCategory[]);

    } catch (error) {
      console.error('Error fetching blog data:', error);
      toast({ title: "Error", description: "Failed to load blog data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateContent = async () => {
    if (!formData.title || !formData.subject) {
      toast({ title: "Error", description: "Please enter title and subject first", variant: "destructive" });
      return;
    }

    setGenerating('content');
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { title: formData.title, subject: formData.subject, type: 'content' }
      });

      if (error) throw error;

      if (data?.content) {
        // Extract excerpt from first paragraph
        const excerptMatch = data.content.match(/<p>(.*?)<\/p>/);
        const excerpt = excerptMatch ? excerptMatch[1].substring(0, 200) + '...' : '';
        
        setFormData(prev => ({
          ...prev,
          content: data.content,
          excerpt,
          slug: generateSlug(prev.title)
        }));
        toast({ title: "Success", description: "Blog content generated" });
      }
    } catch (error) {
      console.error('Content generation error:', error);
      toast({ title: "Error", description: "Failed to generate content", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateImage = async () => {
    if (!formData.title || !formData.subject) {
      toast({ title: "Error", description: "Please enter title and subject first", variant: "destructive" });
      return;
    }

    setGenerating('image');
    try {
      // First get the image prompt
      const { data: promptData, error: promptError } = await supabase.functions.invoke('generate-blog-content', {
        body: { title: formData.title, subject: formData.subject, type: 'image_prompt' }
      });

      if (promptError) throw promptError;

      // For now, we'll use a placeholder - in production, integrate with image generation API
      toast({ 
        title: "Image Prompt Generated", 
        description: "Use this prompt in an image generator: " + promptData?.content?.substring(0, 100) + "..." 
      });
      
      // Set a placeholder image URL
      setFormData(prev => ({
        ...prev,
        featured_image: '/placeholder.svg'
      }));

    } catch (error) {
      console.error('Image generation error:', error);
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateSEO = async () => {
    if (!formData.title) {
      toast({ title: "Error", description: "Please enter title first", variant: "destructive" });
      return;
    }

    setGenerating('seo');
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { title: formData.title, subject: formData.subject || formData.title, type: 'seo' }
      });

      if (error) throw error;

      if (data?.content) {
        try {
          const jsonMatch = data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const seoData = JSON.parse(jsonMatch[0]);
            setFormData(prev => ({
              ...prev,
              meta_title: seoData.meta_title || '',
              meta_description: seoData.meta_description || '',
              meta_keywords: Array.isArray(seoData.meta_keywords) ? seoData.meta_keywords.join(', ') : ''
            }));
            toast({ title: "Success", description: "SEO metadata generated with PetroDealHub keywords" });
          }
        } catch (parseError) {
          console.error('SEO parse error:', parseError);
          toast({ title: "Error", description: "Failed to parse SEO data", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error('SEO generation error:', error);
      toast({ title: "Error", description: "Failed to generate SEO", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `blog_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('landing-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('landing-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, featured_image: publicUrl }));
      toast({ title: "Success", description: "Image uploaded" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    }
  };

  const handleSavePost = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const postData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt || null,
        content: formData.content,
        featured_image: formData.featured_image || null,
        category_id: formData.category_id || null,
        author_id: user?.id || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        status: formData.status,
        publish_date: formData.status === 'scheduled' && formData.publish_date 
          ? formData.publish_date.toISOString() 
          : formData.status === 'published' ? new Date().toISOString() : null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        meta_keywords: formData.meta_keywords ? formData.meta_keywords.split(',').map(k => k.trim()) : null,
        // GEO fields
        geo_ai_summary: formData.geo_ai_summary || null,
        geo_qa_block: formData.geo_qa_block ? JSON.parse(formData.geo_qa_block) : [],
        geo_authority_statement: formData.geo_authority_statement || null
      };

      if (selectedPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', selectedPost.id);
        if (error) throw error;
        toast({ title: "Success", description: "Blog post updated" });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData);
        if (error) throw error;
        toast({ title: "Success", description: "Blog post created" });
      }

      resetForm();
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: "Error", description: "Failed to save post", variant: "destructive" });
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Post deleted" });
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    const postWithGeo = post as any;
    setFormData({
      title: post.title,
      subject: '',
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featured_image: post.featured_image || '',
      category_id: post.category_id || '',
      tags: post.tags?.join(', ') || '',
      status: post.status,
      publish_date: post.publish_date ? new Date(post.publish_date) : null,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      meta_keywords: post.meta_keywords?.join(', ') || '',
      geo_ai_summary: postWithGeo.geo_ai_summary || '',
      geo_qa_block: JSON.stringify(postWithGeo.geo_qa_block || []),
      geo_authority_statement: postWithGeo.geo_authority_statement || ''
    });
    setStep(1);
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category_id: '',
      tags: '',
      status: 'draft',
      publish_date: null,
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      geo_ai_summary: '',
      geo_qa_block: '[]',
      geo_authority_statement: ''
    });
    setSelectedPost(null);
    setStep(1);
  };

  const generateGEO = async () => {
    if (!formData.title) {
      toast({ title: "Error", description: "Please enter title first", variant: "destructive" });
      return;
    }

    setGenerating('geo');
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { 
          title: formData.title, 
          subject: formData.subject || formData.title, 
          content: formData.content,
          type: 'geo' 
        }
      });

      if (error) throw error;

      if (data?.content) {
        try {
          const jsonMatch = data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const geoData = JSON.parse(jsonMatch[0]);
            setFormData(prev => ({
              ...prev,
              geo_ai_summary: geoData.ai_summary || '',
              geo_qa_block: JSON.stringify(geoData.qa_block || []),
              geo_authority_statement: geoData.authority_statement || ''
            }));
            toast({ title: "Success", description: "GEO content generated for AI engines" });
          }
        } catch (parseError) {
          console.error('GEO parse error:', parseError);
          toast({ title: "Error", description: "Failed to parse GEO data", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error('GEO generation error:', error);
      toast({ title: "Error", description: "Failed to generate GEO content", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const addQAItem = () => {
    try {
      const currentQA = JSON.parse(formData.geo_qa_block || '[]');
      currentQA.push({ question: '', answer: '' });
      setFormData(prev => ({ ...prev, geo_qa_block: JSON.stringify(currentQA) }));
    } catch {
      setFormData(prev => ({ ...prev, geo_qa_block: '[{"question":"","answer":""}]' }));
    }
  };

  const updateQAItem = (index: number, field: 'question' | 'answer', value: string) => {
    try {
      const currentQA = JSON.parse(formData.geo_qa_block || '[]');
      currentQA[index][field] = value;
      setFormData(prev => ({ ...prev, geo_qa_block: JSON.stringify(currentQA) }));
    } catch (e) {
      console.error('Error updating QA:', e);
    }
  };

  const removeQAItem = (index: number) => {
    try {
      const currentQA = JSON.parse(formData.geo_qa_block || '[]');
      currentQA.splice(index, 1);
      setFormData(prev => ({ ...prev, geo_qa_block: JSON.stringify(currentQA) }));
    } catch (e) {
      console.error('Error removing QA:', e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Blog Management
        </CardTitle>
        <CardDescription>Create and manage blog posts for SEO and content marketing</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Blog Post
              </Button>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publish Date</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>
                      {post.publish_date ? format(new Date(post.publish_date), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>{post.views}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditPost(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePost(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {posts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No blog posts yet. Create your first post to boost SEO!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="categories">
            <p className="text-muted-foreground">Category management coming soon...</p>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPost ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
              <DialogDescription>
                Step {step} of 4: {step === 1 ? 'Title & Content' : step === 2 ? 'Featured Image' : step === 3 ? 'SEO Optimization' : 'Schedule & Publish'}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex justify-between mb-6">
              {[1, 2, 3, 4].map(s => (
                <div 
                  key={s} 
                  className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer ${
                    s === step ? 'bg-primary text-primary-foreground' : s < step ? 'bg-green-500 text-white' : 'bg-muted'
                  }`}
                  onClick={() => setStep(s)}
                >
                  {s}
                </div>
              ))}
            </div>

            {/* Step 1: Title & Content */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input 
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter blog title"
                    />
                  </div>
                  <div>
                    <Label>Subject/Topic</Label>
                    <Input 
                      value={formData.subject}
                      onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="What is this article about?"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={generateContent} 
                    disabled={generating === 'content'}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {generating === 'content' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    AI Generate Content
                  </Button>
                </div>

                <div>
                  <Label>Content *</Label>
                  <Textarea 
                    value={formData.content}
                    onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Blog content (HTML supported)"
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Excerpt</Label>
                  <Textarea 
                    value={formData.excerpt}
                    onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Short description for previews"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Featured Image */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={generateImage} disabled={generating === 'image'}>
                    {generating === 'image' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    AI Generate Image Prompt
                  </Button>
                  <Label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md hover:bg-secondary/80">
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </Label>
                </div>

                <div>
                  <Label>Image URL</Label>
                  <Input 
                    value={formData.featured_image}
                    onChange={e => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                {formData.featured_image && (
                  <div className="border rounded-lg p-4">
                    <img 
                      src={formData.featured_image} 
                      alt="Preview" 
                      className="max-h-[300px] mx-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: SEO */}
            {step === 3 && (
              <div className="space-y-4">
                <Button onClick={generateSEO} disabled={generating === 'seo'}>
                  {generating === 'seo' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  AI Generate SEO (with PetroDealHub keywords)
                </Button>

                <div>
                  <Label>Meta Title</Label>
                  <Input 
                    value={formData.meta_title}
                    onChange={e => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title (max 60 chars)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{formData.meta_title.length}/60 characters</p>
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Textarea 
                    value={formData.meta_description}
                    onChange={e => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO description (max 160 chars)"
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{formData.meta_description.length}/160 characters</p>
                </div>

                <div>
                  <Label>Keywords (comma-separated)</Label>
                  <Input 
                    value={formData.meta_keywords}
                    onChange={e => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                    placeholder="PetroDealHub, oil trading, ..."
                  />
                </div>

                <div>
                  <Label>URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/blog/</span>
                    <Input 
                      value={formData.slug}
                      onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                    />
                  </div>
                </div>

                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input 
                    value={formData.tags}
                    onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="oil trading, petroleum, industry"
                  />
                </div>
              </div>
            )}

            {/* Step 4: GEO / AI-Readable Content */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <span className="font-medium">GEO / AI-Readable Content</span>
                  </div>
                  <Button onClick={generateGEO} disabled={generating === 'geo'} variant="outline">
                    {generating === 'geo' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    AI Auto Generate GEO
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Generate content optimized for AI engines (ChatGPT, Gemini, Perplexity, DeepSeek) to understand and cite your article.
                </p>

                <Separator />

                <div>
                  <Label className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4" />
                    AI Summary for Generative Engines
                  </Label>
                  <Textarea 
                    value={formData.geo_ai_summary}
                    onChange={e => setFormData(prev => ({ ...prev, geo_ai_summary: e.target.value }))}
                    placeholder="2-3 clear sentences explaining what this article covers, written in definition-style language for AI engines..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Written for AI systems to understand and cite.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      AI Q&A Block
                    </Label>
                    <Button variant="outline" size="sm" onClick={addQAItem}>
                      <Plus className="h-4 w-4 mr-1" /> Add Q&A
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Questions and answers designed for AI extraction.</p>
                  
                  {(() => {
                    try {
                      const qaItems = JSON.parse(formData.geo_qa_block || '[]');
                      return qaItems.map((qa: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 mb-2 bg-muted/30">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Q&A #{index + 1}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeQAItem(index)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <Input 
                            value={qa.question}
                            onChange={e => updateQAItem(index, 'question', e.target.value)}
                            placeholder="Question..."
                            className="mb-2"
                          />
                          <Textarea 
                            value={qa.answer}
                            onChange={e => updateQAItem(index, 'answer', e.target.value)}
                            placeholder="Answer..."
                            rows={2}
                          />
                        </div>
                      ));
                    } catch {
                      return <p className="text-sm text-muted-foreground">No Q&A items yet.</p>;
                    }
                  })()}
                </div>

                <div>
                  <Label>Context & Authority Statement</Label>
                  <Textarea 
                    value={formData.geo_authority_statement}
                    onChange={e => setFormData(prev => ({ ...prev, geo_authority_statement: e.target.value }))}
                    placeholder="This article is written to explain [topic] for researchers, oil trading professionals, and AI systems seeking accurate industry information about PetroDealHub..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Schedule & Publish */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v: 'draft' | 'scheduled' | 'published') => setFormData(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Publish Immediately</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <Label>Publish Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {formData.publish_date ? format(formData.publish_date, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.publish_date || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, publish_date: date || null }))}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div>
                  <Label>Category</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={v => setFormData(prev => ({ ...prev, category_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview Summary */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Post Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Title:</strong> {formData.title || 'Not set'}</p>
                    <p><strong>URL:</strong> /blog/{formData.slug || 'not-set'}</p>
                    <p><strong>Status:</strong> {formData.status}</p>
                    <p><strong>SEO Title:</strong> {formData.meta_title || 'Not set'}</p>
                    <p><strong>GEO Summary:</strong> {formData.geo_ai_summary ? 'Set' : 'Not set'}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => step > 1 ? setStep(step - 1) : setIsCreateDialogOpen(false)}
              >
                {step > 1 ? 'Previous' : 'Cancel'}
              </Button>
              {step < 5 ? (
                <Button onClick={() => setStep(step + 1)}>Next</Button>
              ) : (
                <Button onClick={handleSavePost} className="bg-green-600 hover:bg-green-700">
                  <Globe className="h-4 w-4 mr-2" />
                  {formData.status === 'published' ? 'Publish Now' : formData.status === 'scheduled' ? 'Schedule' : 'Save Draft'}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BlogManagement;
