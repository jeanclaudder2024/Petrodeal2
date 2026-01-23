import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Archive,
  Shield,
  Calendar,
  DollarSign,
  ArrowRight,
  Building2,
  User,
  Briefcase,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  deal_type: string;
  cargo_type: string;
  quantity: number;
  total_value: number;
  status: string;
  steps_completed: number;
  total_steps: number;
  created_at: string;
  source_port: string;
  destination_port: string;
  price_per_unit?: number;
  currency?: string;
  delivery_date?: string;
  seller_company_name?: string;
  buyer_company_name?: string;
  broker_role?: string;
  commission_status?: string;
  price_basis?: string;
  pricing_formula?: string;
  payment_method?: string;
  laycan_start?: string;
  laycan_end?: string;
  deal_validity?: string;
  is_archived?: boolean;
}

interface EnhancedDealCardProps {
  deal: Deal;
  dealNumber: number;
  onViewSteps: (dealId: string) => void;
  onArchive?: () => void;
}

const EnhancedDealCard: React.FC<EnhancedDealCardProps> = ({ deal, dealNumber, onViewSteps, onArchive }) => {
  const { toast } = useToast();
  const [archiving, setArchiving] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          icon: CheckCircle, 
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
          label: 'Completed'
        };
      case 'approved':
        return { 
          icon: CheckCircle, 
          color: 'bg-blue-500/10 text-blue-600 border-blue-200',
          label: 'Approved'
        };
      case 'pending':
        return { 
          icon: Clock, 
          color: 'bg-amber-500/10 text-amber-600 border-amber-200',
          label: 'Pending'
        };
      case 'rejected':
        return { 
          icon: AlertCircle, 
          color: 'bg-red-500/10 text-red-600 border-red-200',
          label: 'Rejected'
        };
      case 'draft':
        return { 
          icon: FileText, 
          color: 'bg-slate-500/10 text-slate-600 border-slate-200',
          label: 'Draft'
        };
      default:
        return { 
          icon: Clock, 
          color: 'bg-slate-500/10 text-slate-600 border-slate-200',
          label: status
        };
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const { error } = await supabase
        .from('broker_deals')
        .update({ status: 'archived' })
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: 'Deal Archived',
        description: 'This deal has been moved to archives.',
      });

      if (onArchive) onArchive();
    } catch (error) {
      console.error('Error archiving deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive deal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setArchiving(false);
    }
  };

  const getBrokerRoleBadge = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'mandate':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'co-broker':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'introducer':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  const getCommissionStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'protected':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'paid':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  const statusConfig = getStatusConfig(deal.status);
  const StatusIcon = statusConfig.icon;
  const progressPercentage = deal.total_steps > 0 ? (deal.steps_completed / deal.total_steps) * 100 : 0;

  const dealTitle = deal.cargo_type 
    ? `Deal #${dealNumber} – ${deal.cargo_type}` 
    : `Deal #${dealNumber}`;

  return (
    <Card className="border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-md">
      <CardContent className="p-0">
        {/* Deal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-semibold text-foreground truncate">{dealTitle}</h3>
                <Badge variant="outline" className="text-xs shrink-0">
                  {deal.deal_type}
                </Badge>
                {deal.broker_role && (
                  <Badge className={`${getBrokerRoleBadge(deal.broker_role)} border text-xs`}>
                    <Briefcase className="h-3 w-3 mr-1" />
                    {deal.broker_role}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${statusConfig.color} border text-xs`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  IPTO Oversight
                </span>
                {deal.commission_status && (
                  <Badge className={`${getCommissionStatusBadge(deal.commission_status)} border text-xs`}>
                    <DollarSign className="h-3 w-3 mr-1" />
                    Commission: {deal.commission_status}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">ID</div>
              <div className="text-xs font-mono text-muted-foreground">{deal.id.substring(0, 8)}</div>
            </div>
          </div>
        </div>

        {/* Parties Section */}
        {(deal.seller_company_name || deal.buyer_company_name) && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              {deal.seller_company_name && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Seller:</span>
                  <span className="font-medium">{deal.seller_company_name}</span>
                </div>
              )}
              {deal.seller_company_name && deal.buyer_company_name && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {deal.buyer_company_name && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Buyer:</span>
                  <span className="font-medium">{deal.buyer_company_name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commercial Snapshot */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span className="font-medium text-foreground">{deal.quantity?.toLocaleString() || '—'} MT</span>
            {deal.price_basis && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-xs">{deal.price_basis}</Badge>
              </>
            )}
            <span>•</span>
            <span>{deal.source_port || 'TBD'}</span>
            <span>→</span>
            <span>{deal.destination_port || 'TBD'}</span>
            {deal.price_per_unit && (
              <>
                <span>•</span>
                <span>${deal.price_per_unit.toFixed(2)}/MT</span>
              </>
            )}
            {deal.payment_method && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-xs">{deal.payment_method}</Badge>
              </>
            )}
          </div>
          {deal.pricing_formula && (
            <p className="text-xs text-muted-foreground mt-1">
              Formula: {deal.pricing_formula}
            </p>
          )}
        </div>

        {/* Financial Overview */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Value</div>
              <div className="text-lg font-bold text-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                {deal.total_value?.toLocaleString() || '0'}
                {deal.currency && <span className="text-sm text-muted-foreground">{deal.currency}</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Progress</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{deal.steps_completed}/{deal.total_steps}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline & Laycan */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created: {format(new Date(deal.created_at), 'MMM d, yyyy')}</span>
            </div>
            {deal.laycan_start && deal.laycan_end && (
              <div className="flex items-center gap-1">
                <span>Laycan: {format(new Date(deal.laycan_start), 'MMM d')} - {format(new Date(deal.laycan_end), 'MMM d, yyyy')}</span>
              </div>
            )}
            {deal.delivery_date && (
              <div className="flex items-center gap-1">
                <span>Delivery: {format(new Date(deal.delivery_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {deal.deal_validity && (
              <div className="flex items-center gap-1">
                <span>Valid until: {format(new Date(deal.deal_validity), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Deal Actions - Simplified */}
        <div className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onViewSteps(deal.id)}
              className="flex items-center gap-1"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Continue Deal
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewSteps(deal.id)}
              className="flex items-center gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              View Steps
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleArchive}
              disabled={archiving}
              className="flex items-center gap-1 ml-auto text-muted-foreground hover:text-foreground"
            >
              {archiving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Archive</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedDealCard;
