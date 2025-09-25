# API Contracts: Issues

**Endpoint**: `/api/issues`  
**Service**: Issue Management  
**Authentication**: Required (Supabase JWT)

## GET /api/issues
**Purpose**: Retrieve paginated list of issues with filtering

### Request
```typescript
interface GetIssuesQuery {
  page?: number; // default: 1
  limit?: number; // default: 20, max: 100
  status?: 'new' | 'in_progress' | 'dev_review' | 'qa_review' | 'pm_review' | 'resolved' | 'rejected';
  priority?: 'high' | 'medium' | 'low';
  type?: 'bug' | 'feature';
  assigned_to?: string; // user ID
  created_by?: string; // user ID
  search?: string; // search in title and description
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'title';
  sort_order?: 'asc' | 'desc'; // default: desc
}
```

### Response
```typescript
interface GetIssuesResponse {
  issues: Issue[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature';
  priority: 'high' | 'medium' | 'low';
  status: string;
  created_by: UserProfile;
  assigned_to?: UserProfile;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  comment_count: number;
  workflow_steps: WorkflowStep[];
}
```

### Status Codes
- `200`: Success
- `400`: Invalid query parameters
- `401`: Unauthorized
- `500`: Server error

## GET /api/issues/:id
**Purpose**: Retrieve single issue with full details

### Response
```typescript
interface GetIssueResponse {
  issue: Issue & {
    comments: Comment[];
    workflow_history: WorkflowStep[];
  };
}
```

### Status Codes
- `200`: Success
- `404`: Issue not found
- `401`: Unauthorized
- `403`: Insufficient permissions

## POST /api/issues
**Purpose**: Create new issue

### Request
```typescript
interface CreateIssueRequest {
  title: string; // 1-200 characters
  description: string; // min 1 character
  type: 'bug' | 'feature';
  priority: 'high' | 'medium' | 'low';
  assigned_to?: string; // user ID
  estimated_hours?: number; // positive integer
}
```

### Response
```typescript
interface CreateIssueResponse {
  issue: Issue;
  message: string;
}
```

### Status Codes
- `201`: Created successfully
- `400`: Validation error
- `401`: Unauthorized
- `422`: Invalid assigned user

## PATCH /api/issues/:id
**Purpose**: Update issue details

### Request
```typescript
interface UpdateIssueRequest {
  title?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  assigned_to?: string;
  estimated_hours?: number;
  actual_hours?: number;
}
```

### Response
```typescript
interface UpdateIssueResponse {
  issue: Issue;
  message: string;
}
```

### Status Codes
- `200`: Updated successfully
- `400`: Validation error
- `401`: Unauthorized
- `403`: Insufficient permissions (not creator or assignee)
- `404`: Issue not found

## PATCH /api/issues/:id/status
**Purpose**: Update issue status (workflow transitions)

### Request
```typescript
interface UpdateIssueStatusRequest {
  status: 'new' | 'in_progress' | 'dev_review' | 'qa_review' | 'pm_review' | 'resolved' | 'rejected';
  comments?: string; // required for rejections
}
```

### Response
```typescript
interface UpdateIssueStatusResponse {
  issue: Issue;
  workflow_step: WorkflowStep;
  message: string;
}
```

### Business Rules
- `new` → `in_progress`: Any authenticated user
- `in_progress` → `dev_review`: Assignee only
- `dev_review` → `qa_review`: Developer role only (approval)
- `dev_review` → `in_progress`: Developer role only (rejection, comments required)
- `qa_review` → `pm_review`: QA role only (approval)
- `qa_review` → `dev_review`: QA role only (rejection, comments required)
- `pm_review` → `resolved`: Product Manager role only (approval)
- `pm_review` → `qa_review`: Product Manager role only (rejection, comments required)
- `resolved` → `new`: Any authenticated user (reopen)

### Status Codes
- `200`: Status updated successfully
- `400`: Invalid status transition
- `401`: Unauthorized
- `403`: Insufficient role permissions
- `422`: Missing required comments for rejection

## DELETE /api/issues/:id
**Purpose**: Soft delete issue (mark as deleted)

### Response
```typescript
interface DeleteIssueResponse {
  message: string;
}
```

### Status Codes
- `200`: Deleted successfully
- `401`: Unauthorized
- `403`: Only creator can delete
- `404`: Issue not found
- `422`: Cannot delete issue with approved workflow steps

## Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  request_id: string;
  timestamp: string;
}
```

## Real-time Events (Supabase Subscriptions)
```typescript
// Subscribe to issue changes
supabase
  .channel('issues')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'issues'
  }, (payload) => {
    // Handle real-time issue updates
  })
  .subscribe();

// Subscribe to workflow steps
supabase
  .channel('workflow-steps')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'workflow_steps'
  }, (payload) => {
    // Handle workflow changes
  })
  .subscribe();
```