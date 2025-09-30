import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries, setOptimisticData } from '../../lib/queryClient';
import type {
  Issue,
  CreateIssueRequest,
  UpdateIssueRequest,
  IssueFilters,
  IssueStatus,
  IssuePriority,
} from '../../types/issues';

// Services - These will be implemented later in the services phase
// For now we'll create placeholder functions that return mock data for testing
const mockIssues: Issue[] = [
  {
    id: '1',
    title: 'Login page not responsive on mobile devices',
    description:
      'The login form elements are overlapping on mobile devices with screen width less than 768px',
    type: 'bug',
    priority: 'high',
    status: 'in_progress',
    createdBy: 'john.doe@example.com',
    assignedTo: 'jane.smith@example.com',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
    estimatedHours: 8,
    actualHours: 6,
  },
  {
    id: '2',
    title: 'Add dark mode toggle to settings',
    description: 'Users have requested a dark mode option to reduce eye strain during night usage',
    type: 'feature',
    priority: 'medium',
    status: 'new',
    createdBy: 'alice.johnson@example.com',
    assignedTo: 'bob.wilson@example.com',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-14T09:15:00Z',
    estimatedHours: 12,
  },
  {
    id: '3',
    title: 'Database connection timeout error',
    description: 'Random database timeouts occurring during peak hours affecting user experience',
    type: 'bug',
    priority: 'high',
    status: 'qa_review',
    createdBy: 'mike.chen@example.com',
    assignedTo: 'sarah.davis@example.com',
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-17T11:30:00Z',
    estimatedHours: 16,
    actualHours: 14,
  },
  {
    id: '4',
    title: 'API optimization for better performance',
    description: 'Optimize database queries and add caching to improve API response times',
    type: 'feature',
    priority: 'low',
    status: 'resolved',
    createdBy: 'emma.taylor@example.com',
    assignedTo: 'david.brown@example.com',
    createdAt: '2024-01-10T13:20:00Z',
    updatedAt: '2024-01-18T10:45:00Z',
    resolvedAt: '2024-01-18T10:45:00Z',
    estimatedHours: 20,
    actualHours: 18,
  },
  {
    id: '5',
    title: 'User profile image upload feature',
    description: 'Allow users to upload and crop profile images with proper validation',
    type: 'feature',
    priority: 'medium',
    status: 'pm_review',
    createdBy: 'tom.anderson@example.com',
    assignedTo: 'lisa.garcia@example.com',
    createdAt: '2024-01-12T11:10:00Z',
    updatedAt: '2024-01-17T15:25:00Z',
    estimatedHours: 10,
    actualHours: 8,
  },
];

const issuesService = {
  getIssues: async (filters?: IssueFilters): Promise<Issue[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let filteredIssues = [...mockIssues];

    // Apply filters if provided
    if (filters?.status) {
      filteredIssues = filteredIssues.filter(issue => issue.status === filters.status);
    }

    if (filters?.priority) {
      filteredIssues = filteredIssues.filter(issue => issue.priority === filters.priority);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredIssues = filteredIssues.filter(
        issue =>
          issue.title.toLowerCase().includes(searchLower) ||
          issue.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.assignedTo) {
      filteredIssues = filteredIssues.filter(issue => issue.assignedTo === filters.assignedTo);
    }

    if (filters?.createdBy) {
      filteredIssues = filteredIssues.filter(issue => issue.createdBy === filters.createdBy);
    }

    return filteredIssues;
  },

  getIssue: async (id: string): Promise<Issue> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const issue = mockIssues.find(issue => issue.id === id);
    if (!issue) {
      throw new Error(`Issue with id ${id} not found`);
    }
    return issue;
  },

  createIssue: async (_data: CreateIssueRequest): Promise<Issue> => {
    // TODO: Implement actual service call
    throw new Error('Create issue service not implemented yet');
  },

  updateIssue: async (_id: string, _data: UpdateIssueRequest): Promise<Issue> => {
    // TODO: Implement actual service call
    throw new Error('Update issue service not implemented yet');
  },

  deleteIssue: async (_id: string): Promise<void> => {
    // TODO: Implement actual service call
    throw new Error('Delete issue service not implemented yet');
  },

  updateIssueStatus: async (_id: string, _status: string): Promise<Issue> => {
    // TODO: Implement actual service call
    throw new Error('Update issue status service not implemented yet');
  },

  getWorkflowTransitions: async (_issueId: string): Promise<IssueStatus[]> => {
    // TODO: Implement actual service call
    throw new Error('Workflow transitions service not implemented yet');
  },
};

// Query hooks for fetching data
export const useIssues = (filters?: IssueFilters) => {
  return useQuery({
    queryKey: queryKeys.issues.list(filters || {}),
    queryFn: () => issuesService.getIssues(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useIssue = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.issues.detail(id),
    queryFn: () => issuesService.getIssue(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useWorkflowTransitions = (issueId: string) => {
  return useQuery({
    queryKey: queryKeys.issues.workflow(issueId),
    queryFn: () => issuesService.getWorkflowTransitions(issueId),
    enabled: !!issueId,
    staleTime: 10 * 60 * 1000, // 10 minutes - workflow rules don't change often
  });
};

// Mutation hooks for data modifications
export const useCreateIssue = () => {
  return useMutation({
    mutationFn: (data: CreateIssueRequest) => issuesService.createIssue(data),
    onSuccess: () => {
      // Invalidate and refetch issues list
      invalidateQueries.issues();
    },
    onError: error => {
      console.error('Failed to create issue:', error);
    },
  });
};

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIssueRequest }) =>
      issuesService.updateIssue(id, data),
    onSuccess: updatedIssue => {
      // Update the specific issue in cache
      queryClient.setQueryData(queryKeys.issues.detail(updatedIssue.id), updatedIssue);
      // Invalidate issues list to reflect changes
      invalidateQueries.issues();
    },
    onError: error => {
      console.error('Failed to update issue:', error);
    },
  });
};

export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      issuesService.updateIssueStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(id) });

      // Snapshot the previous value
      const previousIssue = queryClient.getQueryData(queryKeys.issues.detail(id));

      // Optimistically update
      setOptimisticData.updateIssueStatus(id, status);

      // Return a context object with the snapshotted value
      return { previousIssue, id };
    },
    onError: (_err, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousIssue) {
        queryClient.setQueryData(queryKeys.issues.detail(id), context.previousIssue);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(id) });
      invalidateQueries.issues();
    },
  });
};

export const useDeleteIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => issuesService.deleteIssue(id),
    onSuccess: (_, deletedId) => {
      // Remove the issue from cache
      queryClient.removeQueries({ queryKey: queryKeys.issues.detail(deletedId) });
      // Invalidate issues list
      invalidateQueries.issues();
    },
    onError: error => {
      console.error('Failed to delete issue:', error);
    },
  });
};

// Prefetch hooks for performance optimization
export const usePrefetchIssue = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.issues.detail(id),
      queryFn: () => issuesService.getIssue(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Custom hooks for common patterns
export const useIssuesByStatus = (status: IssueStatus) => {
  return useIssues({ status });
};

export const useIssuesByAssignee = (assigneeId: string) => {
  return useIssues({ assignedTo: assigneeId });
};

export const useMyIssues = (userId: string) => {
  return useIssues({ assignedTo: userId });
};

export const useIssuesByPriority = (priority: IssuePriority) => {
  return useIssues({ priority });
};
