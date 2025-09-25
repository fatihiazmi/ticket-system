/**
 * Comments and Discussion Validation Schemas
 *
 * Zod schemas for validating comment data, mentions,
 * and comment-related operations.
 */

import { z } from 'zod';

// UUID validation helper (reused from other schemas)
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Comment validation schemas
export const createCommentSchema = z.object({
  issueId: uuidSchema,
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment must not exceed 2000 characters')
    .trim(),
  isInternal: z.boolean().default(false),
  workflowStepId: uuidSchema.optional(),
});

export const updateCommentSchema = z.object({
  commentId: uuidSchema,
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment must not exceed 2000 characters')
    .trim(),
});

// Comment filtering and sorting validation
export const commentFiltersSchema = z
  .object({
    isInternal: z.boolean().optional(),
    authorId: z.array(uuidSchema).optional(),
    dateRange: z
      .object({
        from: z.string().datetime(),
        to: z.string().datetime(),
      })
      .optional(),
    workflowStepId: uuidSchema.optional(),
  })
  .refine(
    data => {
      if (data.dateRange) {
        const from = new Date(data.dateRange.from);
        const to = new Date(data.dateRange.to);
        return from <= to;
      }
      return true;
    },
    {
      message: 'Date range "from" must be before or equal to "to"',
      path: ['dateRange'],
    }
  );

export const commentSortOptionsSchema = z.object({
  field: z.enum(['createdAt', 'updatedAt']),
  direction: z.enum(['asc', 'desc']),
});

// Mention validation schemas
export const mentionSchema = z
  .object({
    userId: uuidSchema,
    fullName: z.string().min(1),
    position: z.object({
      start: z.number().nonnegative(),
      end: z.number().nonnegative(),
    }),
  })
  .refine(data => data.position.start < data.position.end, {
    message: 'Mention start position must be before end position',
    path: ['position'],
  });

export const mentionSuggestionQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(50, 'Search query must not exceed 50 characters')
    .trim(),
  issueId: uuidSchema.optional(), // To filter relevant users for the issue
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(20, 'Limit cannot exceed 20')
    .default(10),
});

// Comment content parsing validation
export const parsedMentionSchema = z.object({
  type: z.literal('mention'),
  userId: uuidSchema,
  fullName: z.string(),
  displayText: z.string(),
});

export const parsedTextSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
});

export const commentContentPartSchema = z.discriminatedUnion('type', [
  parsedMentionSchema,
  parsedTextSchema,
]);

export const commentContentParsedSchema = z.object({
  parts: z.array(commentContentPartSchema),
  mentionedUsers: z.array(uuidSchema),
});

// Comment response validation schemas
export const commentResponseSchema = z.object({
  id: uuidSchema,
  issueId: uuidSchema,
  workflowStepId: uuidSchema.nullable(),
  authorId: uuidSchema,
  content: z.string(),
  isInternal: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  edited: z.boolean(),
});

export const commentWithAuthorResponseSchema = commentResponseSchema.extend({
  author: z.object({
    id: uuidSchema,
    fullName: z.string(),
    role: z.string(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
  }),
});

export const commentWithMentionsResponseSchema = commentWithAuthorResponseSchema.extend({
  mentions: z.array(mentionSchema),
  parsedContent: z.string(),
});

export const commentThreadResponseSchema = z.object({
  issueId: uuidSchema,
  comments: z.array(commentWithAuthorResponseSchema),
  total: z.number().nonnegative(),
  hasMore: z.boolean(),
});

export const commentListResponseSchema = z.object({
  comments: z.array(commentWithAuthorResponseSchema),
  total: z.number().nonnegative(),
  page: z.number().positive(),
  pageSize: z.number().positive(),
  hasMore: z.boolean(),
});

export const mentionSuggestionResponseSchema = z.object({
  userId: uuidSchema,
  fullName: z.string(),
  role: z.string(),
  avatarUrl: z.string().url().nullable(),
  email: z.string().email(),
});

export const mentionSuggestionsResponseSchema = z.object({
  suggestions: z.array(mentionSuggestionResponseSchema),
  query: z.string(),
  hasMore: z.boolean(),
});

// Pagination validation (reused from issues)
export const paginationSchema = z.object({
  page: z.number().int('Page must be an integer').positive('Page must be positive').default(1),
  pageSize: z
    .number()
    .int('Page size must be an integer')
    .positive('Page size must be positive')
    .max(50, 'Page size cannot exceed 50 for comments')
    .default(20),
});

// Type exports for use in components
export type CreateCommentFormData = z.infer<typeof createCommentSchema>;
export type UpdateCommentFormData = z.infer<typeof updateCommentSchema>;
export type CommentFiltersData = z.infer<typeof commentFiltersSchema>;
export type CommentSortOptionsData = z.infer<typeof commentSortOptionsSchema>;
export type MentionData = z.infer<typeof mentionSchema>;
export type MentionSuggestionQueryData = z.infer<typeof mentionSuggestionQuerySchema>;
export type CommentContentParsedData = z.infer<typeof commentContentParsedSchema>;

// Regular expressions for mention parsing
export const MENTION_REGEX = /@\[([^\]]+)\]\(user:([a-zA-Z0-9-]+)\)/g;
export const MENTION_DISPLAY_REGEX = /@([a-zA-Z0-9._-]+)/g;

// Validation helper functions
export const validateCommentContent = (content: string): { isValid: boolean; errors: string[] } => {
  const result = z
    .string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment must not exceed 2000 characters')
    .trim()
    .safeParse(content);

  if (result.success) {
    return { isValid: true, errors: [] };
  }

  return {
    isValid: false,
    errors: result.error.errors.map(err => err.message),
  };
};

export const canEditComment = (
  commentAuthorId: string,
  currentUserId: string,
  createdAt: string
): boolean => {
  if (commentAuthorId !== currentUserId) return false;

  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);

  return diffMinutes <= 30; // Can edit within 30 minutes
};

export const canViewInternalComment = (userRole: string): boolean => {
  return ['developer', 'qa', 'product_manager'].includes(userRole);
};

export const canDeleteComment = (
  commentAuthorId: string,
  currentUserId: string,
  userRole: string
): boolean => {
  return commentAuthorId === currentUserId || userRole === 'product_manager';
};

export const parseMentions = (
  content: string
): { mentionedUsers: string[]; parsedContent: string } => {
  const mentionedUsers: string[] = [];
  let parsedContent = content;

  // Extract mentions using regex
  const mentions = Array.from(content.matchAll(MENTION_REGEX));

  for (const match of mentions) {
    const [fullMatch, displayName, userId] = match;
    mentionedUsers.push(userId);

    // Replace mention markup with plain text
    parsedContent = parsedContent.replace(fullMatch, `@${displayName}`);
  }

  return {
    mentionedUsers: [...new Set(mentionedUsers)], // Remove duplicates
    parsedContent,
  };
};

export const formatMentionForDisplay = (userId: string, fullName: string): string => {
  return `@[${fullName}](user:${userId})`;
};
