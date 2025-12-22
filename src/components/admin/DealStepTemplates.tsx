import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, FileText, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DealStepTemplate {
  id: string;
  step_number: number;
  step_name: string;
  step_description: string | null;
  requires_file: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export default function DealStepTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DealStepTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DealStepTemplate | null>(null);
  
  const [form, setForm] = useState({
    step_number: 1,
    step_name: '',
    step_description: '',
    requires_file: false,
    is_active: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deal_step_templates')
        .select('*')
        .order('step_number', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (template: DealStepTemplate) => {
    setEditingTemplate(template);
    setForm({
      step_number: template.step_number,
      step_name: template.step_name,
      step_description: template.step_description || '',
      requires_file: template.requires_file || false,
      is_active: template.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    const nextStepNumber = templates.length > 0 
      ? Math.max(...templates.map(t => t.step_number)) + 1 
      : 1;
    setForm({
      step_number: nextStepNumber,
      step_name: '',
      step_description: '',
      requires_file: false,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const saveTemplate = async () => {
    if (!form.step_name.trim()) {
      toast({ title: "Error", description: "Step name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('deal_step_templates')
          .update({
            step_number: form.step_number,
            step_name: form.step_name,
            step_description: form.step_description || null,
            requires_file: form.requires_file,
            is_active: form.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({ title: "Success", description: "Template updated" });
      } else {
        const { error } = await supabase
          .from('deal_step_templates')
          .insert({
            step_number: form.step_number,
            step_name: form.step_name,
            step_description: form.step_description || null,
            requires_file: form.requires_file,
            is_active: form.is_active
          });

        if (error) throw error;
        toast({ title: "Success", description: "Template created" });
      }

      setIsDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('deal_step_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Deleted", description: "Template removed" });
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const moveStep = async (template: DealStepTemplate, direction: 'up' | 'down') => {
    const currentIndex = templates.findIndex(t => t.id === template.id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === templates.length - 1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapTemplate = templates[swapIndex];

    try {
      // Swap step numbers
      await supabase
        .from('deal_step_templates')
        .update({ step_number: swapTemplate.step_number })
        .eq('id', template.id);

      await supabase
        .from('deal_step_templates')
        .update({ step_number: template.step_number })
        .eq('id', swapTemplate.id);

      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder templates",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (template: DealStepTemplate) => {
    try {
      const { error } = await supabase
        .from('deal_step_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const [syncingAllDeals, setSyncingAllDeals] = useState(false);

  const syncTemplatesToAllDeals = async () => {
    if (!confirm('This will update step names and descriptions for ALL existing deals with less steps than current templates. Progress, files, and notes will be preserved. Continue?')) {
      return;
    }

    setSyncingAllDeals(true);
    try {
      // Get all deals
      const { data: deals, error: dealsError } = await supabase
        .from('broker_deals')
        .select('id');

      if (dealsError) throw dealsError;

      let updatedCount = 0;
      for (const deal of deals || []) {
        // Get existing steps for this deal
        const { data: existingSteps } = await supabase
          .from('deal_steps')
          .select('*')
          .eq('deal_id', deal.id);

        // Update matching steps
        for (const template of templates) {
          const existingStep = existingSteps?.find(s => s.step_number === template.step_number);
          if (existingStep) {
            await supabase
              .from('deal_steps')
              .update({
                step_name: template.step_name,
                step_description: template.step_description || ''
              })
              .eq('id', existingStep.id);
          }
        }
        updatedCount++;
      }

      toast({
        title: "Success",
        description: `Synced templates to ${updatedCount} deals`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync templates to deals",
        variant: "destructive"
      });
    } finally {
      setSyncingAllDeals(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Deal Step Templates
            </CardTitle>
            <CardDescription>
              Configure the steps that brokers follow when completing deals
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={syncTemplatesToAllDeals}
              disabled={syncingAllDeals || templates.length === 0}
            >
              {syncingAllDeals ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Sync to All Deals
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" /> Add Step
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No step templates configured.</p>
            <Button onClick={openCreateDialog} className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Create First Step
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Step Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">File Required</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template, index) => (
                <TableRow key={template.id} className={!template.is_active ? 'opacity-50' : ''}>
                  <TableCell className="font-bold">{template.step_number}</TableCell>
                  <TableCell className="font-medium">{template.step_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {template.step_description || '-'}
                  </TableCell>
                  <TableCell>
                    {template.requires_file ? (
                      <Badge variant="default">Required</Badge>
                    ) : (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={template.is_active ?? true}
                      onCheckedChange={() => toggleActive(template)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveStep(template, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveStep(template, 'down')}
                        disabled={index === templates.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Step Template' : 'Create Step Template'}
              </DialogTitle>
              <DialogDescription>
                Configure the details for this deal step
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Step Number</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.step_number}
                    onChange={(e) => setForm(prev => ({ ...prev, step_number: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="requires_file"
                    checked={form.requires_file}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, requires_file: checked }))}
                  />
                  <Label htmlFor="requires_file">Requires File Upload</Label>
                </div>
              </div>

              <div>
                <Label>Step Name *</Label>
                <Input
                  placeholder="e.g., Contract Signing"
                  value={form.step_name}
                  onChange={(e) => setForm(prev => ({ ...prev, step_name: e.target.value }))}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what needs to happen in this step..."
                  value={form.step_description}
                  onChange={(e) => setForm(prev => ({ ...prev, step_description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveTemplate} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
