import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingFallback from '@/components/LoadingFallback';
import { db } from '@/lib/supabase-helper';
import { ArrowLeft, Send, Paperclip, Clock, User, Mail } from 'lucide-react';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  message: string;
  user_id: string | null;
  created_at: string;
  is_internal: boolean;
  attachments: string[] | null;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicketData();
    }
  }, [id]);

  const loadTicketData = async () => {
    try {
      setLoading(true);

      // Load ticket
      const { data: ticketData, error: ticketError } = await db
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (ticketError) throw ticketError;

      // Check if user can access this ticket
      if (!isAdmin && ticketData.user_id !== user?.id && ticketData.email !== user?.email) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this ticket.",
          variant: "destructive",
        });
        navigate('/my-tickets');
        return;
      }

      setTicket(ticketData);

      // Load category
      const { data: categoryData, error: categoryError } = await supabase
        .from('support_categories')
        .select('id, name_en, description_en')
        .eq('id', ticketData.category_id)
        .single();

      if (!categoryError && categoryData) {
        setCategory({
          id: categoryData.id,
          name: categoryData.name_en,
          description: categoryData.description_en || ''
        });
      }

      // Load messages
      const { data: messagesData, error: messagesError } = await db
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (!messagesError) {
        setMessages(messagesData);
      }

    } catch (error: any) {
      console.error('Error loading ticket:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !ticket) return;

    try {
      setSending(true);

      // Create message
      const { error: messageError } = await db
        .from('support_ticket_messages')
        .insert({
          ticket_id: ticket.id,
          message: replyMessage,
          user_id: user?.id,
          is_internal: false,
        });

      if (messageError) throw messageError;

      // Update ticket status to open if it was closed
      if (ticket.status === 'closed') {
        const { error: updateError } = await db
          .from('support_tickets')
          .update({ 
            status: 'open',
            updated_at: new Date().toISOString()
          })
          .eq('id', ticket.id);

        if (updateError) throw updateError;
      }

      // Send notification email
      await supabase.functions.invoke('send-support-notification', {
        body: {
          type: 'reply',
          ticket: ticket,
          message: replyMessage,
          from: user?.email || ticket.email,
        },
      });

      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });

      setReplyMessage('');
      setAttachments(null);
      loadTicketData(); // Reload to show new message

    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ticket Not Found</h1>
          <Button onClick={() => navigate('/my-tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(isAdmin ? '/admin' : '/my-tickets')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isAdmin ? 'Back to Admin' : 'Back to My Tickets'}
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{ticket.subject}</h1>
            <p className="text-muted-foreground mb-4">
              Ticket #{ticket.ticket_number}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {ticket.email}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Created {new Date(ticket.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status.replace('_', ' ')}
            </Badge>
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority} priority
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Original Message
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Category: {category?.name || 'Unknown'}
            </div>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{ticket.description}</div>
          </CardContent>
        </Card>

        {messages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.user_id === user?.id
                      ? 'bg-primary/10 ml-8'
                      : 'bg-muted mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {message.user_id === user?.id ? 'You' : 'Support Team'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.message}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {ticket.status !== 'closed' && (
          <Card>
            <CardHeader>
              <CardTitle>Reply to Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reply">Your Reply</Label>
                <Textarea
                  id="reply"
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="attachments">Attachments (optional)</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  onChange={(e) => setAttachments(e.target.files)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Max 5 files, 10MB each. Supported: PDF, JPG, PNG, DOCX
                </p>
              </div>

              <Button
                onClick={handleReply}
                disabled={!replyMessage.trim() || sending}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Sending...' : 'Send Reply'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;