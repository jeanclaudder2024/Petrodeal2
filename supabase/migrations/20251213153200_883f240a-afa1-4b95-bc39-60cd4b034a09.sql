-- Phase 4: Unified Event Registry
CREATE TABLE IF NOT EXISTS public.event_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  payload_schema JSONB DEFAULT '{}',
  sample_payload JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_registry ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all events" ON public.event_registry
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active events" ON public.event_registry
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Insert default platform events
INSERT INTO public.event_registry (event_name, description, category, sample_payload) VALUES
  ('vessel_arrived', 'Triggered when a vessel arrives at port', 'vessel', '{"vessel_id": 123, "imo": "1234567", "port_id": "uuid", "arrived_at": "2024-01-01T00:00:00Z"}'),
  ('vessel_departed', 'Triggered when a vessel departs from port', 'vessel', '{"vessel_id": 123, "imo": "1234567", "port_id": "uuid", "departed_at": "2024-01-01T00:00:00Z"}'),
  ('vessel_eta_updated', 'Triggered when vessel ETA changes', 'vessel', '{"vessel_id": 123, "imo": "1234567", "old_eta": "2024-01-01", "new_eta": "2024-01-02"}'),
  ('vessel_status_changed', 'Triggered when vessel status changes', 'vessel', '{"vessel_id": 123, "old_status": "underway", "new_status": "moored"}'),
  ('order_created', 'Triggered when a new order is created', 'order', '{"order_id": "uuid", "cargo_type": "crude", "quantity": 50000}'),
  ('order_updated', 'Triggered when an order is updated', 'order', '{"order_id": "uuid", "changes": {}}'),
  ('order_completed', 'Triggered when an order is completed', 'order', '{"order_id": "uuid", "completed_at": "2024-01-01T00:00:00Z"}'),
  ('support_ticket_created', 'Triggered when a support ticket is created', 'support', '{"ticket_id": "uuid", "subject": "Help needed", "priority": "high"}'),
  ('support_ticket_updated', 'Triggered when a support ticket is updated', 'support', '{"ticket_id": "uuid", "status": "in_progress"}'),
  ('email_received', 'Triggered when an email is received', 'email', '{"from": "user@example.com", "subject": "Inquiry", "body": "..."}'),
  ('subscription_started', 'Triggered when a subscription starts', 'subscription', '{"user_id": "uuid", "plan": "professional", "amount": 99}'),
  ('subscription_cancelled', 'Triggered when a subscription is cancelled', 'subscription', '{"user_id": "uuid", "reason": "user_request"}'),
  ('payment_successful', 'Triggered when payment succeeds', 'billing', '{"user_id": "uuid", "amount": 99, "invoice_id": "inv_123"}'),
  ('payment_failed', 'Triggered when payment fails', 'billing', '{"user_id": "uuid", "error": "card_declined"}'),
  ('broker_approved', 'Triggered when a broker is approved', 'broker', '{"broker_id": "uuid", "approved_by": "uuid"}'),
  ('deal_created', 'Triggered when a deal is created', 'deal', '{"deal_id": "uuid", "broker_id": "uuid", "total_value": 1000000}'),
  ('deal_completed', 'Triggered when a deal is completed', 'deal', '{"deal_id": "uuid", "completed_at": "2024-01-01T00:00:00Z"}'),
  ('manual', 'Manual trigger for testing', 'system', '{"triggered_by": "uuid", "test_data": {}}')
ON CONFLICT (event_name) DO NOTHING;

-- Phase 5: Chatbot Configuration
CREATE TABLE IF NOT EXISTS public.chatbot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  linked_assistant_id UUID REFERENCES public.ai_assistants(id) ON DELETE SET NULL,
  welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
  rules JSONB DEFAULT '{}',
  allowed_topics TEXT[] DEFAULT '{}',
  blocked_topics TEXT[] DEFAULT '{}',
  escalation_triggers JSONB DEFAULT '[]',
  platform_data_access BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chatbot Conversations
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_config_id UUID REFERENCES public.chatbot_configs(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  subscription_tier TEXT,
  messages JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  escalated BOOLEAN DEFAULT false,
  escalated_to_ticket_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Chatbot configs policies
CREATE POLICY "Admins can manage chatbot configs" ON public.chatbot_configs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active default chatbot" ON public.chatbot_configs
  FOR SELECT USING (is_active = true AND is_default = true);

-- Chatbot conversations policies
CREATE POLICY "Users can view their own conversations" ON public.chatbot_conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations" ON public.chatbot_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations" ON public.chatbot_conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all conversations" ON public.chatbot_conversations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Phase 7: Edge Function Visibility - Add columns to agent_tools
ALTER TABLE public.agent_tools ADD COLUMN IF NOT EXISTS edge_function_url TEXT;
ALTER TABLE public.agent_tools ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ;
ALTER TABLE public.agent_tools ADD COLUMN IF NOT EXISTS last_execution_status TEXT;
ALTER TABLE public.agent_tools ADD COLUMN IF NOT EXISTS avg_execution_time_ms INTEGER;
ALTER TABLE public.agent_tools ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;

-- Add execution trace to agent_executions
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS execution_trace JSONB DEFAULT '[]';
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'workflow';

-- Update trigger for chatbot_configs
CREATE TRIGGER update_chatbot_configs_updated_at
  BEFORE UPDATE ON public.chatbot_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for chatbot_conversations
CREATE TRIGGER update_chatbot_conversations_updated_at
  BEFORE UPDATE ON public.chatbot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for event_registry
CREATE TRIGGER update_event_registry_updated_at
  BEFORE UPDATE ON public.event_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();