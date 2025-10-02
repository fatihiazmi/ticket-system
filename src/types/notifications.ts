/**
 * Notifications and Real-time Updates Types
 *
 * These types define the structure for in-app notifications,
 * real-time updates, and notification management.
 */

export interface Notification {
  id: string;
  userId: string;
  relatedIssueId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

export type NotificationType =
  | 'assignment'
  | 'status_change'
  | 'approval_required'
  | 'comment_added'
  | 'mention';

export interface NotificationWithDetails extends Notification {
  relatedIssue: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
  actor?: {
    id: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
  };
}

export interface CreateNotificationRequest {
  userId: string;
  relatedIssueId: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface NotificationFilters {
  type?: NotificationType[];
  isRead?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface NotificationSortOptions {
  field: 'createdAt' | 'type';
  direction: 'asc' | 'desc';
}

export interface NotificationListResponse {
  notifications: NotificationWithDetails[];
  unreadCount: number;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginatedNotificationsResponse {
  notifications: NotificationWithDetails[];
  unread_count: number;
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface MarkNotificationReadRequest {
  notificationId: string;
}

export interface MarkAllNotificationsReadRequest {
  userId: string;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  types: {
    assignment: boolean;
    statusChange: boolean;
    approvalRequired: boolean;
    commentAdded: boolean;
    mention: boolean;
  };
}

export interface UpdateNotificationPreferencesRequest {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  types?: Partial<NotificationPreferences['types']>;
}

// Real-time notification events
export interface NotificationEvent {
  type: 'notification_created' | 'notification_read' | 'notification_deleted';
  notification: NotificationWithDetails;
  userId: string;
}

export interface NotificationSubscription {
  userId: string;
  channels: string[];
  isActive: boolean;
}

// Notification templates and content generation
export interface NotificationTemplate {
  type: NotificationType;
  titleTemplate: string;
  messageTemplate: string;
  priority: 'low' | 'medium' | 'high';
  expiresInDays?: number;
}

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  assignment: {
    type: 'assignment',
    titleTemplate: 'Issue assigned to you',
    messageTemplate: 'You have been assigned to issue "{issueTitle}"',
    priority: 'medium',
    expiresInDays: 7,
  },
  status_change: {
    type: 'status_change',
    titleTemplate: 'Issue status updated',
    messageTemplate: 'Issue "{issueTitle}" status changed from {fromStatus} to {toStatus}',
    priority: 'low',
    expiresInDays: 3,
  },
  approval_required: {
    type: 'approval_required',
    titleTemplate: 'Approval required',
    messageTemplate: 'Issue "{issueTitle}" requires your approval for {stepType}',
    priority: 'high',
    expiresInDays: 14,
  },
  comment_added: {
    type: 'comment_added',
    titleTemplate: 'New comment added',
    messageTemplate: '{authorName} commented on issue "{issueTitle}"',
    priority: 'low',
    expiresInDays: 2,
  },
  mention: {
    type: 'mention',
    titleTemplate: 'You were mentioned',
    messageTemplate: '{authorName} mentioned you in a comment on "{issueTitle}"',
    priority: 'medium',
    expiresInDays: 7,
  },
} as const;

// Notification display configuration
export const NOTIFICATION_CONFIG = {
  assignment: {
    icon: 'UserPlus',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  status_change: {
    icon: 'ArrowRightCircle',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  approval_required: {
    icon: 'Clock',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  comment_added: {
    icon: 'MessageSquare',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  mention: {
    icon: 'AtSign',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
} as const;

// Notification batching and digest settings
export interface NotificationDigest {
  userId: string;
  digestType: 'daily' | 'weekly';
  notifications: NotificationWithDetails[];
  createdAt: string;
  sentAt?: string;
}

export interface NotificationBatch {
  userId: string;
  notifications: NotificationWithDetails[];
  batchSize: number;
  createdAt: string;
}
