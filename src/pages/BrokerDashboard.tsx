import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  MessageCircle,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase,
  FileText,
  Settings,
  Send,
  Paperclip,
  Plus,
  HelpCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Ship,
  Wifi
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingFallback from '@/components/LoadingFallback';
import CreateDealForm from '@/components/broker/CreateDealForm';
import DealSteps from '@/components/broker/DealSteps';
import EditProfileForm from '@/components/broker/EditProfileForm';
import CompanyContacts from '@/components/broker/CompanyContacts';
import IMFPAAgreement from '@/components/broker/IMFPAAgreement';
import IMFPAInfoNotice from '@/components/broker/IMFPAInfoNotice';
import EnhancedDealCard from '@/components/broker/EnhancedDealCard';
import DealInfoNotice from '@/components/broker/DealInfoNotice';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BrokerProfile {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  license_number: string;
  specializations: string[];
  years_experience: number;
  bio: string;
  verified_at: string;
  verification_notes: string;
  id_document_url: string;
  additional_documents: string[];
  profile_image_url: string;
  created_at: string;
  updated_at: string;
}

interface Deal {
  id: string;
  deal_type: string;
  cargo_type: string;
  quantity: number;
  total_value: number;
  status: string;
  steps_completed: number;
  total_steps: number;
  created_at: string;
  source_port: string;
  destination_port: string;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  sender_type: 'broker' | 'admin';
  created_at: string;
  is_read: boolean;
}

const BrokerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [hasCheckedMembership, setHasCheckedMembership] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());
  const [stats, setStats] = useState({
    totalDeals: 0,
    completedDeals: 0,
    totalValue: 0,
    pendingDeals: 0,
    pipelineValue: 0,
    activeNegotiations: 0
  });

  useEffect(() => {
    if (user) {
      fetchBrokerData();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up realtime subscription for chat messages
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('broker_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broker_chat_messages',
          filter: `broker_id=eq.${profile.id}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Sync timer
  useEffect(() => {
    const interval = setInterval(() => setLastSync(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBrokerData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('broker_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        setLoading(false);
        return;
      }
      
      setProfile(profileData);

      const { data: dealsData, error: dealsError } = await supabase
        .from('broker_deals')
        .select('*')
        .eq('broker_id', profileData.id)
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;

      const sortedDeals = [...(dealsData || [])].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ).reverse();

      setDeals(sortedDeals);

      const totalDeals = dealsData?.length || 0;
      const completedDeals = dealsData?.filter(deal => deal.status === 'completed').length || 0;
      const pendingDeals = dealsData?.filter(deal => deal.status === 'pending').length || 0;
      const activeNegotiations = dealsData?.filter(deal => deal.status === 'approved' || deal.status === 'in_progress').length || 0;
      const totalValue = dealsData?.reduce((sum, deal) => sum + (deal.total_value || 0), 0) || 0;
      const pipelineValue = dealsData?.filter(deal => deal.status !== 'completed' && deal.status !== 'rejected')
        .reduce((sum, deal) => sum + (deal.total_value || 0), 0) || 0;

      setStats({
        totalDeals,
        completedDeals,
        totalValue,
        pendingDeals,
        pipelineValue,
        activeNegotiations
      });

      setLastSync(new Date());

      if (profileData) {
        await loadChatMessages(profileData.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load broker data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (brokerId: string) => {
    try {
      const { data, error } = await supabase
        .from('broker_chat_messages')
        .select('*')
        .eq('broker_id', brokerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as ChatMessage[]);

      await supabase
        .from('broker_chat_messages')
        .update({ is_read: true })
        .eq('broker_id', brokerId)
        .eq('sender_type', 'admin');
    } catch (error) {
      // Error loading chat messages
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile || sending) return;

    setSending(true);
    try {
      const messageData = {
        broker_id: profile.id,
        sender_id: user!.id,
        sender_type: 'broker' as const,
        message: newMessage.trim(),
        is_read: false,
        deal_id: null,
        message_type: 'text'
      };

      const { error } = await supabase
        .from('broker_chat_messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');

      toast({
        title: "Message sent",
        description: "Your message has been sent to the support team."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-600 text-white';
      case 'approved': case 'in_progress': return 'bg-blue-600 text-white';
      case 'pending': return 'bg-amber-500 text-black';
      case 'rejected': case 'failed': return 'bg-red-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Generate trading activity chart data from deals
  const getChartData = () => {
    const weeks: Record<string, number> = {};
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const key = `W${8 - i}`;
      weeks[key] = 0;
    }
    deals.forEach(deal => {
      const dealDate = new Date(deal.created_at);
      const diffDays = Math.floor((now.getTime() - dealDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.min(Math.floor(diffDays / 7), 7);
      const key = `W${8 - weekIndex}`;
      if (weeks[key] !== undefined) weeks[key]++;
    });
    return Object.entries(weeks).map(([name, deals]) => ({ name, deals }));
  };

  const timeSinceSync = () => {
    const seconds = Math.floor((Date.now() - lastSync.getTime()) / 1000);
    return seconds < 60 ? `${seconds} sec ago` : `${Math.floor(seconds / 60)} min ago`;
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Broker Dashboard Access</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Broker Profile Found</h3>
            <p className="text-muted-foreground mb-4">
              You don't have a broker profile. This dashboard is only accessible to verified brokers.
            </p>
            <Button onClick={() => navigate('/broker-membership')}>
              Become a Broker
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (editingProfile && profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EditProfileForm 
          profile={profile}
          onSave={() => {
            setEditingProfile(false);
            fetchBrokerData();
          }}
          onCancel={() => setEditingProfile(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* System Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 rounded-md border border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Server Status: Operational
          </span>
          <span>Last Sync: {timeSinceSync()}</span>
        </div>
        <span className="font-mono">BROKER TERMINAL v2.0</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Broker Trading Terminal
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant={profile.verified_at ? 'default' : 'outline'} className="flex items-center gap-1 rounded-sm">
              <Shield className="h-3 w-3" />
              {profile.verified_at ? 'Verified Energy Broker' : 'Pending Verification'}
            </Badge>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wifi className="h-3 w-3 text-emerald-500" />
              Network Active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => navigate('/broker-dashboard/select-company')}
            className="rounded-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Deal
          </Button>
          <Button variant="outline" className="rounded-sm" onClick={() => navigate('/vessels')}>
            <Ship className="h-4 w-4 mr-1" />
            Browse Vessels
          </Button>
          <Button variant="outline" className="rounded-sm" onClick={() => setEditingProfile(true)}>
            <Settings className="h-4 w-4 mr-1" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Stats Cards - Market Terminal Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'ACTIVE DEALS', value: stats.totalDeals, icon: Briefcase, trend: '+' + stats.pendingDeals + ' pending', trendUp: true },
          { label: 'COMPLETED', value: stats.completedDeals, icon: CheckCircle, trend: Math.round(stats.totalDeals ? (stats.completedDeals / stats.totalDeals) * 100 : 0) + '% rate', trendUp: true },
          { label: 'TOTAL VALUE', value: '$' + (stats.totalValue / 1000000).toFixed(1) + 'M', icon: DollarSign, trend: 'Lifetime', trendUp: true },
          { label: 'PIPELINE', value: '$' + (stats.pipelineValue / 1000000).toFixed(1) + 'M', icon: TrendingUp, trend: 'Open deals', trendUp: true },
          { label: 'NEGOTIATIONS', value: stats.activeNegotiations, icon: Activity, trend: 'In progress', trendUp: stats.activeNegotiations > 0 },
          { label: 'PENDING', value: stats.pendingDeals, icon: Clock, trend: 'Awaiting', trendUp: false },
        ].map((stat, i) => (
          <Card key={i} className="rounded-sm border-border bg-card hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                {stat.trendUp ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-amber-500" />}
                {stat.trend}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trading Activity Chart */}
      <Card className="rounded-sm border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Trading Activity Overview
            </CardTitle>
            <span className="text-xs text-muted-foreground">Last 8 weeks</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="deals" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }} 
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="deals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto gap-1 rounded-sm">
          <TabsTrigger value="deals" className="text-xs sm:text-sm rounded-sm">My Deals</TabsTrigger>
          <TabsTrigger value="imfpa" className="text-xs sm:text-sm rounded-sm">IMFPA</TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs sm:text-sm rounded-sm">Companies</TabsTrigger>
          <TabsTrigger value="profile" className="text-xs sm:text-sm rounded-sm">Profile</TabsTrigger>
          <TabsTrigger value="messages" className="text-xs sm:text-sm rounded-sm">Messages</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm rounded-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Deal Pipeline</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setSelectedDeal('explainer')}
                className="flex items-center gap-2 rounded-sm"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">How Deals Work</span>
              </Button>
              <Button 
                onClick={() => navigate('/broker-dashboard/select-company')}
                className="flex items-center gap-2 rounded-sm"
              >
                <Plus className="h-4 w-4" />
                Create Deal
              </Button>
            </div>
          </div>

          {selectedDeal === 'explainer' && <DealInfoNotice />}
          
          {deals.length === 0 ? (
            <Card className="rounded-sm border-border">
              <CardContent className="text-center py-16">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Your trading pipeline is currently empty.</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Initiate your first energy transaction to activate your broker terminal.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button 
                    onClick={() => navigate('/broker-dashboard/select-company')}
                    className="rounded-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create First Deal
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedDeal('explainer')}
                    className="rounded-sm"
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Learn How Deals Work
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Deals Table */}
              <Card className="rounded-sm border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Deal #</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Commodity</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Route</th>
                        <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Volume</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Value</th>
                        <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Updated</th>
                        <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((deal, index) => {
                        const dealNumber = deals.length - index;
                        return (
                          <tr key={deal.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs">#{dealNumber}</td>
                            <td className="px-4 py-3 font-medium">{deal.cargo_type || deal.deal_type}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {deal.source_port || '—'} → {deal.destination_port || '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs">
                              {deal.quantity ? deal.quantity.toLocaleString() + ' MT' : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(deal.status)}`}>
                                {deal.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold">
                              {deal.total_value ? '$' + deal.total_value.toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                              {new Date(deal.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-sm text-xs"
                                onClick={() => setSelectedDeal(deal.id)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Deal detail cards below the table */}
              {selectedDeal && selectedDeal !== 'explainer' && deals.find(d => d.id === selectedDeal) && (
                <Card className="rounded-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Deal Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DealSteps dealId={selectedDeal} onClose={() => setSelectedDeal(null)} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="imfpa" className="space-y-6">
          <IMFPAInfoNotice />
          
          {deals.length === 0 ? (
            <Card className="rounded-sm">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No deals to create IMFPA for. Create a deal first.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select a deal to view/create its IMFPA agreement:</p>
              {deals.map((deal, index) => (
                <Card key={deal.id} className="cursor-pointer hover:shadow-md rounded-sm" onClick={() => setSelectedDeal(deal.id)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <span>Deal #{deals.length - index} - {deal.cargo_type || deal.deal_type}</span>
                    <Badge variant="outline">{deal.status}</Badge>
                  </CardContent>
                </Card>
              ))}
              {selectedDeal && deals.find(d => d.id === selectedDeal) && (
                <IMFPAAgreement 
                  dealId={selectedDeal}
                  dealInfo={deals.find(d => d.id === selectedDeal)!}
                  brokerProfile={{ full_name: profile.full_name, company_name: profile.company_name, country: profile.country }}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <CompanyContacts />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {editingProfile ? (
            <EditProfileForm 
              profile={profile}
              onSave={(updatedProfile) => {
                setProfile(updatedProfile);
                setEditingProfile(false);
              }}
              onCancel={() => setEditingProfile(false)}
            />
          ) : (
            <>
              {/* Membership ID Card */}
              <Card className="rounded-sm overflow-hidden border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Broker Membership Card
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative group">
                    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg p-6 shadow-2xl border border-slate-700">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-lg"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                              <Shield className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-bold text-sm">OIL BROKER</div>
                              <div className="text-blue-300 text-xs">CERTIFIED MEMBER</div>
                            </div>
                          </div>
                          <Badge 
                            variant={profile.verified_at ? "default" : "secondary"}
                            className={`${
                              profile.verified_at 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-amber-500 text-black'
                            }`}
                          >
                            {profile.verified_at ? "VERIFIED" : "PENDING"}
                          </Badge>
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-20 rounded-lg border-2 border-slate-500 overflow-hidden">
                            {profile.profile_image_url ? (
                              <img 
                                src={profile.profile_image_url} 
                                alt={profile.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-b from-slate-600 to-slate-700 flex items-center justify-center">
                                <User className="h-8 w-8 text-slate-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="text-white font-semibold text-lg leading-tight">
                              {profile.full_name.toUpperCase()}
                            </div>
                            <div className="text-blue-300 text-sm">
                              {profile.company_name || 'INDEPENDENT BROKER'}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {profile.city && profile.country ? `${profile.city.toUpperCase()}, ${profile.country.toUpperCase()}` : 'LOCATION NOT SET'}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-600">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-slate-400 text-xs uppercase tracking-wide">Broker ID</div>
                              <div className="text-white font-mono text-sm font-bold tracking-wider">
                                {profile.id.slice(0, 8).toUpperCase()}-{profile.id.slice(8, 12).toUpperCase()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-slate-400 text-xs">Member Since</div>
                              <div className="text-white text-sm font-medium">
                                {new Date(profile.created_at).toLocaleDateString('en-US', { 
                                  month: '2-digit', 
                                  year: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="text-slate-400">
                            EXP: {new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('en-US', { 
                              month: '2-digit', 
                              day: '2-digit',
                              year: '2-digit' 
                            })}
                          </div>
                          <div className="text-slate-400">
                            {profile.license_number ? `LIC: ${profile.license_number}` : 'NO LICENSE'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="text-muted-foreground text-xs">Status</div>
                      <div className="font-medium flex items-center gap-1">
                        {profile.verified_at ? (
                          <>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            Active & Verified
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            Awaiting Verification
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="text-muted-foreground text-xs">Last Updated</div>
                      <div className="font-medium">
                        {new Date(profile.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Present this ID for all official broker transactions and verifications.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information */}
              <Card className="rounded-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Complete Profile Information
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-sm"
                    onClick={() => setEditingProfile(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-lg border-2 border-border overflow-hidden">
                          {profile.profile_image_url ? (
                            <img 
                              src={profile.profile_image_url} 
                              alt={profile.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <User className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold">{profile.full_name}</h3>
                          <p className="text-muted-foreground">{profile.company_name || 'Independent Broker'}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <p className="font-medium">{profile.phone}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Experience:</span>
                            <p className="font-medium">
                              {profile.years_experience ? `${profile.years_experience} years` : 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {profile.bio && (
                      <div>
                        <h4 className="font-semibold mb-2">Biography</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Full Name:</span>
                          <p className="font-medium">{profile.full_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <p className="font-medium">{profile.phone}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">City:</span>
                          <p className="font-medium">{profile.city || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Country:</span>
                          <p className="font-medium">{profile.country || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Address:</span>
                          <p className="font-medium">{profile.address || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Company Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Company Name:</span>
                          <p className="font-medium">{profile.company_name || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">License Number:</span>
                          <p className="font-medium">{profile.license_number || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Years Experience:</span>
                          <p className="font-medium">{profile.years_experience || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {profile.specializations && profile.specializations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Specializations</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.specializations.map((spec, index) => (
                            <Badge key={index} variant="outline" className="rounded-sm">{spec}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card className="rounded-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Support Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-md h-80 overflow-y-auto p-4 space-y-3 mb-4 bg-muted/20">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet. Start a conversation with our support team.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'broker' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-md text-sm ${
                          msg.sender_type === 'broker'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <span className="text-[10px] opacity-70 mt-1 block">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="rounded-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="rounded-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="rounded-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Deal Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-mono font-bold">
                        {stats.totalDeals ? Math.round((stats.completedDeals / stats.totalDeals) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Deal Value</span>
                      <span className="font-mono font-bold">
                        ${stats.totalDeals ? Math.round(stats.totalValue / stats.totalDeals).toLocaleString() : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Volume</span>
                      <span className="font-mono font-bold">${stats.totalValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Status Distribution</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                        <span className="text-sm">Completed</span>
                      </div>
                      <span className="font-mono font-bold">{stats.completedDeals}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-amber-500" />
                        <span className="text-sm">Pending</span>
                      </div>
                      <span className="font-mono font-bold">{stats.pendingDeals}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-blue-500" />
                        <span className="text-sm">Active</span>
                      </div>
                      <span className="font-mono font-bold">{stats.activeNegotiations}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerDashboard;
