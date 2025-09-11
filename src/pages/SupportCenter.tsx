import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  MoreVertical,
  ArrowLeft,
  Paperclip,
  Smile,
  Plus,
  Eye,
  Clock,
  Ticket,
  Users,
  MessageSquare
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import LoadingFallback from '@/components/LoadingFallback';

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  sender_type: 'broker' | 'admin';
  created_at: string;
  is_read: boolean;
  broker_id: string;
  deal_id: string | null;
  file_url: string | null;
}

interface BrokerInfo {
  id: string;
  full_name: string;
  company_name: string;
  user_id: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category_id: string;
  user_id: string;
  email: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_internal: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const SupportCenter = () => {
  const { user } = useAuth();
  const { role, isAdmin } = useUserRole();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'tickets' : 'chat');
  
  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<BrokerInfo | null>(null);
  const [currentBrokerProfile, setCurrentBrokerProfile] = useState<BrokerInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Ticket states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    description: '',
    category_id: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (user) {
      initializeSupport();
    }
  }, [user, role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!selectedBroker) return;

    const channel = supabase
      .channel('broker_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broker_chat_messages',
          filter: `broker_id=eq.${selectedBroker.id}`
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
  }, [selectedBroker]);

  const initializeSupport = async () => {
    try {
      // Load categories first
      await loadCategories();
      
      if (isAdmin) {
        // Admin: Load all brokers and tickets
        await loadBrokers();
        await loadAllTickets();
      } else {
        // User: Load own profile, messages, and tickets
        await loadBrokerProfile();
        await loadUserTickets();
      }
    } catch (error) {
      console.error('Error initializing support:', error);
      toast({
        title: "Error",
        description: "Failed to load support center. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await db
      .from('support_ticket_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) throw error;
    setCategories(data || []);
  };

  const loadAllTickets = async () => {
    const { data, error } = await db
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTickets(data || []);
  };

  const loadUserTickets = async () => {
    const { data, error } = await db
      .from('support_tickets')
      .select('*')
      .or(`user_id.eq.${user!.id},email.eq.${user!.email}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTickets(data || []);
  };

  const loadBrokers = async () => {
    const { data, error } = await supabase
      .from('broker_profiles')
      .select('id, full_name, company_name, user_id')
      .order('full_name');

    if (error) throw error;
    setBrokers(data || []);
  };

  const loadBrokerProfile = async () => {
    const { data, error } = await supabase
      .from('broker_profiles')
      .select('id, full_name, company_name, user_id')
      .eq('user_id', user!.id)
      .single();

    if (error) throw error;
    setCurrentBrokerProfile(data);
    setSelectedBroker(data);
    await loadMessages(data.id);
  };

  const loadMessages = async (brokerId: string) => {
    const { data, error } = await supabase
      .from('broker_chat_messages')
      .select('*')
      .eq('broker_id', brokerId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    setMessages((data || []) as ChatMessage[]);

    // Mark messages as read
    if (!isAdmin) {
      await supabase
        .from('broker_chat_messages')
        .update({ is_read: true })
        .eq('broker_id', brokerId)
        .eq('sender_type', 'admin');
    }
  };

  const createTicket = async () => {
    if (!newTicketForm.subject.trim() || !newTicketForm.description.trim() || !newTicketForm.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const ticketNumber = `TKT-${Date.now()}`;
      
      const { data, error } = await db
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          user_id: user!.id,
          email: user!.email!,
          subject: newTicketForm.subject.trim(),
          description: newTicketForm.description.trim(),
          category_id: newTicketForm.category_id,
          priority: newTicketForm.priority,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setTickets(prev => [data, ...prev]);
      setSelectedTicket(data);
      setShowNewTicketForm(false);
      setNewTicketForm({
        subject: '',
        description: '',
        category_id: '',
        priority: 'medium'
      });

      toast({
        title: "Ticket created",
        description: `Ticket ${ticketNumber} has been created successfully.`
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sendTicketMessage = async () => {
    if (!newTicketMessage.trim() || !selectedTicket) return;

    try {
      const { data, error } = await db
        .from('support_ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user!.id,
          sender_type: isAdmin ? 'admin' : 'user',
          message: newTicketMessage.trim(),
          is_internal: false
        })
        .select()
        .single();

      if (error) throw error;

      setTicketMessages(prev => [...prev, data]);
      setNewTicketMessage('');

      // Update ticket status if needed
      if (selectedTicket.status === 'closed' && !isAdmin) {
        await db
          .from('support_tickets')
          .update({ status: 'open' })
          .eq('id', selectedTicket.id);
      }

      toast({
        title: "Message sent",
        description: "Your message has been added to the ticket."
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    const { data, error } = await db
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    setTicketMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedBroker || sending) return;

    setSending(true);
    try {
      const messageData = {
        broker_id: selectedBroker.id,
        sender_id: user!.id,
        sender_type: isAdmin ? 'admin' : 'broker',
        message: newMessage.trim(),
        is_read: false,
        deal_id: null,
        message_type: 'text'
      };

      const { data, error } = await supabase
        .from('broker_chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      setNewMessage('');

      toast({
        title: "Message sent",
        description: "Your message has been delivered."
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

  const handleBrokerSelect = async (broker: BrokerInfo) => {
    setSelectedBroker(broker);
    await loadMessages(broker.id);
  };

  const handleTicketSelect = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await loadTicketMessages(ticket.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageSenderName = (message: ChatMessage) => {
    if (message.sender_type === 'admin') {
      return 'Support Team';
    }
    return selectedBroker?.full_name || 'Broker';
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage support tickets and chat with brokers' : 'Get help with your account and trading activities'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Live Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
            
            {/* Tickets Sidebar */}
            <div className="w-full lg:w-80">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      {isAdmin ? 'All Tickets' : 'My Tickets'}
                    </CardTitle>
                    {!isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {showNewTicketForm && (
                    <div className="p-4 border-b space-y-3">
                      <h4 className="font-medium">Create New Ticket</h4>
                      <Input
                        placeholder="Subject"
                        value={newTicketForm.subject}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description"
                        value={newTicketForm.description}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                        rows={3}
                      />
                      <Select
                        value={newTicketForm.category_id}
                        onValueChange={(value) => setNewTicketForm({ ...newTicketForm, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={newTicketForm.priority}
                        onValueChange={(value) => setNewTicketForm({ ...newTicketForm, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button onClick={createTicket} size="sm" className="flex-1">
                          Create
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewTicketForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 p-4 max-h-[600px] overflow-y-auto">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => handleTicketSelect(ticket)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                          selectedTicket?.id === ticket.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            #{ticket.ticket_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {tickets.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tickets yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Detail Area */}
            <div className="flex-1">
              <Card className="h-full flex flex-col">
                {selectedTicket ? (
                  <>
                    {/* Ticket Header */}
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Ticket className="h-5 w-5" />
                            {selectedTicket.subject}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            #{selectedTicket.ticket_number} • Created {new Date(selectedTicket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(selectedTicket.status)}>
                            {selectedTicket.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(selectedTicket.priority)}>
                            {selectedTicket.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{selectedTicket.description}</p>
                      </div>
                    </CardHeader>

                    {/* Ticket Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-4">
                        {ticketMessages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          ticketMessages.map((message) => {
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
                                    {message.sender_type === 'admin' ? 'Support Team' : 'You'} • {formatMessageTime(message.created_at)}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex items-center gap-2">
                        <Input
                          value={newTicketMessage}
                          onChange={(e) => setNewTicketMessage(e.target.value)}
                          placeholder="Type your message..."
                          onKeyPress={(e) => e.key === 'Enter' && sendTicketMessage()}
                        />
                        <Button 
                          onClick={sendTicketMessage}
                          disabled={!newTicketMessage.trim()}
                          size="sm"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a ticket to view details and messages</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
            
            {/* Chat Sidebar */}
            <div className="w-full lg:w-80">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {isAdmin ? 'Active Brokers' : 'Support Chat'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isAdmin ? (
                    <div className="space-y-2 p-4">
                      {brokers.map((broker) => (
                        <div
                          key={broker.id}
                          onClick={() => handleBrokerSelect(broker)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                            selectedBroker?.id === broker.id ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {broker.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{broker.full_name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {broker.company_name}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Need Help?</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Our support team is here to help you with any questions about your deals, verification, or platform usage.
                          </p>
                        </div>
                        <div className="space-y-2 text-left">
                          <div className="text-sm">
                            <strong>Response Time:</strong> Within 2 hours
                          </div>
                          <div className="text-sm">
                            <strong>Available:</strong> Mon-Fri, 9 AM - 6 PM UTC
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="flex-1">
              <Card className="h-full flex flex-col">
                {selectedBroker ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {selectedBroker.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {isAdmin ? selectedBroker.full_name : 'Support Team'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isAdmin ? selectedBroker.company_name : 'We\'re here to help'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Online</Badge>
                      </div>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No messages yet. Start the conversation!</p>
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
                                    {formatMessageTime(message.created_at)}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </CardContent>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
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
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{isAdmin ? 'Select a broker to start chatting' : 'Loading chat...'}</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupportCenter;