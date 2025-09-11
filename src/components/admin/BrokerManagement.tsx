import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  FileText, 
  Download,
  RefreshCw,
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  MessageCircle, 
  XCircle, 
  Eye, 
  Send
} from 'lucide-react';
import { db, supabase } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';

interface BrokerProfile {
  id: string;
  user_id: string;
  full_name: string;
  company_name?: string;
  phone: string;
  bio?: string;
  specializations?: string[];
  years_experience?: number;
  verified_at?: string;
  created_at: string;
  profile_image_url?: string;
  id_document_url?: string;
  passport_document_url?: string;
  country?: string;
  city?: string;
  address?: string;
  license_number?: string;
  verification_notes?: string;
}

interface BrokerDeal {
  id: string;
  broker_id: string;
  deal_type: string;
  cargo_type?: string;
  quantity?: number;
  price_per_unit?: number;
  total_value?: number;
  source_port?: string;
  destination_port?: string;
  status: string;
  steps_completed: number;
  total_steps: number;
  deal_date?: string;
  created_at: string;
  broker_profiles?: BrokerProfile;
}

interface ChatMessage {
  id: string;
  broker_id: string;
  deal_id?: string;
  message: string;
  sender_type: 'admin' | 'broker';
  sender_id: string;
  is_read: boolean;
  created_at: string;
  broker_profiles?: BrokerProfile;
}

interface DealStep {
  id: string;
  deal_id: string;
  step_number: number;
  step_name: string;
  step_description?: string;
  status: 'pending' | 'completed' | 'rejected' | 'not_started';
  completed_at?: string;
  notes?: string;
  file_url?: string;
  created_at?: string;
}

