import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, Save, RefreshCw, FileText, Crown, 
  Check, X, Infinity, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Template } from './types';
import { documentApiFetch } from '@/config/documentApi';

interface TemplatePlanAccessProps {
  templates: Template[];
}

interface Plan {
  id: string;
  plan_name: string;
  plan_tier: string;
  is_active: boolean;
}

interface TemplateAccess {
  templateId: string;
  templateName: string;
  plans: {
    planId: string;
    planName: string;
    planTier: string;
    canDownload: boolean;
    monthlyLimit: number | null; // null = unlimited
  }[];
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  basic: <Shield className="h-4 w-4 text-blue-500" />,
  professional: <Crown className="h-4 w-4 text-purple-500" />,
  enterprise: <Infinity className="h-4 w-4 text-amber-500" />,
};

const TIER_COLORS: Record<string, string> = {
  basic: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
  professional: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800',
  enterprise: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
};

export default function TemplatePlanAccess({ templates }: TemplatePlanAccessProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [accessConfig, setAccessConfig] = useState<TemplateAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch plans from Supabase
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, plan_name, plan_tier, is_active')
          .eq('is_active', true)
          .order('plan_name');

        if (error) throw error;
        setPlans(data || []);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        toast.error('Failed to load subscription plans');
      }
    };
    fetchPlans();
  }, []);

  // Initialize access configuration
  useEffect(() => {
    if (templates.length > 0 && plans.length > 0) {
      const config: TemplateAccess[] = templates.map(template => ({
        templateId: template.id,
        templateName: template.display_name || template.name,
        plans: plans.map(plan => ({
          planId: plan.id,
          planName: plan.plan_name,
          planTier: plan.plan_tier,
          canDownload: template.plan_ids?.includes(plan.id) || plan.plan_tier === 'enterprise',
          monthlyLimit: plan.plan_tier === 'enterprise' ? null :
                        plan.plan_tier === 'professional' ? 50 : 10,
        })),
      }));
      setAccessConfig(config);
      setLoading(false);
    }
  }, [templates, plans]);

  const updateAccess = (
    templateIndex: number, 
    planIndex: number, 
    field: 'canDownload' | 'monthlyLimit',
    value: boolean | number | null
  ) => {
    setAccessConfig(prev => {
      const newConfig = [...prev];
      newConfig[templateIndex] = {
        ...newConfig[templateIndex],
        plans: [...newConfig[templateIndex].plans],
      };
      newConfig[templateIndex].plans[planIndex] = {
        ...newConfig[templateIndex].plans[planIndex],
        [field]: value,
      };
      return newConfig;
    });
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // Get all document_templates to map file_name to UUID
      const { data: dbTemplates } = await supabase
        .from('document_templates')
        .select('id, file_name, name');
      
      const fileNameToUuid = new Map<string, string>();
      dbTemplates?.forEach(t => {
        if (t.file_name) fileNameToUuid.set(t.file_name.toLowerCase(), t.id);
        if (t.name) fileNameToUuid.set(t.name.toLowerCase(), t.id);
        // Also try without extension
        if (t.file_name) {
          const withoutExt = t.file_name.replace('.docx', '').toLowerCase();
          fileNameToUuid.set(withoutExt, t.id);
        }
      });

      for (const templateAccess of accessConfig) {
        const planIds = templateAccess.plans
          .filter(p => p.canDownload)
          .map(p => p.planId);

        const templateLimits: Record<string, number> = {};
        templateAccess.plans.forEach(p => {
          if (p.canDownload && p.monthlyLimit !== null) {
            templateLimits[p.planId] = p.monthlyLimit;
          }
        });

        // Save to Replit API
        try {
          await documentApiFetch(`/templates/${templateAccess.templateId}/metadata`, {
            method: 'POST',
            body: JSON.stringify({
              plan_ids: planIds,
              template_limits: templateLimits,
            }),
          });
        } catch (replitError) {
          console.warn('Replit API save failed, continuing with Supabase:', replitError);
        }

        // Also save to Supabase plan_template_permissions
        const templateNameLower = templateAccess.templateName.toLowerCase();
        const templateIdLower = templateAccess.templateId.toLowerCase();
        
        // Try multiple matching strategies
        let supabaseUuid = fileNameToUuid.get(templateNameLower) || 
                          fileNameToUuid.get(templateIdLower) ||
                          fileNameToUuid.get(templateNameLower.replace('.docx', '')) ||
                          fileNameToUuid.get(templateIdLower.replace('.docx', ''));
        
        if (supabaseUuid) {
          for (const plan of templateAccess.plans) {
            if (plan.canDownload) {
              const { error } = await supabase.from('plan_template_permissions').upsert({
                template_id: supabaseUuid,
                plan_id: plan.planId,
                can_download: true,
                max_downloads_per_template: plan.monthlyLimit
              }, { onConflict: 'template_id,plan_id' });
              
              if (error) {
                console.warn(`Failed to upsert permission for ${templateAccess.templateName}:`, error);
              }
            } else {
              // Remove permission if not allowed
              await supabase.from('plan_template_permissions')
                .delete()
                .eq('template_id', supabaseUuid)
                .eq('plan_id', plan.planId);
            }
          }
        } else {
          console.warn(`Could not find Supabase UUID for template: ${templateAccess.templateName}`);
        }
      }

      toast.success('Plan access configuration saved');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const applyToAll = (planTier: string, canDownload: boolean) => {
    setAccessConfig(prev => prev.map(template => ({
      ...template,
      plans: template.plans.map(plan => 
        plan.planTier === planTier ? { ...plan, canDownload } : plan
      ),
    })));
    toast.success(`Applied to all ${planTier} plans`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        <span>Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Template Plan Access
              </CardTitle>
              <CardDescription>
                Configure which subscription plans can access each template
              </CardDescription>
            </div>
            <Button onClick={saveConfiguration} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground mr-2">Quick Actions:</span>
        <Button variant="outline" size="sm" onClick={() => applyToAll('basic', true)}>
          Enable All Basic
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyToAll('professional', true)}>
          Enable All Professional
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyToAll('enterprise', true)}>
          Enable All Enterprise
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="space-y-4">
        {accessConfig.map((templateAccess, templateIndex) => (
          <Card key={templateAccess.templateId}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {templateAccess.templateName}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templateAccess.plans.map((plan, planIndex) => (
                  <div
                    key={plan.planId}
                    className={`p-4 rounded-lg border ${TIER_COLORS[plan.planTier] || 'bg-muted'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {TIER_ICONS[plan.planTier]}
                        <span className="font-medium text-sm">{plan.planName}</span>
                      </div>
                      <Switch
                        checked={plan.canDownload}
                        onCheckedChange={(checked) => 
                          updateAccess(templateIndex, planIndex, 'canDownload', checked)
                        }
                      />
                    </div>

                    {plan.canDownload && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Monthly Download Limit
                        </Label>
                        <div className="flex items-center gap-2">
                          {plan.planTier === 'enterprise' ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Infinity className="h-3 w-3" />
                              Unlimited
                            </Badge>
                          ) : (
                            <Input
                              type="number"
                              min="1"
                              max="1000"
                              className="h-8 w-20 text-sm"
                              value={plan.monthlyLimit || ''}
                              onChange={(e) => 
                                updateAccess(
                                  templateIndex, 
                                  planIndex, 
                                  'monthlyLimit', 
                                  parseInt(e.target.value) || 10
                                )
                              }
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {!plan.canDownload && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <X className="h-3 w-3 text-destructive" />
                        No access
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              {TIER_ICONS.basic}
              <span>Basic Plan</span>
            </div>
            <div className="flex items-center gap-2">
              {TIER_ICONS.professional}
              <span>Professional Plan</span>
            </div>
            <div className="flex items-center gap-2">
              {TIER_ICONS.enterprise}
              <span>Enterprise Plan (Always Unlimited)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
