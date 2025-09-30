import { supabase } from '../lib/supabase.ts';
import type {
  Issue,
  CreateIssueRequest,
  UpdateIssueRequest,
  IssueFilters,
  IssueSortOptions,
  PaginatedIssuesResponse,
  IssueStatus,
  StatusTransitionRequest,
} from '../types/issues.ts';

export interface GetIssuesOptions {
  page?: number;
  limit?: number;
  filters?: IssueFilters;
  sort?: IssueSortOptions;
}

export interface IssueServiceResponse<T = any> {
  data: T | null;
  error: Error | null;
}

class IssuesService {
  /**
   * Retrieve paginated list of issues with filtering and sorting
   */
  async getIssues(
    options: GetIssuesOptions = {}
  ): Promise<IssueServiceResponse<PaginatedIssuesResponse>> {
    try {
      const {
        page = 1,
        limit = 20,
        filters = {},
        sort = { field: 'created_at', order: 'desc' },
      } = options;

      // Validate limit
      if (limit > 100) {
        throw new Error('Limit cannot exceed 100 items per page');
      }

      const offset = (page - 1) * limit;

      // Build query with filters
      let query = supabase.from('issues').select(
        `
          *,
          created_by:user_profiles!issues_created_by_fkey(
            id,
            full_name,
            role,
            avatar_url
          ),
          assigned_to:user_profiles!issues_assigned_to_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `,
        { count: 'exact' }
      );

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.order === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch issues: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: {
          issues: data || [],
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
   * Get a single issue by ID
   */
  async getIssueById(id: string): Promise<IssueServiceResponse<Issue>> {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select(
          `
          *,
          created_by:user_profiles!issues_created_by_fkey(
            id,
            full_name,
            role,
            avatar_url
          ),
          assigned_to:user_profiles!issues_assigned_to_fkey(
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
          throw new Error('Issue not found');
        }
        throw new Error(`Failed to fetch issue: ${error.message}`);
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
   * Create a new issue
   */
  async createIssue(issueData: CreateIssueRequest): Promise<IssueServiceResponse<Issue>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const newIssue = {
        title: issueData.title,
        description: issueData.description,
        type: issueData.type,
        priority: issueData.priority,
        status: 'new' as IssueStatus,
        created_by: user.id,
        assigned_to: issueData.assignedTo || null,
        estimated_hours: issueData.estimatedHours?.toString() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('issues')
        .insert(newIssue)
        .select(
          `
          *,
          created_by:user_profiles!issues_created_by_fkey(
            id,
            full_name,
            role,
            avatar_url
          ),
          assigned_to:user_profiles!issues_assigned_to_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to create issue: ${error.message}`);
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
   * Update an existing issue
   */
  async updateIssue(id: string, updates: UpdateIssueRequest): Promise<IssueServiceResponse<Issue>> {
    try {
      // Get current user for authorization
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const updateData: Record<string, any> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Convert field names to database schema
      if (updates.assignedTo !== undefined) {
        updateData.assigned_to = updates.assignedTo;
        delete updateData.assignedTo;
      }
      if (updates.estimatedHours !== undefined) {
        updateData.estimated_hours = updates.estimatedHours?.toString() || null;
        delete updateData.estimatedHours;
      }
      if (updates.actualHours !== undefined) {
        updateData.actual_hours = updates.actualHours?.toString() || null;
        delete updateData.actualHours;
      }

      const { data, error } = await (supabase as any)
        .from('issues')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          created_by:user_profiles!issues_created_by_fkey(
            id,
            full_name,
            role,
            avatar_url
          ),
          assigned_to:user_profiles!issues_assigned_to_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Issue not found');
        }
        throw new Error(`Failed to update issue: ${error.message}`);
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
   * Update issue status with workflow validation
   */
  async updateIssueStatus(
    id: string,
    statusData: StatusTransitionRequest
  ): Promise<IssueServiceResponse<Issue>> {
    try {
      // Get current user for authorization
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Get current issue to validate transition
      const { data: currentIssue, error: fetchError } = await (supabase as any)
        .from('issues')
        .select('id, status')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Issue not found');
        }
        throw new Error(`Failed to fetch current issue: ${fetchError.message}`);
      }

      // Validate status transition (basic validation - could be enhanced with workflow rules)
      const validTransitions: Record<IssueStatus, IssueStatus[]> = {
        new: ['in_progress'],
        in_progress: ['dev_review', 'new'],
        dev_review: ['qa_review', 'in_progress'],
        qa_review: ['pm_review', 'dev_review'],
        pm_review: ['resolved', 'qa_review'],
        resolved: ['new'], // Can reopen if needed
        rejected: ['new'], // Can reopen if needed
      };

      const currentStatus = currentIssue?.status as IssueStatus;
      const newStatus = statusData.status;

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Set resolved_at when status becomes resolved
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      // Record actual hours if provided
      if (statusData.actualHours !== undefined) {
        updateData.actual_hours = statusData.actualHours.toString();
      }

      const { data, error } = await (supabase as any)
        .from('issues')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          created_by:user_profiles!issues_created_by_fkey(
            id,
            full_name,
            role,
            avatar_url
          ),
          assigned_to:user_profiles!issues_assigned_to_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to update issue status: ${error.message}`);
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
   * Delete an issue (soft delete by updating status)
   */
  async deleteIssue(id: string): Promise<IssueServiceResponse<boolean>> {
    try {
      // Get current user for authorization
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase.from('issues').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete issue: ${error.message}`);
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
   * Assign issue to a user
   */
  async assignIssue(id: string, userId: string): Promise<IssueServiceResponse<Issue>> {
    try {
      return await this.updateIssue(id, { assignedTo: userId });
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Unassign issue
   */
  async unassignIssue(id: string): Promise<IssueServiceResponse<Issue>> {
    try {
      return await this.updateIssue(id, { assignedTo: undefined });
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }
}

// Export singleton instance
export const issuesService = new IssuesService();
export default issuesService;
