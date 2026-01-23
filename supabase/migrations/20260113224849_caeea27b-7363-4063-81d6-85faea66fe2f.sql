
-- =====================================================
-- GROWTH TALENT ASSESSMENT SYSTEM - DATABASE SCHEMA
-- =====================================================

-- 1. Talent Programs (main configuration)
CREATE TABLE public.talent_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Talent Candidates
CREATE TABLE public.talent_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.talent_programs(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_url TEXT,
  country TEXT,
  city TEXT,
  professional_background TEXT,
  area_of_interest TEXT,
  preferred_language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'rejected', 'shortlisted', 'invited', 'in_progress', 'completed', 'passed', 'failed')),
  admin_notes TEXT,
  invited_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  final_score NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Secure Assessment Links
CREATE TABLE public.talent_assessment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.talent_candidates(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  max_sessions INTEGER DEFAULT 1,
  current_sessions INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Assessment Stages
CREATE TABLE public.talent_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.talent_programs(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  passing_threshold NUMERIC(5,2) DEFAULT 60,
  weight_percentage NUMERIC(5,2) DEFAULT 25,
  time_limit_minutes INTEGER,
  is_enabled BOOLEAN DEFAULT true,
  stage_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Questions per Stage
CREATE TABLE public.talent_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.talent_stages(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'scenario', 'ranking', 'outreach_draft', 'objection_handling')),
  points INTEGER DEFAULT 10,
  question_order INTEGER NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Question Translations
CREATE TABLE public.talent_question_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.talent_questions(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL DEFAULT 'en',
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id, language_code)
);

-- 7. Simulation Profiles (for Stage 4)
CREATE TABLE public.talent_simulation_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.talent_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  seniority TEXT CHECK (seniority IN ('junior', 'mid', 'senior', 'executive', 'c-level')),
  company_type TEXT,
  industry TEXT DEFAULT 'Oil & Energy',
  profile_image_url TEXT,
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Simulation Profile Translations
CREATE TABLE public.talent_simulation_profile_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.talent_simulation_profiles(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL DEFAULT 'en',
  bio TEXT,
  challenge_description TEXT,
  objection_scenario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, language_code)
);

-- 9. Candidate Responses
CREATE TABLE public.talent_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.talent_candidates(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.talent_questions(id) ON DELETE CASCADE,
  response_text TEXT,
  selected_option TEXT,
  ranking_data JSONB,
  score NUMERIC(5,2),
  ai_score NUMERIC(5,2),
  ai_feedback TEXT,
  admin_override_score NUMERIC(5,2),
  admin_feedback TEXT,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, question_id)
);

-- 10. Stage Progress Tracking
CREATE TABLE public.talent_stage_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.talent_candidates(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.talent_stages(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'passed', 'failed')),
  score NUMERIC(5,2),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, stage_id)
);

-- 11. General Content Translations
CREATE TABLE public.talent_content_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en',
  content_text TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_key, language_code)
);

