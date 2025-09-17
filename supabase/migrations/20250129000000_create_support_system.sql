-- Create support system tables
-- This migration creates the complete support ticket system

-- Create support categories table
CREATE TABLE IF NOT EXISTS support_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES support_categories(id),
    user_id UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr')),
    service_domain TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support ticket messages table
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category_id ON support_tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON support_ticket_messages(created_at);

-- Insert default categories
INSERT INTO support_categories (name_en, name_ar, description_en, description_ar, sort_order)
SELECT 'Technical Support', 'الدعم التقني', 'Technical issues and bugs', 'المشاكل التقنية والأخطاء', 1
WHERE NOT EXISTS (SELECT 1 FROM support_categories WHERE name_en = 'Technical Support')
UNION ALL
SELECT 'Account Issues', 'مشاكل الحساب', 'Account-related problems', 'المشاكل المتعلقة بالحساب', 2
WHERE NOT EXISTS (SELECT 1 FROM support_categories WHERE name_en = 'Account Issues')
UNION ALL
SELECT 'Feature Request', 'طلب ميزة', 'Suggestions for new features', 'اقتراحات للميزات الجديدة', 3
WHERE NOT EXISTS (SELECT 1 FROM support_categories WHERE name_en = 'Feature Request')
UNION ALL
SELECT 'General Inquiry', 'استفسار عام', 'General questions and inquiries', 'الأسئلة والاستفسارات العامة', 4
WHERE NOT EXISTS (SELECT 1 FROM support_categories WHERE name_en = 'General Inquiry');

-- Create RLS policies for support_categories
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow read access to active categories" ON support_categories;
CREATE POLICY "Allow read access to active categories" ON support_categories
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow admin full access to categories" ON support_categories;
CREATE POLICY "Allow admin full access to categories" ON support_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can read own tickets" ON support_tickets;
CREATE POLICY "Users can read own tickets" ON support_tickets
    FOR SELECT USING (
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read all tickets" ON support_tickets;
CREATE POLICY "Admins can read all tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        ) OR 
        (auth.jwt() ->> 'role')::text = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    );

DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;
CREATE POLICY "Admins can update tickets" ON support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        ) OR 
        (auth.jwt() ->> 'role')::text = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    );

-- Create RLS policies for support_ticket_messages
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can read messages for own tickets" ON support_ticket_messages;
CREATE POLICY "Users can read messages for own tickets" ON support_ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE id = ticket_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create messages for own tickets" ON support_ticket_messages;
CREATE POLICY "Users can create messages for own tickets" ON support_ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE id = ticket_id 
            AND user_id = auth.uid()
        ) OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can read all messages" ON support_ticket_messages;
CREATE POLICY "Admins can read all messages" ON support_ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        ) OR 
        (auth.jwt() ->> 'role')::text = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    );

DROP POLICY IF EXISTS "Admins can create messages" ON support_ticket_messages;
CREATE POLICY "Admins can create messages" ON support_ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        ) OR 
        (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin') OR
        (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'super_admin')
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_support_categories_updated_at ON support_categories;
CREATE TRIGGER update_support_categories_updated_at 
    BEFORE UPDATE ON support_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_ticket_messages_updated_at ON support_ticket_messages;
CREATE TRIGGER update_support_ticket_messages_updated_at 
    BEFORE UPDATE ON support_ticket_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();