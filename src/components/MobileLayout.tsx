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
  Menu,
  User,
  Bell
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const mobileNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Vessels', url: '/vessels', icon: Ship },
  { title: 'Ports', url: '/ports', icon: Anchor },
  { title: 'Refineries', url: '/refineries', icon: Factory },
  { title: 'Companies', url: '/companies', icon: Building2 },
  { title: 'Map', url: '/map', icon: Map },
  { title: 'Oil Prices', url: '/oil-prices', icon: TrendingUp },
  { title: 'Broker', url: '/broker-dashboard', icon: Shield },
  { title: 'Support', url: '/support', icon: HelpCircle },
];

export function MobileLayout({ children }: MobileLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  if (!isMobile) {
    return <>{children}</>;
  }

  const currentPath = location.pathname;
  const activeItem = mobileNavItems.find(item => item.url === currentPath);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png" 
              alt="PetroDealHub" 
              className="h-8 w-auto"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
            />
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Page Title */}
        {activeItem && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <activeItem.icon className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">{activeItem.title}</h1>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.slice(0, 5).map((item) => {
            const isActive = currentPath === item.url;
            return (
              <Button
                key={item.url}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0 ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => navigate(item.url)}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium truncate">{item.title}</span>
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* This will be implemented with a mobile menu component */}
      </div>
    </div>
  );
}