-- 12. Email Templates for Talent System
CREATE TABLE public.talent_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en',
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  placeholders JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_name, language_code)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_talent_candidates_status ON public.talent_candidates(status);
CREATE INDEX idx_talent_candidates_email ON public.talent_candidates(email);
CREATE INDEX idx_talent_candidates_program ON public.talent_candidates(program_id);
CREATE INDEX idx_talent_assessment_links_token ON public.talent_assessment_links(token);
CREATE INDEX idx_talent_assessment_links_candidate ON public.talent_assessment_links(candidate_id);
CREATE INDEX idx_talent_questions_stage ON public.talent_questions(stage_id);
CREATE INDEX idx_talent_responses_candidate ON public.talent_responses(candidate_id);
CREATE INDEX idx_talent_stage_progress_candidate ON public.talent_stage_progress(candidate_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.talent_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_assessment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_question_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_simulation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_simulation_profile_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_content_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_email_templates ENABLE ROW LEVEL SECURITY;

-- Admin policies (admins can do everything)
CREATE POLICY "Admins can manage talent programs" ON public.talent_programs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage talent candidates" ON public.talent_candidates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage assessment links" ON public.talent_assessment_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage talent stages" ON public.talent_stages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage talent questions" ON public.talent_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage question translations" ON public.talent_question_translations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage simulation profiles" ON public.talent_simulation_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage profile translations" ON public.talent_simulation_profile_translations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage talent responses" ON public.talent_responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage stage progress" ON public.talent_stage_progress
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage content translations" ON public.talent_content_translations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage email templates" ON public.talent_email_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Public read access for active programs (landing page)
CREATE POLICY "Anyone can view active programs" ON public.talent_programs
  FOR SELECT USING (is_active = true);

-- Public can insert candidates (application form)
CREATE POLICY "Anyone can apply as candidate" ON public.talent_candidates
  FOR INSERT WITH CHECK (true);

-- Public read for active stages (for assessment display)
CREATE POLICY "Anyone can view enabled stages" ON public.talent_stages
  FOR SELECT USING (is_enabled = true);

-- Public read for enabled questions
CREATE POLICY "Anyone can view enabled questions" ON public.talent_questions
  FOR SELECT USING (is_enabled = true);

-- Public read for question translations
CREATE POLICY "Anyone can view question translations" ON public.talent_question_translations
  FOR SELECT USING (true);

-- Public read for enabled simulation profiles
CREATE POLICY "Anyone can view enabled profiles" ON public.talent_simulation_profiles
  FOR SELECT USING (is_enabled = true);

-- Public read for profile translations
CREATE POLICY "Anyone can view profile translations" ON public.talent_simulation_profile_translations
  FOR SELECT USING (true);

-- Public read for content translations
CREATE POLICY "Anyone can view content translations" ON public.talent_content_translations
  FOR SELECT USING (true);

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_talent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_talent_programs_updated_at
  BEFORE UPDATE ON public.talent_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_talent_updated_at();

CREATE TRIGGER update_talent_candidates_updated_at
  BEFORE UPDATE ON public.talent_candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_talent_updated_at();

CREATE TRIGGER update_talent_stages_updated_at
  BEFORE UPDATE ON public.talent_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_talent_updated_at();

CREATE TRIGGER update_talent_questions_updated_at
  BEFORE UPDATE ON public.talent_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_talent_updated_at();

CREATE TRIGGER update_talent_stage_progress_updated_at
  BEFORE UPDATE ON public.talent_stage_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_talent_updated_at();

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Create default program
INSERT INTO public.talent_programs (name, description, is_active, settings)
VALUES (
  'Remote Growth Talent Assessment',
  'Professional assessment and market simulation program for growth, marketing, and business development roles.',
  true,
  '{"supported_languages": ["en", "ar", "es", "fr", "zh", "nl", "et"], "link_expiry_hours": 72}'
);

-- Create default stages with correct weights
INSERT INTO public.talent_stages (program_id, stage_number, name, description, passing_threshold, weight_percentage, time_limit_minutes, is_enabled, stage_order)
SELECT 
  id,
  1,
  'Market Awareness Assessment',
  'Initial knowledge and seriousness filtering through multiple choice and true/false questions.',
  60,
  25,
  30,
  true,
  1
FROM public.talent_programs WHERE name = 'Remote Growth Talent Assessment';

INSERT INTO public.talent_stages (program_id, stage_number, name, description, passing_threshold, weight_percentage, time_limit_minutes, is_enabled, stage_order)
SELECT 
  id,
  2,
  'Platform Understanding Assessment',
  'Understanding the platform value and use case through scenario-based questions.',
  65,
  25,
  45,
  true,
  2
FROM public.talent_programs WHERE name = 'Remote Growth Talent Assessment';

INSERT INTO public.talent_stages (program_id, stage_number, name, description, passing_threshold, weight_percentage, time_limit_minutes, is_enabled, stage_order)
SELECT 
  id,
  3,
  'Marketing Intelligence Assessment',
  'Analytical and strategic thinking through scenario analysis and written responses.',
  70,
  30,
  60,
  true,
  3
FROM public.talent_programs WHERE name = 'Remote Growth Talent Assessment';

INSERT INTO public.talent_stages (program_id, stage_number, name, description, passing_threshold, weight_percentage, time_limit_minutes, is_enabled, stage_order)
SELECT 
  id,
  4,
  'Strategic Growth Simulation',
  'Evaluate strategic prioritization, outreach communication, and objection handling using fictional profiles.',
  65,
  20,
  90,
  true,
  4
FROM public.talent_programs WHERE name = 'Remote Growth Talent Assessment';

-- Insert default invitation email template
INSERT INTO public.talent_email_templates (template_name, language_code, subject, body_html, body_text, placeholders)
VALUES 
(
  'assessment_invitation',
  'en',
  'Invitation to Remote Growth Assessment',
  '<p>Hello {{full_name}},</p><p>Thank you for submitting your profile.</p><p>After reviewing your background, we would like to invite you to participate in a professional assessment and market simulation program.</p><p><strong>Please note:</strong></p><ul><li>This assessment is for evaluation purposes only</li><li>It does not guarantee employment</li><li>It helps us understand strategic thinking and communication approach</li></ul><p>Access your secure assessment link below:</p><p><a href="{{assessment_link}}">Start Assessment</a></p><p>This link will expire in {{expiry_hours}} hours.</p><p>Best regards,<br>{{company_name}}</p>',
  'Hello {{full_name}},\n\nThank you for submitting your profile.\n\nAfter reviewing your background, we would like to invite you to participate in a professional assessment and market simulation program.\n\nPlease note:\n- This assessment is for evaluation purposes only\n- It does not guarantee employment\n- It helps us understand strategic thinking and communication approach\n\nAccess your secure assessment link: {{assessment_link}}\n\nThis link will expire in {{expiry_hours}} hours.\n\nBest regards,\n{{company_name}}',
  '["full_name", "assessment_link", "expiry_hours", "company_name"]'
),
(
  'assessment_invitation',
  'ar',
  'دعوة للمشاركة في تقييم النمو عن بعد',
  '<p>مرحباً {{full_name}}،</p><p>شكراً لتقديم ملفك الشخصي.</p><p>بعد مراجعة خلفيتك المهنية، نود دعوتك للمشاركة في برنامج تقييم مهني ومحاكاة سوقية.</p><p><strong>يرجى ملاحظة:</strong></p><ul><li>هذا التقييم لأغراض التقييم فقط</li><li>لا يضمن التوظيف</li><li>يساعدنا في فهم التفكير الاستراتيجي ونهج التواصل</li></ul><p>قم بالوصول إلى رابط التقييم الآمن أدناه:</p><p><a href="{{assessment_link}}">بدء التقييم</a></p><p>سينتهي صلاحية هذا الرابط خلال {{expiry_hours}} ساعة.</p><p>مع أطيب التحيات،<br>{{company_name}}</p>',
  'مرحباً {{full_name}}،\n\nشكراً لتقديم ملفك الشخصي.\n\nبعد مراجعة خلفيتك المهنية، نود دعوتك للمشاركة في برنامج تقييم مهني ومحاكاة سوقية.\n\nيرجى ملاحظة:\n- هذا التقييم لأغراض التقييم فقط\n- لا يضمن التوظيف\n- يساعدنا في فهم التفكير الاستراتيجي ونهج التواصل\n\nرابط التقييم: {{assessment_link}}\n\nسينتهي صلاحية هذا الرابط خلال {{expiry_hours}} ساعة.\n\nمع أطيب التحيات،\n{{company_name}}',
  '["full_name", "assessment_link", "expiry_hours", "company_name"]'
);

-- Insert 5 default simulation profiles
INSERT INTO public.talent_simulation_profiles (program_id, name, role, seniority, company_type, industry, display_order)
SELECT 
  tp.id,
  profiles.name,
  profiles.role,
  profiles.seniority,
  profiles.company_type,
  'Oil & Energy',
  profiles.display_order
FROM public.talent_programs tp
CROSS JOIN (VALUES 
  ('Ahmed Al-Rashid', 'Trading Operations Manager', 'senior', 'National Oil Company', 1),
  ('Sarah Chen', 'VP of Business Development', 'executive', 'International Trading Firm', 2),
  ('Marcus Weber', 'Junior Market Analyst', 'junior', 'Independent Refinery', 3),
  ('Elena Petrova', 'Head of Procurement', 'senior', 'Large Energy Conglomerate', 4),
  ('James Morrison', 'CEO', 'c-level', 'Startup Energy Platform', 5)
) AS profiles(name, role, seniority, company_type, display_order)
WHERE tp.name = 'Remote Growth Talent Assessment';

-- Insert profile translations
INSERT INTO public.talent_simulation_profile_translations (profile_id, language_code, bio, challenge_description, objection_scenario)
SELECT 
  sp.id,
  'en',
  CASE sp.name
    WHEN 'Ahmed Al-Rashid' THEN '15 years in oil trading across Middle East markets. Manages a team of 20 traders. Conservative approach to new technologies but values efficiency.'
    WHEN 'Sarah Chen' THEN '12 years in international commodity trading. Led expansion into Asian markets. Open to innovation but needs strong ROI justification.'
    WHEN 'Marcus Weber' THEN '2 years experience in market analysis. Eager to learn and prove value. Limited decision-making authority but influences team recommendations.'
    WHEN 'Elena Petrova' THEN '18 years in energy procurement. Manages $500M annual purchasing budget. Risk-averse, requires extensive due diligence.'
    WHEN 'James Morrison' THEN '8 years as founder/CEO. Looking for growth partnerships. Quick decision maker but demands clear value proposition.'
  END,
  CASE sp.name
    WHEN 'Ahmed Al-Rashid' THEN 'Needs to modernize operations but faces resistance from traditional stakeholders. Looking for tools that don''t disrupt existing workflows.'
    WHEN 'Sarah Chen' THEN 'Expanding into new regions with limited local contacts. Needs reliable market intelligence and partnership opportunities.'
    WHEN 'Marcus Weber' THEN 'Wants to stand out in team by bringing innovative solutions. Needs easy-to-understand, actionable insights.'
    WHEN 'Elena Petrova' THEN 'Under pressure to reduce costs while maintaining quality suppliers. Needs verified, compliant vendor network.'
    WHEN 'James Morrison' THEN 'Scaling fast but limited resources. Needs solutions that provide immediate, measurable impact.'
  END,
  CASE sp.name
    WHEN 'Ahmed Al-Rashid' THEN '"We already have established relationships with our partners. Why would we change what works?"'
    WHEN 'Sarah Chen' THEN '"I''ve seen many platforms promise global reach but fail to deliver quality connections. What makes you different?"'
    WHEN 'Marcus Weber' THEN '"This sounds interesting but I''d need to get approval from my manager. Can you give me something to show them?"'
    WHEN 'Elena Petrova' THEN '"Our compliance requirements are very strict. How do you verify the companies on your platform?"'
    WHEN 'James Morrison' THEN '"We''re a startup with limited budget. I need to see ROI within 30 days or we can''t commit."'
  END
FROM public.talent_simulation_profiles sp;

-- Insert legal disclaimer content
INSERT INTO public.talent_content_translations (content_key, language_code, content_text, content_type)
VALUES 
('assessment_disclaimer', 'en', 'This program is a professional assessment and market simulation. Participation does not guarantee employment. No individual is required to register, convert, or take any action. Evaluation is based on strategy, communication, and ethical conduct.', 'disclaimer'),
('assessment_disclaimer', 'ar', 'هذا البرنامج هو تقييم مهني ومحاكاة سوقية. المشاركة لا تضمن التوظيف. لا يُطلب من أي فرد التسجيل أو التحويل أو اتخاذ أي إجراء. يعتمد التقييم على الاستراتيجية والتواصل والسلوك الأخلاقي.', 'disclaimer');
