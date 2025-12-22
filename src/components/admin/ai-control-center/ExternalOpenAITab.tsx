import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, ExternalLink, Copy, CheckCircle, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ExternalWorkflow {
  id: string;
  name: string;
  description: string;
  openai_workflow_id: string;
  callback_url: string;
  configuration: any;
  is_active: boolean;
  created_at: string;
}

const ExternalOpenAITab = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<ExternalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ExternalWorkflow | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    openai_workflow_id: '',
    configuration: '{}'
  });

  // Generate callback URL
  const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://ozjhdxvwqbzcvcywhwjg.supabase.co'}/functions/v1/agent-callback-receiver`;

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('external_openai_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching external workflows:', error);
      toast.error('Failed to load external workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.openai_workflow_id) {
      toast.error('Name and OpenAI Workflow ID are required');
      return;
    }

    setSaving(true);
    try {
      let configuration = {};
      try {
        configuration = JSON.parse(formData.configuration);
      } catch (e) {
        toast.error('Invalid JSON for configuration');
        setSaving(false);
        return;
      }

      if (editingWorkflow) {
        // Update existing
        const { error } = await supabase
          .from('external_openai_workflows')
          .update({
            name: formData.name,
            description: formData.description,
            openai_workflow_id: formData.openai_workflow_id,
            configuration,
            callback_url: callbackUrl
          })
          .eq('id', editingWorkflow.id);

        if (error) throw error;
        toast.success('Workflow updated');
      } else {
        // Create new
        const { error } = await supabase
          .from('external_openai_workflows')
          .insert({
            name: formData.name,
            description: formData.description,
            openai_workflow_id: formData.openai_workflow_id,
            callback_url: callbackUrl,
            configuration,
            is_active: true,
            created_by: user?.id
          });

        if (error) throw error;
        toast.success('External workflow saved');
      }

      setDialogOpen(false);
      resetForm();
      fetchWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (workflow: ExternalWorkflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      openai_workflow_id: workflow.openai_workflow_id,
      configuration: JSON.stringify(workflow.configuration || {}, null, 2)
    });
    setDialogOpen(true);
  };

  const handleDelete = async (workflow: ExternalWorkflow) => {
    if (!confirm(`Delete "${workflow.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('external_openai_workflows')
        .delete()
        .eq('id', workflow.id);

      if (error) throw error;
      toast.success('Workflow deleted');
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const toggleActive = async (workflow: ExternalWorkflow) => {
    try {
      const { error } = await supabase
        .from('external_openai_workflows')
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const resetForm = () => {
    setEditingWorkflow(null);
    setFormData({ name: '', description: '', openai_workflow_id: '', configuration: '{}' });
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
        <h3 className="text-lg font-medium">External OpenAI Agent Builder</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add External Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingWorkflow ? 'Edit' : 'Add'} External OpenAI Workflow</DialogTitle>
              <DialogDescription>
                Connect to an OpenAI Platform Agent Builder workflow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My External Workflow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openai_workflow_id">OpenAI Workflow ID</Label>
                <Input
                  id="openai_workflow_id"
                  value={formData.openai_workflow_id}
                  onChange={(e) => setFormData({ ...formData, openai_workflow_id: e.target.value })}
                  placeholder="wf_xxxxxxxx"
                />
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
              <div className="space-y-2">
                <Label htmlFor="configuration">Configuration (JSON)</Label>
                <Textarea
                  id="configuration"
                  value={formData.configuration}
                  onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Callback URL (for MCP/HTTP node)</Label>
                <div className="flex gap-2">
                  <Input value={callbackUrl} readOnly />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(callbackUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Use this URL in your OpenAI workflow's HTTP node</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">How to Connect External Workflows</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Create a workflow in the OpenAI Platform Agent Builder</p>
          <p>2. Add an HTTP/MCP node in your workflow that calls the callback URL</p>
          <p>3. Copy the workflow ID from OpenAI and add it here</p>
          <p>4. Configure the workflow to receive triggers from this platform</p>
        </CardContent>
      </Card>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No external workflows connected</p>
            <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
              Connect your first external workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-primary" />
                      {workflow.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {workflow.description || 'No description'}
                    </p>
                  </div>
                  <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                    {workflow.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workflow ID:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{workflow.openai_workflow_id}</code>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(workflow)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Switch
                    checked={workflow.is_active}
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
    </div>
  );
};

export default ExternalOpenAITab;
