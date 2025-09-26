import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Settings, FileText, BarChart3, Ship, Building2, MapPin, Factory, UserCheck, Bot, Filter, CreditCard, Video, Layout } from 'lucide-react';
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
import EnhancedDocumentTemplateManager from './EnhancedDocumentTemplateManager';
import FilterManagement from './FilterManagement';
import SubscriptionManagement from './SubscriptionManagement';
import TutorialManagement from './TutorialManagement';
import LandingPageManager from './LandingPageManager';

const AdminPanel = () => {
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

      <Tabs defaultValue="users" className="space-y-6">
<TabsList
  className="flex w-full overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
>
  <TabsTrigger value="users" className="flex items-center gap-2">
    <Users className="h-4 w-4" />
    Users
  </TabsTrigger>

  <TabsTrigger value="subscriptions" className="flex items-center gap-2">
    <CreditCard className="h-4 w-4" />
    Subscriptions
  </TabsTrigger>

  <TabsTrigger value="brokers" className="flex items-center gap-2">
    <UserCheck className="h-4 w-4" />
    Brokers
  </TabsTrigger>

  <TabsTrigger value="vessels" className="flex items-center gap-2">
    <Ship className="h-4 w-4" />
    Vessels
  </TabsTrigger>

  <TabsTrigger value="ports" className="flex items-center gap-2">
    <MapPin className="h-4 w-4" />
    Ports
  </TabsTrigger>

  <TabsTrigger value="companies" className="flex items-center gap-2">
    <Building2 className="h-4 w-4" />
    Companies
  </TabsTrigger>

  <TabsTrigger value="refineries" className="flex items-center gap-2">
    <Factory className="h-4 w-4" />
    Refineries
  </TabsTrigger>

  <TabsTrigger value="connections" className="flex items-center gap-2">
    <Ship className="h-4 w-4" />
    Connections
  </TabsTrigger>

  <TabsTrigger value="documents" className="flex items-center gap-2">
    <FileText className="h-4 w-4" />
    Documents
  </TabsTrigger>

  <TabsTrigger value="templates" className="flex items-center gap-2">
    <FileText className="h-4 w-4" />
    Word Templates
  </TabsTrigger>

  <TabsTrigger value="filters" className="flex items-center gap-2">
    <Filter className="h-4 w-4" />
    Filters
  </TabsTrigger>

  <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
    <Bot className="h-4 w-4" />
    AI Assistant
  </TabsTrigger>

  <TabsTrigger value="tutorials" className="flex items-center gap-2">
    <Video className="h-4 w-4" />
    Tutorials
  </TabsTrigger>

  <TabsTrigger value="landing-page" className="flex items-center gap-2">
    <Layout className="h-4 w-4" />
    Landing Page
  </TabsTrigger>

  <TabsTrigger value="settings" className="flex items-center gap-2">
    <Settings className="h-4 w-4" />
    Settings
  </TabsTrigger>

  <TabsTrigger value="notes" className="flex items-center gap-2">
    <FileText className="h-4 w-4" />
    Notes
  </TabsTrigger>

  <TabsTrigger value="analytics" className="flex items-center gap-2">
    <BarChart3 className="h-4 w-4" />
    Analytics
  </TabsTrigger>
</TabsList>


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
          <EnhancedDocumentTemplateManager />
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