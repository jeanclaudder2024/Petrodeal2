import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AccessProvider } from "@/contexts/AccessContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import FloatingAIAssistant from "@/components/FloatingAIAssistant";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/LanguageSelector";
import UserProfileMenu from "@/components/UserProfileMenu";
import Index from "./pages/Index";
import AboutUs from "./pages/AboutUs";
import FutureTrading from "./pages/FutureTrading";
import APIIntegration from "./pages/APIIntegration";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import ContactUs from "./pages/ContactUs";
import CookiePolicy from "./pages/CookiePolicy";
import Auth from "./pages/Auth";
import PaymentSuccess from "./pages/PaymentSuccess";
import Dashboard from "./pages/Dashboard";
import Vessels from "./pages/Vessels";
import Tutorials from "./pages/Tutorials";
import VesselDetail from "./pages/VesselDetail";
import Ports from "./pages/Ports";
import PortDetail from "./pages/PortDetail";
import Refineries from "./pages/Refineries";
import RefineryDetail from "./pages/RefineryDetail";
import Connections from "./pages/Connections";
import Companies from "./pages/Companies";
import Brokers from "./pages/Brokers";
import BrokerDetail from "./pages/BrokerDetail";
import BrokerMembership from "./pages/BrokerMembership";
import BrokerSetup from "./pages/BrokerSetup";
import BrokerDashboard from "./pages/BrokerDashboard";
import BrokerVerificationWaiting from "./pages/BrokerVerificationWaiting";
import OilPrices from "./pages/OilPrices";
import CompanyDetail from "./pages/CompanyDetail";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import News from "./pages/News";
import VesselNews from "./pages/VesselNews";
import PortNews from "./pages/PortNews";
import RefineryNews from "./pages/RefineryNews";
import SupportNews from "./pages/SupportNews";
import Policies from "./pages/Policies";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Support from "./pages/Support";
import SupportCenter from "./pages/SupportCenter";
import MyTickets from "./pages/MyTickets";
import NewTicket from "./pages/NewTicket";
import TicketDetail from "./pages/TicketDetail";
import SupportAdmin from "./pages/SupportAdmin";
import Subscription from "./pages/Subscription";
import Admin from "./pages/Admin";
import Map from "./pages/Map";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full light">
      <AppSidebar />
      <div className="flex-1">
        <header className="h-12 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarTrigger className="ml-2" />
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
    {/* AI Assistant available on all pages */}
    <FloatingAIAssistant />
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        <SubscriptionProvider>
          <AccessProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/future-trading" element={<FutureTrading />} />
          <Route 
            path="/tutorials" 
            element={
              <AppLayout>
                <ProtectedRoute>
                  <Tutorials />
                </ProtectedRoute>
              </AppLayout>
            } 
          />
            <Route path="/api-integration" element={<APIIntegration />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/news" element={<News />} />
            <Route path="/vessel-news" element={<VesselNews />} />
            <Route path="/port-news" element={<PortNews />} />
            <Route path="/refinery-news" element={<RefineryNews />} />
            <Route path="/support-news" element={<SupportNews />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route 
            path="/support" 
            element={
              <AppLayout>
                <Support />
              </AppLayout>
            } 
          />
          <Route 
            path="/support-center" 
            element={
              <AppLayout>
                <ProtectedRoute>
                  <SupportCenter />
                </ProtectedRoute>
              </AppLayout>
            } 
          />
          <Route 
            path="/my-tickets" 
            element={
              <AppLayout>
                <ProtectedRoute>
                  <MyTickets />
                </ProtectedRoute>
              </AppLayout>
            } 
          />
          <Route 
            path="/new-ticket" 
            element={
              <AppLayout>
                <NewTicket />
              </AppLayout>
            } 
          />
          <Route 
            path="/ticket/:id" 
            element={
              <AppLayout>
                <ProtectedRoute>
                  <TicketDetail />
                </ProtectedRoute>
              </AppLayout>
            } 
          />
          <Route 
            path="/support-admin" 
            element={
              <AppLayout>
                <ProtectedRoute>
                  <SupportAdmin />
                </ProtectedRoute>
              </AppLayout>
            } 
          />
            <Route path="/auth" element={<Auth />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route 
              path="/dashboard" 
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              } 
            />
            <Route 
              path="/vessels" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Vessels />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/vessels/:id" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <VesselDetail />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/ports" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Ports />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/ports/:id" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <PortDetail />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/refineries" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Refineries />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/refineries/:id" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <RefineryDetail />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/connections" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Connections />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/companies" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Companies />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/brokers" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Brokers />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/brokers/:id" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <BrokerDetail />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/broker-membership" 
              element={
                <AppLayout>
                  <ProtectedRoute requireSubscription={false}>
                    <BrokerMembership />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/broker-setup" 
              element={
                <AppLayout>
                  <ProtectedRoute requireSubscription={false}>
                    <BrokerSetup />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/broker-dashboard" 
              element={
                <AppLayout>
                  <ProtectedRoute requireSubscription={false}>
                    <BrokerDashboard />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/broker-verification-waiting" 
              element={
                <AppLayout>
                  <ProtectedRoute requireSubscription={false}>
                    <BrokerVerificationWaiting />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/companies/:id" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <CompanyDetail />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/oil-prices"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <OilPrices />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/subscription"
              element={
                <AppLayout>
                  <Subscription />
                </AppLayout>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AppLayout>
                  <ProtectedRoute requireSubscription={false}>
                    <Admin />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            <Route 
              path="/map" 
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Map />
                  </ProtectedRoute>
                </AppLayout>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AccessProvider>
      </SubscriptionProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
