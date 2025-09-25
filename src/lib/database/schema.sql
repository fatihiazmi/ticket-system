-- =====================================================
-- Issue Tracking Application Database Schema
-- Target: Supabase (PostgreSQL 15+)
-- Date: 2025-09-25
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER PROFILES (extends Supabase auth.users)
-- =====================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('developer', 'qa', 'product_manager')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- ISSUES
-- =====================================================

CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (LENGTH(title) <= 200),
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'dev_review', 'qa_review', 'pm_review', 'resolved', 'rejected')),
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(8,2) CHECK (estimated_hours > 0),
  actual_hours DECIMAL(8,2) CHECK (actual_hours > 0)
);

-- =====================================================
-- WORKFLOW STEPS
-- =====================================================

CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL CHECK (step_type IN ('dev_review', 'qa_review', 'pm_review')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  approver_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- COMMENTS
-- =====================================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  edited BOOLEAN NOT NULL DEFAULT false
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  related_issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'status_change', 'approval_required', 'comment_added', 'mention')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

-- Issues indexes
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_type ON issues(type);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_created_by ON issues(created_by);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_issues_updated_at ON issues(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_issues_status_priority ON issues(status, priority);
CREATE INDEX idx_issues_assigned_status ON issues(assigned_to, status);

-- Workflow steps indexes
CREATE INDEX idx_workflow_steps_issue_id ON workflow_steps(issue_id);
CREATE INDEX idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX idx_workflow_steps_type ON workflow_steps(step_type);
CREATE INDEX idx_workflow_steps_approver ON workflow_steps(approver_id);

-- Comments indexes
CREATE INDEX idx_comments_issue_id ON comments(issue_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_workflow_step_id ON comments(workflow_step_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_issue_id ON notifications(related_issue_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS Policies
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Issues RLS Policies
CREATE POLICY "Users can view all issues" ON issues
  FOR SELECT USING (true);

CREATE POLICY "Users can create issues" ON issues
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update issues they created or are assigned to" ON issues
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('qa', 'product_manager')
    )
  );

-- Workflow Steps RLS Policies
CREATE POLICY "Users can view workflow steps for visible issues" ON workflow_steps
  FOR SELECT USING (true);

CREATE POLICY "Users can create workflow steps" ON workflow_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM issues 
      WHERE id = issue_id AND (created_by = auth.uid() OR assigned_to = auth.uid())
    )
  );

CREATE POLICY "Approvers can update workflow steps" ON workflow_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND 
      ((step_type = 'dev_review' AND role = 'developer') OR
       (step_type = 'qa_review' AND role = 'qa') OR
       (step_type = 'pm_review' AND role = 'product_manager'))
    )
  );

-- Comments RLS Policies
CREATE POLICY "Users can view non-internal comments or internal if team member" ON comments
  FOR SELECT USING (
    NOT is_internal OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments within 30 minutes" ON comments
  FOR UPDATE USING (
    auth.uid() = author_id AND 
    created_at > NOW() - INTERVAL '30 minutes'
  );

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'developer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA (Optional - for development)
-- =====================================================

-- Insert sample roles if needed
-- Note: This would be handled by the application during user registration