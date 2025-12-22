import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Send, Minimize2, Maximize2, X, Sparkles, MessageCircle, Zap, Ship, Anchor, DollarSign } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'data' | 'analysis';
}

interface ChatbotConfig {
  id: string | null;
  name: string;
  welcome_message: string;
  allowed_topics: string[];
  blocked_topics: string[];
  platform_data_access: boolean;
}

const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Fetch chatbot config on mount
  useEffect(() => {
    if (user) {
      fetchChatbotConfig();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatbotConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-chat', {
        body: { action: 'get_config' }
      });

      if (error) throw error;

      const config = data?.config || {
        id: null,
        name: 'PetroDealHub Assistant',
        welcome_message: 'Hello! 👋 I\'m your PetroDealHub assistant. I can help you with:\n\n🛢️ Vessel and port information\n📊 Platform features and navigation\n💳 Subscription and billing questions\n🤝 Trading and broker services\n\nHow can I assist you today?',
        allowed_topics: [],
        blocked_topics: [],
        platform_data_access: true
      };

      setChatbotConfig(config);
      
      // Set welcome message
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: config.welcome_message,
          timestamp: new Date(),
          type: 'text'
        }]);
      }
    } catch (error) {
      console.error('Error fetching chatbot config:', error);
      // Use default welcome message
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Hello! 👋 I\'m your PetroDealHub assistant. How can I help you today?',
          timestamp: new Date(),
          type: 'text'
        }]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call customer-chat edge function with conversation context
      const { data, error } = await supabase.functions.invoke('customer-chat', {
        body: { 
          action: 'send_message',
          message: inputMessage,
          conversation_id: conversationId,
          user_id: user?.id,
          user_email: user?.email,
          user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
          subscription_tier: null // Will be fetched by the edge function
        }
      });

      if (error) throw error;

      // Update conversation ID if new
      if (data?.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.response || 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show toast if escalated
      if (data?.escalated) {
        toast({
          title: "Support Ticket Created",
          description: "Your request has been escalated to our support team."
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback to local response with platform data
      const fallbackResponse = await generateLocalResponse(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalResponse = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    // Check for blocked topics first
    const blockedKeywords = ['politics', 'religion', 'gambling', 'cryptocurrency', 'bitcoin'];
    if (blockedKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return "I'm sorry, but I can only help with questions related to the PetroDealHub platform, vessels, ports, refineries, and trading services. Is there anything else I can assist you with?";
    }

    // Vessel-related queries - fetch real data
    if (lowerMessage.includes('vessel') || lowerMessage.includes('ship') || lowerMessage.includes('tanker')) {
      try {
        const { data: vessels, count } = await db
          .from('vessels')
          .select('name, vessel_type, flag, status', { count: 'exact' })
          .limit(5);

        const vesselList = vessels?.map(v => `• ${v.name} (${v.vessel_type})`).join('\n') || 'No vessels found';
        
        return `🚢 **Vessel Information**\n\nTotal vessels tracked: ${count || 0}\n\n**Recent vessels:**\n${vesselList}\n\nYou can view all vessels in the Vessels section of the platform. Would you like to know anything specific about vessel tracking?`;
      } catch (error) {
        return `🚢 **Vessel Tracking**\n\nPetroDealHub tracks thousands of vessels globally. You can:\n\n• View real-time vessel positions\n• Track voyage routes and ETA\n• Access vessel specifications\n• Monitor cargo information\n\nVisit the Vessels section to explore all available data.`;
      }
    }

    // Port-related queries
    if (lowerMessage.includes('port') || lowerMessage.includes('terminal')) {
      try {
        const { count } = await db
          .from('ports')
          .select('*', { count: 'exact', head: true });

        return `⚓ **Port Information**\n\nWe track ${count || 'hundreds of'} ports worldwide.\n\nOur port data includes:\n• Port locations and coordinates\n• Capacity and throughput data\n• Terminal information\n• Port status and operations\n\nVisit the Ports section to explore detailed port information.`;
      } catch (error) {
        return `⚓ **Port Data**\n\nPetroDealHub provides comprehensive port information including locations, capacities, and terminal details. Visit the Ports section to explore.`;
      }
    }

    // Subscription/pricing queries
    if (lowerMessage.includes('price') || lowerMessage.includes('subscription') || lowerMessage.includes('plan') || lowerMessage.includes('cost')) {
      try {
        const { data: plans } = await db
          .from('subscription_plans')
          .select('plan_name, price_monthly, price_yearly')
          .eq('is_active', true)
          .order('sort_order');

        const planInfo = plans?.map(p => `• **${p.plan_name}**: $${p.price_monthly}/month or $${p.price_yearly}/year`).join('\n') || '';

        return `💳 **Subscription Plans**\n\n${planInfo || 'Visit our Subscription page for current pricing.'}\n\nAll plans include a free trial period. Visit the Subscription page to compare features and choose the best plan for your needs.`;
      } catch (error) {
        return `💳 **Subscription Information**\n\nWe offer multiple subscription tiers:\n• Basic - Essential features\n• Professional - Advanced analytics\n• Enterprise - Full platform access\n\nVisit the Subscription page to see current pricing and start your free trial.`;
      }
    }

    // Refinery queries
    if (lowerMessage.includes('refinery') || lowerMessage.includes('refineries')) {
      try {
        const { count } = await db
          .from('refineries')
          .select('*', { count: 'exact', head: true });

        return `🏭 **Refinery Data**\n\nWe track ${count || 'numerous'} refineries globally.\n\nOur refinery information includes:\n• Location and capacity\n• Operator details\n• Production capabilities\n• Status updates\n\nVisit the Refineries section for detailed information.`;
      } catch (error) {
        return `🏭 **Refineries**\n\nPetroDealHub tracks major refineries worldwide with capacity, operator, and location data. Visit the Refineries section to explore.`;
      }
    }

    // Broker/trading queries
    if (lowerMessage.includes('broker') || lowerMessage.includes('trading') || lowerMessage.includes('deal')) {
      return `🤝 **Broker Services**\n\nPetroDealHub offers professional broker services:\n\n• Become a verified broker\n• Create and manage deals\n• Connect with buyers and sellers\n• Access trading documents\n\nVisit the Broker section to learn more about our broker program.`;
    }

    // Help/features queries
    if (lowerMessage.includes('help') || lowerMessage.includes('feature') || lowerMessage.includes('what can')) {
      return `🎯 **PetroDealHub Features**\n\n**I can help you with:**\n\n🚢 **Vessels** - Real-time tracking and data\n⚓ **Ports** - Global port information\n🏭 **Refineries** - Refinery data and capacity\n🤝 **Brokers** - Trading and deal services\n💳 **Subscriptions** - Plans and billing\n🗺️ **Maps** - Interactive global views\n\nWhat would you like to know more about?`;
    }

    // Default response - stay on topic
    return `I understand you're asking about: "${message}"\n\nAs your PetroDealHub assistant, I can help with:\n\n🚢 Vessel tracking and data\n⚓ Port information\n🏭 Refinery details\n💳 Subscription and billing\n🤝 Broker services\n\nCould you please rephrase your question related to these topics? Or type "help" to see what I can assist with.`;
  };

  const quickActions = [
    { 
      label: 'Vessels', 
      icon: Ship, 
      action: () => setInputMessage('Tell me about vessel tracking') 
    },
    { 
      label: 'Ports', 
      icon: Anchor, 
      action: () => setInputMessage('What port information do you have?') 
    },
    { 
      label: 'Pricing', 
      icon: DollarSign, 
      action: () => setInputMessage('What are the subscription plans?') 
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className={`fixed z-50 ${isMobile ? 'bottom-24 right-4' : 'bottom-6 right-6'}`}>
          <Button
            onClick={() => setIsOpen(true)}
            className={`${isMobile ? 'h-10 w-10' : 'h-14 w-14'} rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isAnimating ? 'animate-bounce' : ''
            } group relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Bot className={`${isMobile ? 'h-5 w-5' : 'h-7 w-7'} text-white relative z-10`} />
            <Sparkles className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white absolute top-1 right-1 animate-pulse`} />
          </Button>
        </div>
      )}

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className={`${isMobile ? 'max-w-full mx-4' : 'max-w-lg'} transition-all duration-300 ${
            isMinimized ? 'h-20' : isMobile ? 'h-[80vh]' : 'h-[600px]'
          } p-0 overflow-hidden`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between ${isMobile ? 'p-3' : 'p-4'} border-b bg-gradient-to-r from-primary/5 to-primary/10`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center`}>
                  <Bot className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-white`} />
                </div>
                <div className={`absolute -top-1 -right-1 ${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-green-500 rounded-full animate-pulse`} />
              </div>
              <div>
                <DialogTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                  {chatbotConfig?.name || 'PetroDealHub Assistant'}
                </DialogTitle>
                {!isMobile && (
                  <DialogDescription className="text-sm">
                    Your platform support assistant
                  </DialogDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="flex flex-col h-full">
              {/* Quick Actions */}
              <div className="p-3 bg-muted/30 border-b">
                <div className="flex gap-2 flex-wrap">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-xs"
                      onClick={action.action}
                    >
                      <action.icon className="h-3 w-3" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-background border shadow-sm mr-4'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-background border shadow-sm mr-4 p-3 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={`${isMobile ? 'p-3' : 'p-4'} border-t bg-background`}>
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about vessels, ports, subscriptions..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                    className={`flex-1 ${isMobile ? 'text-base' : ''}`}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isLoading || !inputMessage.trim()}
                    size="icon"
                    className={`bg-gradient-to-r from-primary to-primary/80 ${isMobile ? 'h-10 w-10' : ''}`}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingAIAssistant;
