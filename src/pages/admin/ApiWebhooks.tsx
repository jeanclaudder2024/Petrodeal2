import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, Webhook, Copy, Trash2, Plus, Eye, EyeOff, RefreshCw, 
  CheckCircle2, XCircle, Loader2, ExternalLink, Calendar, Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  description: string | null;
  permissions: Record<string, any>;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
  timeout_seconds: number;
  retry_count: number;
  headers: Record<string, any>;
  description: string | null;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  status: string;
  status_code: number | null;
  error_message: string | null;
  attempt_number: number;
  delivered_at: string | null;
  created_at: string;
}

export default function ApiWebhooks() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState({ name: '', description: '' });
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    secret: '',
    events: [] as string[],
    description: '',
    timeout_seconds: 30,
    retry_count: 3,
  });
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  const availableEvents = [
    'vessel.created',
    'vessel.updated',
    'vessel.deleted',
    'document.generated',
    'user.registered',
    'subscription.created',
    'subscription.updated',
    'subscription.cancelled',
    'payment.succeeded',
    'payment.failed',
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedWebhookId) {
      loadWebhookDeliveries(selectedWebhookId);
    }
  }, [selectedWebhookId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadApiKeys(), loadWebhooks()]);
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load API keys",
        variant: "destructive",
      });
    }
  };

  const loadWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error: any) {
      console.error('Error loading webhooks:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load webhooks",
        variant: "destructive",
      });
    }
  };

  const loadWebhookDeliveries = async (webhookId: string) => {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setWebhookDeliveries(data || []);
    } catch (error: any) {
      console.error('Error loading webhook deliveries:', error);
    }
  };

  const generateApiKey = async () => {
    if (!newApiKey.name) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Generate API key on backend (more secure)
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/api-keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newApiKey.name,
          description: newApiKey.description,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate API key');
      }

      setGeneratedApiKey(data.api_key);
      await loadApiKeys();
      setNewApiKey({ name: '', description: '' });
      toast({
        title: "API Key Generated",
        description: "Copy the key now - you won't be able to see it again!",
      });
    } catch (error: any) {
      console.error('Error generating API key:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate API key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "API Key Deleted",
        description: "The API key has been deleted successfully",
      });
      await loadApiKeys();
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const toggleApiKeyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "API Key Updated",
        description: `API key ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      await loadApiKeys();
    } catch (error: any) {
      console.error('Error updating API key:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update API key",
        variant: "destructive",
      });
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast({
        title: "Error",
        description: "Please fill in name and URL",
        variant: "destructive",
      });
      return;
    }

    if (newWebhook.events.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one event",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('webhooks')
        .insert({
          name: newWebhook.name,
          url: newWebhook.url,
          secret: newWebhook.secret || null,
          events: newWebhook.events,
          description: newWebhook.description,
          timeout_seconds: newWebhook.timeout_seconds,
          retry_count: newWebhook.retry_count,
        });

      if (error) throw error;

      toast({
        title: "Webhook Created",
        description: "The webhook has been created successfully",
      });
      await loadWebhooks();
      setNewWebhook({
        name: '',
        url: '',
        secret: '',
        events: [],
        description: '',
        timeout_seconds: 30,
        retry_count: 3,
      });
      setShowWebhookDialog(false);
    } catch (error: any) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Webhook Deleted",
        description: "The webhook has been deleted successfully",
      });
      await loadWebhooks();
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete webhook",
        variant: "destructive",
      });
    }
  };

  const toggleWebhookStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Webhook Updated",
        description: `Webhook ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      await loadWebhooks();
    } catch (error: any) {
      console.error('Error updating webhook:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update webhook",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const getApiBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const baseUrl = window.location.origin;
    return apiUrl.startsWith('http') ? apiUrl : `${baseUrl}${apiUrl}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API & Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Manage API keys for external platform integration and configure webhooks for event notifications
          </p>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="documentation">
            <ExternalLink className="w-4 h-4 mr-2" />
            API Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Generate and manage API keys for external platform integration
                  </CardDescription>
                </div>
                <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate New API Key</DialogTitle>
                      <DialogDescription>
                        Create a new API key for external platform integration
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="key-name">Name</Label>
                        <Input
                          id="key-name"
                          value={newApiKey.name}
                          onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                          placeholder="e.g., Production API Key"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="key-description">Description (Optional)</Label>
                        <Textarea
                          id="key-description"
                          value={newApiKey.description}
                          onChange={(e) => setNewApiKey({ ...newApiKey, description: e.target.value })}
                          placeholder="Describe what this key will be used for"
                        />
                      </div>
                      {generatedApiKey && (
                        <div className="space-y-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                          <Label>Your API Key (Copy this now - you won't see it again!)</Label>
                          <div className="flex gap-2">
                            <Input
                              value={generatedApiKey}
                              readOnly
                              className="font-mono"
                            />
                            <Button
                              variant="outline"
                              onClick={() => copyToClipboard(generatedApiKey, 'API Key')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowApiKeyDialog(false);
                        setGeneratedApiKey(null);
                        setNewApiKey({ name: '', description: '' });
                      }}>
                        Close
                      </Button>
                      {!generatedApiKey && (
                        <Button onClick={generateApiKey} disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            'Generate Key'
                          )}
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No API keys found. Generate one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell className="font-mono text-sm">{key.key_prefix}...</TableCell>
                        <TableCell>
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {key.last_used_at
                            ? new Date(key.last_used_at).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          {new Date(key.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleApiKeyStatus(key.id, key.is_active)}
                            >
                              {key.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteApiKey(key.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configure webhooks to receive event notifications from the platform
                  </CardDescription>
                </div>
                <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Webhook</DialogTitle>
                      <DialogDescription>
                        Configure a webhook to receive event notifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhook-name">Name</Label>
                        <Input
                          id="webhook-name"
                          value={newWebhook.name}
                          onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                          placeholder="e.g., Production Webhook"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-url">URL</Label>
                        <Input
                          id="webhook-url"
                          value={newWebhook.url}
                          onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                          placeholder="https://your-platform.com/webhook"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-secret">Secret (Optional)</Label>
                        <Input
                          id="webhook-secret"
                          type="password"
                          value={newWebhook.secret}
                          onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                          placeholder="Secret for HMAC signature verification"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Events to Listen For</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                          {availableEvents.map((event) => (
                            <div key={event} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`event-${event}`}
                                checked={newWebhook.events.includes(event)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewWebhook({
                                      ...newWebhook,
                                      events: [...newWebhook.events, event],
                                    });
                                  } else {
                                    setNewWebhook({
                                      ...newWebhook,
                                      events: newWebhook.events.filter((ev) => ev !== event),
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`event-${event}`} className="text-sm font-normal cursor-pointer">
                                {event}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="webhook-timeout">Timeout (seconds)</Label>
                          <Input
                            id="webhook-timeout"
                            type="number"
                            value={newWebhook.timeout_seconds}
                            onChange={(e) =>
                              setNewWebhook({
                                ...newWebhook,
                                timeout_seconds: parseInt(e.target.value) || 30,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="webhook-retries">Retry Count</Label>
                          <Input
                            id="webhook-retries"
                            type="number"
                            value={newWebhook.retry_count}
                            onChange={(e) =>
                              setNewWebhook({
                                ...newWebhook,
                                retry_count: parseInt(e.target.value) || 3,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-description">Description (Optional)</Label>
                        <Textarea
                          id="webhook-description"
                          value={newWebhook.description}
                          onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                          placeholder="Describe what this webhook is used for"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowWebhookDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createWebhook} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Webhook'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No webhooks found. Create one to get started.
                  </div>
                ) : (
                  webhooks.map((webhook) => (
                    <Card key={webhook.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{webhook.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {webhook.url}
                            </CardDescription>
                            {webhook.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {webhook.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                              {webhook.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWebhookStatus(webhook.id, webhook.is_active)}
                            >
                              {webhook.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteWebhook(webhook.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Events</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {(webhook.events as string[]).map((event) => (
                                <Badge key={event} variant="outline">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Timeout: </span>
                              <span>{webhook.timeout_seconds}s</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Retries: </span>
                              <span>{webhook.retry_count}</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWebhookId(webhook.id);
                            }}
                          >
                            <Activity className="w-4 h-4 mr-2" />
                            View Delivery Logs
                          </Button>
                          {selectedWebhookId === webhook.id && (
                            <div className="mt-4 border rounded-md">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Attempt</TableHead>
                                    <TableHead>Time</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {webhookDeliveries.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No deliveries yet
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    webhookDeliveries.map((delivery) => (
                                      <TableRow key={delivery.id}>
                                        <TableCell className="font-mono text-sm">
                                          {delivery.event_type}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              delivery.status === 'success'
                                                ? 'default'
                                                : delivery.status === 'failed'
                                                ? 'destructive'
                                                : 'secondary'
                                            }
                                          >
                                            {delivery.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{delivery.attempt_number}</TableCell>
                                        <TableCell>
                                          {new Date(delivery.created_at).toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Complete API reference for external platform integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  {getApiBaseUrl()}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  All API requests must include your API key in the Authorization header:
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  Authorization: Bearer YOUR_API_KEY
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Available Endpoints</h3>
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/v1/vessels</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      List all vessels with optional filtering
                    </p>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/v1/vessels/:imo</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get vessel details by IMO number
                    </p>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/v1/ports</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      List all ports
                    </p>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/v1/companies</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      List all companies
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Webhook Events</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Your webhook will receive POST requests with the following structure:
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm whitespace-pre-wrap">
{`{
  "event": "vessel.created",
  "timestamp": "2025-01-28T10:00:00Z",
  "data": {
    // Event-specific data
  }
}`}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

