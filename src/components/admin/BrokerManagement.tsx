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
  Send,
  User
} from 'lucide-react';
import { db, supabase } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';

interface BrokerProfile {
  id: string;
  user_id: string;
  membership_id?: string;
  full_name: string;
  company_name?: string;
  phone: string;
  email?: string;
  address?: string;
  country?: string;
  city?: string;
  license_number?: string;
  years_experience?: number;
  specializations?: string[];
  id_document_url?: string;
  passport_document_url?: string;
  additional_documents?: string[];
  bio?: string;
  profile_image_url?: string;
  website?: string;
  linkedin_url?: string;
  twitter_url?: string;
  languages?: string[];
  certifications?: string[];
  education?: string;
  trading_volume?: string;
  commission_rate?: number;
  preferred_regions?: string[];
  company_size?: string;
  company_type?: string;
  business_registration?: string;
  tax_id?: string;
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at?: string;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch brokers
      const { data: brokersData, error: brokersError } = await db
        .from('broker_profiles')
        .select('*')
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
    // Create a more detailed rejection dialog
    const feedback = prompt(
      "Please provide detailed feedback about why this step was rejected and what the broker needs to correct:\n\n" +
      "Examples:\n" +
      "- Document is unclear/blurry, please upload a clearer version\n" +
      "- Missing required information in the contract\n" +
      "- File format not acceptable, please upload PDF format\n" +
      "- Additional documentation required\n\n" +
      "Your feedback:"
    );
    
