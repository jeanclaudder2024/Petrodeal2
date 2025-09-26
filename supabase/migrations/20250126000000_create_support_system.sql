-- Create support system tables

-- Create support_categories table
CREATE TABLE IF NOT EXISTS public.support_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    description_en TEXT,
    description_ar TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES public.support_categories(id),
    user_id UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    service_domain TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default support categories
INSERT INTO public.support_categories (name_en, name_ar, description_en, description_ar, sort_order, is_active) VALUES
('Technical Support', 'الدعم الفني', 'Technical issues and troubleshooting', 'المشاكل التقنية واستكشاف الأخطاء وإصلاحها', 1, true),
('Account & Billing', 'الحساب والفوترة', 'Account management and billing inquiries', 'إدارة الحساب واستفسارات الفوترة', 2, true),
('Feature Request', 'طلب ميزة', 'Suggestions for new features', 'اقتراحات للميزات الجديدة', 3, true),
('General Inquiry', 'استفسار عام', 'General questions and information', 'أسئلة عامة ومعلومات', 4, true),
('Bug Report', 'تقرير خطأ', 'Report bugs and issues', 'الإبلاغ عن الأخطاء والمشاكل', 5, true);

-- Enable RLS
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for support_categories
CREATE POLICY "Anyone can view active categories" ON public.support_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.support_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category_id ON public.support_tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);