const BrokerManagement = () => {
  const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
  const [deals, setDeals] = useState<BrokerDeal[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dealSteps, setDealSteps] = useState<DealStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('brokers');
  const [selectedBroker, setSelectedBroker] = useState<BrokerProfile | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<BrokerDeal | null>(null);
  const [selectedStep, setSelectedStep] = useState<DealStep | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const [imageErrorStates, setImageErrorStates] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  // Image loading helpers
  const handleImageLoad = (imageKey: string) => {
    setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
    setImageErrorStates(prev => ({ ...prev, [imageKey]: false }));
  };

  const handleImageError = (imageKey: string) => {
    setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
    setImageErrorStates(prev => ({ ...prev, [imageKey]: true }));
  };

  const handleImageLoadStart = (imageKey: string) => {
    setImageLoadingStates(prev => ({ ...prev, [imageKey]: true }));
    setImageErrorStates(prev => ({ ...prev, [imageKey]: false }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset image states when broker changes
  useEffect(() => {
    if (selectedBroker) {
      setImageLoadingStates({});
      setImageErrorStates({});
    }
  }, [selectedBroker]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch brokers
      const { data: brokersData, error: brokersError } = await db
        .from('broker_profiles')
        .select(`
          id,
          user_id,
          full_name,
          company_name,
          phone,
          bio,
          specializations,
          years_experience,
          verified_at,
          created_at,
          profile_image_url,
          id_document_url,
          passport_document_url,
          country,
          city,
          address,
          license_number,
          verification_notes
        `)
        .order('created_at', { ascending: false });

      if (brokersError) throw brokersError;
      setBrokers(brokersData || []);

      // Fetch deals with broker info
      const { data: dealsData, error: dealsError } = await db
        .from('broker_deals')
        .select(`
          *,
          broker_profiles:broker_id (
            id,
            full_name,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;
      setDeals(dealsData || []);

      // Fetch chat messages
      const { data: messagesData, error: messagesError } = await db
        .from('broker_chat_messages')
        .select(`
          *,
          broker_profiles:broker_id (
            id,
            full_name,
            company_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Fetch deal steps
      const { data: stepsData, error: stepsError } = await db
        .from('deal_steps')
        .select('*')
        .order(['deal_id', 'step_number']);

      if (stepsError) throw stepsError;
      setDealSteps(stepsData || []);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "Error",
        description: "Failed to load broker data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStep = async (stepId: string) => {
    try {
      const step = dealSteps.find(s => s.id === stepId);
      if (!step) return;

      const { error: stepError } = await supabase
        .from('deal_steps')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          notes: 'Approved by admin'
        })
        .eq('id', stepId);

      if (stepError) throw stepError;

      // Update deal progress
      const completedSteps = dealSteps.filter(s => 
        s.deal_id === step.deal_id && (s.status === 'completed' || s.id === stepId)
      ).length;

      const { error: dealError } = await supabase
        .from('broker_deals')
        .update({ steps_completed: completedSteps })
        .eq('id', step.deal_id);

      if (dealError) throw dealError;
      
      toast({ title: "Success", description: "Step approved successfully" });
      fetchData();
    } catch (error) {
      console.error('Failed to approve step:', error);
      toast({
        title: "Error",
        description: "Failed to approve step",
        variant: "destructive"
      });
    }
  };

  const handleRejectStep = async (stepId: string, rejectionNotes?: string) => {
    try {
      const { error } = await supabase
        .from('deal_steps')
        .update({ 
          status: 'rejected',
          notes: rejectionNotes || 'Rejected by admin - please revise and resubmit'
        })
        .eq('id', stepId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Step rejected with feedback sent to broker" });
      fetchData();
    } catch (error) {
      console.error('Failed to reject step:', error);
      toast({
        title: "Error",
        description: "Failed to reject step",
        variant: "destructive"
      });
    }
  };

  const handleRejectWithMessage = async () => {
    if (!selectedStep || !rejectionMessage.trim()) return;
    
    await handleRejectStep(selectedStep.id, rejectionMessage);
    setIsRejectDialogOpen(false);
    setRejectionMessage('');
    setSelectedStep(null);
  };

  const handleSendMessage = async () => {
    if (!selectedBroker || !chatMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('broker_chat_messages')
        .insert({
          broker_id: selectedBroker.id,
          deal_id: selectedDeal?.id,
          message: chatMessage,
          sender_type: 'admin',
          sender_id: 'admin', // This would be the actual admin user ID in production
        });

      if (error) throw error;
      
      setChatMessage('');
      toast({ title: "Success", description: "Message sent" });
      fetchData();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleVerifyBroker = async (brokerId: string) => {
    try {
      const { error } = await supabase
        .from('broker_profiles')
        .update({ 
          verified_at: new Date().toISOString(),
          verification_notes: 'Verified by admin'
        })
        .eq('id', brokerId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Broker verified successfully" });
      fetchData();
    } catch (error) {
      console.error('Failed to verify broker:', error);
      toast({
        title: "Error",
        description: "Failed to verify broker",
        variant: "destructive"
      });
    }
  };

  const handleRejectBroker = async (brokerId: string) => {
    try {
      const { error } = await supabase
        .from('broker_profiles')
        .update({ 
          verified_at: null,
          verified_by: null,
          verification_notes: 'Rejected by admin'
        })
        .eq('id', brokerId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Broker verification rejected" });
      fetchData();
    } catch (error) {
      console.error('Failed to reject broker:', error);
      toast({
        title: "Error",
        description: "Failed to reject broker",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { variant: 'secondary' as const, label: 'Pending' },
      'active': { variant: 'default' as const, label: 'Active' },
      'completed': { variant: 'default' as const, label: 'Completed' },
      'rejected': { variant: 'destructive' as const, label: 'Rejected' },
      'approved': { variant: 'default' as const, label: 'Approved' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredBrokers = brokers.filter(broker =>
    broker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeals = deals.filter(deal =>
    deal.deal_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.cargo_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(message =>
    message.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Broker Management
          </CardTitle>
          <CardDescription>
            Manage brokers, approve deals, and communicate with brokers
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="brokers">Brokers</TabsTrigger>
          <TabsTrigger value="deals">Deals & Approvals</TabsTrigger>
          <TabsTrigger value="chat">Chat Messages</TabsTrigger>
          <TabsTrigger value="steps">Deal Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="brokers">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Broker Profiles</CardTitle>
              <CardDescription>Manage and verify broker profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search brokers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{brokers.length}</div>
                  <div className="text-sm text-muted-foreground">Total Brokers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {brokers.filter(b => b.verified_at).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {brokers.filter(b => !b.verified_at).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Verification</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">
                    {filteredBrokers.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Filtered Results</div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : filteredBrokers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No brokers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBrokers.map((broker) => (
                        <TableRow key={broker.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{broker.full_name}</TableCell>
                          <TableCell>{broker.company_name || 'N/A'}</TableCell>
                          <TableCell>{broker.years_experience ? `${broker.years_experience} years` : 'N/A'}</TableCell>
                          <TableCell>
                            {broker.verified_at ? (
                              <Badge variant="default">Verified</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBroker(broker);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBroker(broker);
                                  setActiveTab('chat');
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              {!broker.verified_at ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerifyBroker(broker.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectBroker(broker.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Deal Management</CardTitle>
              <CardDescription>Review and approve broker deals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{deals.length}</div>
                  <div className="text-sm text-muted-foreground">Total Deals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {deals.filter(d => d.status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Approval</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {deals.filter(d => d.status === 'approved').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {deals.reduce((sum, deal) => sum + (deal.total_value || 0), 0).toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: 'USD', 
                      notation: 'compact' 
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broker</TableHead>
                      <TableHead>Deal Type</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : filteredDeals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No deals found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDeals.map((deal) => (
                         <TableRow key={deal.id} className="hover:bg-muted/50">
                           <TableCell className="font-medium">
                             {deal.broker_profiles?.full_name || 'N/A'}
                           </TableCell>
                           <TableCell>{deal.deal_type}</TableCell>
                           <TableCell>{deal.cargo_type || 'N/A'}</TableCell>
                           <TableCell>
                             {deal.total_value ? (
                               deal.total_value.toLocaleString('en-US', { 
                                 style: 'currency', 
                                 currency: 'USD' 
                               })
                             ) : (
                               'N/A'
                             )}
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               <div className="w-full bg-muted rounded-full h-2">
                                 <div 
                                   className="bg-primary h-2 rounded-full transition-all duration-300" 
                                   style={{ 
                                     width: `${((deal.steps_completed || 0) / (deal.total_steps || 1)) * 100}%` 
                                   }}
                                 ></div>
                               </div>
                               <span className="text-sm text-muted-foreground whitespace-nowrap">
                                 {deal.steps_completed || 0}/{deal.total_steps || 0}
                               </span>
                             </div>
                           </TableCell>
                           <TableCell>{getStatusBadge(deal.status)}</TableCell>
                           <TableCell>
                             <div className="flex gap-2">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => {
                                   setSelectedDeal(deal);
                                   setActiveTab('steps');
                                 }}
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => {
                                   setSelectedBroker(brokers.find(b => b.id === deal.broker_id) || null);
                                   setSelectedDeal(deal);
                                   setActiveTab('chat');
                                 }}
                               >
                                 <MessageCircle className="h-4 w-4" />
                               </Button>
                             </div>
                           </TableCell>
                         </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Broker Communications</CardTitle>
              <CardDescription>Chat with brokers and manage communications</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedBroker && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold">Chatting with: {selectedBroker.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedBroker.company_name}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <Textarea
                    placeholder={selectedBroker ? `Message ${selectedBroker.full_name}...` : "Select a broker to send a message"}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    disabled={!selectedBroker}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!selectedBroker || !chatMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broker</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Deal ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No messages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMessages.map((message) => (
                        <TableRow key={message.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {message.broker_profiles?.full_name || 'N/A'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {message.message}
                          </TableCell>
                          <TableCell>
                            <Badge variant={message.sender_type === 'admin' ? 'default' : 'secondary'}>
                              {message.sender_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{message.deal_id ? message.deal_id.slice(0, 8) + '...' : 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(message.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={message.is_read ? 'default' : 'secondary'}>
                              {message.is_read ? 'Read' : 'Unread'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Deal Steps Approval</CardTitle>
              <CardDescription>Approve or reject individual deal steps</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDeal && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold">Deal: {selectedDeal.deal_type}</h3>
                  <p className="text-sm text-muted-foreground">
                    Broker: {selectedDeal.broker_profiles?.full_name} | 
                    Progress: {selectedDeal.steps_completed}/{selectedDeal.total_steps}
                  </p>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                     <TableRow>
                       <TableHead>Step #</TableHead>
                       <TableHead>Step Name</TableHead>
                       <TableHead>Description</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Document</TableHead>
                       <TableHead>Notes</TableHead>
                       <TableHead>Completed</TableHead>
                       <TableHead>Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealSteps
                      .filter(step => !selectedDeal || step.deal_id === selectedDeal.id)
                      .map((step) => (
                         <TableRow key={step.id} className="hover:bg-muted/50">
                           <TableCell>{step.step_number}</TableCell>
                           <TableCell className="font-medium">{step.step_name}</TableCell>
                           <TableCell className="max-w-xs truncate">{step.step_description || 'N/A'}</TableCell>
                           <TableCell>{getStatusBadge(step.status)}</TableCell>
                           <TableCell>
                             {step.file_url ? (
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => window.open(step.file_url, '_blank')}
                               >
                                 View Document
                               </Button>
                             ) : (
                               <span className="text-muted-foreground text-sm">No document</span>
                             )}
                           </TableCell>
                           <TableCell className="max-w-xs">
                             <div className="truncate text-sm">
                               {step.notes || 'No notes'}
                             </div>
                           </TableCell>
                           <TableCell>
                             {step.completed_at ? (
                               new Date(step.completed_at).toLocaleDateString()
                             ) : (
                               'N/A'
                             )}
                           </TableCell>
                           <TableCell>
                             <div className="flex gap-2">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => {
                                   setSelectedStep(step);
                                   setIsStepDialogOpen(true);
                                 }}
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                               {step.status === 'pending' && (
                                 <>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => handleApproveStep(step.id)}
                                     className="text-green-600 hover:text-green-700"
                                   >
                                     <CheckCircle className="h-4 w-4" />
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => {
                                       setSelectedStep(step);
                                       setIsRejectDialogOpen(true);
                                     }}
                                     className="text-red-600 hover:text-red-700"
                                   >
                                     <XCircle className="h-4 w-4" />
                                   </Button>
                                 </>
                               )}
                               {step.status === 'completed' && (
                                 <Badge variant="default" className="text-xs">Approved</Badge>
                               )}
                               {step.status === 'rejected' && (
                                 <Badge variant="destructive" className="text-xs">Rejected</Badge>
                               )}
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Broker Details</DialogTitle>
            <DialogDescription>
              View detailed information about the broker
            </DialogDescription>
          </DialogHeader>
          {selectedBroker && (
            <div className="space-y-8 max-h-[80vh] overflow-y-auto">
              {/* Header with Status */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {selectedBroker.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{selectedBroker.full_name}</h3>
                    <p className="text-muted-foreground">{selectedBroker.company_name || 'Independent Broker'}</p>
                  </div>
                </div>
                <div className="text-right">
                  {selectedBroker.verified_at ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Verification
                    </Badge>
                  )}
                </div>
              </div>

              {/* Profile and Passport Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Profile Photo
                  </Label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 min-h-56 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all duration-200">
                    {selectedBroker.profile_image_url ? (
                      <div className="space-y-3">
                        <div className="relative group">
                          {imageLoadingStates['profile'] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                              <div className="flex flex-col items-center space-y-2">
                                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                                <p className="text-sm text-gray-600">Loading image...</p>
                              </div>
                            </div>
                          )}
                          {imageErrorStates['profile'] ? (
                            <div className="flex items-center justify-center h-48 text-center py-16 text-muted-foreground">
                              <div>
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                                <p className="text-sm font-medium text-red-600">Profile image failed to load</p>
                                <p className="text-xs text-muted-foreground mt-1">The image may be corrupted or unavailable</p>
                              </div>
                            </div>
                          ) : (
                            <img 
                              src={selectedBroker.profile_image_url} 
                              alt="Profile" 
                              className="w-full h-48 object-cover rounded-lg border-2 border-white shadow-md group-hover:shadow-lg transition-shadow duration-200"
                              onLoadStart={() => handleImageLoadStart('profile')}
                              onLoad={() => handleImageLoad('profile')}
                              onError={() => handleImageError('profile')}
                              style={{ display: imageLoadingStates['profile'] ? 'none' : 'block' }}
                            />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200"></div>
                        </div>
                        {!imageErrorStates['profile'] && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full hover:bg-blue-50 hover:border-blue-300"
                            onClick={() => window.open(selectedBroker.profile_image_url, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Image
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 mx-auto mb-3 flex items-center justify-center shadow-inner">
                            <span className="text-2xl font-bold text-white">
                              {selectedBroker.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <p className="text-sm font-medium">No profile photo uploaded</p>
                          <p className="text-xs text-muted-foreground mt-1">Broker hasn't provided a profile image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Passport/ID Document
                  </Label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 min-h-56 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all duration-200">
                    {selectedBroker.passport_document_url ? (
                      <div className="space-y-3">
                        <div className="relative group">
                          {imageLoadingStates['document'] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                              <div className="flex flex-col items-center space-y-2">
                                <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
                                <p className="text-sm text-gray-600">Loading document...</p>
                              </div>
                            </div>
                          )}
                          {imageErrorStates['document'] ? (
                            <div className="flex items-center justify-center h-48 text-center py-16 text-muted-foreground">
                              <div>
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                                <p className="text-sm font-medium text-red-600">ID document failed to load</p>
                                <p className="text-xs text-muted-foreground mt-1">The document may be corrupted or unavailable</p>
                              </div>
                            </div>
                          ) : (
                            <img 
                              src={selectedBroker.passport_document_url} 
                              alt="ID Document" 
                              className="w-full h-48 object-cover rounded-lg border-2 border-white shadow-md group-hover:shadow-lg transition-shadow duration-200"
                              onLoadStart={() => handleImageLoadStart('document')}
                              onLoad={() => handleImageLoad('document')}
                              onError={() => handleImageError('document')}
                              style={{ display: imageLoadingStates['document'] ? 'none' : 'block' }}
                            />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200"></div>
                        </div>
                        {!imageErrorStates['document'] && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full hover:bg-purple-50 hover:border-purple-300"
                            onClick={() => window.open(selectedBroker.passport_document_url, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Document
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-100 to-red-200 mx-auto mb-3 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-red-400" />
                          </div>
                          <p className="text-sm font-medium text-red-600">No ID document uploaded</p>
                          <p className="text-xs text-muted-foreground mt-1">Required for verification</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-foreground">Broker Information</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                      <Label className="text-sm font-medium text-blue-700">Full Name</Label>
                      <p className="text-base font-semibold text-blue-900 mt-1">{selectedBroker.full_name}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                      <Label className="text-sm font-medium text-purple-700">Company</Label>
                      <p className="text-base font-semibold text-purple-900 mt-1">{selectedBroker.company_name || 'Independent Broker'}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                      <Label className="text-sm font-medium text-green-700">Phone</Label>
                      <p className="text-base font-semibold text-green-900 mt-1">{selectedBroker.phone}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-100">
                      <Label className="text-sm font-medium text-orange-700">Experience</Label>
                      <p className="text-base font-semibold text-orange-900 mt-1">
                        {selectedBroker.years_experience ? `${selectedBroker.years_experience} years` : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-100">
                      <Label className="text-sm font-medium text-teal-700">Country</Label>
                      <p className="text-base font-semibold text-teal-900 mt-1">{selectedBroker.country || 'Not specified'}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
                      <Label className="text-sm font-medium text-indigo-700">City</Label>
                      <p className="text-base font-semibold text-indigo-900 mt-1">{selectedBroker.city || 'Not specified'}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-lg border border-violet-100">
                      <Label className="text-sm font-medium text-violet-700">License Number</Label>
                      <p className="text-base font-semibold text-violet-900 mt-1">{selectedBroker.license_number || 'Not provided'}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-100">
                      <Label className="text-sm font-medium text-rose-700">Address</Label>
                      <p className="text-base font-semibold text-rose-900 mt-1">{selectedBroker.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                {selectedBroker.specializations && selectedBroker.specializations.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                      <Label className="text-base font-semibold">Specializations</Label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedBroker.specializations.map((spec, index) => (
                        <Badge key={index} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedBroker.bio && (
                  <div className="mt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      <Label className="text-base font-semibold">Professional Bio</Label>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm leading-relaxed text-gray-700">{selectedBroker.bio}</p>
                    </div>
                  </div>
                )}

                {selectedBroker.verification_notes && (
                  <div className="mt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                      <Label className="text-base font-semibold">Admin Verification Notes</Label>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm leading-relaxed text-yellow-800">{selectedBroker.verification_notes}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Verification Status</Label>
                      <div className="mt-2">
                        {selectedBroker.verified_at ? (
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              on {new Date(selectedBroker.verified_at).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Verification
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Member Since</Label>
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                            <UserCheck className="h-3 w-3 mr-1" />
                            {new Date(selectedBroker.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Actions */}
              {!selectedBroker.verified_at && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleVerifyBroker(selectedBroker.id);
                      setIsDialogOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Broker
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleRejectBroker(selectedBroker.id);
                      setIsDialogOpen(false);
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Verification
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step Review Dialog */}
      <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Step: {selectedStep?.step_name}</DialogTitle>
            <DialogDescription>
              Step {selectedStep?.step_number} - Review submitted content before approval
            </DialogDescription>
          </DialogHeader>
          {selectedStep && (
            <div className="space-y-6">
              {/* Step Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Step Number</Label>
                  <p className="text-sm mt-1">{selectedStep.step_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedStep.status)}</div>
                </div>
              </div>

              {/* Step Description */}
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {selectedStep.step_description || 'No description available'}
                </p>
              </div>

              {/* Broker Notes */}
              <div>
                <Label className="text-sm font-semibold">Broker Notes/Message</Label>
                <div className="mt-1 p-3 bg-muted rounded-md min-h-[100px]">
                  {selectedStep.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{selectedStep.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes provided</p>
                  )}
                </div>
              </div>

              {/* Uploaded Document */}
              {selectedStep.file_url ? (
                <div>
                  <Label className="text-sm font-semibold">Uploaded Document</Label>
                  <div className="mt-1 p-4 border rounded-md bg-blue-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Document attached</p>
                        <p className="text-xs text-muted-foreground">Click to view the uploaded file</p>
                      </div>
                      <Button
                        onClick={() => window.open(selectedStep.file_url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        View Document
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-semibold">Uploaded Document</Label>
                  <div className="mt-1 p-4 border rounded-md bg-gray-50">
                    <p className="text-sm text-muted-foreground italic">No document uploaded</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Submitted At</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedStep.created_at || '').toLocaleString()}
                  </p>
                </div>
                {selectedStep.completed_at && (
                  <div>
                    <Label className="text-sm font-semibold">Completed At</Label>
                    <p className="text-sm mt-1">
                      {new Date(selectedStep.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedStep.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleApproveStep(selectedStep.id);
                      setIsStepDialogOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Step
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsStepDialogOpen(false);
                      setIsRejectDialogOpen(true);
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Step
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Step: {selectedStep?.step_name}</DialogTitle>
            <DialogDescription>
              Provide detailed feedback to help the broker understand what needs to be corrected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-message">Rejection Message</Label>
              <Textarea
                id="rejection-message"
                placeholder="Please specify what needs to be corrected. For example: 'The uploaded document is not clear enough. Please provide a higher quality scan of your ICPO with all text clearly visible.'"
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                className="mt-1 min-h-[120px]"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleRejectWithMessage}
                disabled={!rejectionMessage.trim()}
                className="bg-red-600 hover:bg-red-700 text-white flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Step
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectionMessage('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokerManagement;