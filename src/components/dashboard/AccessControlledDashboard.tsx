import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/contexts/AccessContext';
import AccessGate from '@/components/AccessGate';
import TrialStatus from '@/components/TrialStatus';
import OilPrices from '@/components/dashboard/OilPrices';
import VesselTracking from '@/components/dashboard/VesselTracking';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown,
  Ship, 
  MapPin, 
  Factory,
  Globe,
  BarChart3,
  Building2,
  DollarSign,
  Clock,
  ArrowRight,
  Map,
  Activity
} from 'lucide-react';

interface DashboardStats {
  vesselCount: number;
  portCount: number;
  refineryCount: number;
  companyCount: number;
}

interface OilPrice {
  oil_type: string;
  current_price: number;
  price_change_percent: number;
  currency: string;
}

const AccessControlledDashboard = () => {
  const { accessType, trialDaysLeft, isSubscribed } = useAccess();
  const [stats, setStats] = useState<DashboardStats>({ vesselCount: 0, portCount: 0, refineryCount: 0, companyCount: 0 });
  const [topOilPrices, setTopOilPrices] = useState<OilPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [vesselsRes, portsRes, refineriesRes, companiesRes, oilPricesRes] = await Promise.all([
        supabase.from('vessels').select('id', { count: 'exact', head: true }),
        supabase.from('ports').select('id', { count: 'exact', head: true }),
        supabase.from('refineries').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('oil_prices').select('oil_type, current_price, price_change_percent, currency').limit(3)
      ]);

      setStats({
        vesselCount: vesselsRes.count || 0,
        portCount: portsRes.count || 0,
        refineryCount: refineriesRes.count || 0,
        companyCount: companiesRes.count || 0
      });

      if (oilPricesRes.data) {
        setTopOilPrices(oilPricesRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trial Status Banner */}
      <TrialStatus />
      
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Real-time oil market intelligence at your fingertips</p>
        </div>
        <Badge variant={isSubscribed ? "default" : "secondary"} className="text-sm">
          {accessType === 'subscription' ? 'Premium Access' : 
           accessType === 'trial' ? `Trial - ${trialDaysLeft} Days Left` : 'Limited Access'}
        </Badge>
      </div>

      {/* Live Oil Price Ticker */}
      {topOilPrices.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 via-background to-primary/10 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium">Live Oil Prices</span>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                {topOilPrices.map((price) => (
                  <div key={price.oil_type} className="flex items-center gap-2">
                    <span className="text-sm font-medium">{price.oil_type.replace(' Oil', '').replace(' Crude', '')}</span>
                    <span className="font-bold">${price.current_price?.toFixed(2)}</span>
                    {price.price_change_percent !== undefined && (
                      <span className={`text-xs flex items-center gap-1 ${price.price_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {price.price_change_percent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {price.price_change_percent?.toFixed(2)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Link to="/oil-prices">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vessels</CardTitle>
            <Ship className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.vesselCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tracked globally</p>
            <Link to="/vessels" className="text-xs text-primary hover:underline mt-2 inline-block">
              View all vessels →
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Ports</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.portCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Worldwide coverage</p>
            <Link to="/ports" className="text-xs text-primary hover:underline mt-2 inline-block">
              View all ports →
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refineries</CardTitle>
            <Factory className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.refineryCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Processing capacity</p>
            <Link to="/refineries" className="text-xs text-primary hover:underline mt-2 inline-block">
              View all refineries →
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.companyCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Trading partners</p>
            <Link to="/companies" className="text-xs text-primary hover:underline mt-2 inline-block">
              View all companies →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link to="/map" className="block">
          <Card className="hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Map className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Live Map</h3>
              <p className="text-xs text-muted-foreground">Track vessels in real-time</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/vessels" className="block">
          <Card className="hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Ship className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-semibold">Vessels</h3>
              <p className="text-xs text-muted-foreground">Browse fleet data</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/ports" className="block">
          <Card className="hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <MapPin className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold">Ports</h3>
              <p className="text-xs text-muted-foreground">Port intelligence</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/oil-prices" className="block">
          <Card className="hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <DollarSign className="h-8 w-8 text-yellow-500 mb-2" />
              <h3 className="font-semibold">Oil Prices</h3>
              <p className="text-xs text-muted-foreground">Market analysis</p>
            </CardContent>
          </Card>
        </Link>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Market Analytics
            </CardTitle>
            <CardDescription>
              Advanced market intelligence and trading patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Globe className="h-8 w-8 mx-auto text-primary mb-2" />
                <h4 className="font-semibold">Global Coverage</h4>
                <p className="text-xs text-muted-foreground">Track worldwide</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <h4 className="font-semibold">Price Trends</h4>
                <p className="text-xs text-muted-foreground">Market forecasts</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <h4 className="font-semibold">Real-time Data</h4>
                <p className="text-xs text-muted-foreground">Live updates</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <BarChart3 className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <h4 className="font-semibold">Analytics</h4>
                <p className="text-xs text-muted-foreground">Deep insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccessControlledDashboard;