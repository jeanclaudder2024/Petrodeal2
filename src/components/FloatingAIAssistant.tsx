import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Send, Minimize2, Maximize2, X, Sparkles, MessageCircle, Zap } from 'lucide-react';
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

interface PlatformMetrics {
  totalBrokers: number;
  totalDeals: number;
  pendingApprovals: number;
  totalValue: number;
  activeVessels: number;
  activePorts: number;
  recentActivity: number;
}

const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchPlatformMetrics();
      // Add welcome message when user opens for first time
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Hello! 👋 I\'m your AI assistant for the Oil Trading Platform. I can help you with:\n\n✨ Platform analytics and insights\n🛢️ Broker and deal management\n📊 Data analysis and reporting\n⚡ Quick actions and recommendations\n\nWhat would you like to know?',
          timestamp: new Date(),
          type: 'text'
        }]);
      }
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Animate the floating button
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPlatformMetrics = async () => {
    try {
      const [brokersRes, dealsRes, vesselsRes, portsRes] = await Promise.all([
        db.from('broker_profiles').select('*', { count: 'exact' }),
        db.from('broker_deals').select('*'),
        db.from('vessels').select('*', { count: 'exact' }),
        db.from('ports').select('*', { count: 'exact' })
      ]);

      const deals = dealsRes.data || [];
      
      setMetrics({
        totalBrokers: brokersRes.count || 0,
        totalDeals: deals.length,
        pendingApprovals: deals.filter(d => d.status === 'pending').length,
        totalValue: deals.reduce((sum, deal) => sum + (deal.total_value || 0), 0),
        activeVessels: vesselsRes.count || 0,
        activePorts: portsRes.count || 0,
        recentActivity: deals.filter(d => {
          const dealDate = new Date(d.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return dealDate > weekAgo;
        }).length
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
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
      // Call AI assistant edge function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          message: inputMessage,
          context: {
            metrics,
            currentTime: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date(),
        type: data.type || 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('AI Assistant error:', error);
      
      // Fallback response based on keywords
      const fallbackResponse = generateFallbackResponse(inputMessage);
      
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

  const generateFallbackResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('broker') || lowerMessage.includes('brokers')) {
      return `📊 **Broker Overview**\n\n• Total Brokers: ${metrics?.totalBrokers || 0}\n• Recent Activity: ${metrics?.recentActivity || 0} deals this week\n• Pending Approvals: ${metrics?.pendingApprovals || 0}\n\nNeed help with broker management or performance analysis?`;
    }
    
    if (lowerMessage.includes('deal') || lowerMessage.includes('deals')) {
      return `💼 **Deal Summary**\n\n• Total Deals: ${metrics?.totalDeals || 0}\n• Pending Approvals: ${metrics?.pendingApprovals || 0}\n• Total Value: ${metrics?.totalValue ? `$${metrics.totalValue.toLocaleString()}` : 'N/A'}\n• This Week: ${metrics?.recentActivity || 0} new deals\n\nWhat specific deal insights do you need?`;
    }
    
    if (lowerMessage.includes('vessel') || lowerMessage.includes('ships')) {
      return `🚢 **Vessel Analytics**\n\n• Active Vessels: ${metrics?.activeVessels || 0}\n• Real-time Tracking: ✅ Enabled\n\nI can help analyze vessel movements, cargo tracking, or port activities.`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `🤖 **I can help you with:**\n\n📈 Platform Analytics & KPIs\n👥 Broker & Deal Management\n🚢 Vessel & Port Operations\n💡 Business Intelligence\n⚡ Quick Actions & Insights\n\nJust ask me anything about your platform!`;
    }
    
    return `I understand you're asking about: "${message}"\n\n🎯 **Here's what I can help with:**\n• Platform performance metrics\n• Broker and deal insights\n• Vessel and port data\n• Business recommendations\n\nCould you be more specific about what you'd like to know?`;
  };

  const quickActions = [
    { 
      label: 'Platform Stats', 
      icon: Zap, 
      action: () => setInputMessage('Show me current platform statistics and key metrics') 
    },
    { 
      label: 'Broker Analysis', 
      icon: MessageCircle, 
      action: () => setInputMessage('Analyze broker performance and recent activity') 
    }
  ];

  // Don't show if user is not authenticated
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
          
          {/* Tooltip - Hidden on mobile */}
          {!isMobile && (
            <div className="absolute bottom-16 right-0 bg-background border border-border rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
              <div className="text-sm font-medium">AI Assistant</div>
              <div className="text-xs text-muted-foreground">Ask me anything!</div>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
            </div>
          )}
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
                <DialogTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>AI Assistant</DialogTitle>
                {!isMobile && (
                  <DialogDescription className="text-sm">
                    Your intelligent platform companion
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
                <div className="flex gap-2">
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
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
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
                    placeholder={isMobile ? "Ask me anything..." : "Ask about your platform..."}
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
                    <Send className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
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