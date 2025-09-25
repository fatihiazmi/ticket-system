/**
 * Comments and Discussion Types
 *
 * These types define the structure for comment threads,
 * mentions, and collaborative discussions on issues.
 */

export interface Comment {
  id: string;
  issueId: string;
  workflowStepId?: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
  };
}

export interface CommentThread {
  issueId: string;
  comments: CommentWithAuthor[];
  total: number;
  hasMore: boolean;
}

export interface CreateCommentRequest {
  issueId: string;
  content: string;
  isInternal?: boolean;
  workflowStepId?: string;
}

export interface UpdateCommentRequest {
  commentId: string;
  content: string;
}

export interface CommentMention {
  userId: string;
  fullName: string;
  position: {
    start: number;
    end: number;
  };
}

export interface CommentWithMentions extends CommentWithAuthor {
  mentions: CommentMention[];
  parsedContent: string; // Content with mentions parsed as links
}

export interface CommentFilters {
  isInternal?: boolean;
  authorId?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  workflowStepId?: string;
}

export interface CommentSortOptions {
  field: 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface CommentListResponse {
  comments: CommentWithAuthor[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Comment content parsing and validation
export interface ParsedMention {
  type: 'mention';
  userId: string;
  fullName: string;
  displayText: string;
}

export interface ParsedText {
  type: 'text';
  content: string;
}

export type CommentContentPart = ParsedMention | ParsedText;

export interface CommentContentParsed {
  parts: CommentContentPart[];
  mentionedUsers: string[];
}

// Comment edit tracking
export interface CommentEditHistory {
  commentId: string;
  versions: CommentVersion[];
}

export interface CommentVersion {
  version: number;
  content: string;
  editedAt: string;
  editedBy: string;
}

// Comment permissions and visibility
export const COMMENT_PERMISSIONS = {
  canCreate: (userRole: string): boolean => {
    return ['developer', 'qa', 'product_manager'].includes(userRole);
  },
  canEdit: (commentAuthorId: string, currentUserId: string, createdAt: string): boolean => {
    if (commentAuthorId !== currentUserId) return false;

    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);

    return diffMinutes <= 30; // Can edit within 30 minutes
  },
  canViewInternal: (userRole: string): boolean => {
    return ['developer', 'qa', 'product_manager'].includes(userRole);
  },
  canDelete: (commentAuthorId: string, currentUserId: string, userRole: string): boolean => {
    return commentAuthorId === currentUserId || userRole === 'product_manager';
  },
} as const;

// Mention patterns and validation
export const MENTION_REGEX = /@\[([^\]]+)\]\(user:([a-zA-Z0-9-]+)\)/g;
export const MENTION_DISPLAY_REGEX = /@([a-zA-Z0-9._-]+)/g;

export interface MentionSuggestion {
  userId: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  email: string;
}

export interface MentionSuggestionsResponse {
  suggestions: MentionSuggestion[];
  query: string;
  hasMore: boolean;
}
