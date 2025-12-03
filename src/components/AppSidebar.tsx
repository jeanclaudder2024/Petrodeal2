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
  Mail,
  Send,
  Inbox,
  Key
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
import { useLanguage } from '@/contexts/LanguageContext';

const getMainItems = (t: (key: string) => string) => [
  { title: t('navigation.dashboard'), url: '/dashboard', icon: LayoutDashboard },
  { title: t('navigation.vessels'), url: '/vessels', icon: Ship },
  { title: t('navigation.ports'), url: '/ports', icon: Anchor },
  { title: t('navigation.refineries'), url: '/refineries', icon: Factory },
  { title: t('navigation.companies'), url: '/companies', icon: Building2 },
  { title: t('navigation.map'), url: '/map', icon: Map },
];

const getSupportItems = (t: (key: string) => string) => [
  { title: t('navigation.tutorials'), url: '/tutorials', icon: BookOpen },
  { title: t('navigation.support'), url: '/support', icon: HelpCircle },
  { title: t('support.myTickets'), url: '/my-tickets', icon: Shield },
  { title: t('support.newTicket'), url: '/new-ticket', icon: Crown },
];

const getTradingItems = (t: (key: string) => string) => [
  { title: t('navigation.oilPrices'), url: '/oil-prices', icon: TrendingUp },
];

const getAccountItems = (t: (key: string) => string) => [
  { title: t('navigation.subscription'), url: '/subscription', icon: Crown },
];

const getBrokerItems = (t: (key: string) => string) => [
  { title: t('brokers.membership', 'Broker Membership'), url: '/broker-membership', icon: Shield },
  { title: t('brokers.dashboard', 'Broker Dashboard'), url: '/broker-dashboard', icon: LayoutDashboard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { t } = useLanguage();
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
            {t('navigation.title', 'Navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {getMainItems(t).map((item, index) => (
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
            {t('navigation.trading', 'Trading')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {getTradingItems(t).map((item, index) => (
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

        {/* Broker Section */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className={`${collapsed ? 'sr-only' : 'px-2 text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold'}`}>
            {t('brokers.services', 'Broker Services')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {getBrokerItems(t).map((item, index) => (
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
            {t('navigation.support')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {getSupportItems(t).map((item, index) => (
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
            {t('settings.account')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {getAccountItems(t).map((item, index) => (
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
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin#email-config" 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-flame border-2 border-blue-200
                        ${isActive || currentPath.includes('email') 
                          ? 'bg-gradient-to-r from-blue-20 to-blue-10 text-blue-700 border-l-4 border-blue-500 shadow-flame' 
                          : 'hover:bg-gradient-to-r hover:from-blue-10 hover:to-blue-5 text-muted-foreground hover:text-blue-600'
                        }
                      `}
                    >
                      <Mail className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} text-blue-600`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">Email Config</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin#email-templates" 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-flame border-2 border-blue-200
                        ${isActive || currentPath.includes('email') 
                          ? 'bg-gradient-to-r from-blue-20 to-blue-10 text-blue-700 border-l-4 border-blue-500 shadow-flame' 
                          : 'hover:bg-gradient-to-r hover:from-blue-10 hover:to-blue-5 text-muted-foreground hover:text-blue-600'
                        }
                      `}
                    >
                      <Send className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} text-blue-600`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">Email Templates</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin#auto-reply" 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-flame border-2 border-blue-200
                        ${isActive || currentPath.includes('email') 
                          ? 'bg-gradient-to-r from-blue-20 to-blue-10 text-blue-700 border-l-4 border-blue-500 shadow-flame' 
                          : 'hover:bg-gradient-to-r hover:from-blue-10 hover:to-blue-5 text-muted-foreground hover:text-blue-600'
                        }
                      `}
                    >
                      <Inbox className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} text-blue-600`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">Auto-Reply</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin#api-webhooks" 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        transform hover:scale-[1.02] hover:shadow-flame border-2 border-green-200
                        ${isActive || currentPath.includes('api') 
                          ? 'bg-gradient-to-r from-green-20 to-green-10 text-green-700 border-l-4 border-green-500 shadow-flame' 
                          : 'hover:bg-gradient-to-r hover:from-green-10 hover:to-green-5 text-muted-foreground hover:text-green-600'
                        }
                      `}
                    >
                      <Key className={`transition-all duration-300 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} text-green-600`} />
                      {!collapsed && (
                        <span className="font-medium animate-fade-in">API & Webhooks</span>
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