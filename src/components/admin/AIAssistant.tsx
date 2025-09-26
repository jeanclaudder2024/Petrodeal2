import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Send, Zap, Brain, Settings, MessageCircle, BarChart3, Users, TrendingUp } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const AIAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlatformMetrics();
    // Add welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for the Oil Trading Platform. I can help you with:\n\n• Platform analytics and insights\n• Broker and deal management queries\n• Data analysis and reporting\n• System monitoring and recommendations\n\nWhat would you like to know?',
      timestamp: new Date(),
      type: 'text'
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      let fallbackResponse = generateFallbackResponse(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      toast({
        title: "AI Assistant Offline",
        description: "Using local analysis. For full AI features, please configure the AI assistant.",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('broker') || lowerMessage.includes('brokers')) {
      return `Based on current data:\n\n• Total Brokers: ${metrics?.totalBrokers || 0}\n• Recent Activity: ${metrics?.recentActivity || 0} deals this week\n• Pending Approvals: ${metrics?.pendingApprovals || 0}\n\nWould you like me to analyze broker performance or help with specific broker management tasks?`;
    }
    
    if (lowerMessage.includes('deal') || lowerMessage.includes('deals')) {
      return `Deal Overview:\n\n• Total Deals: ${metrics?.totalDeals || 0}\n• Pending Approvals: ${metrics?.pendingApprovals || 0}\n• Total Value: ${metrics?.totalValue ? `$${metrics.totalValue.toLocaleString()}` : 'N/A'}\n• Recent Activity: ${metrics?.recentActivity || 0} new deals this week\n\nWhat specific deal insights would you like?`;
    }
    
    if (lowerMessage.includes('vessel') || lowerMessage.includes('ships')) {
      return `Vessel Data:\n\n• Active Vessels: ${metrics?.activeVessels || 0}\n• Monitoring Status: Real-time tracking enabled\n\nI can help you analyze vessel movements, cargo tracking, or port arrivals. What would you like to know?`;
    }
    
    if (lowerMessage.includes('port') || lowerMessage.includes('ports')) {
      return `Port Information:\n\n• Total Ports: ${metrics?.activePorts || 0}\n• Status: All systems operational\n\nI can provide port capacity analysis, traffic reports, or help with port management. What do you need?`;
    }
    
    if (lowerMessage.includes('analytics') || lowerMessage.includes('report') || lowerMessage.includes('analysis')) {
      return `Platform Analytics Summary:\n\n📊 **Key Metrics**\n• Brokers: ${metrics?.totalBrokers || 0}\n• Deals: ${metrics?.totalDeals || 0} (${metrics?.pendingApprovals || 0} pending)\n• Vessels: ${metrics?.activeVessels || 0}\n• Ports: ${metrics?.activePorts || 0}\n\n📈 **Recent Trends**\n• This week: ${metrics?.recentActivity || 0} new deals\n• Total value: ${metrics?.totalValue ? `$${metrics.totalValue.toLocaleString()}` : 'N/A'}\n\nWould you like a deeper analysis of any specific area?`;
    }
    
    return `I understand you're asking about: "${message}"\n\nI can help you with:\n• Platform analytics and performance metrics\n• Broker and deal management insights\n• Vessel and port operations data\n• Business intelligence and reporting\n\nCould you be more specific about what information you need?`;
  };

  const quickActions = [
    { 
      label: 'Platform Overview', 
      icon: BarChart3, 
      action: () => setInputMessage('Give me a platform overview with key metrics') 
    },
    { 
      label: 'Broker Analysis', 
      icon: Users, 
      action: () => setInputMessage('Analyze broker performance and pending approvals') 
    },
    { 
      label: 'Deal Trends', 
      icon: TrendingUp, 
      action: () => setInputMessage('Show me deal trends and recent activity') 
    },
    { 
      label: 'System Health', 
      icon: Zap, 
      action: () => setInputMessage('Check system health and operational status') 
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <CardDescription>
            Intelligent platform analysis and business insights powered by AI
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
          <TabsTrigger value="insights">Quick Insights</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                AI Chat Assistant
              </CardTitle>
              <CardDescription>
                Ask questions about your platform data and get intelligent insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={action.action}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-muted/20">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-4'
                            : 'bg-background border mr-4'
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
                      <div className="bg-background border mr-4 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about brokers, deals, vessels, or platform analytics..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Platform Insights
              </CardTitle>
              <CardDescription>
                Real-time analytics and key performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && (
                <div className="space-y-6">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{metrics.totalBrokers}</div>
                        <div className="text-sm text-muted-foreground">Total Brokers</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">{metrics.totalDeals}</div>
                        <div className="text-sm text-muted-foreground">Total Deals</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-500">{metrics.pendingApprovals}</div>
                        <div className="text-sm text-muted-foreground">Pending Approvals</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {metrics.totalValue.toLocaleString('en-US', { 
                            style: 'currency', 
                            currency: 'USD', 
                            notation: 'compact' 
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Value</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Vessels</h3>
                        <div className="text-xl font-bold">{metrics.activeVessels}</div>
                        <div className="text-sm text-muted-foreground">Active vessels tracked</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Ports</h3>
                        <div className="text-xl font-bold">{metrics.activePorts}</div>
                        <div className="text-sm text-muted-foreground">Ports in database</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Recent Activity</h3>
                        <div className="text-xl font-bold">{metrics.recentActivity}</div>
                        <div className="text-sm text-muted-foreground">New deals this week</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Recommendations */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-4">AI Recommendations</h3>
                      <div className="space-y-3">
                        {metrics.pendingApprovals > 5 && (
                          <div className="flex items-start gap-2">
                            <Badge variant="secondary">High Priority</Badge>
                            <div className="text-sm">
                              <strong>Deal Approvals Backlog:</strong> You have {metrics.pendingApprovals} deals pending approval. 
                              Consider reviewing and processing these to maintain broker satisfaction.
                            </div>
                          </div>
                        )}
                        {metrics.recentActivity > 10 && (
                          <div className="flex items-start gap-2">
                            <Badge variant="default">Positive Trend</Badge>
                            <div className="text-sm">
                              <strong>High Activity:</strong> {metrics.recentActivity} new deals this week indicates strong platform growth. 
                              Consider scaling resources to handle increased volume.
                            </div>
                          </div>
                        )}
                        {metrics.recentActivity < 2 && (
                          <div className="flex items-start gap-2">
                            <Badge variant="outline">Low Activity</Badge>
                            <div className="text-sm">
                              <strong>Low Deal Volume:</strong> Only {metrics.recentActivity} new deals this week. 
                              Consider broker outreach or marketing initiatives.
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Configure AI assistant settings and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2">AI Assistant Status</h3>
                <Badge variant="secondary">Local Mode</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  The AI assistant is currently running in local mode with predefined responses. 
                  To enable full AI capabilities, configure the OpenAI integration.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Available Features</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Platform Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Data Insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Quick Actions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">○</Badge>
                    <span className="text-sm">Advanced AI Conversations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">○</Badge>
                    <span className="text-sm">Predictive Analytics</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Setup Instructions</h3>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Configure OpenAI API key in Supabase secrets</li>
                  <li>Deploy the AI assistant edge function</li>
                  <li>Enable advanced AI features in settings</li>
                  <li>Test the AI assistant functionality</li>
                </ol>
              </div>

              <Button variant="outline" className="w-full">
                Configure AI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAssistant;