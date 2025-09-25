# API Contracts: Comments

**Endpoint**: `/api/issues/:issueId/comments`  
**Service**: Comment Management  
**Authentication**: Required (Supabase JWT)

## GET /api/issues/:issueId/comments
**Purpose**: Retrieve comments for a specific issue

### Request
```typescript
interface GetCommentsQuery {
  page?: number; // default: 1
  limit?: number; // default: 50, max: 100
  include_internal?: boolean; // default: false, requires team member role
  sort_order?: 'asc' | 'desc'; // default: asc (chronological)
}
```

### Response
```typescript
interface GetCommentsResponse {
  comments: Comment[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

interface Comment {
  id: string;
  issue_id: string;
  workflow_step_id?: string;
  author: UserProfile;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  edited: boolean;
}
```

### Status Codes
- `200`: Success
- `404`: Issue not found
- `401`: Unauthorized
- `403`: Cannot view internal comments (non-team member)

## POST /api/issues/:issueId/comments
**Purpose**: Create new comment on issue

### Request
```typescript
interface CreateCommentRequest {
  content: string; // min 1 character, max 10000
  is_internal?: boolean; // default: false
  workflow_step_id?: string; // link to specific workflow step
}
```

### Response
```typescript
interface CreateCommentResponse {
  comment: Comment;
  message: string;
}
```

### Status Codes
- `201`: Created successfully
- `400`: Validation error
- `401`: Unauthorized
- `404`: Issue not found
- `403`: Cannot create internal comments (non-team member)

## PATCH /api/comments/:id
**Purpose**: Update comment (within 30 minutes of creation)

### Request
```typescript
interface UpdateCommentRequest {
  content: string; // min 1 character, max 10000
}
```

### Response
```typescript
interface UpdateCommentResponse {
  comment: Comment;
  message: string;
}
```

### Business Rules
- Only comment author can edit
- Must be within 30 minutes of creation
- Editing marks comment as `edited: true`

### Status Codes
- `200`: Updated successfully
- `400`: Validation error
- `401`: Unauthorized
- `403`: Not comment author or edit window expired
- `404`: Comment not found

## DELETE /api/comments/:id
**Purpose**: Delete comment (soft delete)

### Response
```typescript
interface DeleteCommentResponse {
  message: string;
}
```

### Business Rules
- Only comment author or issue creator can delete
- Workflow step comments cannot be deleted
- Deleted comments show as "[Comment deleted]" in UI

### Status Codes
- `200`: Deleted successfully
- `401`: Unauthorized
- `403`: Insufficient permissions
- `404`: Comment not found
- `422`: Cannot delete workflow step comment

## Real-time Events
```typescript
// Subscribe to new comments on specific issue
supabase
  .channel(`issue-${issueId}-comments`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'comments',
    filter: `issue_id=eq.${issueId}`
  }, (payload) => {
    // Handle new comment
  })
  .subscribe();
```