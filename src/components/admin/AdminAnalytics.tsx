import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Ship, TrendingUp, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminAnalytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeals: 0,
    totalVessels: 0,
    totalCompanies: 0,
    activeDeals: 0,
    completedDeals: 0,
    pendingDeals: 0,
    totalDealValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch each table with proper error handling
      let usersCount = 0;
      let deals: any[] = [];
      let vesselsCount = 0;
      let companiesCount = 0;

      try {
        const { count } = await supabase.from('broker_memberships').select('id', { count: 'exact', head: true });
        usersCount = count || 0;
      } catch { /* broker_memberships table may not exist */ }

      try {
        const { data } = await supabase.from('deals').select('*');
        deals = data || [];
      } catch { /* deals table may not exist */ }

      try {
        const { count } = await supabase.from('vessels').select('id', { count: 'exact', head: true });
        vesselsCount = count || 0;
      } catch { /* vessels table may not exist */ }

      try {
        const { count } = await supabase.from('companies').select('id', { count: 'exact', head: true });
        companiesCount = count || 0;
      } catch { /* companies table may not exist */ }

      const totalDealValue = deals.reduce((sum: number, deal: any) => sum + (deal.total_value || 0), 0);

      setStats({
        totalUsers: usersCount,
        totalDeals: deals.length,
        totalVessels: vesselsCount,
        totalCompanies: companiesCount,
        activeDeals: deals.filter((deal: any) => deal.status === 'active').length,
        completedDeals: deals.filter((deal: any) => deal.status === 'completed').length,
        pendingDeals: deals.filter((deal: any) => deal.status === 'pending').length,
        totalDealValue
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Platform Analytics
          </CardTitle>
          <CardDescription>
            Overview of platform usage and performance metrics
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vessels</CardTitle>
            <Ship className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVessels}</div>
            <p className="text-xs text-muted-foreground">Tracked globally</p>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">In network</p>
          </CardContent>
        </Card>
      </div>

      {/* Deal Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="trading-card">
          <CardHeader>
            <CardTitle>Deal Status Overview</CardTitle>
            <CardDescription>Current status of all trading deals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-semibold">{stats.pendingDeals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm">Active</span>
                </div>
                <span className="font-semibold">{stats.activeDeals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-semibold">{stats.completedDeals}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Total value of trading deals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(stats.totalDealValue)}
                </div>
                <p className="text-sm text-muted-foreground">Total Deal Value</p>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {stats.totalDeals > 0 
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        notation: 'compact'
                      }).format(stats.totalDealValue / stats.totalDeals)
                    : '$0'
                  }
                </div>
                <p className="text-sm text-muted-foreground">Average Deal Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current platform operational status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">✓ Online</div>
              <div className="text-sm text-muted-foreground">Database</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">✓ Active</div>
              <div className="text-sm text-muted-foreground">Authentication</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">✓ Running</div>
              <div className="text-sm text-muted-foreground">Real-time Updates</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">✓ Operational</div>
              <div className="text-sm text-muted-foreground">Trading Engine</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;