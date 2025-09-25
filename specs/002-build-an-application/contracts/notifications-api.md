# API Contracts: Notifications

**Endpoint**: `/api/notifications`  
**Service**: In-app Notification System  
**Authentication**: Required (Supabase JWT)

## GET /api/notifications
**Purpose**: Retrieve user's notifications

### Request
```typescript
interface GetNotificationsQuery {
  page?: number; // default: 1
  limit?: number; // default: 20, max: 50
  is_read?: boolean; // filter by read status
  type?: 'assignment' | 'status_change' | 'approval_required' | 'comment_added' | 'mention';
  sort_order?: 'asc' | 'desc'; // default: desc (newest first)
}
```

### Response
```typescript
interface GetNotificationsResponse {
  notifications: Notification[];
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

interface Notification {
  id: string;
  user_id: string;
  related_issue: {
    id: string;
    title: string;
    status: string;
  };
  type: 'assignment' | 'status_change' | 'approval_required' | 'comment_added' | 'mention';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  expires_at: string;
}
```

### Status Codes
- `200`: Success
- `401`: Unauthorized

## PATCH /api/notifications/:id/read
**Purpose**: Mark notification as read

### Response
```typescript
interface MarkReadResponse {
  notification: Notification;
  message: string;
}
```

### Status Codes
- `200`: Marked as read
- `401`: Unauthorized
- `403`: Not user's notification
- `404`: Notification not found

## PATCH /api/notifications/mark-all-read  
**Purpose**: Mark all user's notifications as read

### Response
```typescript
interface MarkAllReadResponse {
  updated_count: number;
  message: string;
}
```

### Status Codes
- `200`: All notifications marked as read
- `401`: Unauthorized

## POST /api/notifications (Internal System Use)
**Purpose**: Create notification (triggered by system events)

### Notification Types & Triggers

#### Assignment Notification
**Trigger**: Issue assigned to user
```typescript
{
  type: 'assignment',
  title: 'Issue Assigned',
  message: 'You have been assigned to issue: {issue_title}'
}
```

#### Status Change Notification  
**Trigger**: Issue status updated
```typescript
{
  type: 'status_change',
  title: 'Issue Status Updated',
  message: 'Issue "{issue_title}" status changed to {new_status}'
}
```

#### Approval Required Notification
**Trigger**: Issue needs approval from user's role
```typescript
{
  type: 'approval_required',
  title: 'Approval Required',
  message: 'Issue "{issue_title}" requires your {role} approval'
}
```

#### Comment Added Notification
**Trigger**: New comment on assigned/created issue
```typescript
{
  type: 'comment_added', 
  title: 'New Comment',
  message: '{commenter_name} commented on issue: {issue_title}'
}
```

#### Mention Notification
**Trigger**: User mentioned in comment (@username)
```typescript
{
  type: 'mention',
  title: 'You were mentioned',
  message: '{commenter_name} mentioned you in issue: {issue_title}'
}
```

## Real-time Notifications
```typescript
// Subscribe to user's notifications
supabase
  .channel(`user-${userId}-notifications`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Show toast notification
    // Update notification count
  })
  .subscribe();
```

## Notification Cleanup
- Notifications automatically expire after 30 days
- System runs daily cleanup job
- Users can manually delete old notifications