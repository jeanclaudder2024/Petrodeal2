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
import { RefreshCw, Plus, Loader2, Wrench, CheckCircle, XCircle, Play, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tool {
  id: string;
  name: string;
  function_name: string;
  description: string;
  parameters: any;
  category: string;
  is_active: boolean;
  is_system: boolean;
  edge_function_url: string | null;
  last_executed_at: string | null;
  last_execution_status: string | null;
  avg_execution_time_ms: number | null;
  execution_count: number;
  created_at: string;
}

const CATEGORIES = [
  { value: 'vessel', label: 'Vessel' },
  { value: 'port', label: 'Port' },
  { value: 'refinery', label: 'Refinery' },
  { value: 'company', label: 'Company' },
  { value: 'email', label: 'Email' },
  { value: 'billing', label: 'Billing' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'broker', label: 'Broker' },
  { value: 'market', label: 'Market' },
  { value: 'custom', label: 'Custom' }
];

const ToolsTab = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [testParams, setTestParams] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    function_name: '',
    description: '',
    category: 'custom',
    parameters: '{}'
  });

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_tools')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
      toast.error('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: { action: 'discover_tools' }
      });

      if (error) throw error;

      toast.success(`Discovered ${data.discovered} tools`);
      fetchTools();
    } catch (error) {
      console.error('Error discovering tools:', error);
      toast.error('Failed to discover tools');
    } finally {
      setDiscovering(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.function_name) {
      toast.error('Name and function name are required');
      return;
    }

    setSaving(true);
    try {
      let parameters = {};
      try {
        parameters = JSON.parse(formData.parameters);
      } catch (e) {
        toast.error('Invalid JSON for parameters');
        setSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'add_tool',
          name: formData.name,
          function_name: formData.function_name,
          description: formData.description,
          category: formData.category,
          parameters
        }
      });

      if (error) throw error;

      toast.success('Tool created successfully');
      setCreateDialogOpen(false);
      setFormData({ name: '', function_name: '', description: '', category: 'custom', parameters: '{}' });
      fetchTools();
    } catch (error) {
      console.error('Error creating tool:', error);
      toast.error('Failed to create tool');
    } finally {
      setSaving(false);
    }
  };

  const openTestDialog = (tool: Tool) => {
    setSelectedTool(tool);
    setTestParams(JSON.stringify(tool.parameters || {}, null, 2));
    setTestResult(null);
    setTestDialogOpen(true);
  };

  const handleTestTool = async () => {
    if (!selectedTool) return;

    let parsedParams;
    try {
      parsedParams = JSON.parse(testParams);
    } catch (e) {
      toast.error('Invalid JSON parameters');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'test_tool',
          tool_id: selectedTool.id,
          parameters: parsedParams
        }
      });

      if (error) throw error;

      setTestResult(data);
      if (data.success) {
        toast.success(`Tool executed in ${data.execution_time_ms}ms`);
      } else {
        toast.error('Tool execution failed');
      }
      
      // Refresh tools to get updated stats
      fetchTools();
    } catch (error) {
      console.error('Error testing tool:', error);
      toast.error('Failed to test tool');
    } finally {
      setTesting(false);
    }
  };

  const toggleTool = async (tool: Tool) => {
    try {
      const { error } = await supabase
        .from('agent_tools')
        .update({ is_active: !tool.is_active })
        .eq('id', tool.id);

      if (error) throw error;

      setTools(tools.map(t => t.id === tool.id ? { ...t, is_active: !t.is_active } : t));
      toast.success(`Tool ${!tool.is_active ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling tool:', error);
      toast.error('Failed to update tool');
    }
  };

  const groupedTools = tools.reduce((acc, tool) => {
    const category = tool.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

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
        <h3 className="text-lg font-medium">Platform Tools</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDiscover} disabled={discovering}>
            {discovering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Discover Tools
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Tool
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Tool</DialogTitle>
                <DialogDescription>
                  Create a custom tool that can be used by AI agents
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Custom Tool"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="function_name">Function Name</Label>
                  <Input
                    id="function_name"
                    value={formData.function_name}
                    onChange={(e) => setFormData({ ...formData, function_name: e.target.value })}
                    placeholder="my-custom-tool"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                    placeholder="What does this tool do?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parameters">Parameters (JSON Schema)</Label>
                  <Textarea
                    id="parameters"
                    value={formData.parameters}
                    onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                    placeholder='{"type": "object", "properties": {}}'
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Tool
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tools discovered yet</p>
            <Button variant="outline" className="mt-4" onClick={handleDiscover}>
              Discover Platform Tools
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTools).map(([category, categoryTools]) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                  <Badge variant="outline">{category}</Badge>
                  <span className="text-muted-foreground font-normal">
                    {categoryTools.length} tool{categoryTools.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {categoryTools.map((tool) => (
                    <div key={tool.id} className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tool.name}</span>
                          {tool.is_system && <Badge variant="secondary" className="text-xs">System</Badge>}
                          {tool.last_execution_status && (
                            <Badge 
                              variant={tool.last_execution_status === 'success' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {tool.last_execution_status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <code className="text-xs text-muted-foreground">{tool.function_name}</code>
                          {tool.execution_count > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {tool.execution_count} runs
                            </span>
                          )}
                          {tool.avg_execution_time_ms && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ~{tool.avg_execution_time_ms}ms
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openTestDialog(tool)}>
                          <Play className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <div className="flex items-center gap-2">
                          {tool.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Switch
                            checked={tool.is_active}
                            onCheckedChange={() => toggleTool(tool)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Test Tool Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Test Tool: {selectedTool?.name}
            </DialogTitle>
            <DialogDescription>
              Execute this tool with custom parameters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Function: <code>{selectedTool?.function_name}</code></Label>
              <Label>Input Parameters (JSON)</Label>
              <Textarea
                value={testParams}
                onChange={(e) => setTestParams(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder='{"param1": "value1"}'
              />
            </div>

            {testResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Result</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={testResult.success ? 'default' : 'destructive'}>
                      {testResult.success ? 'Success' : 'Failed'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {testResult.execution_time_ms}ms
                    </span>
                  </div>
                </div>
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[200px]">
                  {JSON.stringify(testResult.result || testResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>Close</Button>
            <Button onClick={handleTestTool} disabled={testing}>
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Execute Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToolsTab;