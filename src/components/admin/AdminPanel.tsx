import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Settings, FileText, BarChart3, Ship, Building2, MapPin, Factory, UserCheck, Bot, Filter, CreditCard, Video, Layout, Mail, Send, Inbox, Key } from 'lucide-react';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import AdminNotes from './AdminNotes';
import AdminAnalytics from './AdminAnalytics';
import VesselManagement from './VesselManagement';
import PortManagement from './PortManagement';
import CompanyManagement from './CompanyManagement';
import RefineryManagement from './RefineryManagement';
import ConnectionManagement from './ConnectionManagement';
import BrokerManagement from './BrokerManagement';
import AIAssistant from './AIAssistant';
import DocumentManagement from './DocumentManagement';
import DocumentTemplateManager from './DocumentTemplateManager';
import FilterManagement from './FilterManagement';
import SubscriptionManagement from './SubscriptionManagement';
import TutorialManagement from './TutorialManagement';
import LandingPageManager from './LandingPageManager';
import EmailConfiguration from '@/pages/admin/EmailConfiguration';
import EmailTemplates from '@/pages/admin/EmailTemplates';
import AutoReplySystem from '@/pages/admin/AutoReplySystem';
import ApiWebhooks from '@/pages/admin/ApiWebhooks';

const AdminPanel = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    // Read hash from URL and set active tab
    if (location.hash) {
      const hash = location.hash.replace('#', '');
      // Map hash to tab value
      const tabMap: Record<string, string> = {
        'email-config': 'email-config',
        'email-templates': 'email-templates',
        'auto-reply': 'auto-reply',
        'api-webhooks': 'api-webhooks',
      };
      if (tabMap[hash]) {
        setActiveTab(tabMap[hash]);
      }
    }
  }, [location.hash]);

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Control Panel
          </CardTitle>
          <CardDescription>
            Complete platform management and data administration
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full bg-gray-50/50 rounded-lg p-2">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 h-auto p-2 bg-white shadow-sm">
            <TabsTrigger value="users" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[70px] rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-md">
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Users</span>
            </TabsTrigger>

            <TabsTrigger value="subscriptions" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <CreditCard className="h-5 w-5" />
              <span className="text-xs font-medium">Subscriptions</span>
            </TabsTrigger>

            <TabsTrigger value="brokers" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <UserCheck className="h-5 w-5" />
              <span className="text-xs font-medium">Brokers</span>
            </TabsTrigger>

            <TabsTrigger value="vessels" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <Ship className="h-5 w-5" />
              <span className="text-xs font-medium">Vessels</span>
            </TabsTrigger>

            <TabsTrigger value="ports" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <MapPin className="h-5 w-5" />
              <span className="text-xs font-medium">Ports</span>
            </TabsTrigger>

            <TabsTrigger value="companies" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-medium">Companies</span>
            </TabsTrigger>

            <TabsTrigger value="refineries" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <Factory className="h-5 w-5" />
              <span className="text-xs font-medium">Refineries</span>
            </TabsTrigger>

            <TabsTrigger value="connections" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <Ship className="h-5 w-5" />
              <span className="text-xs font-medium">Connections</span>
            </TabsTrigger>

            <TabsTrigger value="documents" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">Documents</span>
            </TabsTrigger>

            <TabsTrigger value="templates" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">Templates</span>
            </TabsTrigger>

            <TabsTrigger value="filters" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <Filter className="h-5 w-5" />
              <span className="text-xs font-medium">Filters</span>
            </TabsTrigger>

            <TabsTrigger value="ai-assistant" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <Bot className="h-5 w-5" />
              <span className="text-xs font-medium">AI Assistant</span>
            </TabsTrigger>

            <TabsTrigger value="tutorials" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <Video className="h-5 w-5" />
              <span className="text-xs font-medium">Tutorials</span>
            </TabsTrigger>

            <TabsTrigger value="landing-page" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <Layout className="h-5 w-5" />
              <span className="text-xs font-medium">Landing Page</span>
            </TabsTrigger>

            <TabsTrigger value="settings" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <Settings className="h-5 w-5" />
              <span className="text-xs font-medium">Settings</span>
            </TabsTrigger>

            <TabsTrigger value="notes" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">Notes</span>
            </TabsTrigger>

            <TabsTrigger value="email-config" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] border-2 border-blue-200 hover:border-blue-400">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium">Email Config</span>
            </TabsTrigger>

            <TabsTrigger value="email-templates" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] border-2 border-blue-200 hover:border-blue-400">
              <Send className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium">Email Templates</span>
            </TabsTrigger>

            <TabsTrigger value="auto-reply" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] border-2 border-blue-200 hover:border-blue-400">
              <Inbox className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium">Auto-Reply</span>
            </TabsTrigger>

            <TabsTrigger value="api-webhooks" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] border-2 border-green-200 hover:border-green-400">
              <Key className="h-5 w-5 text-green-600" />
              <span className="text-xs font-medium">API & Webhooks</span>
            </TabsTrigger>

            <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px]">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-medium">Analytics</span>
            </TabsTrigger>
          </TabsList>
        </div>


        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="brokers">
          <BrokerManagement />
        </TabsContent>

        <TabsContent value="vessels">
          <VesselManagement />
        </TabsContent>

        <TabsContent value="ports">
          <PortManagement />
        </TabsContent>

        <TabsContent value="companies">
          <CompanyManagement />
        </TabsContent>

      <TabsContent value="refineries">
        <RefineryManagement />
      </TabsContent>

      <TabsContent value="connections">
        <ConnectionManagement />
      </TabsContent>

        <TabsContent value="documents">
          <DocumentManagement />
        </TabsContent>

        <TabsContent value="templates">
          <DocumentTemplateManager />
        </TabsContent>

        <TabsContent value="filters">
          <FilterManagement />
        </TabsContent>

        <TabsContent value="ai-assistant">
          <AIAssistant />
        </TabsContent>

        <TabsContent value="tutorials">
          <TutorialManagement />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="notes">
          <AdminNotes />
        </TabsContent>

        <TabsContent value="email-config">
          <EmailConfiguration />
        </TabsContent>

        <TabsContent value="email-templates">
          <EmailTemplates />
        </TabsContent>

        <TabsContent value="auto-reply">
          <AutoReplySystem />
        </TabsContent>

        <TabsContent value="api-webhooks">
          <ApiWebhooks />
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="landing-page">
          <LandingPageManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;