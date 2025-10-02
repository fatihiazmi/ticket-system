/**
 * Issue Management Types
 *
 * These types define the structure for issue tracking,
 * workflow management, and status transitions.
 */

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export type IssueType = 'bug' | 'feature';

export type IssuePriority = 'high' | 'medium' | 'low';

export type IssueStatus =
  | 'new'
  | 'in_progress'
  | 'dev_review'
  | 'qa_review'
  | 'pm_review'
  | 'resolved'
  | 'rejected';

export interface CreateIssueRequest {
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  assignedTo?: string;
  estimatedHours?: number;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  type?: IssueType;
  priority?: IssuePriority;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface IssueStatusTransition {
  issueId: string;
  fromStatus: IssueStatus;
  toStatus: IssueStatus;
  userId: string;
  timestamp: string;
}

export interface IssueWithDetails extends Issue {
  creator: {
    id: string;
    fullName: string;
    role: string;
  };
  assignee?: {
    id: string;
    fullName: string;
    role: string;
  };
  workflowSteps: WorkflowStep[];
  commentsCount: number;
  lastActivityAt: string;
}

export interface WorkflowStep {
  id: string;
  issueId: string;
  stepType: WorkflowStepType;
  status: WorkflowStepStatus;
  approverId?: string;
  comments?: string;
  createdAt: string;
  completedAt?: string;
}

export type WorkflowStepType = 'dev_review' | 'qa_review' | 'pm_review';

export type WorkflowStepStatus = 'pending' | 'approved' | 'rejected';

export interface WorkflowStepWithApprover extends WorkflowStep {
  approver?: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface ApproveWorkflowStepRequest {
  stepId: string;
  comments?: string;
}

export interface RejectWorkflowStepRequest {
  stepId: string;
  comments: string;
}

export interface IssueFilters {
  type?: IssueType;
  priority?: IssuePriority;
  status?: IssueStatus;
  assignedTo?: string;
  createdBy?: string;
  search?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface IssueSortOptions {
  field: 'title' | 'priority' | 'status' | 'created_at' | 'updated_at' | 'assigned_to';
  order: 'asc' | 'desc';
}

export interface IssueListResponse {
  issues: IssueWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginatedIssuesResponse {
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

export interface StatusTransitionRequest {
  status: IssueStatus;
  actualHours?: number;
  comment?: string;
}

export interface KanbanColumn {
  id: IssueStatus;
  title: string;
  issues: IssueWithDetails[];
  count: number;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  total: number;
}

// Workflow state machine definitions
export const WORKFLOW_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  new: ['in_progress'],
  in_progress: ['dev_review', 'new'],
  dev_review: ['qa_review', 'in_progress', 'rejected'],
  qa_review: ['pm_review', 'dev_review', 'rejected'],
  pm_review: ['resolved', 'qa_review', 'rejected'],
  resolved: [], // Terminal state
  rejected: ['new'], // Can be reopened
};

export const WORKFLOW_STEP_REQUIREMENTS: Record<IssueStatus, WorkflowStepType | null> = {
  new: null,
  in_progress: null,
  dev_review: 'dev_review',
  qa_review: 'qa_review',
  pm_review: 'pm_review',
  resolved: null,
  rejected: null,
};

// Priority and status display configurations
export const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  low: {
    label: 'Low',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
} as const;

export const STATUS_CONFIG = {
  new: {
    label: 'New',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  dev_review: {
    label: 'Dev Review',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  qa_review: {
    label: 'QA Review',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  pm_review: {
    label: 'PM Review',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
} as const;
