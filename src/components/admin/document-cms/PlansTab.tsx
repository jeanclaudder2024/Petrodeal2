import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Shield, RefreshCw, Edit2, Loader2, Save, 
  UserCheck, Info, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { usePlans, useTemplates } from './hooks/useDocumentAPI';
import { API_BASE_URL, normalizeTemplateName } from './types';

interface PlansTabProps {
  isAuthenticated: boolean;
}

export default function PlansTab({ isAuthenticated }: PlansTabProps) {
  const { plans, loading, fetchPlans } = usePlans();
  const { templates, fetchTemplates } = useTemplates();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [accessType, setAccessType] = useState<'all' | 'specific'>('all');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [maxDownloads, setMaxDownloads] = useState<number>(10);
  const [features, setFeatures] = useState<string>('');
  
  // Test permission state
  const [testUserId, setTestUserId] = useState('basic');
  const [testTemplate, setTestTemplate] = useState('');
  const [permissionResult, setPermissionResult] = useState<any>(null);
  const [testingPermission, setTestingPermission] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditPlan = (planId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to edit plans');
      return;
    }
    if (!plans || !plans[planId]) return;
    
    const plan = plans[planId];
    const canDownload = plan.can_download;
    const canDownloadList = Array.isArray(canDownload)
      ? canDownload
      : canDownload === '*' || canDownload === true
        ? ['*']
        : canDownload
          ? [String(canDownload)]
          : [];
    const isAllTemplates = canDownloadList.length === 1 && canDownloadList[0] === '*';
    
    setSelectedPlanId(planId);
    setAccessType(isAllTemplates ? 'all' : 'specific');
    // Normalize template names when setting selected templates
    const normalizedTemplates = isAllTemplates ? [] : canDownloadList
      .filter(t => t !== '*')
      .map(t => normalizeTemplateName(t));
    setSelectedTemplates(normalizedTemplates);
    setMaxDownloads(plan.max_downloads_per_month !== undefined ? plan.max_downloads_per_month : 10);
    setFeatures(Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features || ''));
    setEditDialogOpen(true);
  };

  const handleTemplateCheckboxChange = (templateName: string, checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedTemplates(prev => prev.includes(templateName) ? prev : [...prev, templateName]);
    } else {
      setSelectedTemplates(prev => prev.filter(t => t !== templateName));
    }
  };

  const handleSavePlan = async () => {
    if (!selectedPlanId || !plans || !plans[selectedPlanId]) return;
    
    if (accessType === 'specific' && selectedTemplates.length === 0) {
      toast.error('Error', { description: 'Please select at least one template' });
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in to update plans');
      return;
    }

    setSaving(true);
    try {
      const canDownload = accessType === 'all' ? ['*'] : selectedTemplates;
      const featuresArray = features ? features.split(',').map(f => f.trim()).filter(f => f) : [];
      const existingPlan = plans[selectedPlanId] as Record<string, unknown>;
      
      const planData: Record<string, unknown> = {
        can_download: canDownload,
        max_downloads_per_month: maxDownloads,
        features: featuresArray,
      };
      if (existingPlan?.name) planData.name = existingPlan.name;
      if (existingPlan?.description) planData.description = existingPlan.description;
      if (existingPlan?.monthly_price !== undefined) planData.monthly_price = existingPlan.monthly_price;
      if (existingPlan?.annual_price !== undefined) planData.annual_price = existingPlan.annual_price;
      if (existingPlan?.plan_tier) planData.plan_tier = existingPlan.plan_tier;

      const response = await fetch(`${API_BASE_URL}/update-plan`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: selectedPlanId, plan_data: planData }),
      });

      if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        setEditDialogOpen(false);
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Save failed' }));
        const msg = typeof err?.detail === 'string' ? err.detail : 'Save failed';
        throw new Error(msg);
      }

      toast.success('Plan Updated', { description: 'Plan settings saved successfully' });
      setEditDialogOpen(false);
      fetchPlans();
    } catch (error) {
      toast.error('Save Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestPermission = async () => {
    if (!testTemplate.trim()) {
      toast.error('Missing Info', { description: 'Please enter template name' });
      return;
    }

    setTestingPermission(true);
    try {
      const response = await fetch(`${API_BASE_URL}/check-download-permission`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: testUserId,
          template_name: testTemplate,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Check failed' }));
        throw new Error(error.detail || 'Check failed');
      }

      const data = await response.json();
      setPermissionResult(data);
    } catch (error) {
      toast.error('Permission Check Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setPermissionResult(null);
    } finally {
      setTestingPermission(false);
    }
  };

  const formatTemplateLabel = (templateName: string) => {
    // Normalize template name for comparison
    const normalizedName = normalizeTemplateName(templateName);
    // Find template in templates array to get display name
    const template = templates.find(t => {
      const tName = normalizeTemplateName(t.name || t.file_name || '');
      return tName === normalizedName;
    });
    if (template) {
      return template.metadata?.display_name || template.display_name || template.title || normalizedName.replace('.docx', '');
    }
    return normalizedName.replace('.docx', '');
  };

  const allTemplates = [...new Set(
    templates
      .map(t => normalizeTemplateName(t.name || t.file_name || ''))
      .filter(t => t && t.trim() !== '')
  )];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column - Plans List */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Subscription Plans
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isAuthenticated && (
                <span className="text-xs text-amber-600 font-medium">Log in to edit plans</span>
              )}
              <Button variant="outline" size="sm" onClick={() => { fetchPlans(); fetchTemplates(); }}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading plans...
              </div>
            ) : !plans || Object.keys(plans).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No plans found. Refresh or check the document API.
              </div>
            ) : (
              <ScrollArea className="h-[min(50vh,420px)] pr-4">
                <div className="space-y-3">
                {Object.entries(plans).map(([planId, plan]: [string, any]) => {
                  const canDownload = plan.can_download;
                  const canDownloadList = Array.isArray(canDownload)
                    ? canDownload
                    : canDownload === '*' || canDownload === true
                      ? ['*']
                      : canDownload
                        ? [String(canDownload)]
                        : [];
                  const isAllTemplates = canDownloadList.length === 1 && canDownloadList[0] === '*';
                  const maxDownloads = plan.max_downloads_per_month !== undefined ? plan.max_downloads_per_month : 10;
                  const planFeatures = Array.isArray(plan.features) ? plan.features : [];

                  return (
                    <Card key={planId}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-semibold">{plan.name || planId}</h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPlan(planId)}
                            disabled={!isAuthenticated}
                            title={!isAuthenticated ? 'Log in to edit plans' : undefined}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <strong>Download Allowed:</strong>{' '}
                            {isAllTemplates ? (
                              <Badge className="bg-green-600">All templates (*)</Badge>
                            ) : (
                              <Badge className="bg-blue-600">{canDownloadList.length} template{canDownloadList.length === 1 ? '' : 's'}</Badge>
                            )}
                            {!isAllTemplates && canDownloadList.length > 0 && (
                              <ul className="mt-2 ml-4 list-disc text-sm">
                                {canDownloadList.filter(t => t !== '*').slice(0, 5).map((t: string) => (
                                  <li key={t}>
                                    <small>{formatTemplateLabel(t)}</small>
                                  </li>
                                ))}
                                {canDownloadList.filter(t => t !== '*').length > 5 && (
                                  <li><small>... and {canDownloadList.filter(t => t !== '*').length - 5} more</small></li>
                                )}
                              </ul>
                            )}
                          </div>
                          <div>
                            <strong>Max downloads per month:</strong>{' '}
                            {maxDownloads === -1 ? (
                              <Badge className="bg-green-600">Unlimited</Badge>
                            ) : (
                              <Badge variant="secondary">{maxDownloads}/month</Badge>
                            )}
                          </div>
                          {planFeatures.length > 0 && (
                            <div>
                              <strong>Features:</strong>{' '}
                              <small className="text-muted-foreground">
                                {planFeatures.slice(0, 3).join(', ')}
                                {planFeatures.length > 3 ? '...' : ''}
                              </small>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Test Permission & Info */}
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4" />
              Test Permission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>User ID</Label>
              <Input
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                placeholder="basic/premium/enterprise"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Template Name</Label>
              <Input
                value={testTemplate}
                onChange={(e) => setTestTemplate(e.target.value)}
                placeholder="template.docx"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleTestPermission}
              disabled={testingPermission || !isAuthenticated}
              className="w-full"
            >
              {testingPermission ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Check Permission
                </>
              )}
            </Button>
            {permissionResult && (
              <Alert className={permissionResult.can_download ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
                <AlertDescription>
                  <div className="flex items-center gap-2 mb-1">
                    {permissionResult.can_download ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    <strong>Result:</strong>{' '}
                    {permissionResult.can_download ? '✓ Can Download' : '✗ Cannot Download'}
                  </div>
                  <small className="text-xs text-muted-foreground">
                    User: {permissionResult.user_id} | Plan: {permissionResult.plan} | Template: {permissionResult.template_name}
                  </small>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              Quick Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 font-semibold">Plans:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li><strong>Basic:</strong> Limited templates</li>
                <li><strong>Premium:</strong> More templates</li>
                <li><strong>Enterprise:</strong> All templates (*)</li>
              </ul>
            </div>
            <div className="border-t pt-4">
              <p className="mb-2 font-semibold">Features:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>Edit template permissions</li>
                <li>Set download limits</li>
                <li>Manage access per plan</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Plan Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              Edit Plan: {selectedPlanId && plans && plans[selectedPlanId] ? (plans[selectedPlanId] as any).name : selectedPlanId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-semibold">Allowed Templates:</Label>
              <RadioGroup value={accessType} onValueChange={(v) => setAccessType(v as 'all' | 'specific')} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="access-all" />
                  <Label htmlFor="access-all" className="font-normal cursor-pointer">
                    All templates (unlimited)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="access-specific" />
                  <Label htmlFor="access-specific" className="font-normal cursor-pointer">
                    Specific templates
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {accessType === 'specific' && (
              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">Select templates this plan can download:</p>
                  {allTemplates.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSelectedTemplates([...allTemplates])}
                      >
                        Select all
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSelectedTemplates([])}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </div>
                {allTemplates.length > 0 ? (
                  <ScrollArea className="h-48 rounded border p-2">
                    <div className="space-y-2 pr-2">
                      {allTemplates.map((templateName) => {
                        const normalizedName = normalizeTemplateName(templateName);
                        const template = templates.find(t => {
                          const tName = normalizeTemplateName(t.name || t.file_name || '');
                          return tName === normalizedName;
                        });
                        const displayName = template 
                          ? (template.metadata?.display_name || template.display_name || template.title || normalizedName.replace('.docx', ''))
                          : normalizedName.replace('.docx', '');
                        const isChecked = selectedTemplates.includes(normalizedName);
                        
                        return (
                          <div key={normalizedName} className="flex items-center space-x-2">
                            <Checkbox
                              id={`template_${normalizedName}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleTemplateCheckboxChange(normalizedName, checked)}
                            />
                            <Label htmlFor={`template_${normalizedName}`} className="text-sm font-normal cursor-pointer flex-1">
                              {displayName}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No templates available. Upload templates in the Templates tab first.</p>
                )}
              </div>
            )}
            <div>
              <Label className="font-semibold">Max Downloads Per Month:</Label>
              <Input
                type="number"
                value={maxDownloads}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setMaxDownloads(Number.isNaN(v) ? 10 : v);
                }}
                placeholder="Use -1 for unlimited"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter -1 for unlimited downloads</p>
            </div>
            <div>
              <Label className="font-semibold">Features (comma-separated):</Label>
              <Input
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="feature1, feature2, feature3"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlan} disabled={saving || !isAuthenticated} title={!isAuthenticated ? 'Log in to save' : undefined}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
