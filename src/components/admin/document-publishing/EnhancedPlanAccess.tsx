import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Save, 
  RefreshCw, 
  FileText, 
  Lock, 
  Unlock,
  Shield,
  Download,
  Users,
  Stamp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  file_name: string;
}

interface Plan {
  id: string;
  name: string;
  type: 'subscription' | 'broker';
}

interface TemplatePermission {
  can_download: boolean;
  monthly_limit: number;
  requires_watermark: boolean;
  is_locked: boolean;
}

interface EnhancedPlanAccessProps {
  templates: Template[];
}

// Default permission settings
const DEFAULT_PERMISSION: TemplatePermission = {
  can_download: false,
  monthly_limit: 0,
  requires_watermark: true,
  is_locked: true,
};

export default function EnhancedPlanAccess({ templates }: EnhancedPlanAccessProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, TemplatePermission>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch all plans (subscription + broker membership)
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        // Fetch subscription plans
        const { data: subPlans, error: subError } = await supabase
          .from('subscription_plans')
          .select('id, plan_name')
          .order('monthly_price');
        
        if (subError) throw subError;

        // Create plans array with subscription plans
        const allPlans: Plan[] = (subPlans || []).map(p => ({
          id: p.id,
          name: p.plan_name,
          type: 'subscription' as const,
        }));

        // Add Broker Membership as a special plan
        allPlans.push({
          id: 'broker_membership',
          name: 'Broker Membership',
          type: 'broker',
        });

        setPlans(allPlans);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Build UUID ↔ API ID mapping
  const [uuidToApiId, setUuidToApiId] = useState<Map<string, string>>(new Map());
  const [apiIdToUuid, setApiIdToUuid] = useState<Map<string, string>>(new Map());

  // Fetch existing permissions and build mapping
  useEffect(() => {
    const fetchPermissions = async () => {
      if (templates.length === 0) return;

      try {
        // Step 1: Fetch all document_templates from Supabase for UUID mapping
        const { data: dbTemplates } = await supabase
          .from('document_templates')
          .select('id, file_name, name');

        // Build bidirectional maps: UUID ↔ API template ID
        const uuid2api = new Map<string, string>();
        const api2uuid = new Map<string, string>();

        (dbTemplates || []).forEach(dbT => {
          const dbFileName = dbT.file_name?.toLowerCase() || '';
          const dbBaseName = dbFileName.replace(/\.(docx|pdf|doc)$/i, '');
          
          // Find matching API template
          const matched = templates.find(apiT => {
            const apiId = apiT.id?.toLowerCase() || '';
            const apiFileName = apiT.file_name?.toLowerCase() || '';
            const apiBaseName = apiFileName.replace(/\.(docx|pdf|doc)$/i, '');
            const apiName = apiT.name?.toLowerCase() || '';
            
            return apiFileName === dbFileName ||
                   apiBaseName === dbBaseName ||
                   apiId === dbFileName ||
                   apiId === dbBaseName ||
                   apiName === dbBaseName;
          });

          if (matched) {
            uuid2api.set(dbT.id, matched.id);
            api2uuid.set(matched.id, dbT.id);
          }
        });

        setUuidToApiId(uuid2api);
        setApiIdToUuid(api2uuid);

        // Step 2: Fetch permissions and map UUID keys → API ID keys
        const { data: planPerms, error: planError } = await supabase
          .from('plan_template_permissions')
          .select('*');
        
        if (planError) console.error('Failed to fetch plan permissions:', planError);

        const { data: brokerPerms, error: brokerError } = await supabase
          .from('broker_template_permissions')
          .select('*');
        
        if (brokerError) console.error('Failed to fetch broker permissions:', brokerError);

        // Build permissions map keyed by API template ID
        const permMap: Record<string, Record<string, TemplatePermission>> = {};
        
        (planPerms || []).forEach((perm) => {
          // Convert DB UUID to API template ID
          const apiId = uuid2api.get(perm.template_id) || perm.template_id;
          if (!permMap[apiId]) permMap[apiId] = {};
          permMap[apiId][perm.plan_id] = {
            can_download: perm.can_download || false,
            monthly_limit: perm.max_downloads_per_template || 0,
            requires_watermark: false,
            is_locked: !perm.can_download,
          };
        });

        (brokerPerms || []).forEach((perm) => {
          const apiId = uuid2api.get(perm.template_id) || perm.template_id;
          if (!permMap[apiId]) permMap[apiId] = {};
          const existing = permMap[apiId]['broker_membership'];
          if (!existing || perm.can_download) {
            permMap[apiId]['broker_membership'] = {
              can_download: perm.can_download || false,
              monthly_limit: perm.max_downloads_per_template || 0,
              requires_watermark: false,
              is_locked: !perm.can_download,
            };
          }
        });

        setPermissions(permMap);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }
    };

    fetchPermissions();
  }, [templates]);

  // Toggle download access
  const toggleAccess = useCallback((templateId: string, planId: string) => {
    setPermissions((prev) => {
      const templatePerms = prev[templateId] || {};
      const current = templatePerms[planId] || { ...DEFAULT_PERMISSION };
      return {
        ...prev,
        [templateId]: {
          ...templatePerms,
          [planId]: { 
            ...current, 
            can_download: !current.can_download,
            is_locked: current.can_download, // Toggle lock inversely
          },
        },
      };
    });
  }, []);

  // Set monthly limit
  const setLimit = useCallback((templateId: string, planId: string, limit: number) => {
    setPermissions((prev) => {
      const templatePerms = prev[templateId] || {};
      const current = templatePerms[planId] || { ...DEFAULT_PERMISSION };
      return {
        ...prev,
        [templateId]: {
          ...templatePerms,
          [planId]: { ...current, monthly_limit: limit },
        },
      };
    });
  }, []);

  // Toggle watermark
  const toggleWatermark = useCallback((templateId: string, planId: string) => {
    setPermissions((prev) => {
      const templatePerms = prev[templateId] || {};
      const current = templatePerms[planId] || { ...DEFAULT_PERMISSION };
      return {
        ...prev,
        [templateId]: {
          ...templatePerms,
          [planId]: { ...current, requires_watermark: !current.requires_watermark },
        },
      };
    });
  }, []);

  // Save permissions using pre-built UUID mapping
  const savePermissions = async () => {
    setSaving(true);
    try {
      // Prepare upserts for plan permissions
      const planUpserts: {
        template_id: string;
        plan_id: string;
        can_download: boolean;
        max_downloads_per_template: number;
      }[] = [];
      
      for (const [apiTemplateId, planPerms] of Object.entries(permissions)) {
        // Use the pre-built mapping
        const uuid = apiIdToUuid.get(apiTemplateId);
        // Also check if it's already a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiTemplateId);
        const actualTemplateId = uuid || (isUuid ? apiTemplateId : null);
        
        if (!actualTemplateId) {
          console.warn(`Skipping template ${apiTemplateId} - no UUID found`);
          continue;
        }

        for (const [planId, perm] of Object.entries(planPerms)) {
          if (planId === 'broker_membership') continue;
          
          const isPlanUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
          if (!isPlanUuid) continue;
          
          planUpserts.push({
            template_id: actualTemplateId,
            plan_id: planId,
            can_download: perm.can_download,
            max_downloads_per_template: perm.monthly_limit,
          });
        }
      }

      // Deduplicate before upsert
      const uniquePlanUpserts = Array.from(
        new Map(planUpserts.map(u => [`${u.template_id}_${u.plan_id}`, u])).values()
      );

      if (uniquePlanUpserts.length > 0) {
        const { error } = await supabase
          .from('plan_template_permissions')
          .upsert(uniquePlanUpserts, { onConflict: 'template_id,plan_id' });

        if (error) {
          console.error('Plan permissions upsert error:', error);
          throw error;
        }
      }

      // Handle broker permissions (using first broker membership as default)
      const brokerPermsToSave: {
        template_id: string;
        broker_membership_id: string;
        can_download: boolean;
        max_downloads_per_template: number;
      }[] = [];

      // Get default broker membership for saving
      const { data: brokerMemberships } = await supabase
        .from('broker_memberships')
        .select('id')
        .limit(1);
      
      const defaultBrokerMembershipId = brokerMemberships?.[0]?.id;

      if (defaultBrokerMembershipId) {
        for (const [apiTemplateId, planPerms] of Object.entries(permissions)) {
          const brokerPerm = planPerms['broker_membership'];
          if (!brokerPerm) continue;

          const uuid = apiIdToUuid.get(apiTemplateId);
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiTemplateId);
          const actualTemplateId = uuid || (isUuid ? apiTemplateId : null);
          if (!actualTemplateId) continue;

          brokerPermsToSave.push({
            template_id: actualTemplateId,
            broker_membership_id: defaultBrokerMembershipId,
            can_download: brokerPerm.can_download,
            max_downloads_per_template: brokerPerm.monthly_limit,
          });
        }

        // Deduplicate broker permissions too
        const uniqueBrokerPerms = Array.from(
          new Map(brokerPermsToSave.map(u => [`${u.template_id}_${u.broker_membership_id}`, u])).values()
        );

        if (uniqueBrokerPerms.length > 0) {
          const { error: brokerError } = await supabase
            .from('broker_template_permissions')
            .upsert(uniqueBrokerPerms, { onConflict: 'template_id,broker_membership_id' });
          
          if (brokerError) {
            console.error('Failed to save broker permissions:', brokerError);
          }
        }
      }

      toast.success('Permissions saved successfully');
    } catch (error) {
      console.error('Failed to save permissions:', error);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);
  
  // Filter plans by type
  const subscriptionPlans = plans.filter(p => p.type === 'subscription');
  const brokerPlan = plans.find(p => p.type === 'broker');

  // Get permission for a template/plan combo
  const getPermission = (templateId: string, planId: string): TemplatePermission => {
    return permissions[templateId]?.[planId] || { ...DEFAULT_PERMISSION };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Plan Access Control
            </CardTitle>
            <CardDescription>
              Configure download permissions, limits, and watermarks per plan
            </CardDescription>
          </div>
          <Button onClick={savePermissions} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No templates available</p>
            <p className="text-sm">Upload templates first to configure access</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading plans...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose a template to configure..." />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter((template) => template.id && template.id.trim() !== '')
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan Access Configuration */}
            {selectedTemplate && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    <Users className="h-4 w-4" />
                    All Plans
                  </TabsTrigger>
                  <TabsTrigger value="subscription" className="gap-2">
                    <Crown className="h-4 w-4" />
                    Subscription
                  </TabsTrigger>
                  <TabsTrigger value="broker" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Broker
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[200px]">Plan</TableHead>
                          <TableHead className="text-center">Can Download</TableHead>
                          <TableHead className="text-center">Monthly Limit</TableHead>
                          <TableHead className="text-center">Watermark</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.map((plan) => {
                          const perm = getPermission(selectedTemplate, plan.id);
                          return (
                            <TableRow key={plan.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {plan.type === 'broker' ? (
                                    <Shield className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Crown className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className="font-medium">{plan.name}</span>
                                  {plan.type === 'broker' && (
                                    <Badge variant="secondary" className="text-[10px]">Special</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  <Switch
                                    checked={perm.can_download}
                                    onCheckedChange={() => toggleAccess(selectedTemplate, plan.id)}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {perm.can_download ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      className="w-20 h-8 text-center"
                                      value={perm.monthly_limit}
                                      onChange={(e) => setLimit(selectedTemplate, plan.id, parseInt(e.target.value) || 0)}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {perm.monthly_limit === 0 ? '∞' : '/mo'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {perm.can_download && (
                                  <div className="flex justify-center">
                                    <Button
                                      variant={perm.requires_watermark ? 'default' : 'ghost'}
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => toggleWatermark(selectedTemplate, plan.id)}
                                    >
                                      <Stamp className={`h-4 w-4 ${perm.requires_watermark ? '' : 'opacity-30'}`} />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant={perm.can_download ? 'default' : 'secondary'}
                                  className="gap-1"
                                >
                                  {perm.can_download ? (
                                    <>
                                      <Unlock className="h-3 w-3" />
                                      Unlocked
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3 w-3" />
                                      Locked
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="subscription" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Subscription Plan</TableHead>
                          <TableHead className="text-center">Download</TableHead>
                          <TableHead className="text-center">Limit</TableHead>
                          <TableHead className="text-center">Watermark</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptionPlans.map((plan) => {
                          const perm = getPermission(selectedTemplate, plan.id);
                          return (
                            <TableRow key={plan.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4 text-amber-500" />
                                  <span className="font-medium">{plan.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={perm.can_download}
                                  onCheckedChange={() => toggleAccess(selectedTemplate, plan.id)}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                {perm.can_download ? (
                                  <Input
                                    type="number"
                                    min={0}
                                    className="w-20 h-8 text-center mx-auto"
                                    value={perm.monthly_limit}
                                    onChange={(e) => setLimit(selectedTemplate, plan.id, parseInt(e.target.value) || 0)}
                                  />
                                ) : '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                {perm.can_download && (
                                  <Switch
                                    checked={perm.requires_watermark}
                                    onCheckedChange={() => toggleWatermark(selectedTemplate, plan.id)}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="broker" className="mt-4">
                  {brokerPlan && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Broker Membership Access
                        </CardTitle>
                        <CardDescription>
                          Configure access for verified broker members
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(() => {
                          const perm = getPermission(selectedTemplate, brokerPlan.id);
                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Download className="h-4 w-4 text-muted-foreground" />
                                  <Label>Allow Downloads</Label>
                                </div>
                                <Switch
                                  checked={perm.can_download}
                                  onCheckedChange={() => toggleAccess(selectedTemplate, brokerPlan.id)}
                                />
                              </div>
                              
                              {perm.can_download && (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Monthly Download Limit</Label>
                                      <p className="text-xs text-muted-foreground">0 = Unlimited</p>
                                    </div>
                                    <Input
                                      type="number"
                                      min={0}
                                      className="w-24 h-8 text-center"
                                      value={perm.monthly_limit}
                                      onChange={(e) => setLimit(selectedTemplate, brokerPlan.id, parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Stamp className="h-4 w-4 text-muted-foreground" />
                                      <Label>Require Watermark</Label>
                                    </div>
                                    <Switch
                                      checked={perm.requires_watermark}
                                      onCheckedChange={() => toggleWatermark(selectedTemplate, brokerPlan.id)}
                                    />
                                  </div>
                                </>
                              )}
                              
                              <div className="pt-2 border-t">
                                <Badge variant={perm.can_download ? 'default' : 'secondary'} className="gap-1">
                                  {perm.can_download ? (
                                    <>
                                      <Unlock className="h-3 w-3" />
                                      Brokers Can Access
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3 w-3" />
                                      Locked for Brokers
                                    </>
                                  )}
                                </Badge>
                              </div>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Quick Template Overview (when no template selected) */}
            {!selectedTemplate && templates.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.slice(0, 9).map((template) => {
                  const templatePerms = permissions[template.id] || {};
                  const enabledPlans = Object.values(templatePerms).filter((p) => p.can_download).length;
                  const hasbrokerAccess = templatePerms['broker_membership']?.can_download;
                  
                  return (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium truncate text-sm">{template.name}</span>
                          {hasbrokerAccess && (
                            <Shield className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={enabledPlans > 0 ? 'default' : 'secondary'} className="text-xs">
                            {enabledPlans} / {plans.length} plans
                          </Badge>
                          {hasbrokerAccess && (
                            <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                              Broker ✓
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Info Notice */}
            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">How Access Control Works:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li><strong>Can Download:</strong> User can download this template</li>
                <li><strong>Monthly Limit:</strong> Maximum downloads per month (0 = unlimited)</li>
                <li><strong>Watermark:</strong> Add watermark to downloaded documents</li>
                <li><strong>Locked:</strong> Template shows as locked in vessel/document pages</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
