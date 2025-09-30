import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries, setOptimisticData } from '../../lib/queryClient';
import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentFilters,
} from '../../types/comments';

// Services - These will be implemented later in the services phase
// For now we'll create placeholder functions that return mock data for testing
const mockComments: Comment[] = [
  {
    id: '1',
    issueId: '1',
    content:
      'I can reproduce this issue on my iPhone 12. The form elements are definitely overlapping.',
    authorId: 'jane.smith@example.com',
    isInternal: false,
    createdAt: '2024-01-15T11:30:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    edited: false,
  },
  {
    id: '2',
    issueId: '1',
    content:
      'Working on a fix for this. Will need to adjust the CSS media queries for mobile breakpoints.',
    authorId: 'john.doe@example.com',
    isInternal: false,
    createdAt: '2024-01-16T09:15:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
    edited: false,
  },
  {
    id: '3',
    issueId: '2',
    content:
      'This would be a great addition! I suggest using a system preference detection by default.',
    authorId: 'mike.chen@example.com',
    isInternal: false,
    createdAt: '2024-01-14T10:20:00Z',
    updatedAt: '2024-01-14T10:20:00Z',
    edited: false,
  },
  {
    id: '4',
    issueId: '3',
    content: 'I noticed this happening around 2 PM EST when traffic is highest.',
    authorId: 'sarah.davis@example.com',
    isInternal: false,
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
    edited: false,
  },
];

const commentsService = {
  getCommentsByIssue: async (issueId: string, _filters?: CommentFilters): Promise<Comment[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return mockComments.filter(comment => comment.issueId === issueId);
  },

  getComment: async (id: string): Promise<Comment> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const comment = mockComments.find(comment => comment.id === id);
    if (!comment) {
      throw new Error(`Comment with id ${id} not found`);
    }
    return comment;
  },

  createComment: async (_data: CreateCommentRequest): Promise<Comment> => {
    // TODO: Implement actual service call
    throw new Error('Create comment service not implemented yet');
  },

  updateComment: async (_id: string, _data: UpdateCommentRequest): Promise<Comment> => {
    // TODO: Implement actual service call
    throw new Error('Update comment service not implemented yet');
  },

  deleteComment: async (_id: string): Promise<void> => {
    // TODO: Implement actual service call
    throw new Error('Comments service not implemented yet');
  },

  getCommentThread: async (_commentId: string): Promise<Comment[]> => {
    // TODO: Implement actual service call
    throw new Error('Comments service not implemented yet');
  },
};

// Query hooks for fetching data
export const useCommentsByIssue = (issueId: string, filters?: CommentFilters) => {
  return useQuery({
    queryKey: queryKeys.comments.byIssue(issueId),
    queryFn: () => commentsService.getCommentsByIssue(issueId, filters),
    enabled: !!issueId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useComment = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.comments.detail(id),
    queryFn: () => commentsService.getComment(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCommentThread = (commentId: string) => {
  return useQuery({
    queryKey: [...queryKeys.comments.detail(commentId), 'thread'],
    queryFn: () => commentsService.getCommentThread(commentId),
    enabled: !!commentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hooks for data modifications
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => commentsService.createComment(data),
    onMutate: async newComment => {
      // Cancel any outgoing refetches for this issue's comments
      await queryClient.cancelQueries({
        queryKey: queryKeys.comments.byIssue(newComment.issueId),
      });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(
        queryKeys.comments.byIssue(newComment.issueId)
      );

      // Optimistically update with temporary comment
      const tempComment: Comment = {
        id: `temp-${Date.now()}`,
        issueId: newComment.issueId,
        content: newComment.content,
        authorId: 'current-user', // This should come from auth context
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workflowStepId: newComment.workflowStepId,
        isInternal: newComment.isInternal || false,
        edited: false,
      };

      setOptimisticData.addComment(newComment.issueId, tempComment);

      // Return a context object with the snapshotted value
      return { previousComments, issueId: newComment.issueId };
    },
    onError: (_err, newComment, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.comments.byIssue(newComment.issueId),
          context.previousComments
        );
      }
    },
    onSuccess: createdComment => {
      // Invalidate and refetch comments for this issue
      invalidateQueries.issueComments(createdComment.issueId);
      // Also invalidate the issue to update comment count
      invalidateQueries.issue(createdComment.issueId);
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentRequest }) =>
      commentsService.updateComment(id, data),
    onSuccess: updatedComment => {
      // Update the specific comment in cache
      queryClient.setQueryData(queryKeys.comments.detail(updatedComment.id), updatedComment);
      // Invalidate comments list for this issue
      invalidateQueries.issueComments(updatedComment.issueId);
    },
    onError: error => {
      console.error('Failed to update comment:', error);
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentsService.deleteComment(id),
    onMutate: async commentId => {
      // Get the comment to find the issue ID
      const comment = queryClient.getQueryData(queryKeys.comments.detail(commentId)) as Comment;
      if (!comment) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.comments.byIssue(comment.issueId),
      });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(
        queryKeys.comments.byIssue(comment.issueId)
      );

      // Optimistically remove comment
      queryClient.setQueryData(
        queryKeys.comments.byIssue(comment.issueId),
        (oldComments: Comment[] | undefined) => oldComments?.filter(c => c.id !== commentId) || []
      );

      return { previousComments, issueId: comment.issueId };
    },
    onError: (_err, _commentId, context) => {
      // Roll back on error
      if (context?.previousComments && context?.issueId) {
        queryClient.setQueryData(
          queryKeys.comments.byIssue(context.issueId),
          context.previousComments
        );
      }
    },
    onSuccess: (_data, _commentId, context) => {
      // Remove the comment from cache completely
      queryClient.removeQueries({ queryKey: queryKeys.comments.detail(_commentId) });
      // Invalidate comments list and issue
      if (context?.issueId) {
        invalidateQueries.issueComments(context.issueId);
        invalidateQueries.issue(context.issueId);
      }
    },
  });
};

// Prefetch hooks for performance optimization
export const usePrefetchComment = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.comments.detail(id),
      queryFn: () => commentsService.getComment(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

export const usePrefetchCommentsByIssue = () => {
  const queryClient = useQueryClient();

  return (issueId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.comments.byIssue(issueId),
      queryFn: () => commentsService.getCommentsByIssue(issueId),
      staleTime: 2 * 60 * 1000,
    });
  };
};

// Custom hooks for common patterns
export const useCommentsByIssueCount = (issueId: string) => {
  const { data: comments } = useCommentsByIssue(issueId);
  return comments?.length || 0;
};

export const useRootComments = (issueId: string) => {
  const { data: comments, ...rest } = useCommentsByIssue(issueId);
  // Since the current Comment type doesn't have threading, return all comments
  const rootComments = comments || [];
  return { data: rootComments, ...rest };
};

export const useCommentReplies = (_parentCommentId: string, issueId: string) => {
  const { data: comments, ...rest } = useCommentsByIssue(issueId);
  // Since the current Comment type doesn't have threading, return empty array
  const replies: Comment[] = [];
  return { data: replies, ...rest };
};
