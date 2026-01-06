import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Sparkles, 
  RefreshCw,
  Megaphone,
  Gift,
  Bell,
  Tag,
  MessageSquare,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MarketingPopup {
  id: string;
  popup_type: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  button_text: string;
  button_link: string | null;
  style_config: Record<string, unknown> | null;
  trigger_pages: string[];
  show_on_all_pages: boolean;
  display_delay_seconds: number;
  show_once_per_session: boolean;
  collect_name: boolean;
  collect_email: boolean;
  collect_phone: boolean;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface PopupSubscriber {
  id: string;
  popup_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  page_subscribed_from: string | null;
  subscribed_at: string;
}

const POPUP_TYPES = [
  { value: 'newsletter', label: 'Newsletter Signup', icon: MessageSquare, color: 'bg-blue-500' },
  { value: 'promotion', label: 'Promotion/Sale', icon: Tag, color: 'bg-green-500' },
  { value: 'announcement', label: 'Announcement', icon: Bell, color: 'bg-yellow-500' },
  { value: 'discount', label: 'Discount Offer', icon: Gift, color: 'bg-purple-500' },
  { value: 'custom', label: 'Custom', icon: Megaphone, color: 'bg-gray-500' },
];

const PAGE_OPTIONS = [
  { value: '/', label: 'Home Page' },
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/vessels', label: 'Vessels' },
  { value: '/ports', label: 'Ports' },
  { value: '/companies', label: 'Companies' },
  { value: '/refineries', label: 'Refineries' },
  { value: '/brokers', label: 'Brokers' },
  { value: '/subscription', label: 'Subscription' },
  { value: '/support', label: 'Support' },
  { value: '/blog', label: 'Blog' },
  { value: '/news', label: 'News' },
];

const MarketingPopups = () => {
  const [popups, setPopups] = useState<MarketingPopup[]>([]);
  const [subscribers, setSubscribers] = useState<PopupSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('popups');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPopup, setSelectedPopup] = useState<MarketingPopup | null>(null);
  const [step, setStep] = useState(1);
  const [generatingContent, setGeneratingContent] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    popup_type: 'newsletter',
    title: '',
    subtitle: '',
    content: '',
    image_url: '',
    button_text: 'Subscribe',
    button_link: '',
    style_config: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonColor: '#3b82f6'
    } as Record<string, string>,
    trigger_pages: [] as string[],
    show_on_all_pages: false,
    display_delay_seconds: 3,
    show_once_per_session: true,
    collect_name: true,
    collect_email: true,
    collect_phone: false,
    is_active: false,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: popupsData, error: popupsError } = await supabase
        .from('marketing_popups')
        .select('*')
        .order('created_at', { ascending: false });

      if (popupsError) throw popupsError;
      setPopups((popupsData || []) as MarketingPopup[]);

      const { data: subsData, error: subsError } = await supabase
        .from('popup_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (subsError) throw subsError;
      setSubscribers((subsData || []) as PopupSubscriber[]);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load marketing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContentWithAI = async () => {
    setGeneratingContent(true);
    try {
      const popupType = POPUP_TYPES.find(t => t.value === formData.popup_type);
      const message = `Generate marketing popup content for PetroDealHub oil trading platform. Type: ${popupType?.label}. 
      Generate a compelling title (max 50 chars), subtitle (max 100 chars), and content (max 200 chars) that encourages users to subscribe.
      Return ONLY valid JSON with no extra text: {"title": "", "subtitle": "", "content": "", "button_text": ""}`;

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message, context: 'marketing popup generation' }
      });

      if (error) throw error;

      if (data?.response) {
        try {
          // Extract JSON from response (handle potential markdown code blocks)
          let jsonStr = data.response;
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }
          const parsed = JSON.parse(jsonStr);
          setFormData(prev => ({
            ...prev,
            title: parsed.title || prev.title,
            subtitle: parsed.subtitle || prev.subtitle,
            content: parsed.content || prev.content,
            button_text: parsed.button_text || prev.button_text
          }));
          toast({ title: "Content Generated", description: "AI generated popup content" });
        } catch (parseError) {
          console.error('Parse error:', parseError, 'Response:', data.response);
          toast({ title: "Error", description: "Failed to parse AI response", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive"
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleSavePopup = async () => {
    try {
      const popupData = {
        popup_type: formData.popup_type,
        title: formData.title,
        subtitle: formData.subtitle || null,
        content: formData.content || null,
        image_url: formData.image_url || null,
        button_text: formData.button_text,
        button_link: formData.button_link || null,
        style_config: formData.style_config,
        trigger_pages: formData.trigger_pages,
        show_on_all_pages: formData.show_on_all_pages,
        display_delay_seconds: formData.display_delay_seconds,
        show_once_per_session: formData.show_once_per_session,
        collect_name: formData.collect_name,
        collect_email: formData.collect_email,
        collect_phone: formData.collect_phone,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (selectedPopup) {
        const { error } = await supabase
          .from('marketing_popups')
          .update(popupData)
          .eq('id', selectedPopup.id);
        if (error) throw error;
        toast({ title: "Success", description: "Popup updated successfully" });
      } else {
        const { error } = await supabase
          .from('marketing_popups')
          .insert(popupData);
        if (error) throw error;
        toast({ title: "Success", description: "Popup created successfully" });
      }

      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: "Error", description: "Failed to save popup", variant: "destructive" });
    }
  };

  const handleDeletePopup = async (id: string) => {
    if (!confirm('Delete this popup and all its subscriber data?')) return;
    
    try {
      const { error } = await supabase.from('marketing_popups').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Popup deleted successfully" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete popup", variant: "destructive" });
    }
  };

  const togglePopupActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('marketing_popups')
        .update({ is_active: !currentState })
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update popup", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      popup_type: 'newsletter',
      title: '',
      subtitle: '',
      content: '',
      image_url: '',
      button_text: 'Subscribe',
      button_link: '',
      style_config: { backgroundColor: '#ffffff', textColor: '#000000', buttonColor: '#3b82f6' },
      trigger_pages: [],
      show_on_all_pages: false,
      display_delay_seconds: 3,
      show_once_per_session: true,
      collect_name: true,
      collect_email: true,
      collect_phone: false,
      is_active: false,
      start_date: '',
      end_date: ''
    });
    setSelectedPopup(null);
    setStep(1);
  };

  const openEditDialog = (popup: MarketingPopup) => {
    setSelectedPopup(popup);
    const styleConfig = popup.style_config as Record<string, string> | null;
    setFormData({
      popup_type: popup.popup_type,
      title: popup.title,
      subtitle: popup.subtitle || '',
      content: popup.content || '',
      image_url: popup.image_url || '',
      button_text: popup.button_text,
      button_link: popup.button_link || '',
      style_config: (styleConfig as Record<string, string>) || { backgroundColor: '#ffffff', textColor: '#000000', buttonColor: '#3b82f6' },
      trigger_pages: popup.trigger_pages || [],
      show_on_all_pages: popup.show_on_all_pages,
      display_delay_seconds: popup.display_delay_seconds,
      show_once_per_session: popup.show_once_per_session,
      collect_name: popup.collect_name,
      collect_email: popup.collect_email,
      collect_phone: popup.collect_phone,
      is_active: popup.is_active,
      start_date: popup.start_date ? popup.start_date.split('T')[0] : '',
      end_date: popup.end_date ? popup.end_date.split('T')[0] : ''
    });
    setIsCreateDialogOpen(true);
  };

  const getPopupTypeInfo = (type: string) => {
    return POPUP_TYPES.find(t => t.value === type) || POPUP_TYPES[4];
  };

  const getSubscriberCount = (popupId: string) => {
    return subscribers.filter(s => s.popup_id === popupId).length;
  };

  const exportSubscribers = (popupId?: string) => {
    const data = popupId 
      ? subscribers.filter(s => s.popup_id === popupId)
      : subscribers;
    
    const csv = [
      ['Name', 'Email', 'Phone', 'Page', 'Date'].join(','),
      ...data.map(s => [
        s.name || '',
        s.email || '',
        s.phone || '',
        s.page_subscribed_from || '',
        new Date(s.subscribed_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `popup-subscribers-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Marketing Popups
          </CardTitle>
          <CardDescription>
            Create and manage promotional popups to engage visitors and collect leads
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="popups">Popups</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers ({subscribers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="popups" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Popup
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedPopup ? 'Edit Popup' : 'Create New Popup'}</DialogTitle>
                  <DialogDescription>Step {step} of 3</DialogDescription>
                </DialogHeader>

                {step === 1 && (
                  <div className="space-y-4">
                    <Label>Popup Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {POPUP_TYPES.map(type => (
                        <div
                          key={type.value}
                          onClick={() => setFormData(prev => ({ ...prev, popup_type: type.value }))}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            formData.popup_type === type.value 
                              ? 'border-primary bg-primary/10' 
                              : 'hover:border-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded ${type.color}`}>
                              <type.icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium">{type.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => setStep(2)} className="w-full">Next: Content</Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Content</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={generateContentWithAI}
                        disabled={generatingContent}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {generatingContent ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter popup title"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <Label>Subtitle</Label>
                      <Input
                        value={formData.subtitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Enter subtitle"
                      />
                    </div>

                    <div>
                      <Label>Content</Label>
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter popup content"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Button Text</Label>
                        <Input
                          value={formData.button_text}
                          onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Button Link (optional)</Label>
                        <Input
                          value={formData.button_link}
                          onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                          placeholder="/subscription"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Background</Label>
                        <Input
                          type="color"
                          value={formData.style_config.backgroundColor}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            style_config: { ...prev.style_config, backgroundColor: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Text Color</Label>
                        <Input
                          type="color"
                          value={formData.style_config.textColor}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            style_config: { ...prev.style_config, textColor: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Button Color</Label>
                        <Input
                          type="color"
                          value={formData.style_config.buttonColor}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            style_config: { ...prev.style_config, buttonColor: e.target.value }
                          }))}
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="border rounded-lg p-4">
                      <Label className="text-sm text-muted-foreground mb-2 block">Preview</Label>
                      <div 
                        className="p-6 rounded-lg text-center"
                        style={{ 
                          backgroundColor: formData.style_config.backgroundColor,
                          color: formData.style_config.textColor 
                        }}
                      >
                        <h3 className="text-xl font-bold mb-2">{formData.title || 'Your Title'}</h3>
                        {formData.subtitle && <p className="text-sm mb-2">{formData.subtitle}</p>}
                        {formData.content && <p className="text-sm mb-4">{formData.content}</p>}
                        <button 
                          className="px-4 py-2 rounded text-white"
                          style={{ backgroundColor: formData.style_config.buttonColor }}
                        >
                          {formData.button_text}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                      <Button onClick={() => setStep(3)} className="flex-1">Next: Settings</Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Show on all pages</Label>
                      <Switch
                        checked={formData.show_on_all_pages}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          show_on_all_pages: checked,
                          trigger_pages: checked ? [] : prev.trigger_pages
                        }))}
                      />
                    </div>

                    {!formData.show_on_all_pages && (
                      <div>
                        <Label>Select Pages</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {PAGE_OPTIONS.map(page => (
                            <div key={page.value} className="flex items-center gap-2">
                              <Checkbox
                                checked={formData.trigger_pages.includes(page.value)}
                                onCheckedChange={(checked) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    trigger_pages: checked
                                      ? [...prev.trigger_pages, page.value]
                                      : prev.trigger_pages.filter(p => p !== page.value)
                                  }));
                                }}
                              />
                              <span className="text-sm">{page.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Display Delay (seconds)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={60}
                          value={formData.display_delay_seconds}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            display_delay_seconds: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          checked={formData.show_once_per_session}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            show_once_per_session: checked 
                          }))}
                        />
                        <Label>Show once per session</Label>
                      </div>
                    </div>

                    <div>
                      <Label>Collect Fields</Label>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.collect_name}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              collect_name: !!checked 
                            }))}
                          />
                          <span>Name</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.collect_email}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              collect_email: !!checked 
                            }))}
                          />
                          <span>Email</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.collect_phone}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              collect_phone: !!checked 
                            }))}
                          />
                          <span>Phone</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date (optional)</Label>
                        <Input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>End Date (optional)</Label>
                        <Input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label>Activate popup immediately</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                      <Button onClick={handleSavePopup} className="flex-1" disabled={!formData.title}>
                        {selectedPopup ? 'Update Popup' : 'Create Popup'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : popups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No popups created yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    popups.map(popup => {
                      const typeInfo = getPopupTypeInfo(popup.popup_type);
                      return (
                        <TableRow key={popup.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${typeInfo.color}`}>
                                <typeInfo.icon className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm">{typeInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{popup.title}</TableCell>
                          <TableCell>
                            {popup.show_on_all_pages ? (
                              <Badge variant="secondary">All Pages</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {popup.trigger_pages?.length || 0} pages
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {getSubscriberCount(popup.id)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={popup.is_active}
                              onCheckedChange={() => togglePopupActive(popup.id, popup.is_active)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditDialog(popup)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => exportSubscribers(popup.id)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeletePopup(popup.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Subscribers</CardTitle>
                <Button onClick={() => exportSubscribers()} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No subscribers yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.name || '-'}</TableCell>
                        <TableCell>{sub.email || '-'}</TableCell>
                        <TableCell>{sub.phone || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.page_subscribed_from || '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(sub.subscribed_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingPopups;