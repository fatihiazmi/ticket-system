import { supabase } from '../lib/supabase.ts';
import type {
  CommentWithAuthor,
  CommentThread,
  CreateCommentRequest,
  UpdateCommentRequest,
  PaginatedCommentsResponse,
} from '../types/comments.ts';

export interface GetCommentsOptions {
  page?: number;
  limit?: number;
  includeInternal?: boolean;
  sortOrder?: 'asc' | 'desc';
}

export interface CommentServiceResponse<T = any> {
  data: T | null;
  error: Error | null;
}

class CommentsService {
  /**
   * Get comments for a specific issue
   */
  async getCommentsByIssueId(
    issueId: string,
    options: GetCommentsOptions = {}
  ): Promise<CommentServiceResponse<PaginatedCommentsResponse>> {
    try {
      const { page = 1, limit = 50, includeInternal = false, sortOrder = 'asc' } = options;

      // Validate limit
      if (limit > 100) {
        throw new Error('Limit cannot exceed 100 items per page');
      }

      const offset = (page - 1) * limit;

      // Build query
      let query = (supabase as any)
        .from('comments')
        .select(
          `
          *,
          author:user_profiles!comments_author_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `,
          { count: 'exact' }
        )
        .eq('issue_id', issueId);

      // Filter internal comments based on user role if needed
      if (!includeInternal) {
        query = query.eq('is_internal', false);
      }

      // Apply sorting
      query = query.order('created_at', { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch comments: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: {
          comments: data || [],
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_items: count || 0,
            items_per_page: limit,
            has_next: page < totalPages,
            has_previous: page > 1,
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Get a specific comment by ID
   */
  async getCommentById(id: string): Promise<CommentServiceResponse<CommentWithAuthor>> {
    try {
      const { data, error } = await (supabase as any)
        .from('comments')
        .select(
          `
          *,
          author:user_profiles!comments_author_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Comment not found');
        }
        throw new Error(`Failed to fetch comment: ${error.message}`);
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Create a new comment
   */
  async createComment(
    commentData: CreateCommentRequest
  ): Promise<CommentServiceResponse<CommentWithAuthor>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Verify issue exists
      const { error: issueError } = await (supabase as any)
        .from('issues')
        .select('id')
        .eq('id', commentData.issueId)
        .single();

      if (issueError) {
        if (issueError.code === 'PGRST116') {
          throw new Error('Issue not found');
        }
        throw new Error(`Failed to verify issue: ${issueError.message}`);
      }

      const newComment = {
        issue_id: commentData.issueId,
        workflow_step_id: commentData.workflowStepId || null,
        author_id: user.id,
        content: commentData.content,
        is_internal: commentData.isInternal || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        edited: false,
      };

      const { data, error } = await (supabase as any)
        .from('comments')
        .insert(newComment)
        .select(
          `
          *,
          author:user_profiles!comments_author_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to create comment: ${error.message}`);
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Update an existing comment
   */
  async updateComment(
    commentId: string,
    updates: UpdateCommentRequest
  ): Promise<CommentServiceResponse<CommentWithAuthor>> {
    try {
      // Get current user for authorization
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Verify comment exists and user owns it
      const { data: existingComment, error: fetchError } = await (supabase as any)
        .from('comments')
        .select('id, author_id')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Comment not found');
        }
        throw new Error(`Failed to fetch comment: ${fetchError.message}`);
      }

      if (existingComment.author_id !== user.id) {
        throw new Error('You can only edit your own comments');
      }

      const updateData = {
        content: updates.content,
        updated_at: new Date().toISOString(),
        edited: true,
      };

      const { data, error } = await (supabase as any)
        .from('comments')
        .update(updateData)
        .eq('id', commentId)
        .select(
          `
          *,
          author:user_profiles!comments_author_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to update comment: ${error.message}`);
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<CommentServiceResponse<boolean>> {
    try {
      // Get current user for authorization
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Verify comment exists and user owns it or has admin role
      const { data: existingComment, error: fetchError } = await (supabase as any)
        .from('comments')
        .select(
          `
          id, 
          author_id,
          author:user_profiles!comments_author_id_fkey(role)
        `
        )
        .eq('id', commentId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Comment not found');
        }
        throw new Error(`Failed to fetch comment: ${fetchError.message}`);
      }

      // Get current user's role
      const { data: userProfile, error: profileError } = await (supabase as any)
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to verify user permissions');
      }

      // Check if user can delete this comment (owner or product_manager)
      const canDelete =
        existingComment.author_id === user.id || userProfile.role === 'product_manager';

      if (!canDelete) {
        throw new Error('You can only delete your own comments');
      }

      const { error } = await (supabase as any).from('comments').delete().eq('id', commentId);

      if (error) {
        throw new Error(`Failed to delete comment: ${error.message}`);
      }

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Get comment thread for an issue (convenience method)
   */
  async getCommentThread(issueId: string): Promise<CommentServiceResponse<CommentThread>> {
    try {
      const response = await this.getCommentsByIssueId(issueId, {
        limit: 100,
        sortOrder: 'asc',
      });

      if (response.error) {
        throw response.error;
      }

      const thread: CommentThread = {
        issueId,
        comments: response.data?.comments || [],
        total: response.data?.pagination.total_items || 0,
        hasMore: response.data?.pagination.has_next || false,
      };

      return {
        data: thread,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Search comments by content
   */
  async searchComments(
    query: string,
    issueId?: string
  ): Promise<CommentServiceResponse<CommentWithAuthor[]>> {
    try {
      let supabaseQuery = (supabase as any)
        .from('comments')
        .select(
          `
          *,
          author:user_profiles!comments_author_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .textSearch('content', query);

      if (issueId) {
        supabaseQuery = supabaseQuery.eq('issue_id', issueId);
      }

      // Order by relevance (most recent first)
      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

      const { data, error } = await supabaseQuery;

      if (error) {
        throw new Error(`Failed to search comments: ${error.message}`);
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Get comments with mentions for a specific user
   */
  async getCommentMentions(userId: string): Promise<CommentServiceResponse<CommentWithAuthor[]>> {
    try {
      // This would require a more sophisticated implementation with mention parsing
      // For now, we'll search for comments containing @username patterns
      const { data: userProfile, error: userError } = await (supabase as any)
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error('Failed to fetch user profile');
      }

      const { data, error } = await (supabase as any)
        .from('comments')
        .select(
          `
          *,
          author:user_profiles!comments_author_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .ilike('content', `%@${userProfile.full_name}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch comment mentions: ${error.message}`);
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }
}

// Export singleton instance
export const commentsService = new CommentsService();
export default commentsService;
