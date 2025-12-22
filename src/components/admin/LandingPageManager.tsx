import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Save, Upload, Image, Type, Layout, Eye, EyeOff, Trash2, Plus, RefreshCw, Settings, 
  FileText, Menu, Globe, Search, Edit, ExternalLink, MapPin, Sparkles, Mail, Users,
  Linkedin, Twitter, Facebook, Instagram, Download, ArrowUpDown
} from "lucide-react";

interface CMSPage {
  id: string;
  page_slug: string;
  page_name: string;
  page_category: string;
  meta_title: string | null;
  meta_description: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_cta_text: string | null;
  hero_cta_link: string | null;
  content_sections: any;
  seo_keywords: string[] | null;
  is_editable: boolean;
  is_in_sitemap: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FooterColumn {
  id: string;
  column_name: string;
  column_order: number;
  items: any;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  menu_location: string;
  title: string;
  link: string;
  icon: string | null;
  parent_id: string | null;
  order_index: number;
  is_active: boolean;
  requires_auth: boolean;
}

interface LandingSection {
  id: string;
  section_name: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content: any;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CMSSetting {
  id: string;
  key: string;
  value_en: string | null;
  group_name: string | null;
  type: string;
  description: string | null;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  status: string;
  source: string;
  subscribed_at: string;
}

const PAGE_CATEGORIES = [
  { value: 'public', label: 'Public/Marketing' },
  { value: 'news', label: 'News' },
  { value: 'legal', label: 'Legal' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'auth', label: 'Authentication' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'detail', label: 'Detail Pages' },
  { value: 'user', label: 'User Pages' },
  { value: 'support', label: 'Support' },
  { value: 'admin', label: 'Admin' },
  { value: 'developer', label: 'Developer' },
];

const LandingPageManager = () => {
  const [activeTab, setActiveTab] = useState('pages');
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [settings, setSettings] = useState<CMSSetting[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(null);
  const [selectedSection, setSelectedSection] = useState<LandingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [pageEditorTab, setPageEditorTab] = useState('seo');
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadPages(), loadFooter(), loadMenuItems(), loadSections(), loadSettings(), loadSubscribers()]);
    setLoading(false);
  };

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_page_content')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  };

