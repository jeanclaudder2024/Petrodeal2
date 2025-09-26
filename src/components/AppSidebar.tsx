import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Ship, 
  Anchor, 
  Factory, 
  Building2, 
  TrendingUp,
  Shield,
  LogOut,
  Crown,
  Map,
  HelpCircle,
  BookOpen,
  Newspaper
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

const mainItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Vessels', url: '/vessels', icon: Ship },
  { title: 'Ports', url: '/ports', icon: Anchor },
  { title: 'Refineries', url: '/refineries', icon: Factory },
  { title: 'Companies', url: '/companies', icon: Building2 },
  { title: 'Map', url: '/map', icon: Map },
];

const supportItems = [
  { title: 'Tutorials', url: '/tutorials', icon: BookOpen },
  { title: 'Support Center', url: '/support', icon: HelpCircle },
  { title: 'My Tickets', url: '/my-tickets', icon: Shield },
  { title: 'New Ticket', url: '/new-ticket', icon: Crown },
];

const tradingItems = [
  { title: 'Oil Prices', url: '/oil-prices', icon: TrendingUp },
];

const accountItems = [
  { title: 'Subscription', url: '/subscription', icon: Crown },
];

const brokerItems = [
  { title: 'Broker Membership', url: '/broker-membership', icon: Shield },
  { title: 'Broker Dashboard', url: '/broker-dashboard', icon: LayoutDashboard },
];

const newsItems = [
  { title: 'Vessel News', url: '/vessel-news', icon: Ship },
  { title: 'Port News', url: '/port-news', icon: Anchor },
  { title: 'Refinery News', url: '/refinery-news', icon: Factory },
  { title: 'Support News', url: '/support-news', icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent className="p-0 bg-gradient-to-b from-card via-card/95 to-card/90">
        {/* Logo Section */}
        <div className={`flex items-center justify-center p-4 border-b border-border/30 ${collapsed ? 'px-2' : 'px-4'}`}>
        <div className="flex items-center justify-center transition-smooth">
            <div className="relative">
              <img 
                src="/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png" 
                alt="PetroDeallHub" 
                className="transition-smooth hover:scale-105 w-auto"
                style={{ height: '156px' }}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="px-2 py-4">
          <SidebarGroupLabel className={`${collapsed ? 'sr-only' : 'px-2 text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold'}`}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-elegant
                        ${isActive 
                          ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-l-4 border-primary shadow-glow' 
                          : 'hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 text-muted-foreground hover:text-foreground'
                        }
                      `}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <item.icon className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${isActive(item.url) ? 'animate-glow-pulse' : ''}`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Trading Section */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className={`${collapsed ? 'sr-only' : 'px-2 text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold'}`}>
            Trading
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {tradingItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-water
                        ${isActive 
                          ? 'bg-gradient-to-r from-water/20 to-water/10 text-water border-l-4 border-water shadow-water' 
                          : 'hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 text-muted-foreground hover:text-foreground'
                        }
                      `}
                      style={{ animationDelay: `${(index + 7) * 0.1}s` }}
                    >
                      <item.icon className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${isActive(item.url) ? 'animate-glow-pulse' : ''}`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* News Section */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className={`${collapsed ? 'sr-only' : 'px-2 text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold'}`}>
            News & Updates
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {newsItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-elegant
                        ${isActive 
                          ? 'bg-gradient-to-r from-accent/20 to-accent/10 text-accent border-l-4 border-accent shadow-glow' 
                          : 'hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 text-muted-foreground hover:text-foreground'
                        }
                      `}
                      style={{ animationDelay: `${(index + 8) * 0.1}s` }}
                    >
                      <item.icon className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${isActive(item.url) ? 'animate-glow-pulse' : ''}`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Broker Section */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className={`${collapsed ? 'sr-only' : 'px-2 text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold'}`}>
            Broker Services
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {brokerItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-flame
                        ${isActive 
                          ? 'bg-gradient-to-r from-accent/20 to-accent/10 text-accent border-l-4 border-accent shadow-flame' 
                          : 'hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 text-muted-foreground hover:text-foreground'
                        }
                      `}
                      style={{ animationDelay: `${(index + 10) * 0.1}s` }}
                    >
                      <item.icon className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${isActive(item.url) ? 'animate-glow-pulse' : ''}`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support Section */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className={`${collapsed ? 'sr-only' : 'px-2 text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold'}`}>
            Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {supportItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-elegant
                        ${isActive 
                          ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-l-4 border-primary shadow-glow' 
                          : 'hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 text-muted-foreground hover:text-foreground'
                        }
                      `}
                      style={{ animationDelay: `${(index + 15) * 0.1}s` }}
                    >
                      <item.icon className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${isActive(item.url) ? 'animate-glow-pulse' : ''}`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Section */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className={`${collapsed ? 'sr-only' : 'px-2 text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold'}`}>
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {accountItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-elegant
                        ${isActive 
                          ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-l-4 border-primary shadow-glow' 
                          : 'hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 text-muted-foreground hover:text-foreground'
                        }
                      `}
                      style={{ animationDelay: `${(index + 12) * 0.1}s` }}
                    >
                      <item.icon className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${isActive(item.url) ? 'animate-glow-pulse' : ''}`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup className="px-2 py-2">
            <SidebarGroupLabel className={`${collapsed ? 'sr-only' : 'px-2 text-xs uppercase tracking-wider text-destructive/80 font-semibold'}`}>
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin" 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-flame
                        ${isActive 
                          ? 'bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive border-l-4 border-destructive shadow-flame' 
                          : 'hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 text-muted-foreground hover:text-destructive'
                        }
                      `}
                    >
                      <Shield className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${isActive('/admin') ? 'animate-glow-pulse' : ''}`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">Admin Panel</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/support-admin" 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-flame
                        ${isActive 
                          ? 'bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive border-l-4 border-destructive shadow-flame' 
                          : 'hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 text-muted-foreground hover:text-destructive'
                        }
                      `}
                    >
                      <HelpCircle className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${isActive('/support-admin') ? 'animate-glow-pulse' : ''}`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">Support Admin</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Footer Actions */}
        <SidebarGroup className="mt-auto px-2 py-4 border-t border-border/30">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                           transform hover:scale-[1.02] hover:shadow-flame
                           hover:bg-gradient-to-r hover:from-destructive/20 hover:to-destructive/10 
                           text-muted-foreground hover:text-destructive"
                >
                  <LogOut className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  {!collapsed && <span className="font-medium">Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}