import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, Edit, Trash2, Loader2, Workflow, CheckCircle, XCircle, FileJson } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  MarkerType,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string | null;
  steps: unknown;
  is_active: boolean | null;
  version: number | null;
  created_at: string;
  [key: string]: unknown;
}

interface EventTemplate {
  event_name: string;
  sample_payload: any;
  description: string;
}

const TRIGGER_EVENTS = [
  { value: 'vessel_status_changed', label: 'Vessel Status Changed' },
  { value: 'vessel_eta_updated', label: 'Vessel ETA Updated' },
  { value: 'vessel_arrived', label: 'Vessel Arrived' },
  { value: 'vessel_departed', label: 'Vessel Departed' },
  { value: 'order_created', label: 'Order Created' },
  { value: 'order_updated', label: 'Order Updated' },
  { value: 'order_completed', label: 'Order Completed' },
  { value: 'support_ticket_created', label: 'Support Ticket Created' },
  { value: 'support_ticket_updated', label: 'Support Ticket Updated' },
  { value: 'email_received', label: 'Email Received' },
  { value: 'subscription_started', label: 'Subscription Started' },
  { value: 'subscription_cancelled', label: 'Subscription Cancelled' },
  { value: 'payment_successful', label: 'Payment Successful' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'broker_approved', label: 'Broker Approved' },
  { value: 'deal_created', label: 'Deal Created' },
  { value: 'deal_completed', label: 'Deal Completed' },
  { value: 'manual', label: 'Manual Trigger' }
];

