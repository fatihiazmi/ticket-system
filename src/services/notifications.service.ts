import { supabase } from '../lib/supabase.ts';
import type {
  Notification,
  NotificationWithDetails,
  CreateNotificationRequest,
  PaginatedNotificationsResponse,
  NotificationType,
} from '../types/notifications.ts';

export interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationServiceResponse<T = any> {
  data: T | null;
  error: Error | null;
}

class NotificationsService {
  /**
   * Get notifications for the current user
   */
  async getNotifications(
    options: GetNotificationsOptions = {}
  ): Promise<NotificationServiceResponse<PaginatedNotificationsResponse>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { page = 1, limit = 20, isRead, type, sortOrder = 'desc' } = options;

      // Validate limit
      if (limit > 50) {
        throw new Error('Limit cannot exceed 50 items per page');
      }

      const offset = (page - 1) * limit;

      // Build query
      let query = (supabase as any)
        .from('notifications')
        .select(
          `
          *,
          related_issue:issues!notifications_related_issue_id_fkey(
            id,
            title,
            status,
            priority
          ),
          actor:user_profiles!notifications_actor_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `,
          { count: 'exact' }
        )
        .eq('user_id', user.id);

      // Apply filters
      if (isRead !== undefined) {
        query = query.eq('is_read', isRead);
      }
      if (type) {
        query = query.eq('type', type);
      }

      // Only show non-expired notifications
      query = query.or('expires_at.is.null,expires_at.gte.' + new Date().toISOString());

      // Apply sorting
      query = query.order('created_at', { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }

      // Get unread count separately
      const { count: unreadCount, error: unreadError } = await (supabase as any)
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString());

      if (unreadError) {
        console.error('Failed to fetch unread count:', unreadError);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: {
          notifications: data || [],
          unread_count: unreadCount || 0,
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
   * Get a specific notification by ID
   */
  async getNotificationById(
    id: string
  ): Promise<NotificationServiceResponse<NotificationWithDetails>> {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select(
          `
          *,
          related_issue:issues!notifications_related_issue_id_fkey(
            id,
            title,
            status,
            priority
          ),
          actor:user_profiles!notifications_actor_id_fkey(
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
          throw new Error('Notification not found');
        }
        throw new Error(`Failed to fetch notification: ${error.message}`);
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
   * Create a new notification
   */
  async createNotification(
    notificationData: CreateNotificationRequest
  ): Promise<NotificationServiceResponse<Notification>> {
    try {
      // Get current user as the actor
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Verify the related issue exists
      const { error: issueError } = await (supabase as any)
        .from('issues')
        .select('id')
        .eq('id', notificationData.relatedIssueId)
        .single();

      if (issueError) {
        if (issueError.code === 'PGRST116') {
          throw new Error('Related issue not found');
        }
        throw new Error(`Failed to verify issue: ${issueError.message}`);
      }

      // Don't create notification for the actor themselves
      if (notificationData.userId === user.id) {
        return {
          data: null,
          error: new Error('Cannot create notification for yourself'),
        };
      }

      const newNotification = {
        user_id: notificationData.userId,
        related_issue_id: notificationData.relatedIssueId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        actor_id: user.id,
        is_read: false,
        created_at: new Date().toISOString(),
        expires_at: this.getExpirationDate(notificationData.type),
      };

      const { data, error } = await (supabase as any)
        .from('notifications')
        .insert(newNotification)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create notification: ${error.message}`);
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
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<NotificationServiceResponse<Notification>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await (supabase as any)
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only mark their own notifications
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Notification not found or access denied');
        }
        throw new Error(`Failed to mark notification as read: ${error.message}`);
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
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(ids: string[]): Promise<NotificationServiceResponse<Notification[]>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      if (ids.length === 0) {
        return { data: [], error: null };
      }

      const { data, error } = await (supabase as any)
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .in('id', ids)
        .eq('user_id', user.id)
        .select();

      if (error) {
        throw new Error(`Failed to mark notifications as read: ${error.message}`);
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
   * Mark all notifications as read for the current user
   */
  async markAllAsRead(): Promise<NotificationServiceResponse<boolean>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { error } = await (supabase as any)
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
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
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<NotificationServiceResponse<boolean>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own notifications

      if (error) {
        throw new Error(`Failed to delete notification: ${error.message}`);
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
   * Delete expired notifications (cleanup utility)
   */
  async deleteExpiredNotifications(): Promise<NotificationServiceResponse<number>> {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to delete expired notifications: ${error.message}`);
      }

      return {
        data: data?.length || 0,
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
   * Get unread notification count
   */
  async getUnreadCount(): Promise<NotificationServiceResponse<number>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { count, error } = await (supabase as any)
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString());

      if (error) {
        throw new Error(`Failed to get unread count: ${error.message}`);
      }

      return {
        data: count || 0,
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
   * Subscribe to real-time notifications for the current user
   */
  subscribeToNotifications(
    callback: (notification: NotificationWithDetails) => void
  ): (() => void) | null {
    try {
      // Get current user synchronously from session
      const session = supabase.auth.getSession();

      if (!session) {
        console.error('No active session for notifications subscription');
        return null;
      }

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.then(s => s.data.session?.user?.id)}`,
          },
          payload => {
            // Fetch the full notification with relations
            this.getNotificationById(payload.new.id).then(response => {
              if (response.data) {
                callback(response.data);
              }
            });
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      return null;
    }
  }

  /**
   * Helper method to determine notification expiration
   */
  private getExpirationDate(type: NotificationType): string | null {
    const now = new Date();

    switch (type) {
      case 'assignment':
      case 'status_change':
        // These don't expire
        return null;
      case 'approval_required':
        // Expires in 7 days
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'comment_added':
      case 'mention':
        // Expires in 30 days
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        // Default: expires in 7 days
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Create notification for issue assignment
   */
  async createAssignmentNotification(
    issueId: string,
    assigneeId: string,
    issueTitle: string
  ): Promise<NotificationServiceResponse<Notification>> {
    return this.createNotification({
      userId: assigneeId,
      relatedIssueId: issueId,
      type: 'assignment',
      title: 'New Issue Assignment',
      message: `You have been assigned to "${issueTitle}"`,
    });
  }

  /**
   * Create notification for status change
   */
  async createStatusChangeNotification(
    issueId: string,
    userId: string,
    issueTitle: string,
    newStatus: string
  ): Promise<NotificationServiceResponse<Notification>> {
    return this.createNotification({
      userId,
      relatedIssueId: issueId,
      type: 'status_change',
      title: 'Issue Status Updated',
      message: `"${issueTitle}" status changed to ${newStatus}`,
    });
  }

  /**
   * Create notification for approval required
   */
  async createApprovalRequiredNotification(
    issueId: string,
    approverId: string,
    issueTitle: string,
    reviewType: string
  ): Promise<NotificationServiceResponse<Notification>> {
    return this.createNotification({
      userId: approverId,
      relatedIssueId: issueId,
      type: 'approval_required',
      title: `${reviewType} Approval Required`,
      message: `"${issueTitle}" requires your approval`,
    });
  }

  /**
   * Create notification for new comment
   */
  async createCommentNotification(
    issueId: string,
    userId: string,
    issueTitle: string,
    commenterName: string
  ): Promise<NotificationServiceResponse<Notification>> {
    return this.createNotification({
      userId,
      relatedIssueId: issueId,
      type: 'comment_added',
      title: 'New Comment',
      message: `${commenterName} commented on "${issueTitle}"`,
    });
  }

  /**
   * Create notification for mention
   */
  async createMentionNotification(
    issueId: string,
    mentionedUserId: string,
    issueTitle: string,
    mentionerName: string
  ): Promise<NotificationServiceResponse<Notification>> {
    return this.createNotification({
      userId: mentionedUserId,
      relatedIssueId: issueId,
      type: 'mention',
      title: 'You were mentioned',
      message: `${mentionerName} mentioned you in "${issueTitle}"`,
    });
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService();
export default notificationsService;
