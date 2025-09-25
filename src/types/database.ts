// Database type definitions for Supabase
// This would typically be generated from supabase gen types typescript

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          role: 'developer' | 'qa' | 'product_manager';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          role: 'developer' | 'qa' | 'product_manager';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: 'developer' | 'qa' | 'product_manager';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'bug' | 'feature';
          priority: 'high' | 'medium' | 'low';
          status:
            | 'new'
            | 'in_progress'
            | 'dev_review'
            | 'qa_review'
            | 'pm_review'
            | 'resolved'
            | 'rejected';
          created_by: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          estimated_hours: string | null;
          actual_hours: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          type: 'bug' | 'feature';
          priority: 'high' | 'medium' | 'low';
          status:
            | 'new'
            | 'in_progress'
            | 'dev_review'
            | 'qa_review'
            | 'pm_review'
            | 'resolved'
            | 'rejected';
          created_by: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          estimated_hours?: string | null;
          actual_hours?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          type?: 'bug' | 'feature';
          priority?: 'high' | 'medium' | 'low';
          status?:
            | 'new'
            | 'in_progress'
            | 'dev_review'
            | 'qa_review'
            | 'pm_review'
            | 'resolved'
            | 'rejected';
          created_by?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          estimated_hours?: string | null;
          actual_hours?: string | null;
        };
      };
      workflow_steps: {
        Row: {
          id: string;
          issue_id: string;
          step_type: 'dev_review' | 'qa_review' | 'pm_review';
          status: 'pending' | 'approved' | 'rejected';
          approver_id: string | null;
          comments: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          issue_id: string;
          step_type: 'dev_review' | 'qa_review' | 'pm_review';
          status: 'pending' | 'approved' | 'rejected';
          approver_id?: string | null;
          comments?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          issue_id?: string;
          step_type?: 'dev_review' | 'qa_review' | 'pm_review';
          status?: 'pending' | 'approved' | 'rejected';
          approver_id?: string | null;
          comments?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          issue_id: string;
          workflow_step_id: string | null;
          author_id: string;
          content: string;
          is_internal: boolean;
          created_at: string;
          updated_at: string;
          edited: boolean;
        };
        Insert: {
          id?: string;
          issue_id: string;
          workflow_step_id?: string | null;
          author_id: string;
          content: string;
          is_internal?: boolean;
          created_at?: string;
          updated_at?: string;
          edited?: boolean;
        };
        Update: {
          id?: string;
          issue_id?: string;
          workflow_step_id?: string | null;
          author_id?: string;
          content?: string;
          is_internal?: boolean;
          created_at?: string;
          updated_at?: string;
          edited?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          related_issue_id: string;
          type: 'assignment' | 'status_change' | 'approval_required' | 'comment_added' | 'mention';
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          related_issue_id: string;
          type: 'assignment' | 'status_change' | 'approval_required' | 'comment_added' | 'mention';
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          related_issue_id?: string;
          type?: 'assignment' | 'status_change' | 'approval_required' | 'comment_added' | 'mention';
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
          expires_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
