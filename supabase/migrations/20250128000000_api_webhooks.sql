-- ============================================================================
-- API & Webhooks System Migration
-- ============================================================================
-- This migration creates tables for API key management and webhook configuration
-- to enable external platform integration

-- ============================================================================
-- API KEYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key for security
    key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for display (e.g., "pk_live_")
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb, -- What endpoints this key can access
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- ============================================================================
-- API USAGE LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    request_body JSONB,
    response_body JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

-- ============================================================================
-- WEBHOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255), -- Secret for HMAC signature verification
    events JSONB DEFAULT '[]'::jsonb, -- Array of event types to listen for
    is_active BOOLEAN DEFAULT true,
    timeout_seconds INTEGER DEFAULT 30,
    retry_count INTEGER DEFAULT 3,
    headers JSONB DEFAULT '{}'::jsonb, -- Custom headers to send
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON webhooks(created_by);

-- ============================================================================
-- WEBHOOK DELIVERY LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'success', 'failed', 'retrying'
    status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    attempt_number INTEGER DEFAULT 1,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook delivery tracking
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- API Keys Policies
CREATE POLICY "Admins can view all API keys"
    ON api_keys FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can create API keys"
    ON api_keys FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update API keys"
    ON api_keys FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete API keys"
    ON api_keys FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- API Usage Logs Policies
CREATE POLICY "Admins can view all API usage logs"
    ON api_usage_logs FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "System can insert API usage logs"
    ON api_usage_logs FOR INSERT
    WITH CHECK (true); -- Allow system/service role to insert

-- Webhooks Policies
CREATE POLICY "Admins can view all webhooks"
    ON webhooks FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can create webhooks"
    ON webhooks FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update webhooks"
    ON webhooks FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete webhooks"
    ON webhooks FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Webhook Deliveries Policies
CREATE POLICY "Admins can view all webhook deliveries"
    ON webhook_deliveries FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "System can insert webhook deliveries"
    ON webhook_deliveries FOR INSERT
    WITH CHECK (true); -- Allow system/service role to insert

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key(prefix TEXT DEFAULT 'pk_live_')
RETURNS TEXT AS $$
DECLARE
    random_part TEXT;
    full_key TEXT;
BEGIN
    -- Generate 32 random characters (base64url safe)
    random_part := encode(gen_random_bytes(24), 'base64');
    random_part := replace(replace(random_part, '+', '-'), '/', '_');
    random_part := rtrim(random_part, '=');
    
    full_key := prefix || random_part;
    RETURN full_key;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE api_keys IS 'Stores API keys for external platform integration';
COMMENT ON TABLE api_usage_logs IS 'Logs all API requests for analytics and monitoring';
COMMENT ON TABLE webhooks IS 'Stores webhook configurations for sending events to external platforms';
COMMENT ON TABLE webhook_deliveries IS 'Logs all webhook delivery attempts and results';

