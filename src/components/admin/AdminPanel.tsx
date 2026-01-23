import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Settings, FileText, BarChart3, Ship, Building2, MapPin, Factory, UserCheck, Cpu, Filter, CreditCard, Video, Layout, Mail, Send, Inbox, Key, HelpCircle, Bell, UserMinus, Wallet, DollarSign, Megaphone, Database, ShoppingCart, Store, Package, Briefcase, Gift, Target, Linkedin } from 'lucide-react';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import AdminNotes from './AdminNotes';
import AdminAnalytics from './AdminAnalytics';
import VesselManagement from './VesselManagement';
import PortManagement from './PortManagement';
import CompanyManagement from './CompanyManagement';
import BuyerCompanyManagement from './BuyerCompanyManagement';
import SellerCompanyManagement from './SellerCompanyManagement';
import ProductManagement from './ProductManagement';
import RefineryManagement from './RefineryManagement';
import ConnectionManagement from './ConnectionManagement';
import BrokerManagement from './BrokerManagement';
import BrokerSubscriptionManagement from './BrokerSubscriptionManagement';
import BrokerPricingManagement from './BrokerPricingManagement';
import UnsubscribeRequestsManagement from './UnsubscribeRequestsManagement';
import AIAgentControlCenter from './AIAgentControlCenter';
import DocumentManagement from './DocumentManagement';
import { CMSTemplateManager } from './cms-templates';
import { DocumentProcessingCMS } from './document-cms';
import FilterManagement from './FilterManagement';
import SubscriptionManagement from './SubscriptionManagement';
import TutorialManagement from './TutorialManagement';
import LandingPageManager from './LandingPageManager';
import StripeConfiguration from './StripeConfiguration';
import EmailConfiguration from '@/pages/admin/EmailConfiguration';
import EmailTemplates from '@/pages/admin/EmailTemplates';
import AutoReplySystem from '@/pages/admin/AutoReplySystem';
import ApiWebhooks from '@/pages/admin/ApiWebhooks';
import FAQManagement from './FAQManagement';
import NotificationsManagement from './NotificationsManagement';
import MarketingPopups from './MarketingPopups';
import BlogManagement from './BlogManagement';
import DatabaseDocManagement from './DatabaseDocManagement';
import MarketingAnalytics from './MarketingAnalytics';
import CareerManagement from './CareerManagement';
import RewardProgramsManagement from './RewardProgramsManagement';
import TalentProgramsManagement from './talent/TalentProgramsManagement';
import LinkedInManagement from './LinkedInManagement';

