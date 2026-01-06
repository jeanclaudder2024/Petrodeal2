import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useMarketingPixels, MarketingSetting, MarketingEvent } from '@/hooks/useMarketingPixels';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Settings2, BarChart3, Target, Code, Activity, ExternalLink } from 'lucide-react';

const PROVIDER_OPTIONS = [
  { value: 'gtm', label: 'Google Tag Manager', icon: '📊' },
  { value: 'ga4', label: 'Google Analytics 4', icon: '📈' },
  { value: 'facebook_pixel', label: 'Facebook Pixel', icon: '📘' },
  { value: 'linkedin', label: 'LinkedIn Insight Tag', icon: '💼' },
  { value: 'hotjar', label: 'Hotjar', icon: '🔥' },
  { value: 'tiktok', label: 'TikTok Pixel', icon: '🎵' },
  { value: 'twitter', label: 'Twitter Pixel', icon: '🐦' },
  { value: 'custom', label: 'Custom Script', icon: '⚙️' },
];

const CATEGORY_COLORS: Record<string, string> = {
  conversion: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  engagement: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ecommerce: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const MarketingAnalytics = () => {
  const { pixels, events, loading, addPixel, deletePixel, togglePixel, toggleEvent } = useMarketingPixels();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPixel, setNewPixel] = useState({ provider: '', tracking_id: '', name: '', config: {} });
  const [customScript, setCustomScript] = useState('');

  const handleAddPixel = async () => {
    if (!newPixel.provider || !newPixel.tracking_id) {
      toast({ title: 'Error', description: 'Provider and Tracking ID are required', variant: 'destructive' });
      return;
    }

    const config = newPixel.provider === 'custom' ? { script: customScript } : {};
    
    const result = await addPixel({
      provider: newPixel.provider,
      tracking_id: newPixel.tracking_id,
      name: newPixel.name || null,
      is_enabled: true,
      config,
    });

    if (result.success) {
      toast({ title: 'Success', description: 'Tracking pixel added successfully' });
      setAddDialogOpen(false);
      setNewPixel({ provider: '', tracking_id: '', name: '', config: {} });
      setCustomScript('');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeletePixel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tracking pixel?')) return;
    
    const result = await deletePixel(id);
    if (result.success) {
      toast({ title: 'Success', description: 'Tracking pixel deleted' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleTogglePixel = async (id: string, enabled: boolean) => {
    const result = await togglePixel(id, enabled);
    if (result.success) {
      toast({ title: 'Success', description: `Pixel ${enabled ? 'enabled' : 'disabled'}` });
    }
  };

  const handleToggleEvent = async (id: string, enabled: boolean) => {
    const result = await toggleEvent(id, enabled);
    if (result.success) {
      toast({ title: 'Success', description: `Event ${enabled ? 'enabled' : 'disabled'}` });
    }
  };

  const getProviderLabel = (provider: string) => {
    const option = PROVIDER_OPTIONS.find(p => p.value === provider);
    return option ? `${option.icon} ${option.label}` : provider;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Marketing Analytics & Tracking
          </CardTitle>
          <CardDescription>
            Manage tracking pixels, events, and marketing integrations
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pixels" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pixels" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Tracking Pixels
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="utm" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            UTM Builder
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Tracking Pixels Tab */}
        <TabsContent value="pixels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Configured Tracking Pixels</h3>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pixel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Tracking Pixel</DialogTitle>
                  <DialogDescription>
                    Configure a new marketing tracking pixel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select 
                      value={newPixel.provider} 
                      onValueChange={(value) => setNewPixel({ ...newPixel, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking ID</Label>
                    <Input
                      placeholder={newPixel.provider === 'gtm' ? 'GTM-XXXXXXX' : newPixel.provider === 'ga4' ? 'G-XXXXXXXX' : 'Enter ID'}
                      value={newPixel.tracking_id}
                      onChange={(e) => setNewPixel({ ...newPixel, tracking_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Name (Optional)</Label>
                    <Input
                      placeholder="e.g., Main GA4 Account"
                      value={newPixel.name}
                      onChange={(e) => setNewPixel({ ...newPixel, name: e.target.value })}
                    />
                  </div>
                  {newPixel.provider === 'custom' && (
                    <div className="space-y-2">
                      <Label>Custom Script</Label>
                      <Textarea
                        placeholder="Enter your custom tracking script"
                        value={customScript}
                        onChange={(e) => setCustomScript(e.target.value)}
                        rows={5}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPixel}>Add Pixel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pixels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No tracking pixels configured. Add your first pixel to start tracking.
                    </TableCell>
                  </TableRow>
                ) : (
                  pixels.map((pixel) => (
                    <TableRow key={pixel.id}>
                      <TableCell className="font-medium">
                        {getProviderLabel(pixel.provider)}
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {pixel.tracking_id}
                        </code>
                      </TableCell>
                      <TableCell>{pixel.name || '-'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={pixel.is_enabled}
                          onCheckedChange={(checked) => handleTogglePixel(pixel.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeletePixel(pixel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Quick Setup Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Setup Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><strong>Google Tag Manager:</strong> Get your container ID (GTM-XXXXXXX) from your GTM account</p>
              <p><strong>Google Analytics 4:</strong> Find your Measurement ID (G-XXXXXXXX) in GA4 Admin → Data Streams</p>
              <p><strong>Facebook Pixel:</strong> Copy your Pixel ID from Facebook Events Manager</p>
              <p><strong>LinkedIn Insight:</strong> Get your Partner ID from LinkedIn Campaign Manager</p>
              <p><strong>Hotjar:</strong> Find your Site ID in Hotjar Settings → General</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tracked Events</h3>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Providers</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {event.event_name}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={CATEGORY_COLORS[event.category] || CATEGORY_COLORS.general}>
                        {event.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {event.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {event.providers.map(p => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={event.is_enabled}
                        onCheckedChange={(checked) => handleToggleEvent(event.id, checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* UTM Builder Tab */}
        <TabsContent value="utm" className="space-y-4">
          <UTMBuilder />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Pixels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pixels.filter(p => p.is_enabled).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {pixels.length} total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tracked Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {events.filter(e => e.is_enabled).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {events.length} total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {events.filter(e => e.category === 'conversion' && e.is_enabled).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  active conversions
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>External Analytics</CardTitle>
              <CardDescription>Quick links to your analytics dashboards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Google Analytics
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Google Tag Manager
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Facebook Events Manager
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://www.linkedin.com/campaignmanager" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open LinkedIn Campaign Manager
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// UTM Builder Component
const UTMBuilder = () => {
  const [baseUrl, setBaseUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const { toast } = useToast();

  const generateUrl = () => {
    if (!baseUrl) return '';
    
    const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
    
    if (utmSource) url.searchParams.set('utm_source', utmSource);
    if (utmMedium) url.searchParams.set('utm_medium', utmMedium);
    if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign);
    if (utmContent) url.searchParams.set('utm_content', utmContent);
    if (utmTerm) url.searchParams.set('utm_term', utmTerm);
    
    return url.toString();
  };

  const copyToClipboard = () => {
    const url = generateUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast({ title: 'Copied!', description: 'URL copied to clipboard' });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>UTM Campaign URL Builder</CardTitle>
          <CardDescription>
            Generate trackable URLs for your marketing campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Website URL *</Label>
              <Input
                placeholder="https://petrodealhub.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Campaign Source *</Label>
              <Input
                placeholder="e.g., google, facebook, newsletter"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Campaign Medium *</Label>
              <Input
                placeholder="e.g., cpc, email, social"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                placeholder="e.g., spring_sale, product_launch"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Campaign Content (Optional)</Label>
              <Input
                placeholder="e.g., banner_ad, text_link"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Campaign Term (Optional)</Label>
              <Input
                placeholder="e.g., oil trading, crude oil"
                value={utmTerm}
                onChange={(e) => setUtmTerm(e.target.value)}
              />
            </div>
          </div>

          {generateUrl() && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Generated URL</Label>
              <div className="flex gap-2">
                <Input
                  value={generateUrl()}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyToClipboard}>
                  Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingAnalytics;
