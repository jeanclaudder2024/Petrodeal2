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
import { Plus, Edit, Trash2, Loader2, Code, Eye, Workflow, CheckCircle, XCircle, Cpu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string | null;
  model: string;
  tools: unknown;
  workflows: unknown;
  behaviors: unknown;
  triggers: unknown;
  compiled_json: unknown;
  linked_assistant_id: string | null;
  is_active: boolean | null;
  created_at: string;
  [key: string]: unknown;
}

interface Tool {
  id: string;
  name: string;
  function_name: string;
  description: string;
}

const SDKAgentsTab = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [viewingJson, setViewingJson] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    model: 'gpt-4o',
    selectedTools: [] as string[],
    triggers: [] as string[]
  });

  const TRIGGER_OPTIONS = [
    'vessel_arrived', 'vessel_departed', 'order_created', 'order_updated',
    'support_ticket_created', 'email_received', 'subscription_started', 'payment_failed'
  ];

  useEffect(() => {
    fetchAgents();
    fetchTools();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_tools')
        .select('id, name, function_name, description')
        .eq('is_active', true);

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.system_prompt) {
      toast.error('Name and system prompt are required');
      return;
    }

    setSaving(true);
    try {
      const selectedToolObjects = tools.filter(t => formData.selectedTools.includes(t.id));
      
      const payload = {
        name: formData.name,
        description: formData.description,
        system_prompt: formData.system_prompt,
        model: formData.model,
        tools: selectedToolObjects,
        triggers: formData.triggers,
        created_by: user?.id
      };

      if (editingAgent) {
        const { error } = await supabase.functions.invoke('openai-agent-builder', {
          body: { action: 'update_agent', id: editingAgent.id, ...payload }
        });
        if (error) throw error;
        toast.success('Agent updated');
      } else {
        const { error } = await supabase.functions.invoke('openai-agent-builder', {
          body: { action: 'create_agent', ...payload }
        });
        if (error) throw error;
        toast.success('Agent created');
      }

      setDialogOpen(false);
      resetForm();
      fetchAgents();
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error('Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    const agentTools = Array.isArray(agent.tools) ? agent.tools : [];
    const agentTriggers = Array.isArray(agent.triggers) ? agent.triggers : [];
    setFormData({
      name: agent.name,
      description: agent.description || '',
      system_prompt: agent.system_prompt || '',
      model: agent.model,
      selectedTools: agentTools.map((t: any) => t.id),
      triggers: agentTriggers
    });
    setDialogOpen(true);
  };

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Delete "${agent.name}"?`)) return;

    try {
      const { error } = await supabase.functions.invoke('openai-agent-builder', {
        body: { action: 'delete_agent', id: agent.id }
      });
      if (error) throw error;
      toast.success('Agent deleted');
      fetchAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const handleCompileToAssistant = async (agent: Agent) => {
    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: { action: 'compile_to_assistant', agent_id: agent.id }
      });
      if (error) throw error;
      toast.success('Agent compiled to OpenAI Assistant');
      fetchAgents();
    } catch (error) {
      console.error('Error compiling agent:', error);
      toast.error('Failed to compile agent');
    }
  };

  const viewJson = (agent: Agent) => {
    const json = {
      name: agent.name,
      description: agent.description,
      system_prompt: agent.system_prompt,
      model: agent.model,
      tools: agent.tools,
      workflows: agent.workflows,
      behaviors: agent.behaviors,
      triggers: agent.triggers
    };
    setViewingJson(json);
    setJsonDialogOpen(true);
  };

  const toggleActive = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({ is_active: !agent.is_active })
        .eq('id', agent.id);

      if (error) throw error;
      setAgents(agents.map(a => a.id === agent.id ? { ...a, is_active: !a.is_active } : a));
      toast.success(`Agent ${!agent.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling agent:', error);
      toast.error('Failed to update agent');
    }
  };

  const resetForm = () => {
    setEditingAgent(null);
    setFormData({
      name: '',
      description: '',
      system_prompt: '',
      model: 'gpt-4o',
      selectedTools: [],
      triggers: []
    });
  };

  const toggleTool = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTools: prev.selectedTools.includes(toolId)
        ? prev.selectedTools.filter(id => id !== toolId)
        : [...prev.selectedTools, toolId]
    }));
  };

  const toggleTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter(t => t !== trigger)
        : [...prev.triggers, trigger]
    }));
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
        <div>
          <h3 className="text-lg font-medium">SDK Agents (Local)</h3>
          <p className="text-sm text-muted-foreground">
            Agents run locally using OpenAI API - not visible on OpenAI platform
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Edit' : 'Create'} SDK Agent</DialogTitle>
              <DialogDescription>
                Create a local agent that uses OpenAI API for inference
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
                    placeholder="Operations Agent"
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
                  placeholder="Handles vessel operations and monitoring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt *</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="You are an AI agent responsible for..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Tools</Label>
                <div className="flex flex-wrap gap-2">
                  {tools.map(tool => (
                    <Badge
                      key={tool.id}
                      variant={formData.selectedTools.includes(tool.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTool(tool.id)}
                    >
                      {formData.selectedTools.includes(tool.id) && <CheckCircle className="h-3 w-3 mr-1" />}
                      {tool.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Triggers</Label>
                <div className="flex flex-wrap gap-2">
                  {TRIGGER_OPTIONS.map(trigger => (
                    <Badge
                      key={trigger}
                      variant={formData.triggers.includes(trigger) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTrigger(trigger)}
                    >
                      {formData.triggers.includes(trigger) && <CheckCircle className="h-3 w-3 mr-1" />}
                      {trigger.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAgent ? 'Update' : 'Create'} Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No SDK agents created yet</p>
            <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
              Create your first local agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      {agent.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {agent.description || 'No description'}
                    </p>
                  </div>
                  <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                    {agent.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <Badge variant="outline">{agent.model}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const agentTools = Array.isArray(agent.tools) ? agent.tools : [];
                      return agentTools.slice(0, 3).map((tool: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{tool.name}</Badge>
                      ));
                    })()}
                    {(() => {
                      const agentTools = Array.isArray(agent.tools) ? agent.tools : [];
                      return agentTools.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{agentTools.length - 3}</Badge>
                      );
                    })()}
                  </div>
                  {agent.linked_assistant_id && (
                    <Badge className="text-xs bg-green-500">Linked to Assistant</Badge>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => viewJson(agent)}>
                    <Eye className="h-4 w-4 mr-1" />
                    JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCompileToAssistant(agent)}>
                    <Workflow className="h-4 w-4 mr-1" />
                    Compile
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(agent)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={agent.is_active}
                    onCheckedChange={() => toggleActive(agent)}
                  />
                  <Button variant="outline" size="sm" onClick={() => handleDelete(agent)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* JSON View Dialog */}
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Agent Configuration JSON</DialogTitle>
          </DialogHeader>
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[60vh]">
            {JSON.stringify(viewingJson, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SDKAgentsTab;
