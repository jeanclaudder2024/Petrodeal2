-- Create reward_programs table
CREATE TABLE public.reward_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  program_type TEXT NOT NULL DEFAULT 'internal' CHECK (program_type IN ('internal', 'external', 'both')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  banner_image_url TEXT,
  icon TEXT DEFAULT 'gift',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  external_slug TEXT UNIQUE,
  disclaimer_text TEXT DEFAULT 'We value honest and genuine feedback. Your participation is voluntary.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reward_program_tasks table
CREATE TABLE public.reward_program_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.reward_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('review', 'social_share', 'referral', 'email_invite', 'video_review', 'case_study', 'custom')),
  completion_method TEXT NOT NULL CHECK (completion_method IN ('link_submission', 'screenshot_upload', 'email_validation', 'manual_approval', 'auto_referral')),
  points INTEGER NOT NULL DEFAULT 0,
  task_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  validation_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reward_program_rewards table
CREATE TABLE public.reward_program_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.reward_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  required_points INTEGER NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('percentage_discount', 'free_months', 'feature_unlock', 'vip_access', 'custom')),
  reward_value TEXT,
  auto_apply BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reward_program_participants table
CREATE TABLE public.reward_program_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.reward_programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  company_name TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  source TEXT NOT NULL DEFAULT 'internal' CHECK (source IN ('internal', 'external')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reward_task_submissions table
CREATE TABLE public.reward_task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.reward_program_tasks(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.reward_program_participants(id) ON DELETE CASCADE,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('link', 'screenshot', 'video_link', 'document')),
  proof_url TEXT,
  proof_metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reward_redemptions table
CREATE TABLE public.reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.reward_program_rewards(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.reward_program_participants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'redeemed', 'expired')),
  redemption_code TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reward_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_program_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_program_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_program_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reward_programs
CREATE POLICY "Active programs are publicly readable" ON public.reward_programs
  FOR SELECT USING (status = 'active' OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage programs" ON public.reward_programs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for reward_program_tasks
CREATE POLICY "Enabled tasks are publicly readable" ON public.reward_program_tasks
  FOR SELECT USING (is_enabled = true OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage tasks" ON public.reward_program_tasks
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for reward_program_rewards
CREATE POLICY "Active rewards are publicly readable" ON public.reward_program_rewards
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage rewards" ON public.reward_program_rewards
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for reward_program_participants
CREATE POLICY "Users can view own participation" ON public.reward_program_participants
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can join programs" ON public.reward_program_participants
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can manage participants" ON public.reward_program_participants
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for reward_task_submissions
CREATE POLICY "Users can view own submissions" ON public.reward_task_submissions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.reward_program_participants 
    WHERE id = participant_id AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ))
  ));

CREATE POLICY "Users can submit proofs" ON public.reward_task_submissions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.reward_program_participants 
    WHERE id = participant_id AND (user_id = auth.uid() OR user_id IS NULL)
  ));

CREATE POLICY "Admins can manage submissions" ON public.reward_task_submissions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for reward_redemptions
CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.reward_program_participants 
    WHERE id = participant_id AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ))
  ));

CREATE POLICY "Users can redeem rewards" ON public.reward_redemptions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.reward_program_participants 
    WHERE id = participant_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage redemptions" ON public.reward_redemptions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create indexes for performance
CREATE INDEX idx_reward_tasks_program ON public.reward_program_tasks(program_id);
CREATE INDEX idx_reward_rewards_program ON public.reward_program_rewards(program_id);
CREATE INDEX idx_reward_participants_program ON public.reward_program_participants(program_id);
CREATE INDEX idx_reward_participants_user ON public.reward_program_participants(user_id);
CREATE INDEX idx_reward_submissions_task ON public.reward_task_submissions(task_id);
CREATE INDEX idx_reward_submissions_participant ON public.reward_task_submissions(participant_id);
CREATE INDEX idx_reward_submissions_status ON public.reward_task_submissions(status);
CREATE INDEX idx_reward_programs_slug ON public.reward_programs(external_slug);

-- Create storage bucket for reward proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('reward-proofs', 'reward-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for reward proofs
CREATE POLICY "Users can upload proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reward-proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'reward-proofs' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  ));

CREATE POLICY "Admins can manage all proofs" ON storage.objects
  FOR ALL USING (bucket_id = 'reward-proofs' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));