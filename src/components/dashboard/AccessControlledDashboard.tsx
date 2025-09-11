import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccess } from '@/contexts/AccessContext';
import AccessGate from '@/components/AccessGate';
import TrialStatus from '@/components/TrialStatus';
import OilPrices from '@/components/dashboard/OilPrices';
import VesselTracking from '@/components/dashboard/VesselTracking';
import { 
  TrendingUp, 
  Ship, 
  MapPin, 
  Factory,
  Globe,
  BarChart3
} from 'lucide-react';

const AccessControlledDashboard = () => {
  const { accessType, trialDaysLeft, isSubscribed } = useAccess();

  return (
    <div className="space-y-6">
      {/* Trial Status Banner */}
      <TrialStatus />
      
      {/* Welcome Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {accessType === 'subscription' ? 'Premium' : 
               accessType === 'trial' ? 'Trial' : 'Limited'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isSubscribed ? 'Full Access' : 
               accessType === 'trial' ? `${trialDaysLeft} Days Left` : 'Expired'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vessels</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Ports</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-xs text-muted-foreground">
              Worldwide coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Refineries</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">789</div>
            <p className="text-xs text-muted-foreground">
              Processing capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content - Access Controlled */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AccessGate fallbackMessage="Oil price monitoring requires an active subscription">
          <OilPrices />
        </AccessGate>

        <AccessGate fallbackMessage="Real-time vessel tracking is a premium feature">
          <VesselTracking />
        </AccessGate>
      </div>

      {/* Additional Features - Always Visible in Trial/Subscription */}
      {(accessType === 'trial' || accessType === 'subscription') && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Market Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Market Intelligence</h3>
                <p className="text-muted-foreground">
                  Access comprehensive market analytics, trading patterns, and forecasting tools.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccessControlledDashboard;