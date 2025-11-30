-- Email System Migration
-- Creates tables for SMTP/IMAP configuration, email templates, and auto-reply system

-- Email Configurations (SMTP and IMAP)
CREATE TABLE IF NOT EXISTS email_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('smtp', 'imap')),
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  enable_tls BOOLEAN DEFAULT true,
  from_email TEXT,
  from_name TEXT,
  check_interval INTEGER DEFAULT 5, -- For IMAP: minutes between checks
  enable_auto_reply BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(type)
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Logs (track sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  template_id UUID REFERENCES email_templates(id),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incoming Emails (from IMAP)
CREATE TABLE IF NOT EXISTS incoming_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  auto_replied BOOLEAN DEFAULT false,
  reply_body TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-Reply Rules
CREATE TABLE IF NOT EXISTS auto_reply_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  keywords TEXT[] DEFAULT '{}',
  ai_enabled BOOLEAN DEFAULT false,
  template_id UUID REFERENCES email_templates(id),
  custom_response TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_configurations_type ON email_configurations(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(active);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_incoming_emails_received_at ON incoming_emails(received_at);
CREATE INDEX IF NOT EXISTS idx_incoming_emails_processed ON incoming_emails(processed);
CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_enabled ON auto_reply_rules(enabled);

-- Enable Row Level Security (RLS)
ALTER TABLE email_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incoming_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reply_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow admins to manage everything)
CREATE POLICY "Admins can manage email configurations"
  ON email_configurations FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage incoming emails"
  ON incoming_emails FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert incoming emails"
  ON incoming_emails FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage auto-reply rules"
  ON auto_reply_rules FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_email_configurations_updated_at
  BEFORE UPDATE ON email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_reply_rules_updated_at
  BEFORE UPDATE ON auto_reply_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

