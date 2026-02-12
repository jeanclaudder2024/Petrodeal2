import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  User, 
  Menu,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  Home,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileHeaderProps {
  onMenuToggle?: () => void;
  showSearch?: boolean;
  onSearchToggle?: () => void;
}

export function MobileHeader({ onMenuToggle, showSearch, onSearchToggle }: MobileHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!isMobile) {
    return null;
  }

  const getPageTitle = () => {
    const path = location.pathname;
    const titles: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/vessels': 'Vessels',
      '/ports': 'Ports',
      '/refineries': 'Refineries',
      '/companies': 'Companies',
      '/map': 'Map',
      '/oil-prices': 'Oil Prices',
      '/broker-dashboard': 'Broker Dashboard',
      '/broker-membership': 'Broker Membership',
      '/broker-setup': 'Broker Setup',
      '/broker-verification-waiting': 'Verification',
      '/support': 'Support',
      '/tutorials': 'Tutorials',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/admin': 'Admin Panel',
    };
    return titles[path] || 'PetroDealHub';
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Side - Menu & Logo */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={onMenuToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png" 
              alt="PetroDealHub" 
              className="h-7 w-auto"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
            />
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {onSearchToggle && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={onSearchToggle}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 relative"
            onClick={() => navigate('/support')}
          >
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">3</Badge>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu open={showUserMenu} onOpenChange={setShowUserMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/support')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Page Title Bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
            {user && (
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.user_metadata?.full_name || user.email}
              </p>
            )}
          </div>
          
          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {isAdmin && (
                <Badge variant="destructive" className="text-xs">Admin</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0"
            onClick={() => navigate('/vessels')}
          >
            <Search className="h-4 w-4 mr-2" />
            Search Vessels
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0"
            onClick={() => navigate('/support')}
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0"
            onClick={() => navigate('/profile')}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>
    </header>
  );
}
