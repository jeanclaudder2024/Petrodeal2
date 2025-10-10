import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Ship, 
  Anchor, 
  Factory, 
  Building2, 
  TrendingUp,
  Shield,
  Crown,
  Map,
  HelpCircle,
  BookOpen,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

const primaryNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Vessels', url: '/vessels', icon: Ship },
  { title: 'Ports', url: '/ports', icon: Anchor },
  { title: 'Refineries', url: '/refineries', icon: Factory },
  { title: 'Companies', url: '/companies', icon: Building2 },
];

const secondaryNavItems = [
  { title: 'Map', url: '/map', icon: Map },
  { title: 'Oil Prices', url: '/oil-prices', icon: TrendingUp },
  { title: 'Broker', url: '/broker-dashboard', icon: Shield },
  { title: 'Support', url: '/support', icon: HelpCircle },
  { title: 'Tutorials', url: '/tutorials', icon: BookOpen },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const currentPath = location.pathname;
  const [showMore, setShowMore] = React.useState(false);

  const isActive = (url: string) => currentPath === url;

  return (
    <>
      {/* Primary Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {primaryNavItems.map((item) => {
            const active = isActive(item.url);
            return (
              <Button
                key={item.url}
                variant="ghost"
                size="sm"
                className={`relative flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0 transition-all duration-200 ${
                  active 
                    ? 'text-primary bg-primary/10 scale-105' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => navigate(item.url)}
              >
                <item.icon className={`h-5 w-5 transition-all duration-200 ${active ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium truncate">{item.title}</span>
                {active && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
                )}
              </Button>
            );
          })}
          
          {/* More Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0 transition-all duration-200 ${
              showMore 
                ? 'text-primary bg-primary/10 scale-105' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            onClick={() => setShowMore(!showMore)}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
            {showMore && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        </div>
      </nav>

      {/* Secondary Navigation Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-20 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40 rounded-t-2xl shadow-2xl">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">More Options</h3>
              <div className="grid grid-cols-2 gap-2">
                {secondaryNavItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <Button
                      key={item.url}
                      variant="ghost"
                      className={`flex items-center gap-3 p-3 h-auto justify-start ${
                        active 
                          ? 'text-primary bg-primary/10' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        navigate(item.url);
                        setShowMore(false);
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                      {active && (
                        <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