    if (!feedback || feedback.trim() === '') {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback to help the broker understand what needs to be corrected.",
        variant: "destructive"
      });
      return;
    }

    try {
      const step = dealSteps.find(s => s.id === stepId);
      if (!step) return;

      // Reset the step to allow the broker to resubmit - change status back to 'not_started' or 'rejected'
      const { error } = await supabase
        .from('deal_steps')
        .update({ 
          status: 'rejected',
          notes: `ADMIN FEEDBACK: ${feedback.trim()}\n\nPlease resubmit this step with the requested corrections.`,
          completed_at: null // Clear completion date to reopen the step
        })
        .eq('id', stepId);

      if (error) throw error;

      toast({
        title: "Step Rejected",
        description: "The step has been rejected and reopened for the broker to resubmit with your feedback.",
      });

      // Refresh data to show updated status
      await fetchData();
    } catch (error) {
      console.error('Error rejecting step:', error);
      toast({
        title: "Error", 
        description: "Failed to reject deal step. Please try again.",
        variant: "destructive"
      });
    }
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
                            {broker.verified_at ? 
                              <Badge variant="default">Verified</Badge> : 
                              <Badge variant="secondary">Pending</Badge>
                            }
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
                             {deal.total_value ? 
                               deal.total_value.toLocaleString('en-US', { 
                                 style: 'currency', 
                                 currency: 'USD' 
                               }) : 'N/A'
                             }
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
                             {step.completed_at ? 
                               new Date(step.completed_at).toLocaleDateString() : 'N/A'
                             }
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
                        const feedback = prompt(
                          "Please provide detailed feedback about why this step is being rejected:\n\n" +
                          "Examples:\n" +
                          "- Document is unclear, please upload a clearer version\n" +
                          "- Missing required information\n" +
                          "- Wrong file format\n\n" +
                          "Your feedback:"
                        );
                        if (feedback && feedback.trim()) {
                          handleRejectStep(step.id, `ADMIN FEEDBACK: ${feedback.trim()}\n\nPlease resubmit this step with the requested corrections.`);
                        }
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

      {/* Broker Profile Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Broker Profile Details</DialogTitle>
            <DialogDescription>
              Complete broker profile information for verification and approval
            </DialogDescription>
          </DialogHeader>
          {selectedBroker && (
            <div className="space-y-6">
              {/* Profile and Document Images */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-base font-semibold">Profile Photo</Label>
                  <div className="mt-2 border rounded-lg p-4 min-h-48 bg-muted/30">
                    {selectedBroker.profile_image_url ? (
                      <div className="space-y-2">
                        <img 
                          src={selectedBroker.profile_image_url} 
                          alt="Profile" 
                          className="w-full h-40 object-cover rounded-md border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden text-center py-16 text-muted-foreground">
                          <p>Profile image not available</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-muted-foreground">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
                            <span className="text-2xl font-semibold">
                              {selectedBroker.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <p className="text-sm">No profile photo uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-base font-semibold">ID Document</Label>
                  <div className="mt-2 border rounded-lg p-4 min-h-48 bg-muted/30">
                    {selectedBroker.id_document_url ? (
                      <div className="space-y-2">
                        <img 
                          src={selectedBroker.id_document_url} 
                          alt="ID Document" 
                          className="w-full h-40 object-cover rounded-md border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden text-center py-16 text-muted-foreground">
                          <p>ID document image not available</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open(selectedBroker.id_document_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Document
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-muted-foreground">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm">No ID document uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold">Passport Document</Label>
                  <div className="mt-2 border rounded-lg p-4 min-h-48 bg-muted/30">
                    {selectedBroker.passport_document_url ? (
                      <div className="space-y-2">
                        <img 
                          src={selectedBroker.passport_document_url} 
                          alt="Passport Document" 
                          className="w-full h-40 object-cover rounded-md border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden text-center py-16 text-muted-foreground">
                          <p>Passport document image not available</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open(selectedBroker.passport_document_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Document
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-muted-foreground">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm">No passport document uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-sm font-medium">{selectedBroker.full_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm font-medium">{selectedBroker.email || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm font-medium">{selectedBroker.phone}</p>
                  </div>
                  <div>
                    <Label>Years of Experience</Label>
                    <p className="text-sm font-medium">
                      {selectedBroker.years_experience ? `${selectedBroker.years_experience} years` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Country</Label>
                    <p className="text-sm font-medium">{selectedBroker.country || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>City</Label>
                    <p className="text-sm font-medium">{selectedBroker.city || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <p className="text-sm font-medium">{selectedBroker.address || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Education</Label>
                    <p className="text-sm font-medium">{selectedBroker.education || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>License Number</Label>
                    <p className="text-sm font-medium">{selectedBroker.license_number || 'N/A'}</p>
                  </div>
                </div>

                {selectedBroker.languages && selectedBroker.languages.length > 0 && (
                  <div>
                    <Label>Languages</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedBroker.languages.map((lang, index) => (
                        <Badge key={index} variant="outline">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Professional Information</h3>
                
                {selectedBroker.bio && (
                  <div>
                    <Label>Professional Bio</Label>
                    <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md">{selectedBroker.bio}</p>
                  </div>
                )}

                {selectedBroker.specializations && selectedBroker.specializations.length > 0 && (
                  <div>
                    <Label>Specializations</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedBroker.specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBroker.certifications && selectedBroker.certifications.length > 0 && (
                  <div>
                    <Label>Certifications</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedBroker.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Trading Volume</Label>
                    <p className="text-sm font-medium">{selectedBroker.trading_volume || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Commission Rate</Label>
                    <p className="text-sm font-medium">
                      {selectedBroker.commission_rate ? `${selectedBroker.commission_rate}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedBroker.preferred_regions && selectedBroker.preferred_regions.length > 0 && (
                  <div>
                    <Label>Preferred Trading Regions</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedBroker.preferred_regions.map((region, index) => (
                        <Badge key={index} variant="outline">{region}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Website</Label>
                    <p className="text-sm font-medium">
                      {selectedBroker.website ? (
                        <a href={selectedBroker.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          View Website
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label>LinkedIn</Label>
                    <p className="text-sm font-medium">
                      {selectedBroker.linkedin_url ? (
                        <a href={selectedBroker.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          View Profile
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label>Twitter</Label>
                    <p className="text-sm font-medium">
                      {selectedBroker.twitter_url ? (
                        <a href={selectedBroker.twitter_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          View Profile
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <p className="text-sm font-medium">{selectedBroker.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Company Type</Label>
                    <p className="text-sm font-medium">{selectedBroker.company_type || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Size</Label>
                    <p className="text-sm font-medium">{selectedBroker.company_size || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Business Registration</Label>
                    <p className="text-sm font-medium">{selectedBroker.business_registration || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <Label>Tax ID / VAT Number</Label>
                  <p className="text-sm font-medium">{selectedBroker.tax_id || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              {/* Additional Documents */}
              {selectedBroker.additional_documents && selectedBroker.additional_documents.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Additional Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedBroker.additional_documents.map((docUrl, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium">Document {index + 1}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full mt-2"
                          onClick={() => window.open(docUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Status and Verification */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Status & Verification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      {selectedBroker.verified_at ? 
                        <Badge variant="default">Verified</Badge> : 
                        <Badge variant="secondary">Pending Verification</Badge>
                      }
                    </div>
                  </div>
                  <div>
                    <Label>Joined</Label>
                    <p className="text-sm font-medium">
                      {new Date(selectedBroker.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedBroker.verified_at && (
                  <div>
                    <Label>Verified At</Label>
                    <p className="text-sm font-medium">
                      {new Date(selectedBroker.verified_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedBroker.verification_notes && (
                  <div>
                    <Label>Verification Notes</Label>
                    <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md">{selectedBroker.verification_notes}</p>
                  </div>
                )}
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
                      // Small delay to ensure dialog closes before new prompt
                      setTimeout(() => {
                        handleRejectStep(selectedStep.id);
                      }, 100);
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject & Request Resubmission
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokerManagement;