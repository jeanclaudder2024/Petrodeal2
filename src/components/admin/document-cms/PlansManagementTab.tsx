import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CreditCard, Settings, Download, FileText,
  Loader2, Save, Infinity, Check, X
} from 'lucide-react';
import { toast } from 'sonner';
import { usePlans, useTemplates } from './hooks/useDocumentAPI';
import { Plan, Template } from './types';

export default function PlansManagementTab() {
  const { plans, loading, fetchPlans, updatePlan, updateBrokerMembership } = usePlans();
  const { templates, fetchTemplates } = useTemplates();
  
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    canDownload: true,
    maxDownloads: -1,
    allTemplates: true,
    selectedTemplates: [] as string[],
    templateLimits: {} as Record<string, number>,
  });

  useEffect(() => {
    fetchPlans();
    fetchTemplates();
  }, [fetchPlans, fetchTemplates]);

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setEditForm({
      canDownload: plan.can_download ?? true,
      maxDownloads: plan.max_downloads_per_month ?? -1,
      allTemplates: plan.allowed_templates === 'all',
      selectedTemplates: Array.isArray(plan.allowed_templates) ? plan.allowed_templates : [],
      templateLimits: plan.template_limits || {},
    });
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    
    setSaving(true);
    try {
      const planData: {
        can_download?: boolean;
        max_downloads_per_month?: number;
        template_limits?: Record<string, number>;
        allowed_templates?: 'all' | string[];
      } = {
        can_download: editForm.canDownload,
        max_downloads_per_month: editForm.maxDownloads,
        allowed_templates: editForm.allTemplates ? 'all' as const : editForm.selectedTemplates,
        template_limits: editForm.templateLimits,
      };

      // Check if it's broker membership
      if (editingPlan.plan_tier === 'broker' || editingPlan.plan_name.toLowerCase().includes('broker')) {
        await updateBrokerMembership(planData);
      } else {
        await updatePlan(editingPlan.id || editingPlan.plan_id || '', planData);
      }
      
      toast.success('Plan updated successfully');
      setEditingPlan(null);
    } catch (error) {
      toast.error('Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplateSelection = (templateId: string) => {
    setEditForm(prev => ({
      ...prev,
      selectedTemplates: prev.selectedTemplates.includes(templateId)
        ? prev.selectedTemplates.filter(id => id !== templateId)
        : [...prev.selectedTemplates, templateId],
    }));
  };

  const setTemplateLimit = (templateId: string, limit: number) => {
    setEditForm(prev => ({
      ...prev,
      templateLimits: { ...prev.templateLimits, [templateId]: limit },
    }));
  };

  const getPlanTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'basic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'premium': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'enterprise': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'broker': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Subscription Plans</h3>
          <p className="text-sm text-muted-foreground">
            Configure template access and download limits for each plan
          </p>
        </div>
        <Button variant="outline" onClick={fetchPlans} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No subscription plans found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id || plan.plan_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{plan.plan_name}</CardTitle>
                    <Badge className={`mt-1 ${getPlanTierColor(plan.plan_tier)}`}>
                      {plan.plan_tier}
                    </Badge>
                  </div>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      Downloads
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      {plan.can_download ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-red-500" />
                          Disabled
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Infinity className="h-3.5 w-3.5" />
                      Monthly Limit
                    </span>
                    <span className="font-medium">
                      {plan.max_downloads_per_month === -1 ? 'Unlimited' : plan.max_downloads_per_month || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Templates
                    </span>
                    <span className="font-medium">
                      {plan.allowed_templates === 'all' 
                        ? 'All' 
                        : Array.isArray(plan.allowed_templates) 
                          ? plan.allowed_templates.length 
                          : 0}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => handleEditPlan(plan)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configure: {editingPlan?.plan_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Download Permission */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label className="font-medium">Allow Downloads</Label>
                <p className="text-sm text-muted-foreground">
                  Enable document template downloads for this plan
                </p>
              </div>
              <Switch
                checked={editForm.canDownload}
                onCheckedChange={(v) => setEditForm(f => ({ ...f, canDownload: v }))}
              />
            </div>

            {/* Monthly Limit */}
            <div className="p-4 rounded-lg border space-y-3">
              <div>
                <Label className="font-medium">Monthly Download Limit</Label>
                <p className="text-sm text-muted-foreground">
                  Maximum downloads per month (-1 for unlimited)
                </p>
              </div>
              <Input
                type="number"
                min={-1}
                value={editForm.maxDownloads}
                onChange={(e) => setEditForm(f => ({ ...f, maxDownloads: parseInt(e.target.value) || -1 }))}
                className="max-w-[200px]"
              />
            </div>

            {/* Template Selection */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Allowed Templates</Label>
                  <p className="text-sm text-muted-foreground">
                    Select which templates this plan can access
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">All Templates</Label>
                  <Switch
                    checked={editForm.allTemplates}
                    onCheckedChange={(v) => setEditForm(f => ({ ...f, allTemplates: v }))}
                  />
                </div>
              </div>
              
              {!editForm.allTemplates && (
                <ScrollArea className="h-[200px] border rounded-lg p-2">
                  <div className="space-y-2">
                    {templates.map(template => (
                      <div key={template.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={editForm.selectedTemplates.includes(template.id)}
                            onCheckedChange={() => toggleTemplateSelection(template.id)}
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {template.display_name || template.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{template.file_name}</p>
                          </div>
                        </div>
                        {editForm.selectedTemplates.includes(template.id) && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Limit:</Label>
                            <Input
                              type="number"
                              min={-1}
                              value={editForm.templateLimits[template.id] ?? -1}
                              onChange={(e) => setTemplateLimit(template.id, parseInt(e.target.value) || -1)}
                              className="w-20 h-7 text-xs"
                              placeholder="-1"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
