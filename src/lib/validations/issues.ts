/**
 * Issue Management Validation Schemas
 *
 * Zod schemas for validating issue data, workflow transitions,
 * and issue-related operations.
 */

import { z } from 'zod';

// Issue type and status enums
export const issueTypeSchema = z.enum(['bug', 'feature'], {
  errorMap: () => ({ message: 'Issue type must be bug or feature' }),
});

export const issuePrioritySchema = z.enum(['high', 'medium', 'low'], {
  errorMap: () => ({ message: 'Priority must be high, medium, or low' }),
});

export const issueStatusSchema = z.enum(
  ['new', 'in_progress', 'dev_review', 'qa_review', 'pm_review', 'resolved', 'rejected'],
  {
    errorMap: () => ({ message: 'Invalid issue status' }),
  }
);

export const workflowStepTypeSchema = z.enum(['dev_review', 'qa_review', 'pm_review'], {
  errorMap: () => ({ message: 'Workflow step type must be dev_review, qa_review, or pm_review' }),
});

export const workflowStepStatusSchema = z.enum(['pending', 'approved', 'rejected'], {
  errorMap: () => ({ message: 'Workflow step status must be pending, approved, or rejected' }),
});

// UUID validation helper (reused from auth)
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Issue validation schemas
export const createIssueSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim(),
  type: issueTypeSchema,
  priority: issuePrioritySchema,
  assignedTo: uuidSchema.optional(),
  estimatedHours: z
    .number()
    .positive('Estimated hours must be positive')
    .max(1000, 'Estimated hours cannot exceed 1000')
    .optional(),
});

export const updateIssueSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim()
    .optional(),
  type: issueTypeSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assignedTo: uuidSchema.optional().or(z.null()),
  estimatedHours: z
    .number()
    .positive('Estimated hours must be positive')
    .max(1000, 'Estimated hours cannot exceed 1000')
    .optional()
    .or(z.null()),
  actualHours: z
    .number()
    .positive('Actual hours must be positive')
    .max(1000, 'Actual hours cannot exceed 1000')
    .optional()
    .or(z.null()),
});

// Issue status transition validation
export const issueStatusTransitionSchema = z.object({
  issueId: uuidSchema,
  toStatus: issueStatusSchema,
  comments: z.string().max(1000, 'Comments must not exceed 1000 characters').optional(),
});

// Workflow step validation schemas
export const approveWorkflowStepSchema = z.object({
  stepId: uuidSchema,
  comments: z.string().max(1000, 'Comments must not exceed 1000 characters').optional(),
});

export const rejectWorkflowStepSchema = z.object({
  stepId: uuidSchema,
  comments: z
    .string()
    .min(5, 'Rejection reason is required and must be at least 5 characters')
    .max(1000, 'Comments must not exceed 1000 characters'),
});

// Issue filtering and sorting validation
export const issueFiltersSchema = z
  .object({
    type: z.array(issueTypeSchema).optional(),
    priority: z.array(issuePrioritySchema).optional(),
    status: z.array(issueStatusSchema).optional(),
    assignedTo: z.array(uuidSchema).optional(),
    createdBy: z.array(uuidSchema).optional(),
    dateRange: z
      .object({
        from: z.string().datetime(),
        to: z.string().datetime(),
      })
      .optional(),
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

export const issueSortOptionsSchema = z.object({
  field: z.enum(['title', 'priority', 'status', 'createdAt', 'updatedAt', 'assignedTo']),
  direction: z.enum(['asc', 'desc']),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int('Page must be an integer').positive('Page must be positive').default(1),
  pageSize: z
    .number()
    .int('Page size must be an integer')
    .positive('Page size must be positive')
    .max(100, 'Page size cannot exceed 100')
    .default(20),
});

// Issue response validation schemas
export const issueResponseSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  description: z.string(),
  type: issueTypeSchema,
  priority: issuePrioritySchema,
  status: issueStatusSchema,
  createdBy: uuidSchema,
  assignedTo: uuidSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
  estimatedHours: z.number().nullable(),
  actualHours: z.number().nullable(),
});

export const workflowStepResponseSchema = z.object({
  id: uuidSchema,
  issueId: uuidSchema,
  stepType: workflowStepTypeSchema,
  status: workflowStepStatusSchema,
  approverId: uuidSchema.nullable(),
  comments: z.string().nullable(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

export const issueWithDetailsResponseSchema = issueResponseSchema.extend({
  creator: z.object({
    id: uuidSchema,
    fullName: z.string(),
    role: z.string(),
  }),
  assignee: z
    .object({
      id: uuidSchema,
      fullName: z.string(),
      role: z.string(),
    })
    .nullable(),
  workflowSteps: z.array(workflowStepResponseSchema),
  commentsCount: z.number().nonnegative(),
  lastActivityAt: z.string().datetime(),
});

export const issueListResponseSchema = z.object({
  issues: z.array(issueWithDetailsResponseSchema),
  total: z.number().nonnegative(),
  page: z.number().positive(),
  pageSize: z.number().positive(),
  hasMore: z.boolean(),
});

// Type exports for use in components
export type CreateIssueFormData = z.infer<typeof createIssueSchema>;
export type UpdateIssueFormData = z.infer<typeof updateIssueSchema>;
export type IssueStatusTransitionData = z.infer<typeof issueStatusTransitionSchema>;
export type ApproveWorkflowStepData = z.infer<typeof approveWorkflowStepSchema>;
export type RejectWorkflowStepData = z.infer<typeof rejectWorkflowStepSchema>;
export type IssueFiltersData = z.infer<typeof issueFiltersSchema>;
export type IssueSortOptionsData = z.infer<typeof issueSortOptionsSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;

// Validation helper functions
export const validateIssueStatus = (
  status: unknown
): status is z.infer<typeof issueStatusSchema> => {
  return issueStatusSchema.safeParse(status).success;
};

export const validateWorkflowTransition = (fromStatus: string, toStatus: string): boolean => {
  const transitions: Record<string, string[]> = {
    new: ['in_progress'],
    in_progress: ['dev_review', 'new'],
    dev_review: ['qa_review', 'in_progress', 'rejected'],
    qa_review: ['pm_review', 'dev_review', 'rejected'],
    pm_review: ['resolved', 'qa_review', 'rejected'],
    resolved: [],
    rejected: ['new'],
  };

  if (!(fromStatus in transitions)) {
    return false;
  }

  return transitions[fromStatus].includes(toStatus);
};

export const getRequiredWorkflowStep = (status: string): string | null => {
  const stepRequirements: Record<string, string | null> = {
    new: null,
    in_progress: null,
    dev_review: 'dev_review',
    qa_review: 'qa_review',
    pm_review: 'pm_review',
    resolved: null,
    rejected: null,
  };

  if (!(status in stepRequirements)) {
    return null;
  }

  return stepRequirements[status];
};

export const canUserApproveStep = (userRole: string, stepType: string): boolean => {
  const approverRoles: Record<string, string[]> = {
    dev_review: ['developer'],
    qa_review: ['qa'],
    pm_review: ['product_manager'],
  };

  if (!(stepType in approverRoles)) {
    return false;
  }

  return approverRoles[stepType].includes(userRole);
};