  const loadFooter = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_footer_content')
        .select('*')
        .order('column_order', { ascending: true });
      if (error) throw error;
      setFooterColumns(data || []);
    } catch (error) {
      console.error('Error loading footer:', error);
    }
  };

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_menu_items')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  };

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_settings')
        .select('*')
        .in('group_name', ['contact', 'social']);
      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    }
  };

  const savePage = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_page_content')
        .update({
          page_name: selectedPage.page_name,
          page_category: selectedPage.page_category,
          meta_title: selectedPage.meta_title,
          meta_description: selectedPage.meta_description,
          hero_title: selectedPage.hero_title,
          hero_subtitle: selectedPage.hero_subtitle,
          hero_image_url: selectedPage.hero_image_url,
          hero_cta_text: selectedPage.hero_cta_text,
          hero_cta_link: selectedPage.hero_cta_link,
          content_sections: selectedPage.content_sections,
          seo_keywords: selectedPage.seo_keywords,
          is_in_sitemap: selectedPage.is_in_sitemap,
          is_published: selectedPage.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPage.id);
      if (error) throw error;
      toast({ title: "Saved", description: "Page updated successfully" });
      loadPages();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveSection = async () => {
    if (!selectedSection) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_page_content')
        .update({
          title: selectedSection.title,
          subtitle: selectedSection.subtitle,
          description: selectedSection.description,
          content: selectedSection.content,
          image_url: selectedSection.image_url,
          is_active: selectedSection.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSection.id);
      if (error) throw error;
      toast({ title: "Saved", description: "Section updated successfully" });
      loadSections();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveFooterColumn = async (column: FooterColumn) => {
    try {
      const { error } = await supabase
        .from('cms_footer_content')
        .update({ 
          column_name: column.column_name,
          items: column.items,
          is_active: column.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', column.id);
      if (error) throw error;
      toast({ title: "Saved" });
      loadFooter();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const saveMenuItem = async (item: MenuItem) => {
    try {
      if (item.id) {
        await supabase.from('cms_menu_items').update({
          title: item.title,
          link: item.link,
          icon: item.icon,
          order_index: item.order_index,
          is_active: item.is_active,
          requires_auth: item.requires_auth,
          updated_at: new Date().toISOString()
        }).eq('id', item.id);
      } else {
        await supabase.from('cms_menu_items').insert({
          menu_location: item.menu_location,
          title: item.title,
          link: item.link,
          icon: item.icon,
          order_index: item.order_index,
          is_active: item.is_active,
          requires_auth: item.requires_auth
        });
      }
      toast({ title: "Saved" });
      setIsMenuDialogOpen(false);
      setEditingMenuItem(null);
      loadMenuItems();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await supabase.from('cms_menu_items').delete().eq('id', id);
      toast({ title: "Deleted" });
      loadMenuItems();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('cms_settings')
        .update({ value_en: value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
      toast({ title: "Setting saved" });
      loadSettings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const generateSEOWithAI = async () => {
    if (!selectedPage) return;
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: `Generate SEO metadata for a page called "${selectedPage.page_name}" with slug "${selectedPage.page_slug}". 
          The page is categorized as "${selectedPage.page_category}".
          Return a JSON object with: meta_title (max 60 chars), meta_description (max 160 chars), and seo_keywords (array of 5-7 keywords).
          Focus on oil trading, maritime, vessels, ports, and energy trading industry.
          Return ONLY valid JSON, no markdown or extra text.`
        }
      });

      if (error) throw error;

      try {
        const responseText = data.response || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const seoData = JSON.parse(jsonMatch[0]);
          setSelectedPage({
            ...selectedPage,
            meta_title: seoData.meta_title || selectedPage.meta_title,
            meta_description: seoData.meta_description || selectedPage.meta_description,
            seo_keywords: seoData.seo_keywords || selectedPage.seo_keywords
          });
          toast({ title: "SEO Generated", description: "AI generated SEO fields. Review and save." });
        }
      } catch (parseError) {
        toast({ title: "Parse Error", description: "Could not parse AI response", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "AI Error", description: error.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const syncAllPagesContent = async () => {
    setSyncing(true);
    try {
      // Define page templates for syncing
      const pageTemplates = [
        { slug: '/privacy-policy', name: 'Privacy Policy', category: 'legal' },
        { slug: '/cookie-policy', name: 'Cookie Policy', category: 'legal' },
        { slug: '/policies', name: 'Terms of Service', category: 'legal' },
        { slug: '/about', name: 'About Us', category: 'public' },
        { slug: '/careers', name: 'Careers', category: 'public' },
        { slug: '/contact', name: 'Contact Us', category: 'public' },
        { slug: '/support', name: 'Support Center', category: 'support' },
        { slug: '/api-integration', name: 'API Integration', category: 'developer' },
        { slug: '/blog', name: 'Blog', category: 'news' },
        { slug: '/vessels', name: 'Vessel Tracking', category: 'dashboard' },
        { slug: '/ports', name: 'Port Intelligence', category: 'dashboard' },
        { slug: '/refineries', name: 'Refinery Analytics', category: 'dashboard' },
        { slug: '/dashboard', name: 'Dashboard', category: 'dashboard' },
        { slug: '/subscription', name: 'Subscription Plans', category: 'subscription' },
        { slug: '/', name: 'Home', category: 'public' },
      ];

      let synced = 0;
      let created = 0;

      for (const template of pageTemplates) {
        // Check if page exists
        const { data: existing } = await supabase
          .from('cms_page_content')
          .select('id')
          .eq('page_slug', template.slug)
          .maybeSingle();

        if (existing) {
          // Update existing page
          await supabase
            .from('cms_page_content')
            .update({
              page_name: template.name,
              page_category: template.category,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          synced++;
        } else {
          // Create new page entry
          await supabase
            .from('cms_page_content')
            .insert({
              page_slug: template.slug,
              page_name: template.name,
              page_category: template.category,
              is_published: true,
              is_editable: true,
              is_in_sitemap: true,
              sort_order: pageTemplates.indexOf(template)
            });
          created++;
        }
      }

      toast({ 
        title: "Content Synced", 
        description: `Synced ${synced} pages, created ${created} new entries` 
      });
      loadPages();
    } catch (error: any) {
      toast({ title: "Sync Error", description: error.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const exportSubscribersCSV = () => {
    const csvContent = [
      ['Email', 'Status', 'Source', 'Subscribed At'].join(','),
      ...subscribers.map(s => [s.email, s.status, s.source, s.subscribed_at].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredPages = pages.filter(p => {
    const matchesSearch = p.page_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.page_slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.page_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getSettingValue = (key: string) => settings.find(s => s.key === key)?.value_en || '';

  const updateContentSection = (index: number, field: string, value: string) => {
    if (!selectedPage) return;
    const sections = Array.isArray(selectedPage.content_sections) ? [...selectedPage.content_sections] : [];
    if (sections[index]) {
      sections[index] = { ...sections[index], [field]: value };
      setSelectedPage({ ...selectedPage, content_sections: sections });
    }
  };

  const addContentSection = () => {
    if (!selectedPage) return;
    const sections = Array.isArray(selectedPage.content_sections) ? [...selectedPage.content_sections] : [];
    sections.push({ title: '', content: '', type: 'text' });
    setSelectedPage({ ...selectedPage, content_sections: sections });
  };

  const removeContentSection = (index: number) => {
    if (!selectedPage) return;
    const sections = Array.isArray(selectedPage.content_sections) ? [...selectedPage.content_sections] : [];
    sections.splice(index, 1);
    setSelectedPage({ ...selectedPage, content_sections: sections });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
          <p className="text-muted-foreground">Manage pages, footer, menus, and landing sections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncAllPagesContent} disabled={syncing}>
            {syncing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpDown className="h-4 w-4 mr-2" />}
            Sync All Pages
          </Button>
          <Button variant="outline" onClick={loadAllData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Pages ({pages.length})
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Layout className="h-4 w-4" /> Sections ({sections.length})
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Footer ({footerColumns.length})
          </TabsTrigger>
          <TabsTrigger value="menus" className="flex items-center gap-2">
            <Menu className="h-4 w-4" /> Menus ({menuItems.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Settings
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Subscribers ({subscribers.length})
          </TabsTrigger>
        </TabsList>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Pages List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">All Pages</CardTitle>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search pages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {PAGE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1 p-2">
                    {filteredPages.map((page) => (
                      <div
                        key={page.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPage?.id === page.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => { setSelectedPage(page); setPageEditorTab('seo'); }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{page.page_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{page.page_slug}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {page.is_published ? (
                              <Eye className="h-3 w-3 text-green-500" />
                            ) : (
                              <EyeOff className="h-3 w-3 text-red-500" />
                            )}
                            {page.is_editable && <Edit className="h-3 w-3 text-blue-500" />}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">{page.page_category}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Page Editor */}
            <Card className="lg:col-span-3">
              {selectedPage ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" /> {selectedPage.page_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-0.5 rounded text-xs">{selectedPage.page_slug}</code>
                          <a href={selectedPage.page_slug} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedPage.is_published ? "default" : "secondary"}>
                          {selectedPage.is_published ? "Published" : "Draft"}
                        </Badge>
                        {!selectedPage.is_editable && (
                          <Badge variant="outline">Read-only</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={pageEditorTab} onValueChange={setPageEditorTab} className="space-y-6">
                      <TabsList>
                        <TabsTrigger value="seo">SEO</TabsTrigger>
                        <TabsTrigger value="hero">Hero</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>

                      <TabsContent value="seo" className="space-y-4">
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={generateSEOWithAI}
                            disabled={aiGenerating || !selectedPage.is_editable}
                          >
                            {aiGenerating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            AI Autofill SEO
                          </Button>
                        </div>
                        <div>
                          <Label>Meta Title</Label>
                          <Input
                            value={selectedPage.meta_title || ''}
                            onChange={(e) => setSelectedPage({ ...selectedPage, meta_title: e.target.value })}
                            placeholder="Page title for search engines"
                            disabled={!selectedPage.is_editable}
                          />
                          <p className="text-xs text-muted-foreground mt-1">{(selectedPage.meta_title || '').length}/60 characters</p>
                        </div>
                        <div>
                          <Label>Meta Description</Label>
                          <Textarea
                            value={selectedPage.meta_description || ''}
                            onChange={(e) => setSelectedPage({ ...selectedPage, meta_description: e.target.value })}
                            placeholder="Page description for search engines"
                            rows={3}
                            disabled={!selectedPage.is_editable}
                          />
                          <p className="text-xs text-muted-foreground mt-1">{(selectedPage.meta_description || '').length}/160 characters</p>
                        </div>
                        <div>
                          <Label>SEO Keywords (comma-separated)</Label>
                          <Input
                            value={(selectedPage.seo_keywords || []).join(', ')}
                            onChange={(e) => setSelectedPage({ 
                              ...selectedPage, 
                              seo_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                            })}
                            placeholder="oil trading, maritime, vessels"
                            disabled={!selectedPage.is_editable}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="hero" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Hero Title</Label>
                            <Input
                              value={selectedPage.hero_title || ''}
                              onChange={(e) => setSelectedPage({ ...selectedPage, hero_title: e.target.value })}
                              placeholder="Main headline"
                              disabled={!selectedPage.is_editable}
                            />
                          </div>
                          <div>
                            <Label>Hero Subtitle</Label>
                            <Input
                              value={selectedPage.hero_subtitle || ''}
                              onChange={(e) => setSelectedPage({ ...selectedPage, hero_subtitle: e.target.value })}
                              placeholder="Supporting text"
                              disabled={!selectedPage.is_editable}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Hero Image URL</Label>
                          <Input
                            value={selectedPage.hero_image_url || ''}
                            onChange={(e) => setSelectedPage({ ...selectedPage, hero_image_url: e.target.value })}
                            placeholder="https://..."
                            disabled={!selectedPage.is_editable}
                          />
                          {selectedPage.hero_image_url && (
                            <div className="mt-2 p-2 border rounded">
                              <img src={selectedPage.hero_image_url} alt="Hero preview" className="max-h-32 rounded" />
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>CTA Button Text</Label>
                            <Input
                              value={selectedPage.hero_cta_text || ''}
                              onChange={(e) => setSelectedPage({ ...selectedPage, hero_cta_text: e.target.value })}
                              placeholder="Get Started"
                              disabled={!selectedPage.is_editable}
                            />
                          </div>
                          <div>
                            <Label>CTA Button Link</Label>
                            <Input
                              value={selectedPage.hero_cta_link || ''}
                              onChange={(e) => setSelectedPage({ ...selectedPage, hero_cta_link: e.target.value })}
                              placeholder="/subscription"
                              disabled={!selectedPage.is_editable}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="content" className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-lg font-semibold">Page Content Sections</Label>
                          <Button variant="outline" size="sm" onClick={addContentSection} disabled={!selectedPage.is_editable}>
                            <Plus className="h-4 w-4 mr-2" /> Add Section
                          </Button>
                        </div>
                        
                        {Array.isArray(selectedPage.content_sections) && selectedPage.content_sections.length > 0 ? (
                          <div className="space-y-4">
                            {selectedPage.content_sections.map((section: any, index: number) => (
                              <Card key={index} className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <Badge variant="outline">Section {index + 1}</Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeContentSection(index)}
                                    disabled={!selectedPage.is_editable}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <Label>Section Title</Label>
                                    <Input
                                      value={section.title || ''}
                                      onChange={(e) => updateContentSection(index, 'title', e.target.value)}
                                      placeholder="Section title"
                                      disabled={!selectedPage.is_editable}
                                    />
                                  </div>
                                  <div>
                                    <Label>Content</Label>
                                    <Textarea
                                      value={section.content || section.description || section.text || ''}
                                      onChange={(e) => updateContentSection(index, 'content', e.target.value)}
                                      placeholder="Section content"
                                      rows={4}
                                      disabled={!selectedPage.is_editable}
                                    />
                                  </div>
                                  {section.button_text && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label>Button Text</Label>
                                        <Input
                                          value={section.button_text || ''}
                                          onChange={(e) => updateContentSection(index, 'button_text', e.target.value)}
                                          disabled={!selectedPage.is_editable}
                                        />
                                      </div>
                                      <div>
                                        <Label>Button Link</Label>
                                        <Input
                                          value={section.button_link || ''}
                                          onChange={(e) => updateContentSection(index, 'button_link', e.target.value)}
                                          disabled={!selectedPage.is_editable}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground border rounded-lg">
                            <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No content sections yet</p>
                            <p className="text-sm">Click "Add Section" to create editable content blocks</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="settings" className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Published</Label>
                            <p className="text-sm text-muted-foreground">Make this page visible to users</p>
                          </div>
                          <Switch
                            checked={selectedPage.is_published}
                            onCheckedChange={(v) => setSelectedPage({ ...selectedPage, is_published: v })}
                            disabled={!selectedPage.is_editable}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Include in Sitemap</Label>
                            <p className="text-sm text-muted-foreground">Add to sitemap.xml for SEO</p>
                          </div>
                          <Switch
                            checked={selectedPage.is_in_sitemap}
                            onCheckedChange={(v) => setSelectedPage({ ...selectedPage, is_in_sitemap: v })}
                            disabled={!selectedPage.is_editable}
                          />
                        </div>
                        <Separator />
                        <div>
                          <Label>Category</Label>
                          <Select 
                            value={selectedPage.page_category} 
                            onValueChange={(v) => setSelectedPage({ ...selectedPage, page_category: v })}
                            disabled={!selectedPage.is_editable}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {PAGE_CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {selectedPage.is_editable && (
                      <div className="flex justify-end mt-6">
                        <Button onClick={savePage} disabled={saving}>
                          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-[400px]">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a page to edit</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" /> Landing Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSection?.id === section.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedSection(section)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium capitalize">{section.section_name.replace(/_/g, ' ')}</p>
                      {section.is_active ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              {selectedSection ? (
                <>
                  <CardHeader>
                    <CardTitle>Edit: {selectedSection.section_name.replace(/_/g, ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={selectedSection.title || ''}
                        onChange={(e) => setSelectedSection({ ...selectedSection, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Subtitle</Label>
                      <Input
                        value={selectedSection.subtitle || ''}
                        onChange={(e) => setSelectedSection({ ...selectedSection, subtitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={selectedSection.description || ''}
                        onChange={(e) => setSelectedSection({ ...selectedSection, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        value={selectedSection.image_url || ''}
                        onChange={(e) => setSelectedSection({ ...selectedSection, image_url: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedSection.is_active}
                        onCheckedChange={(v) => setSelectedSection({ ...selectedSection, is_active: v })}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={saveSection} disabled={saving}>
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Section
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Select a section to edit
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {footerColumns.map((column) => (
              <Card key={column.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <Input
                      value={column.column_name}
                      onChange={(e) => {
                        const updated = footerColumns.map(c => 
                          c.id === column.id ? { ...c, column_name: e.target.value } : c
                        );
                        setFooterColumns(updated);
                      }}
                      className="font-bold"
                    />
                    <Switch
                      checked={column.is_active}
                      onCheckedChange={(v) => {
                        const updated = footerColumns.map(c => 
                          c.id === column.id ? { ...c, is_active: v } : c
                        );
                        setFooterColumns(updated);
                      }}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.isArray(column.items) && column.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={item.label || ''}
                        onChange={(e) => {
                          const newItems = [...column.items];
                          newItems[idx] = { ...newItems[idx], label: e.target.value };
                          const updated = footerColumns.map(c => 
                            c.id === column.id ? { ...c, items: newItems } : c
                          );
                          setFooterColumns(updated);
                        }}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Input
                        value={item.link || ''}
                        onChange={(e) => {
                          const newItems = [...column.items];
                          newItems[idx] = { ...newItems[idx], link: e.target.value };
                          const updated = footerColumns.map(c => 
                            c.id === column.id ? { ...c, items: newItems } : c
                          );
                          setFooterColumns(updated);
                        }}
                        placeholder="Link"
                        className="flex-1"
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => saveFooterColumn(column)}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Menus Tab */}
        <TabsContent value="menus" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingMenuItem({ id: '', menu_location: 'header', title: '', link: '', icon: null, parent_id: null, order_index: 0, is_active: true, requires_auth: false }); setIsMenuDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Menu Item
            </Button>
          </div>
          
          {['header', 'footer', 'mobile'].map(location => (
            <Card key={location}>
              <CardHeader>
                <CardTitle className="capitalize">{location} Menu</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Auth Required</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuItems.filter(m => m.menu_location === location).map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell className="font-mono text-xs">{item.link}</TableCell>
                        <TableCell>{item.order_index}</TableCell>
                        <TableCell>{item.is_active ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-red-500" />}</TableCell>
                        <TableCell>{item.requires_auth ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setEditingMenuItem(item); setIsMenuDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteMenuItem(item.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" /> Contact Settings
                </CardTitle>
                <CardDescription>Configure contact form and quick contact emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Contact Form Email</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getSettingValue('contact_form_email')}
                      onChange={(e) => {
                        const updated = settings.map(s => 
                          s.key === 'contact_form_email' ? { ...s, value_en: e.target.value } : s
                        );
                        setSettings(updated);
                      }}
                      placeholder="support@petrodealhub.com"
                    />
                    <Button variant="outline" onClick={() => saveSetting('contact_form_email', getSettingValue('contact_form_email'))}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Receives "Send Us a Message" form submissions</p>
                </div>
                <div>
                  <Label>Quick Contact Email</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getSettingValue('quick_contact_email')}
                      onChange={(e) => {
                        const updated = settings.map(s => 
                          s.key === 'quick_contact_email' ? { ...s, value_en: e.target.value } : s
                        );
                        setSettings(updated);
                      }}
                      placeholder="support@petrodealhub.com"
                    />
                    <Button variant="outline" onClick={() => saveSetting('quick_contact_email', getSettingValue('quick_contact_email'))}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">For homepage quick contact section</p>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" /> Social Media Links
                </CardTitle>
                <CardDescription>Configure footer social media links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getSettingValue('linkedin_url')}
                      onChange={(e) => {
                        const updated = settings.map(s => 
                          s.key === 'linkedin_url' ? { ...s, value_en: e.target.value } : s
                        );
                        setSettings(updated);
                      }}
                      placeholder="https://linkedin.com/company/..."
                    />
                    <Button variant="outline" onClick={() => saveSetting('linkedin_url', getSettingValue('linkedin_url'))}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Twitter className="h-4 w-4" /> Twitter/X</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getSettingValue('twitter_url')}
                      onChange={(e) => {
                        const updated = settings.map(s => 
                          s.key === 'twitter_url' ? { ...s, value_en: e.target.value } : s
                        );
                        setSettings(updated);
                      }}
                      placeholder="https://twitter.com/..."
                    />
                    <Button variant="outline" onClick={() => saveSetting('twitter_url', getSettingValue('twitter_url'))}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getSettingValue('facebook_url')}
                      onChange={(e) => {
                        const updated = settings.map(s => 
                          s.key === 'facebook_url' ? { ...s, value_en: e.target.value } : s
                        );
                        setSettings(updated);
                      }}
                      placeholder="https://facebook.com/..."
                    />
                    <Button variant="outline" onClick={() => saveSetting('facebook_url', getSettingValue('facebook_url'))}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getSettingValue('instagram_url')}
                      onChange={(e) => {
                        const updated = settings.map(s => 
                          s.key === 'instagram_url' ? { ...s, value_en: e.target.value } : s
                        );
                        setSettings(updated);
                      }}
                      placeholder="https://instagram.com/..."
                    />
                    <Button variant="outline" onClick={() => saveSetting('instagram_url', getSettingValue('instagram_url'))}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Newsletter Tab */}
        <TabsContent value="newsletter" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Newsletter Subscribers
                  </CardTitle>
                  <CardDescription>{subscribers.length} total subscribers</CardDescription>
                </div>
                <Button variant="outline" onClick={exportSubscribersCSV}>
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Subscribed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.email}</TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{sub.source}</TableCell>
                      <TableCell>{new Date(sub.subscribed_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {subscribers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No subscribers yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Menu Item Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMenuItem?.id ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            <DialogDescription>Configure the menu item details</DialogDescription>
          </DialogHeader>
          {editingMenuItem && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editingMenuItem.title} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, title: e.target.value })} />
              </div>
              <div>
                <Label>Link</Label>
                <Input value={editingMenuItem.link} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, link: e.target.value })} />
              </div>
              <div>
                <Label>Location</Label>
                <Select value={editingMenuItem.menu_location} onValueChange={(v) => setEditingMenuItem({ ...editingMenuItem, menu_location: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order Index</Label>
                <Input type="number" value={editingMenuItem.order_index} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, order_index: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={editingMenuItem.is_active} onCheckedChange={(v) => setEditingMenuItem({ ...editingMenuItem, is_active: v })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingMenuItem.requires_auth} onCheckedChange={(v) => setEditingMenuItem({ ...editingMenuItem, requires_auth: v })} />
                  <Label>Requires Auth</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => saveMenuItem(editingMenuItem)}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPageManager;