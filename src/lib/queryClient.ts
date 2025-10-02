import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds after data is considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Time in milliseconds after unused/inactive cache data is garbage collected
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry for 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations
      retry: (failureCount, error: any) => {
        // Don't retry for 4xx errors except 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      // Retry delay for mutations
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth related queries
  auth: {
    user: () => ['auth', 'user'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },

  // Issues related queries
  issues: {
    all: () => ['issues'] as const,
    lists: () => [...queryKeys.issues.all(), 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.issues.lists(), { filters }] as const,
    details: () => [...queryKeys.issues.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.issues.details(), id] as const,
    workflow: (id: string) => [...queryKeys.issues.detail(id), 'workflow'] as const,
  },

  // Comments related queries
  comments: {
    all: () => ['comments'] as const,
    byIssue: (issueId: string) => [...queryKeys.comments.all(), 'byIssue', issueId] as const,
    detail: (id: string) => [...queryKeys.comments.all(), 'detail', id] as const,
  },

  // Notifications related queries
  notifications: {
    all: () => ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all(), 'list'] as const,
    unread: () => [...queryKeys.notifications.lists(), 'unread'] as const,
    detail: (id: string) => [...queryKeys.notifications.all(), 'detail', id] as const,
  },

  // Workflow related queries
  workflow: {
    all: () => ['workflow'] as const,
    steps: () => [...queryKeys.workflow.all(), 'steps'] as const,
    transitions: (fromStatus: string) =>
      [...queryKeys.workflow.all(), 'transitions', fromStatus] as const,
  },
} as const;

// Helper function to invalidate related queries
export const invalidateQueries = {
  // Invalidate all issues queries
  issues: () => queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() }),

  // Invalidate specific issue and related data
  issue: (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.comments.byIssue(id) });
  },

  // Invalidate all comments for an issue
  issueComments: (issueId: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.comments.byIssue(issueId) }),

  // Invalidate notifications
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() }),

  // Invalidate auth data
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() }),
};

// Helper function to set query data optimistically
export const setOptimisticData = {
  // Update issue status optimistically
  updateIssueStatus: (id: string, status: string) => {
    queryClient.setQueryData(queryKeys.issues.detail(id), (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData, status };
    });
  },

  // Add comment optimistically
  addComment: (issueId: string, comment: any) => {
    queryClient.setQueryData(queryKeys.comments.byIssue(issueId), (oldData: any) => {
      if (!oldData) return [comment];
      return [...oldData, comment];
    });
  },

  // Mark notification as read optimistically
  markNotificationRead: (id: string) => {
    queryClient.setQueryData(queryKeys.notifications.detail(id), (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData, isRead: true, readAt: new Date().toISOString() };
    });
  },
};
