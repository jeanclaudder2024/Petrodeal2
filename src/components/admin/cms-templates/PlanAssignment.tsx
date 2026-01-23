import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CreditCard, 
  Loader2,
  Download,
  Check
} from 'lucide-react';
import type { PlanTemplatePermission, SubscriptionPlan } from './types';

interface PlanAssignmentProps {
  templateId: string;
  permissions: PlanTemplatePermission[];
  plans: SubscriptionPlan[];
  loading: boolean;
  onToggleAccess: (planId: string, canDownload: boolean) => Promise<boolean>;
  onSetLimit: (planId: string, limit: number | null) => Promise<boolean>;
}

export function PlanAssignment({
  templateId,
  permissions,
  plans,
  loading,
  onToggleAccess,
  onSetLimit
}: PlanAssignmentProps) {
  const getPermission = (planId: string) => {
    return permissions.find(p => p.plan_id === planId);
  };

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      case 'professional': return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
      case 'enterprise': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Plan Access Control
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Configure which subscription plans can access this template
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No subscription plans available</p>
        </div>
      ) : (
        <ScrollArea className="h-[380px]">
          <div className="space-y-2 pr-3">
            {plans.map((plan) => {
              const permission = getPermission(plan.id);
              const hasAccess = permission?.can_download ?? false;
              const downloadLimit = permission?.max_downloads_per_template;

              return (
                <div
                  key={plan.id}
                  className={`
                    p-4 border rounded-lg transition-all
                    ${hasAccess 
                      ? 'border-primary/30 bg-primary/5' 
                      : 'border-border bg-muted/10'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={hasAccess}
                        onCheckedChange={(checked) => onToggleAccess(plan.id, checked)}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{plan.plan_name}</span>
                        <Badge variant="outline" className={`text-[10px] ${getTierStyle(plan.plan_tier)}`}>
                          {plan.plan_tier}
                        </Badge>
                        {hasAccess && (
                          <Check className="h-4 w-4 text-primary ml-1" />
                        )}
                      </div>
                    </div>
                    
                    {hasAccess && (
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="1"
                          placeholder="∞"
                          value={downloadLimit || ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            onSetLimit(plan.id, val);
                          }}
                          className="w-20 h-8 text-sm text-center"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">/month</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
