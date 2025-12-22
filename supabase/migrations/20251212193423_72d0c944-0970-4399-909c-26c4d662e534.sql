-- AI Assistants (OpenAI Platform)
CREATE TABLE public.ai_assistants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  openai_assistant_id TEXT,
  instructions TEXT,
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  tools JSONB DEFAULT '[]'::jsonb,
  file_search BOOLEAN DEFAULT false,
  code_interpreter BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Agents (Local SDK Agents)
CREATE TABLE public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  tools JSONB DEFAULT '[]'::jsonb,
  workflows JSONB DEFAULT '[]'::jsonb,
  behaviors JSONB DEFAULT '{}'::jsonb,
  triggers JSONB DEFAULT '[]'::jsonb,
  compiled_json JSONB,
  openai_workflow_id TEXT,
  linked_assistant_id UUID REFERENCES public.ai_assistants(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  auto_workflows_generated BOOLEAN DEFAULT false,
  workflow_versions JSONB DEFAULT '[]'::jsonb,
  execution_context JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent Tools (Discovered & Custom)
CREATE TABLE public.agent_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  function_name TEXT NOT NULL,
  description TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent Workflows (Visual)
CREATE TABLE public.agent_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT,
  steps JSONB DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  schedule JSONB,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent Executions (History)
CREATE TABLE public.agent_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.agent_workflows(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  trigger_event TEXT,
  trigger_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  steps_completed JSONB DEFAULT '[]'::jsonb,
  current_step INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER,
  openai_thread_id TEXT,
  openai_run_id TEXT
);

-- Assistant Conversations (Chat History)
CREATE TABLE public.assistant_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id UUID REFERENCES public.ai_assistants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  openai_thread_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- External OpenAI Workflows (Agent Builder Configs)
CREATE TABLE public.external_openai_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  openai_workflow_id TEXT NOT NULL,
  callback_url TEXT,
  configuration JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_openai_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_assistants
CREATE POLICY "Admins can manage all assistants" ON public.ai_assistants
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active assistants" ON public.ai_assistants
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- RLS Policies for ai_agents
CREATE POLICY "Admins can manage all agents" ON public.ai_agents
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active agents" ON public.ai_agents
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- RLS Policies for agent_tools
CREATE POLICY "Admins can manage all tools" ON public.agent_tools
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active tools" ON public.agent_tools
  FOR SELECT USING (is_active = true);

-- RLS Policies for agent_workflows
CREATE POLICY "Admins can manage all workflows" ON public.agent_workflows
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active workflows" ON public.agent_workflows
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- RLS Policies for agent_executions
CREATE POLICY "Admins can view all executions" ON public.agent_executions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert executions" ON public.agent_executions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update executions" ON public.agent_executions
  FOR UPDATE USING (true);

-- RLS Policies for assistant_conversations
CREATE POLICY "Users can view their own conversations" ON public.assistant_conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations" ON public.assistant_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations" ON public.assistant_conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all conversations" ON public.assistant_conversations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for external_openai_workflows
CREATE POLICY "Admins can manage external workflows" ON public.external_openai_workflows
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_ai_assistants_updated_at BEFORE UPDATE ON public.ai_assistants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_workflows_updated_at BEFORE UPDATE ON public.agent_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistant_conversations_updated_at BEFORE UPDATE ON public.assistant_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_external_openai_workflows_updated_at BEFORE UPDATE ON public.external_openai_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();