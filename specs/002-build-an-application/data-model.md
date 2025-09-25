# Data Model: Issue Tracking Application

**Feature**: Issue Tracking Application  
**Date**: 2025-09-25  
**Phase**: Phase 1 - Design

## Entity Relationship Overview

```
Users (Supabase Auth)
├── Issues (1:many) - created_by, assigned_to
├── Comments (1:many) - author_id
├── WorkflowSteps (1:many) - approver_id
└── Notifications (1:many) - user_id

Issues
├── WorkflowSteps (1:many) - issue_id
├── Comments (1:many) - issue_id
└── Notifications (1:many) - related_issue_id

WorkflowSteps
└── Comments (1:many) - workflow_step_id (optional)
```

## Core Entities

### Users (Extended Profile)
Built on Supabase auth.users with additional profile data:

```typescript
interface UserProfile {
  id: string; // UUID from auth.users
  email: string; // from auth.users
  full_name: string;
  avatar_url?: string;
  role: 'developer' | 'qa' | 'product_manager';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

**Business Rules:**
- Users can have only one role at a time
- Role determines workflow permissions
- Inactive users cannot be assigned new issues

### Issues
Core entity representing bugs and feature requests:

```typescript
interface Issue {
  id: string; // UUID
  title: string; // max 200 chars
  description: string; // markdown supported
  type: 'bug' | 'feature';
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'in_progress' | 'dev_review' | 'qa_review' | 'pm_review' | 'resolved' | 'rejected';
  created_by: string; // User ID
  assigned_to?: string; // User ID
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  estimated_hours?: number;
  actual_hours?: number;
}
```

**Business Rules:**
- Status transitions must follow workflow rules
- Only assigned user or approvers can transition status
- Resolved issues cannot be edited (only reopened)
- Priority can be changed by any authenticated user

### WorkflowSteps
Tracks approval history and workflow progression:

```typescript
interface WorkflowStep {
  id: string; // UUID
  issue_id: string; // Foreign key to Issues
  step_type: 'dev_review' | 'qa_review' | 'pm_review';
  status: 'pending' | 'approved' | 'rejected';
  approver_id?: string; // User ID
  comments?: string; // Approval/rejection feedback
  created_at: Date;
  completed_at?: Date;
}
```

**Business Rules:**
- Each issue can have multiple workflow steps
- Steps must be completed in order (Dev → QA → PM)
- Rejection returns issue to previous step
- Only users with appropriate role can approve steps

### Comments
Discussion threads and collaboration:

```typescript
interface Comment {
  id: string; // UUID
  issue_id: string; // Foreign key to Issues
  workflow_step_id?: string; // Optional link to workflow step
  author_id: string; // User ID
  content: string; // markdown supported
  is_internal: boolean; // internal team comments vs public
  created_at: Date;
  updated_at: Date;
  edited: boolean;
}
```

**Business Rules:**
- Comments can be edited within 30 minutes of creation
- Internal comments only visible to team members
- Workflow step comments are automatically created on approval/rejection

### Notifications
In-app notification system:

```typescript
interface Notification {
  id: string; // UUID
  user_id: string; // Foreign key to Users
  related_issue_id: string; // Foreign key to Issues
  type: 'assignment' | 'status_change' | 'approval_required' | 'comment_added' | 'mention';
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  expires_at?: Date; // auto-cleanup old notifications
}
```

**Business Rules:**
- Notifications auto-expire after 30 days
- Users can mark notifications as read
- System generates notifications for workflow transitions

## Database Schema (Drizzle ORM)

### Supabase Tables

```sql
-- Users Profile (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('developer', 'qa', 'product_manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(title) <= 200),
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'dev_review', 'qa_review', 'pm_review', 'resolved', 'rejected')),
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  estimated_hours INTEGER CHECK (estimated_hours > 0),
  actual_hours INTEGER CHECK (actual_hours > 0)
);

-- Workflow Steps
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL CHECK (step_type IN ('dev_review', 'qa_review', 'pm_review')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approver_id UUID REFERENCES user_profiles(id),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES user_profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited BOOLEAN DEFAULT false
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  related_issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'status_change', 'approval_required', 'comment_added', 'mention')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);
```

## Indexes for Performance

```sql
-- Issues indexes
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX idx_issues_created_by ON issues(created_by);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);

-- Workflow steps indexes
CREATE INDEX idx_workflow_steps_issue_id ON workflow_steps(issue_id);
CREATE INDEX idx_workflow_steps_approver_id ON workflow_steps(approver_id);
CREATE INDEX idx_workflow_steps_status ON workflow_steps(status);

-- Comments indexes
CREATE INDEX idx_comments_issue_id ON comments(issue_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User profiles: users can read all, update own
CREATE POLICY "Users can read all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Issues: authenticated users can read all, creators can update
CREATE POLICY "Authenticated users can read issues" ON issues FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert issues" ON issues FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators and assignees can update issues" ON issues FOR UPDATE 
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

-- Similar RLS policies for other tables...
```

## Data Validation Rules (Zod Schemas)

```typescript
export const CreateIssueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum(['bug', 'feature']),
  priority: z.enum(['high', 'medium', 'low']),
  assigned_to: z.string().uuid().optional(),
  estimated_hours: z.number().positive().optional()
});

export const UpdateIssueStatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'dev_review', 'qa_review', 'pm_review', 'resolved', 'rejected']),
  comments: z.string().optional()
});

export const CreateCommentSchema = z.object({
  content: z.string().min(1),
  is_internal: z.boolean().default(false)
});
```

## Data Access Patterns

### Common Queries
1. **List Issues**: Paginated with filters (status, assignee, priority)
2. **Issue Details**: Single issue with comments and workflow history
3. **Kanban Board**: Issues grouped by status with real-time updates
4. **User Dashboard**: Issues assigned to current user
5. **Notifications**: Unread notifications for current user

### Real-time Subscriptions
- Issue status changes
- New comments on assigned issues
- Workflow step approvals/rejections
- New issue assignments