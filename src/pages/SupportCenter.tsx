import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Send, 
  Plus,
  Ticket,
  MessageSquare
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import LoadingFallback from '@/components/LoadingFallback';


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
  user_id: string | null;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  attachments: string[] | null;
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
  
  const [loading, setLoading] = useState(true);
  
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

  const initializeSupport = async () => {
    try {
      // Load categories first
      await loadCategories();
      
      if (isAdmin) {
        // Admin: Load all tickets
        await loadAllTickets();
      } else {
        // User: Load own tickets
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
    const { data, error } = await supabase
      .from('support_categories')
      .select('id, name_en, description_en')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) throw error;
    
    // Map to expected format
    const mappedCategories = (data || []).map(cat => ({
      id: cat.id,
      name: cat.name_en,
      description: cat.description_en
    }));
    
    setCategories(mappedCategories);
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
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTickets(data || []);
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

    // Check if user can send messages to this ticket
    if (!isAdmin && selectedTicket.user_id !== user!.id) {
      toast({
        title: "Error",
        description: "You can only send messages to your own tickets.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Sending message:', {
        ticket_id: selectedTicket.id,
        user_id: user!.id,
        message: newTicketMessage.trim()
      });

      const { data, error } = await db
        .from('support_ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user!.id,
          message: newTicketMessage.trim(),
          is_internal: false
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);
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
        description: `Failed to send message: ${error.message || 'Please try again.'}`,
        variant: "destructive"
      });
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    try {
      console.log('Loading messages for ticket:', ticketId);
      const { data, error } = await db
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      console.log('Loaded messages:', data);
      setTicketMessages(data || []);
    } catch (error) {
      console.error('Error in loadTicketMessages:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket messages.",
        variant: "destructive"
      });
    }
  };


  const handleTicketSelect = async (ticket: Ticket) => {
    // Check if user can view this ticket
    if (!isAdmin && ticket.user_id !== user!.id) {
      toast({
        title: "Error",
        description: "You can only view your own tickets.",
        variant: "destructive"
      });
      return;
    }

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


  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage support tickets and help users' : 'Get help with your account and trading activities'}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Support Tickets</h2>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
            
            {/* Tickets Sidebar */}
            <div className="w-full lg:w-96 min-w-0">
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
                  
                  <div className="max-h-[600px] overflow-y-auto">
                    {tickets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tickets yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[80px]">Priority</TableHead>
                            <TableHead className="min-w-[200px]">Subject</TableHead>
                            <TableHead className="w-[120px]">Ticket #</TableHead>
                            <TableHead className="w-[100px]">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.map((ticket) => (
                            <TableRow
                              key={ticket.id}
                              onClick={() => handleTicketSelect(ticket)}
                              className={`cursor-pointer hover:bg-accent/50 ${
                                selectedTicket?.id === ticket.id ? 'bg-accent' : ''
                              }`}
                            >
                              <TableCell className="p-2">
                                <Badge className={`${getStatusColor(ticket.status)} text-xs px-2 py-1 w-full justify-center`}>
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-2">
                                <Badge className={`${getPriorityColor(ticket.priority)} text-xs px-2 py-1 w-full justify-center`}>
                                  {ticket.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-2">
                                <div className="max-w-[200px]">
                                  <p className="font-medium text-sm truncate" title={ticket.subject}>
                                    {ticket.subject}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="p-2">
                                <p className="text-xs text-muted-foreground font-mono truncate" title={ticket.ticket_number}>
                                  {ticket.ticket_number}
                                </p>
                              </TableCell>
                              <TableCell className="p-2">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(ticket.created_at).toLocaleDateString()}
                                </p>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Detail Area */}
            <div className="flex-1 min-w-0">
              <Card className="h-full flex flex-col">
                {selectedTicket ? (
                  <>
                    {/* Ticket Header */}
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate" title={selectedTicket.subject}>
                              {selectedTicket.subject}
                            </span>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
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
                        <p className="text-sm break-words whitespace-pre-wrap">{selectedTicket.description}</p>
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
                            const isOwnMessage = message.user_id === user!.id;
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
        </div>
      </div>
    </div>
  );
};

export default SupportCenter;