import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Workflow, Wrench, FileText, ExternalLink, Code, MessageSquare, Zap } from 'lucide-react';

// Import tab components
import AssistantsManager from './ai-control-center/AssistantsManager';
import WorkflowsTab from './ai-control-center/WorkflowsTab';
import ToolsTab from './ai-control-center/ToolsTab';
import ExecutionLogsTab from './ai-control-center/ExecutionLogsTab';
import ExternalOpenAITab from './ai-control-center/ExternalOpenAITab';
import SDKAgentsTab from './ai-control-center/SDKAgentsTab';
import PromptGenerator from './ai-control-center/PromptGenerator';
import EventRegistryTab from './ai-control-center/EventRegistryTab';
import ChatbotConfigTab from './ai-control-center/ChatbotConfigTab';

const AIAgentControlCenter = () => {
  const [activeTab, setActiveTab] = useState('assistants');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Agent Control Center
          </CardTitle>
          <CardDescription>
            Manage AI Assistants, Agents, Workflows, Chatbots and Automation. Control all AI-powered features from one centralized dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="assistants" className="flex items-center gap-1">
                <Bot className="h-4 w-4" />
                <span className="hidden lg:inline">Assistants</span>
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center gap-1">
                <Workflow className="h-4 w-4" />
                <span className="hidden lg:inline">Workflows</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-1">
                <Wrench className="h-4 w-4" />
                <span className="hidden lg:inline">Tools</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span className="hidden lg:inline">Events</span>
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden lg:inline">Chatbot</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">Logs</span>
              </TabsTrigger>
              <TabsTrigger value="external" className="flex items-center gap-1">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden lg:inline">External</span>
              </TabsTrigger>
              <TabsTrigger value="sdk" className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                <span className="hidden lg:inline">SDK</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assistants">
              <AssistantsManager />
            </TabsContent>

            <TabsContent value="workflows">
              <WorkflowsTab />
            </TabsContent>

            <TabsContent value="tools">
              <ToolsTab />
            </TabsContent>

            <TabsContent value="events">
              <EventRegistryTab />
            </TabsContent>

            <TabsContent value="chatbot">
              <ChatbotConfigTab />
            </TabsContent>

            <TabsContent value="logs">
              <ExecutionLogsTab />
            </TabsContent>

            <TabsContent value="external">
              <ExternalOpenAITab />
            </TabsContent>

            <TabsContent value="sdk">
              <SDKAgentsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Prompt Generator */}
      <PromptGenerator />
    </div>
  );
};

export default AIAgentControlCenter;