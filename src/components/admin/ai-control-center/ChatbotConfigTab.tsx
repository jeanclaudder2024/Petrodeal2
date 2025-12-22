import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Loader2, MessageSquare, Settings, History, Link, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ChatbotConfig {
  id: string;
  name: string;
  description: string | null;
  linked_assistant_id: string | null;
  welcome_message: string;
  rules: any;
  allowed_topics: string[];
  blocked_topics: string[];
  escalation_triggers: any;
  platform_data_access: boolean;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  ai_assistants?: { name: string } | null;
}

interface Conversation {
  id: string;
  user_email: string;
  user_name: string;
  subscription_tier: string;
  messages: any;
  status: string;
  escalated: boolean;
  created_at: string;
  updated_at: string;
}

interface Assistant {
  id: string;
  name: string;
}

const ChatbotConfigTab = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<ChatbotConfig[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ChatbotConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    linked_assistant_id: '',
    welcome_message: 'Hello! How can I help you today?',
    allowed_topics: '',
    blocked_topics: '',
    platform_data_access: true,
    is_default: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch chatbot configs
      const { data: configsData, error: configsError } = await supabase
        .from('chatbot_configs')
        .select('*, ai_assistants(name)')
        .order('created_at', { ascending: false });

      if (configsError) throw configsError;

      // Fetch assistants for linking
      const { data: assistantsData } = await supabase
        .from('ai_assistants')
        .select('id, name')
        .eq('is_active', true);

      // Fetch recent conversations
      const { data: conversationsData } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      setConfigs(configsData || []);
      setAssistants(assistantsData || []);
      setConversations(conversationsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load chatbot data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const configData = {
        name: formData.name,
        description: formData.description,
        linked_assistant_id: formData.linked_assistant_id || null,
        welcome_message: formData.welcome_message,
        allowed_topics: formData.allowed_topics.split(',').map(s => s.trim()).filter(Boolean),
        blocked_topics: formData.blocked_topics.split(',').map(s => s.trim()).filter(Boolean),
        platform_data_access: formData.platform_data_access,
        is_default: formData.is_default,
        created_by: user?.id
      };

      if (editingConfig) {
        const { error } = await supabase
          .from('chatbot_configs')
          .update(configData)
          .eq('id', editingConfig.id);
        if (error) throw error;
        toast.success('Chatbot config updated');
      } else {
        const { error } = await supabase
          .from('chatbot_configs')
          .insert(configData);
        if (error) throw error;
        toast.success('Chatbot config created');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save chatbot config');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (config: ChatbotConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description || '',
      linked_assistant_id: config.linked_assistant_id || '',
      welcome_message: config.welcome_message,
      allowed_topics: config.allowed_topics?.join(', ') || '',
      blocked_topics: config.blocked_topics?.join(', ') || '',
      platform_data_access: config.platform_data_access,
      is_default: config.is_default
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      description: '',
      linked_assistant_id: '',
      welcome_message: 'Hello! How can I help you today?',
      allowed_topics: '',
      blocked_topics: '',
      platform_data_access: true,
      is_default: false
    });
  };

  const toggleActive = async (config: ChatbotConfig) => {
    try {
      const { error } = await supabase
        .from('chatbot_configs')
        .update({ is_active: !config.is_active })
        .eq('id', config.id);

      if (error) throw error;

      setConfigs(configs.map(c => c.id === config.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(`Chatbot ${!config.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling chatbot:', error);
      toast.error('Failed to update chatbot');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="configs">
        <TabsList>
          <TabsTrigger value="configs" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurations
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Conversations ({conversations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Chatbot Configurations</h3>
              <p className="text-sm text-muted-foreground">
                Manage customer-facing chatbot settings and behaviors
              </p>
            </div>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Chatbot
            </Button>
          </div>

          {configs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No chatbot configurations yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                  Create your first chatbot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {configs.map((config) => (
                <Card key={config.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          {config.name}
                          {config.is_default && <Badge>Default</Badge>}
                        </CardTitle>
                        <CardDescription>{config.description || 'No description'}</CardDescription>
                      </div>
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Linked to: {config.ai_assistants?.name || <span className="text-muted-foreground">None</span>}
                        </span>
                      </div>
                      {config.platform_data_access && (
                        <Badge variant="secondary">Platform Data Access</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(config)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={() => toggleActive(config)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Chat History</h3>
            <Badge variant="outline">{conversations.length} conversations</Badge>
          </div>

          {conversations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No conversations yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.map((conv) => (
                      <TableRow 
                        key={conv.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{conv.user_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{conv.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{conv.subscription_tier || 'None'}</Badge>
                        </TableCell>
                        <TableCell>{conv.messages?.length || 0}</TableCell>
                        <TableCell>
                          {conv.escalated ? (
                            <Badge variant="destructive">Escalated</Badge>
                          ) : (
                            <Badge variant="secondary">{conv.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(conv.updated_at), 'MMM d, HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'Edit' : 'Create'} Chatbot Configuration</DialogTitle>
            <DialogDescription>
              Configure the customer-facing chatbot behavior and rules
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer Support Bot"
                />
              </div>
              <div className="space-y-2">
                <Label>Linked Assistant</Label>
                <Select 
                  value={formData.linked_assistant_id || 'none'} 
                  onValueChange={(v) => setFormData({ ...formData, linked_assistant_id: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {assistants.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Customer support chatbot for general inquiries"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcome_message">Welcome Message</Label>
              <Textarea
                id="welcome_message"
                value={formData.welcome_message}
                onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowed_topics">Allowed Topics (comma-separated)</Label>
              <Input
                id="allowed_topics"
                value={formData.allowed_topics}
                onChange={(e) => setFormData({ ...formData, allowed_topics: e.target.value })}
                placeholder="subscriptions, pricing, features, support"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blocked_topics">Blocked Topics (comma-separated)</Label>
              <Input
                id="blocked_topics"
                value={formData.blocked_topics}
                onChange={(e) => setFormData({ ...formData, blocked_topics: e.target.value })}
                placeholder="internal data, other users, confidential"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.platform_data_access}
                  onCheckedChange={(c) => setFormData({ ...formData, platform_data_access: c })}
                />
                <Label>Platform Data Access</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(c) => setFormData({ ...formData, is_default: c })}
                />
                <Label>Set as Default</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingConfig ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Conversation with {selectedConversation?.user_name || selectedConversation?.user_email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[60vh] p-2">
            {selectedConversation?.messages?.map((msg: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatbotConfigTab;