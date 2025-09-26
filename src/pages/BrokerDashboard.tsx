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
  Paperclip
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingFallback from '@/components/LoadingFallback';
import CreateDealForm from '@/components/broker/CreateDealForm';
import DealSteps from '@/components/broker/DealSteps';
import EditProfileForm from '@/components/broker/EditProfileForm';
import { useToast } from '@/hooks/use-toast';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [stats, setStats] = useState({
    totalDeals: 0,
    completedDeals: 0,
    totalValue: 0,
    pendingDeals: 0
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

  const fetchBrokerData = async () => {
    try {
      // Fetch broker profile
      const { data: profileData, error: profileError } = await supabase
        .from('broker_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle(); // Use maybeSingle instead of single

      if (profileError) throw profileError;
      
      // If no broker profile found, user is not a broker
      if (!profileData) {
        console.log('No broker profile found for user');
        setLoading(false);
        return;
      }
      
      setProfile(profileData);

      // Fetch broker deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('broker_deals')
        .select('*')
        .eq('broker_id', profileData.id)
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;

      setDeals(dealsData || []);

      // Calculate stats
      const totalDeals = dealsData?.length || 0;
      const completedDeals = dealsData?.filter(deal => deal.status === 'completed').length || 0;
      const pendingDeals = dealsData?.filter(deal => deal.status === 'pending').length || 0;
      const totalValue = dealsData?.reduce((sum, deal) => sum + (deal.total_value || 0), 0) || 0;

      setStats({
        totalDeals,
        completedDeals,
        totalValue,
        pendingDeals
      });

      // Load chat messages after profile is set
      if (profileData) {
        await loadChatMessages(profileData.id);
      }
    } catch (error) {
      console.error('Failed to fetch broker data:', error);
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

      // Mark messages as read
      await supabase
        .from('broker_chat_messages')
        .update({ is_read: true })
        .eq('broker_id', brokerId)
        .eq('sender_type', 'admin');

    } catch (error) {
      console.error('Error loading chat messages:', error);
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
      console.error('Error sending message:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'approved':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  // If user has no broker profile, show message
  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Broker Dashboard Access</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Broker Profile Found</h3>
            <p className="text-muted-foreground mb-4">
              You don't have a broker profile. This dashboard is only accessible to verified brokers.
            </p>
            <Button onClick={() => window.location.href = '/broker-membership'}>
              Become a Broker
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {profile.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {profile.full_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={profile.verified_at ? 'default' : 'outline'} className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {profile.verified_at ? 'Verified Broker' : 'Pending Verification'}
              </Badge>
              {profile.company_name && (
                <Badge variant="outline">{profile.company_name}</Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedDeals}</div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="deals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deals">My Deals</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Deals</h2>
            <CreateDealForm onSuccess={(dealId) => {
              setSelectedDeal(dealId);
              fetchBrokerData();
            }} />
          </div>
          
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Recent Deals</CardTitle>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No deals yet. Start by browsing vessels and creating your first deal.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deals.map((deal) => (
                    <div key={deal.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{deal.deal_type}</Badge>
                          <span className="font-medium">{deal.cargo_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(deal.status)}
                          <Badge variant="outline" className={getStatusColor(deal.status)}>
                            {deal.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{deal.quantity?.toLocaleString()} MT</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-medium">${deal.total_value?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Progress</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(deal.steps_completed / deal.total_steps) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs">{deal.steps_completed}/{deal.total_steps}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          {deal.source_port} → {deal.destination_port}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDeal(deal.id)}
                        >
                          View Steps
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
              <Card className="trading-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Broker Membership Card
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* ID Card */}
                  <div className="relative group">
                    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl animate-fade-in">
                      {/* Card Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-2xl"></div>
                      
                      {/* Card Header */}
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
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                                : 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                            } animate-pulse`}
                          >
                            {profile.verified_at ? "VERIFIED" : "PENDING"}
                          </Badge>
                        </div>

                        {/* Member Photo */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-20 rounded-lg border-2 border-slate-500 overflow-hidden shadow-inner">
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
                          
                          {/* Member Info */}
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

                        {/* ID Number */}
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

                        {/* Bottom Info */}
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

                        {/* Holographic Effect */}
                        <div className="absolute top-4 right-4 w-12 h-8 bg-gradient-to-r from-cyan-400/20 to-pink-400/20 rounded transform rotate-12 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Card Back (Hidden, shown on hover for premium effect) */}
                    <div className="absolute inset-0 w-full max-w-md mx-auto bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-600 opacity-0 group-hover:opacity-100 transform rotate-y-180 group-hover:rotate-y-0 transition-all duration-700 pointer-events-none">
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="text-center">
                          <div className="text-white font-bold text-sm mb-2">TERMS & CONDITIONS</div>
                          <div className="text-slate-400 text-xs leading-relaxed">
                            This card certifies the holder as an authorized oil trading broker. Valid for commercial transactions within approved networks. Not transferable.
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Experience:</span>
                            <span>{profile.years_experience || 0} Years</span>
                          </div>
                          {profile.specializations && profile.specializations.length > 0 && (
                            <div className="text-xs text-slate-400">
                              <div>Specializations:</div>
                              <div className="text-white">
                                {profile.specializations.slice(0, 2).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-center">
                          <div className="w-full h-8 bg-slate-900 rounded flex items-center justify-center">
                            <div className="text-slate-500 text-xs font-mono">
                              *** AUTHORIZED BROKER ***
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info Below Card */}
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-muted-foreground text-xs">Status</div>
                      <div className="font-medium flex items-center gap-1">
                        {profile.verified_at ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Active & Verified
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            Awaiting Verification
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-muted-foreground text-xs">Last Updated</div>
                      <div className="font-medium">
                        {new Date(profile.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Present this ID for all official broker transactions and verifications.
                      <br />
                      Keep your membership information up to date for continued access.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information */}
              <Card className="trading-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Complete Profile Information
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Profile Photo & Basic Info */}
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

                    {/* Bio */}
                    {profile.bio && (
                      <div>
                        <h4 className="font-semibold mb-2">Biography</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                      </div>
                    )}

                    {/* Personal Information */}
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

                    {/* Company Information */}
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
                          <p className="font-medium">
                            {profile.years_experience ? `${profile.years_experience} years` : 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Professional Details */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Professional Details
                      </h4>
                      <div className="space-y-4">
                        {/* Specializations */}
                        {profile.specializations && profile.specializations.length > 0 && (
                          <div>
                            <span className="text-muted-foreground text-sm">Specializations:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {profile.specializations.map((spec, index) => (
                                <Badge key={index} variant="secondary">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Information */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Account Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Broker ID:</span>
                          <p className="font-mono text-xs">{profile.id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Member Since:</span>
                          <p className="font-medium">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Updated:</span>
                          <p className="font-medium">
                            {new Date(profile.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Verification Status:</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${profile.verified_at ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <p className="font-medium">
                              {profile.verified_at ? 'Verified' : 'Pending Verification'}
                            </p>
                          </div>
                        </div>
                        {profile.verified_at && (
                          <div>
                            <span className="text-muted-foreground">Verified On:</span>
                            <p className="font-medium">
                              {new Date(profile.verified_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Verification Status
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {profile.verified_at ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Verified on {new Date(profile.verified_at).toLocaleDateString()}</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">Verification pending</span>
                            </>
                          )}
                        </div>
                        {profile.verification_notes && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {profile.verification_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card className="trading-card h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Support Chat
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Chat directly with our support team for help with your deals and platform questions.
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      No messages yet. Start the conversation!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Our support team typically responds within 2 hours during business hours.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === user!.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${
                            isOwnMessage ? 'text-right' : 'text-left'
                          }`}>
                            {isOwnMessage ? 'You' : 'Support Team'} • {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message to support..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="pr-12"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Analytics will be available once you have more deal activity.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deal Steps Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DealSteps 
              dealId={selectedDeal} 
              onClose={() => setSelectedDeal(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerDashboard;