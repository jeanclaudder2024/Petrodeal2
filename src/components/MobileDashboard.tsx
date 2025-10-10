import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ship, 
  Anchor, 
  Factory, 
  Building2, 
  TrendingUp,
  Map,
  Plus,
  Bell,
  Search,
  Filter,
  ChevronRight,
  Activity,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileDashboardProps {
  children?: React.ReactNode;
}

export function MobileDashboard({ children }: MobileDashboardProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  const quickActions = [
    { title: 'Find Vessels', icon: Ship, url: '/vessels', color: 'bg-blue-500' },
    { title: 'Explore Ports', icon: Anchor, url: '/ports', color: 'bg-green-500' },
    { title: 'View Refineries', icon: Factory, url: '/refineries', color: 'bg-orange-500' },
    { title: 'Browse Companies', icon: Building2, url: '/companies', color: 'bg-purple-500' },
    { title: 'Check Oil Prices', icon: TrendingUp, url: '/oil-prices', color: 'bg-red-500' },
    { title: 'View Map', icon: Map, url: '/map', color: 'bg-teal-500' },
  ];

  const recentActivity = [
    { title: 'New vessel added', time: '2 min ago', type: 'vessel' },
    { title: 'Port update available', time: '15 min ago', type: 'port' },
    { title: 'Price alert triggered', time: '1 hour ago', type: 'price' },
    { title: 'New company registered', time: '2 hours ago', type: 'company' },
  ];

  return (
    <div className="p-4 space-y-6 mobile-app">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mobile-title">Welcome back!</h1>
            <p className="mobile-caption">Here's what's happening today</p>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Bell className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vessels, ports, companies..."
            className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border/50 rounded-xl mobile-input focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="mobile-subtitle">Quick Actions</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={action.title}
              variant="ghost"
              className="h-auto p-4 flex flex-col items-center gap-3 mobile-card hover:scale-105 transition-all duration-200"
              onClick={() => navigate(action.url)}
            >
              <div className={`p-3 rounded-full ${action.color} text-white`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="font-medium text-sm text-center">{action.title}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="space-y-3">
        <h2 className="mobile-subtitle">Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="mobile-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Ship className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-muted-foreground">Active Vessels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mobile-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Anchor className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-xs text-muted-foreground">Ports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mobile-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Factory className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground">Refineries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mobile-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2,341</p>
                  <p className="text-xs text-muted-foreground">Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="mobile-subtitle">Recent Activity</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <Card className="mobile-card">
          <CardContent className="p-0">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-4 border-b border-border/50 last:border-b-0">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Market Overview */}
      <div className="space-y-3">
        <h2 className="mobile-subtitle">Market Overview</h2>
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Oil Prices Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Brent Crude</span>
              <div className="text-right">
                <p className="font-semibold">$78.45</p>
                <p className="text-xs text-green-500">+2.3%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">WTI Crude</span>
              <div className="text-right">
                <p className="font-semibold">$73.21</p>
                <p className="text-xs text-green-500">+1.8%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Natural Gas</span>
              <div className="text-right">
                <p className="font-semibold">$2.89</p>
                <p className="text-xs text-red-500">-0.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