const AdminPanel = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("users");
  const [vesselIdToEdit, setVesselIdToEdit] = useState<number | null>(null);

  // Handler to switch to vessels tab and open vessel for editing
  const handleEditVessel = (vesselId: number) => {
    setVesselIdToEdit(vesselId);
    setActiveTab("vessels");
  };

  // Clear vesselIdToEdit when switching away from vessels tab
  useEffect(() => {
    if (activeTab !== "vessels") {
      setVesselIdToEdit(null);
    }
  }, [activeTab]);

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
        'stripe': 'stripe',
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
        <div className="w-full bg-gray-50/50 dark:bg-slate-800/50 rounded-lg p-2">
          <div className="overflow-x-auto pb-2">
            <TabsList className="flex flex-nowrap md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 h-auto p-2 bg-white dark:bg-slate-900 shadow-sm min-w-max md:min-w-0">
              <TabsTrigger value="users" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[70px] min-w-[80px] rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-md">
                <Users className="h-5 w-5" />
                <span className="text-xs font-medium">Users</span>
              </TabsTrigger>

              <TabsTrigger value="subscriptions" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <CreditCard className="h-5 w-5" />
                <span className="text-xs font-medium">Subscriptions</span>
              </TabsTrigger>

              <TabsTrigger value="stripe" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-purple-200 hover:border-purple-400">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span className="text-xs font-medium">Stripe</span>
              </TabsTrigger>

              <TabsTrigger value="brokers" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <UserCheck className="h-5 w-5" />
                <span className="text-xs font-medium">Brokers</span>
              </TabsTrigger>

              <TabsTrigger value="broker-subscriptions" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-green-200 hover:border-green-400">
                <Wallet className="h-5 w-5 text-green-600" />
                <span className="text-xs font-medium">Broker Subs</span>
              </TabsTrigger>

              <TabsTrigger value="broker-pricing" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-emerald-200 hover:border-emerald-400">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-medium">Broker Pricing</span>
              </TabsTrigger>

              <TabsTrigger value="unsubscribe-requests" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-red-200 hover:border-red-400">
                <UserMinus className="h-5 w-5 text-red-600" />
                <span className="text-xs font-medium">Unsubscribes</span>
              </TabsTrigger>

              <TabsTrigger value="vessels" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <Ship className="h-5 w-5" />
                <span className="text-xs font-medium">Vessels</span>
              </TabsTrigger>

              <TabsTrigger value="ports" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <MapPin className="h-5 w-5" />
                <span className="text-xs font-medium">Ports</span>
              </TabsTrigger>

              <TabsTrigger value="companies" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <Building2 className="h-5 w-5" />
                <span className="text-xs font-medium">Companies</span>
              </TabsTrigger>

              <TabsTrigger value="buyers" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-blue-200 hover:border-blue-400">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-medium">Buyers</span>
              </TabsTrigger>

              <TabsTrigger value="sellers" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-orange-200 hover:border-orange-400">
                <Store className="h-5 w-5 text-orange-600" />
                <span className="text-xs font-medium">Sellers</span>
              </TabsTrigger>

              <TabsTrigger value="products" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-green-200 hover:border-green-400">
                <Package className="h-5 w-5 text-green-600" />
                <span className="text-xs font-medium">Products</span>
              </TabsTrigger>

              <TabsTrigger value="refineries" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <Factory className="h-5 w-5" />
                <span className="text-xs font-medium">Refineries</span>
              </TabsTrigger>

              <TabsTrigger value="connections" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <Ship className="h-5 w-5" />
                <span className="text-xs font-medium">Connections</span>
              </TabsTrigger>

              <TabsTrigger value="documents" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <FileText className="h-5 w-5" />
                <span className="text-xs font-medium">Documents</span>
              </TabsTrigger>

              <TabsTrigger value="templates" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <FileText className="h-5 w-5" />
                <span className="text-xs font-medium">Templates</span>
              </TabsTrigger>

              <TabsTrigger value="document-cms" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-indigo-200 hover:border-indigo-400">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span className="text-xs font-medium">Doc CMS</span>
              </TabsTrigger>

              <TabsTrigger value="filters" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <Filter className="h-5 w-5" />
                <span className="text-xs font-medium">Filters</span>
              </TabsTrigger>

              <TabsTrigger value="ai-control-center" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-purple-200 hover:border-purple-400">
                <Cpu className="h-5 w-5 text-purple-600" />
                <span className="text-xs font-medium">AI Control</span>
              </TabsTrigger>

              <TabsTrigger value="tutorials" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <Video className="h-5 w-5" />
                <span className="text-xs font-medium">Tutorials</span>
              </TabsTrigger>

              <TabsTrigger value="landing-page" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <Layout className="h-5 w-5" />
                <span className="text-xs font-medium">Landing Page</span>
              </TabsTrigger>

              <TabsTrigger value="settings" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <Settings className="h-5 w-5" />
                <span className="text-xs font-medium">Settings</span>
              </TabsTrigger>

              <TabsTrigger value="notes" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <FileText className="h-5 w-5" />
                <span className="text-xs font-medium">Notes</span>
              </TabsTrigger>

              <TabsTrigger value="email-config" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-blue-200 hover:border-blue-400">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-medium">Email Config</span>
              </TabsTrigger>

              <TabsTrigger value="email-templates" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-blue-200 hover:border-blue-400">
                <Send className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-medium">Email Templates</span>
              </TabsTrigger>

              <TabsTrigger value="auto-reply" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-blue-200 hover:border-blue-400">
                <Inbox className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-medium">Auto-Reply</span>
              </TabsTrigger>

              <TabsTrigger value="api-webhooks" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-green-200 hover:border-green-400">
                <Key className="h-5 w-5 text-green-600" />
                <span className="text-xs font-medium">API & Webhooks</span>
              </TabsTrigger>

              <TabsTrigger value="faq-management" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-orange-200 hover:border-orange-400">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                <span className="text-xs font-medium">FAQ & Support</span>
              </TabsTrigger>

              <TabsTrigger value="notifications" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-yellow-200 hover:border-yellow-400">
                <Bell className="h-5 w-5 text-yellow-600" />
                <span className="text-xs font-medium">Notifications</span>
              </TabsTrigger>

              <TabsTrigger value="marketing" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-pink-200 hover:border-pink-400">
                <Megaphone className="h-5 w-5 text-pink-600" />
                <span className="text-xs font-medium">Marketing</span>
              </TabsTrigger>

              <TabsTrigger value="database-doc" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-cyan-200 hover:border-cyan-400">
                <Database className="h-5 w-5 text-cyan-600" />
                <span className="text-xs font-medium">Database Doc</span>
              </TabsTrigger>

              <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px]">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs font-medium">Analytics</span>
              </TabsTrigger>

              <TabsTrigger value="careers" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-orange-200 hover:border-orange-400">
                <Briefcase className="h-5 w-5 text-orange-600" />
                <span className="text-xs font-medium">Careers</span>
              </TabsTrigger>

              <TabsTrigger value="talent" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-teal-200 hover:border-teal-400">
                <Target className="h-5 w-5 text-teal-600" />
                <span className="text-xs font-medium">Growth Talent</span>
              </TabsTrigger>

              <TabsTrigger value="linkedin" className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] min-w-[80px] border-2 border-blue-200 hover:border-blue-400">
                <Linkedin className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-medium">LinkedIn</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>


        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="stripe">
          <StripeConfiguration />
        </TabsContent>

        <TabsContent value="brokers">
          <BrokerManagement />
        </TabsContent>

        <TabsContent value="broker-subscriptions">
          <BrokerSubscriptionManagement />
        </TabsContent>

        <TabsContent value="broker-pricing">
          <BrokerPricingManagement />
        </TabsContent>

        <TabsContent value="unsubscribe-requests">
          <UnsubscribeRequestsManagement />
        </TabsContent>

        <TabsContent value="vessels">
          <VesselManagement 
            vesselIdToEdit={vesselIdToEdit} 
            onVesselEditComplete={() => setVesselIdToEdit(null)} 
          />
        </TabsContent>

        <TabsContent value="ports">
          <PortManagement />
        </TabsContent>

        <TabsContent value="companies">
          <CompanyManagement />
        </TabsContent>

        <TabsContent value="buyers">
          <BuyerCompanyManagement />
        </TabsContent>

        <TabsContent value="sellers">
          <SellerCompanyManagement />
        </TabsContent>

        <TabsContent value="products">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="refineries">
          <RefineryManagement />
        </TabsContent>

      <TabsContent value="connections">
        <ConnectionManagement onEditVessel={handleEditVessel} />
      </TabsContent>

        <TabsContent value="documents">
          <DocumentManagement />
        </TabsContent>

        <TabsContent value="templates">
          <CMSTemplateManager />
        </TabsContent>

        <TabsContent value="document-cms">
          <DocumentProcessingCMS />
        </TabsContent>

        <TabsContent value="filters">
          <FilterManagement />
        </TabsContent>

        <TabsContent value="ai-control-center">
          <AIAgentControlCenter />
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

        <TabsContent value="faq-management">
          <FAQManagement />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsManagement />
        </TabsContent>

        <TabsContent value="marketing">
          <Tabs defaultValue="reward-programs" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="reward-programs" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Reward Programs
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics & Tracking</TabsTrigger>
              <TabsTrigger value="popups">Popups</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
            </TabsList>
            <TabsContent value="reward-programs">
              <RewardProgramsManagement />
            </TabsContent>
            <TabsContent value="analytics">
              <MarketingAnalytics />
            </TabsContent>
            <TabsContent value="popups">
              <MarketingPopups />
            </TabsContent>
            <TabsContent value="blog">
              <BlogManagement />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="database-doc">
          <DatabaseDocManagement />
        </TabsContent>

        <TabsContent value="landing-page">
          <LandingPageManager />
        </TabsContent>

        <TabsContent value="careers">
          <CareerManagement />
        </TabsContent>

        <TabsContent value="talent">
          <TalentProgramsManagement />
        </TabsContent>

        <TabsContent value="linkedin">
          <LinkedInManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;