import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Check, 
  X, 
  RefreshCw,
  Settings,
  Ship,
  Anchor,
  MapPin,
  Factory,
  FileText,
  Users,
  Zap
} from 'lucide-react';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  vessel_limit: number;
  port_limit: number;
  regions_limit?: number;
  refinery_limit?: number;
  document_access?: string[];
  support_level?: string;
  user_seats?: number;
  api_access?: boolean;
  real_time_analytics?: boolean;
}

interface SubscriptionStatusProps {
  subscriptionData: SubscriptionData | null;
  checkingSubscription: boolean;
  onRefreshStatus: () => void;
  onManageSubscription: () => void;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscriptionData,
  checkingSubscription,
  onRefreshStatus,
  onManageSubscription
}) => {
  if (!subscriptionData) return null;

  const formatTierName = (tier: string | null) => {
    if (!tier) return 'Free';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getSupportLevel = (level?: string) => {
    switch (level) {
      case 'priority': return 'Priority Email & Live Chat';
      case 'dedicated': return 'Dedicated Account Manager + 24/7';
      default: return 'Email Support';
    }
  };

  const getDocumentAccess = (access?: string[]) => {
    if (!access || access.length === 0) return 'Basic Documents';
    if (access.includes('complete')) return 'Complete Documentation Suite';
    if (access.includes('advanced')) return 'Advanced Documents';
    return 'Core Documents';
  };

  return (
    <Card className="trading-card mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Current Subscription
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshStatus}
            disabled={checkingSubscription}
          >
            <RefreshCw className={`h-4 w-4 ${checkingSubscription ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {subscriptionData.subscribed ? (
                <Badge variant="default" className="bg-green-500">
                  <Check className="h-4 w-4 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <X className="h-4 w-4 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Status</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatTierName(subscriptionData.subscription_tier)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Plan</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {subscriptionData.subscription_end 
                ? new Date(subscriptionData.subscription_end).toLocaleDateString()
                : 'N/A'
              }
            </div>
            <p className="text-sm text-muted-foreground mt-1">Renewal Date</p>
          </div>
        </div>

        {/* Detailed Limits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{subscriptionData.regions_limit || 1} Regions</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <Anchor className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{subscriptionData.port_limit} Ports</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <Ship className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{subscriptionData.vessel_limit} Vessels</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <Factory className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{subscriptionData.refinery_limit || 5} Refineries</span>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Access & Features
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Document Access:</span>
                <span className="font-medium">{getDocumentAccess(subscriptionData.document_access)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Support Level:</span>
                <span className="font-medium">{getSupportLevel(subscriptionData.support_level)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>User Seats:</span>
                <span className="font-medium">{subscriptionData.user_seats || 1}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Premium Features
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>API Access:</span>
                {subscriptionData.api_access ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Real-time Analytics:</span>
                {subscriptionData.real_time_analytics ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Multi-user Access:</span>
                {(subscriptionData.user_seats || 1) > 1 ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Management Button */}
        {subscriptionData.subscribed && (
          <div className="pt-4 border-t">
            <Button onClick={onManageSubscription} variant="outline" className="w-full md:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;