const initialNodes: Node[] = [
  {
    id: 'trigger',
    type: 'input',
    position: { x: 250, y: 0 },
    data: { label: 'Trigger' },
    style: { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
  }
];

const WorkflowsTab = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [eventTemplates, setEventTemplates] = useState<EventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [testPayloadOpen, setTestPayloadOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null);
  const [testPayload, setTestPayload] = useState('{}');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_event: 'manual'
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed }
    }, eds));
  }, [setEdges]);

  useEffect(() => {
    fetchWorkflows();
    fetchEventTemplates();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('event_registry')
        .select('event_name, sample_payload, description')
        .eq('is_active', true);

      if (error) throw error;
      setEventTemplates(data || []);
    } catch (error) {
      console.error('Error fetching event templates:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'create_workflow',
          name: formData.name,
          description: formData.description,
          trigger_event: formData.trigger_event,
          steps: { nodes: initialNodes, edges: [] },
          created_by: user?.id
        }
      });

      if (error) throw error;

      toast.success('Workflow created');
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '', trigger_event: 'manual' });
      fetchWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'update_workflow',
          id: selectedWorkflow.id,
          name: selectedWorkflow.name,
          description: selectedWorkflow.description,
          trigger_event: selectedWorkflow.trigger_event,
          steps: { nodes, edges },
          is_active: selectedWorkflow.is_active,
          version: (selectedWorkflow.version || 1) + 1
        }
      });

      if (error) throw error;

      toast.success('Workflow saved');
      setEditorOpen(false);
      fetchWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (workflow: WorkflowData) => {
    if (!confirm(`Delete "${workflow.name}"?`)) return;

    try {
      const { error } = await supabase.functions.invoke('openai-agent-builder', {
        body: { action: 'delete_workflow', id: workflow.id }
      });

      if (error) throw error;

      toast.success('Workflow deleted');
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const openTestPayloadDialog = (workflow: WorkflowData) => {
    setSelectedWorkflow(workflow);
    // Get sample payload for this event
    const template = eventTemplates.find(e => e.event_name === workflow.trigger_event);
    if (template?.sample_payload) {
      setTestPayload(JSON.stringify(template.sample_payload, null, 2));
    } else {
      setTestPayload(JSON.stringify({ triggered_by: user?.id }, null, 2));
    }
    setTestPayloadOpen(true);
  };

  const handleRunWithPayload = async () => {
    if (!selectedWorkflow) return;

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(testPayload);
    } catch (e) {
      toast.error('Invalid JSON payload');
      return;
    }

    setRunning(selectedWorkflow.id);
    setTestPayloadOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'trigger_workflow',
          workflow_id: selectedWorkflow.id,
          trigger_event: selectedWorkflow.trigger_event || 'manual',
          trigger_data: parsedPayload
        }
      });

      if (error) throw error;

      toast.success('Workflow triggered with test payload');
    } catch (error) {
      console.error('Error running workflow:', error);
      toast.error('Failed to trigger workflow');
    } finally {
      setRunning(null);
    }
  };

  const openEditor = (workflow: WorkflowData) => {
    setSelectedWorkflow(workflow);
    const steps = workflow.steps as { nodes?: Node[]; edges?: Edge[] } | null;
    setNodes(steps?.nodes || initialNodes);
    setEdges(steps?.edges || []);
    setEditorOpen(true);
  };

  const addNode = (type: 'tool' | 'condition' | 'ai' | 'action') => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position: { x: 250, y: nodes.length * 100 },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1) + ' Node',
        type
      },
      style: {
        background: type === 'tool' ? 'hsl(var(--chart-1))' :
                    type === 'condition' ? 'hsl(var(--chart-2))' :
                    type === 'ai' ? 'hsl(var(--chart-3))' :
                    'hsl(var(--chart-4))',
        color: 'white'
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const toggleActive = async (workflow: WorkflowData) => {
    try {
      const { error } = await supabase
        .from('agent_workflows')
        .update({ is_active: !workflow.is_active })
        .eq('id', workflow.id);

      if (error) throw error;

      setWorkflows(workflows.map(w => w.id === workflow.id ? { ...w, is_active: !w.is_active } : w));
      toast.success(`Workflow ${!workflow.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast.error('Failed to update workflow');
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Automation Workflows</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Create an automation workflow triggered by platform events
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Vessel Arrival Notification"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger Event</Label>
                <Select value={formData.trigger_event} onValueChange={(v) => setFormData({ ...formData, trigger_event: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map(event => (
                      <SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this workflow do?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No workflows created yet</p>
            <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              Create your first workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-primary" />
                    {workflow.name}
                  </CardTitle>
                  <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                    {workflow.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{workflow.description || 'No description'}</p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">
                    {TRIGGER_EVENTS.find(e => e.value === workflow.trigger_event)?.label || workflow.trigger_event}
                  </Badge>
                  <span className="text-xs text-muted-foreground">v{workflow.version}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openTestPayloadDialog(workflow)} 
                    disabled={running === workflow.id}
                  >
                    {running === workflow.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Run
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditor(workflow)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={workflow.is_active || false}
                    onCheckedChange={() => toggleActive(workflow)}
                  />
                  <Button variant="outline" size="sm" onClick={() => handleDelete(workflow)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Test Payload Dialog */}
      <Dialog open={testPayloadOpen} onOpenChange={setTestPayloadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Test Payload for: {selectedWorkflow?.name}
            </DialogTitle>
            <DialogDescription>
              Edit the JSON payload to simulate different trigger data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Trigger Event: {selectedWorkflow?.trigger_event}</Label>
                <Select
                  onValueChange={(eventName) => {
                    const template = eventTemplates.find(e => e.event_name === eventName);
                    if (template?.sample_payload) {
                      setTestPayload(JSON.stringify(template.sample_payload, null, 2));
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Load template" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTemplates.map(e => (
                      <SelectItem key={e.event_name} value={e.event_name}>
                        {e.event_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestPayloadOpen(false)}>Cancel</Button>
            <Button onClick={handleRunWithPayload}>
              <Play className="h-4 w-4 mr-2" />
              Run with Payload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-5xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Workflow: {selectedWorkflow?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-2">
            <Button size="sm" variant="outline" onClick={() => addNode('tool')}>+ Tool</Button>
            <Button size="sm" variant="outline" onClick={() => addNode('condition')}>+ Condition</Button>
            <Button size="sm" variant="outline" onClick={() => addNode('ai')}>+ AI</Button>
            <Button size="sm" variant="outline" onClick={() => addNode('action')}>+ Action</Button>
          </div>
          <div className="h-[calc(100%-120px)] border rounded-lg">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWorkflow} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowsTab;