import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Edit, Trash2, Loader2, Send, Bot, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Assistant {
  id: string;
  name: string;
  description: string | null;
  openai_assistant_id: string | null;
  instructions: string | null;
  model: string;
  tools: unknown;
  file_search: boolean | null;
  code_interpreter: boolean | null;
  is_active: boolean | null;
  created_at: string;
  [key: string]: unknown;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AssistantsManager = () => {
  const { user } = useAuth();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    model: 'gpt-4o',
    file_search: false,
    code_interpreter: false
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_assistants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssistants(data || []);
    } catch (error) {
      console.error('Error fetching assistants:', error);
      toast.error('Failed to load assistants');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.instructions) {
      toast.error('Name and instructions are required');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'create_assistant',
          ...formData,
          created_by: user?.id
        }
      });

      if (error) throw error;

      toast.success('Assistant created successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchAssistants();
    } catch (error) {
      console.error('Error creating assistant:', error);
      toast.error('Failed to create assistant');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAssistant) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'update_assistant',
          id: selectedAssistant.id,
          ...formData
        }
      });

      if (error) throw error;

      toast.success('Assistant updated successfully');
      setEditDialogOpen(false);
      fetchAssistants();
    } catch (error) {
      console.error('Error updating assistant:', error);
      toast.error('Failed to update assistant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assistant: Assistant) => {
    if (!confirm(`Are you sure you want to delete "${assistant.name}"?`)) return;

    try {
      const { error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'delete_assistant',
          id: assistant.id
        }
      });

      if (error) throw error;

      toast.success('Assistant deleted successfully');
      fetchAssistants();
    } catch (error) {
      console.error('Error deleting assistant:', error);
      toast.error('Failed to delete assistant');
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !selectedAssistant) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'chat_with_assistant',
          assistant_id: selectedAssistant.id,
          message: chatInput,
          thread_id: threadId,
          user_id: user?.id
        }
      });

      if (error) throw error;

      setThreadId(data.thread_id);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error chatting with assistant:', error);
      toast.error('Failed to send message');
    } finally {
      setChatLoading(false);
    }
  };

  const openEditDialog = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setFormData({
      name: assistant.name,
      description: assistant.description || '',
      instructions: assistant.instructions || '',
      model: assistant.model,
      file_search: assistant.file_search,
      code_interpreter: assistant.code_interpreter
    });
    setEditDialogOpen(true);
  };

  const openChat = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setChatMessages([]);
    setThreadId(null);
    setChatOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      instructions: '',
      model: 'gpt-4o',
      file_search: false,
      code_interpreter: false
    });
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">OpenAI Assistants</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assistant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assistant</DialogTitle>
              <DialogDescription>
                Create an AI assistant on the OpenAI platform
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
                    placeholder="Operations Assistant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={formData.model} onValueChange={(v) => setFormData({ ...formData, model: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
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
                  placeholder="Handles vessel operations and port management"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions (System Prompt) *</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="You are an AI assistant specialized in..."
                  rows={6}
                />
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.file_search}
                    onCheckedChange={(c) => setFormData({ ...formData, file_search: c })}
                  />
                  <Label>File Search</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.code_interpreter}
                    onCheckedChange={(c) => setFormData({ ...formData, code_interpreter: c })}
                  />
                  <Label>Code Interpreter</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Assistant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {assistants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No assistants created yet</p>
            <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              Create your first assistant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant) => (
            <Card key={assistant.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      {assistant.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assistant.description || 'No description'}
                    </p>
                  </div>
                  <Badge variant={assistant.is_active ? 'default' : 'secondary'}>
                    {assistant.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {assistant.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <Badge variant="outline">{assistant.model}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">OpenAI ID:</span>
                    <code className="text-xs bg-muted px-1 rounded">
                      {assistant.openai_assistant_id?.slice(0, 15)}...
                    </code>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {assistant.file_search && <Badge variant="secondary" className="text-xs">File Search</Badge>}
                    {assistant.code_interpreter && <Badge variant="secondary" className="text-xs">Code Interpreter</Badge>}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openChat(assistant)}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(assistant)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(assistant)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assistant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Select value={formData.model} onValueChange={(v) => setFormData({ ...formData, model: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Instructions</Label>
              <Textarea
                id="edit-instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={6}
              />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.file_search}
                  onCheckedChange={(c) => setFormData({ ...formData, file_search: c })}
                />
                <Label>File Search</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.code_interpreter}
                  onCheckedChange={(c) => setFormData({ ...formData, code_interpreter: c })}
                />
                <Label>Code Interpreter</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Sheet */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat with {selectedAssistant?.name}
            </SheetTitle>
            <SheetDescription>
              Test your assistant by sending messages
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100vh-180px)] mt-4">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2 mt-4">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                disabled={chatLoading}
              />
              <Button onClick={handleChat} disabled={chatLoading || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AssistantsManager;
