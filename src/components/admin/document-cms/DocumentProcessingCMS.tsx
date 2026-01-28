import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  FileText, Database, Shield, Loader2, LogIn, LogOut, User,
  RefreshCw, Circle, Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import TemplatesTab from './TemplatesTab';
import DataSourcesTab from './DataSourcesTab';
import PlansTab from './PlansTab';
import PlaceholderMappingTab from './PlaceholderMappingTab';
import LoginOverlay from './LoginOverlay';
import { useDocumentAPIAuth } from './hooks/useAuth';
import { API_BASE_URL } from './types';

export default function DocumentProcessingCMS() {
  const [activeTab, setActiveTab] = useState('plans');
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { isAuthenticated, isChecking, checkAuth, login, logout } = useDocumentAPIAuth();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    // Check API status
    checkApiStatus();
    // Check auth status
    checkAuth().then((auth) => {
      if (auth) {
        fetchCurrentUser();
      }
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
    } else {
      setCurrentUser(null);
    }
  }, [isAuthenticated]);

  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        credentials: 'include',
      });
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user || 'Admin');
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleLogin = async (username: string, password: string) => {
    const success = await login(username, password);
    if (success) {
      await checkAuth();
      await fetchCurrentUser();
      checkApiStatus();
    }
    return success;
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
  };

  return (
    <div className="space-y-4">
      {/* Navbar */}
      <Card className="border-none shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-white">Document Processor CMS</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/90">
                {isAuthenticated ? (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User: {currentUser || 'Admin'}
                  </span>
                ) : (
                  'Not authenticated'
                )}
              </span>
              {!isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => {
                    // Login overlay will show automatically when not authenticated
                  }}
                  id="loginBtn"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Login
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={handleLogout}
                  id="logoutBtn"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="plans" className="gap-2">
                <Shield className="h-4 w-4" />
                Plans
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="placeholders" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Placeholders
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Database className="h-4 w-4" />
                Data Sources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="mt-6">
              <PlansTab isAuthenticated={isAuthenticated} />
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <TemplatesTab 
                isAuthenticated={isAuthenticated}
                onRefresh={checkApiStatus}
              />
            </TabsContent>

            <TabsContent value="placeholders" className="mt-6">
              <PlaceholderMappingTab />
            </TabsContent>

            <TabsContent value="data" className="mt-6">
              <DataSourcesTab isAuthenticated={isAuthenticated} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* API Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Circle className="h-4 w-4" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-2 ${
            apiStatus === 'online' ? 'text-green-600' : 
            apiStatus === 'offline' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {apiStatus === 'checking' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Circle className={`h-4 w-4 fill-current ${apiStatus === 'online' ? 'text-green-600' : 'text-red-600'}`} />
            )}
            <span className="text-sm font-medium">
              {apiStatus === 'online' ? 'Online' : 
               apiStatus === 'offline' ? 'Offline' : 
               'Checking...'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Login Overlay */}
      <LoginOverlay
        open={!isAuthenticated && !isChecking}
        onLogin={handleLogin}
      />
    </div>
  );
}
