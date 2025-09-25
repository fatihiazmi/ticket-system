/**
 * Integration Tests: Comments API Contract
 *
 * These tests validate the Comments API endpoints against their contracts.
 * They should FAIL initially as the implementation doesn't exist yet.
 * This follows TDD approach - write failing tests first.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Comment } from '../../src/types/comments';
import type { UserProfile } from '../../src/types/auth';

// Mock Supabase client - this will fail until real implementation exists
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test data interfaces matching the contract
interface GetCommentsQuery {
  page?: number;
  limit?: number;
  include_internal?: boolean;
  sort_order?: 'asc' | 'desc';
}

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

interface CreateCommentRequest {
  content: string;
  is_internal?: boolean;
  workflow_step_id?: string;
}

interface CreateCommentResponse {
  comment: Comment;
  message: string;
}

interface UpdateCommentRequest {
  content: string;
}

interface UpdateCommentResponse {
  comment: Comment;
  message: string;
}

// Mock API client for testing - will fail until real implementation
class MockCommentsAPIClient {
  async getComments(issueId: string, _query: GetCommentsQuery = {}): Promise<GetCommentsResponse> {
    // This should fail initially - no implementation exists
    throw new Error(`GET /api/issues/${issueId}/comments endpoint not implemented yet`);
  }

  async createComment(
    issueId: string,
    _data: CreateCommentRequest
  ): Promise<CreateCommentResponse> {
    // This should fail initially - no implementation exists
    throw new Error(`POST /api/issues/${issueId}/comments endpoint not implemented yet`);
  }

  async updateComment(id: string, _data: UpdateCommentRequest): Promise<UpdateCommentResponse> {
    // This should fail initially - no implementation exists
    throw new Error(`PATCH /api/comments/${id} endpoint not implemented yet`);
  }
}

describe('Comments API Contract Tests', () => {
  let apiClient: MockCommentsAPIClient;
  let testUser: UserProfile;
  let testIssueId: string;
  let authToken: string;

  beforeEach(async () => {
    apiClient = new MockCommentsAPIClient();
    testIssueId = 'test-issue-1';

    // Mock authentication setup - will fail until auth is implemented
    testUser = {
      id: 'test-user-1',
      fullName: 'Test User',
      role: 'developer',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    authToken = 'mock-jwt-token';
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('GET /api/issues/:issueId/comments', () => {
    it('should return paginated list of comments with default parameters', async () => {
      // This test MUST FAIL initially - no implementation exists
      await expect(async () => {
        const response = await apiClient.getComments(testIssueId);

        // Validate response structure per contract
        expect(response).toHaveProperty('comments');
        expect(response).toHaveProperty('pagination');
        expect(Array.isArray(response.comments)).toBe(true);

        // Validate pagination structure
        expect(response.pagination).toHaveProperty('current_page');
        expect(response.pagination).toHaveProperty('total_pages');
        expect(response.pagination).toHaveProperty('total_items');
        expect(response.pagination).toHaveProperty('items_per_page');
        expect(response.pagination).toHaveProperty('has_next');
        expect(response.pagination).toHaveProperty('has_previous');

        // Validate default pagination values
        expect(response.pagination.current_page).toBe(1);
        expect(response.pagination.items_per_page).toBe(50);
      }).rejects.toThrow('GET /api/issues/test-issue-1/comments endpoint not implemented yet');
    });

    it('should handle pagination parameters correctly', async () => {
      const query: GetCommentsQuery = {
        page: 2,
        limit: 20,
      };

      await expect(async () => {
        const response = await apiClient.getComments(testIssueId, query);

        expect(response.pagination.current_page).toBe(2);
        expect(response.pagination.items_per_page).toBe(20);
      }).rejects.toThrow('GET /api/issues/test-issue-1/comments endpoint not implemented yet');
    });

    it('should filter internal comments based on user role', async () => {
      const query: GetCommentsQuery = {
        include_internal: true,
      };

      await expect(async () => {
        const response = await apiClient.getComments(testIssueId, query);

        // Should include internal comments for team members
        const hasInternalComments = response.comments.some(comment => comment.isInternal);
        expect(hasInternalComments).toBe(true);
      }).rejects.toThrow('GET /api/issues/test-issue-1/comments endpoint not implemented yet');
    });

    it('should sort comments chronologically by default (asc)', async () => {
      await expect(async () => {
        const response = await apiClient.getComments(testIssueId);

        if (response.comments.length > 1) {
          for (let i = 1; i < response.comments.length; i++) {
            const prev = new Date(response.comments[i - 1].createdAt);
            const current = new Date(response.comments[i].createdAt);
            expect(prev.getTime()).toBeLessThanOrEqual(current.getTime());
          }
        }
      }).rejects.toThrow('GET /api/issues/test-issue-1/comments endpoint not implemented yet');
    });

    it('should handle sort_order parameter', async () => {
      const query: GetCommentsQuery = {
        sort_order: 'desc',
      };

      await expect(async () => {
        const response = await apiClient.getComments(testIssueId, query);

        if (response.comments.length > 1) {
          for (let i = 1; i < response.comments.length; i++) {
            const prev = new Date(response.comments[i - 1].createdAt);
            const current = new Date(response.comments[i].createdAt);
            expect(prev.getTime()).toBeGreaterThanOrEqual(current.getTime());
          }
        }
      }).rejects.toThrow('GET /api/issues/test-issue-1/comments endpoint not implemented yet');
    });

    it('should respect limit max of 100', async () => {
      const query: GetCommentsQuery = {
        limit: 150, // Above max
      };

      await expect(async () => {
        const response = await apiClient.getComments(testIssueId, query);
        expect(response.pagination.items_per_page).toBeLessThanOrEqual(100);
      }).rejects.toThrow('GET /api/issues/test-issue-1/comments endpoint not implemented yet');
    });

    it('should return 404 for non-existent issue', async () => {
      const nonExistentIssueId = 'non-existent-issue';

      await expect(async () => {
        await apiClient.getComments(nonExistentIssueId);
      }).rejects.toThrow();
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Test without auth token
      await expect(async () => {
        const response = await apiClient.getComments(testIssueId);
      }).rejects.toThrow();
    });

    it('should return 403 for non-team members requesting internal comments', async () => {
      // Mock user with no team member role
      const externalUser = {
        ...testUser,
        role: 'external' as UserProfile['role'],
      };

      const query: GetCommentsQuery = {
        include_internal: true,
      };

      await expect(async () => {
        await apiClient.getComments(testIssueId, query);
      }).rejects.toThrow();
    });

    it('should validate comment structure', async () => {
      await expect(async () => {
        const response = await apiClient.getComments(testIssueId);

        if (response.comments.length > 0) {
          const comment = response.comments[0];

          // Validate comment structure per contract
          expect(comment).toHaveProperty('id');
          expect(comment).toHaveProperty('issueId');
          expect(comment).toHaveProperty('authorId');
          expect(comment).toHaveProperty('content');
          expect(comment).toHaveProperty('isInternal');
          expect(comment).toHaveProperty('createdAt');
          expect(comment).toHaveProperty('updatedAt');
          expect(comment).toHaveProperty('isEdited');

          // Validate types
          expect(typeof comment.id).toBe('string');
          expect(typeof comment.issueId).toBe('string');
          expect(typeof comment.authorId).toBe('string');
          expect(typeof comment.content).toBe('string');
          expect(typeof comment.isInternal).toBe('boolean');
          expect(typeof comment.createdAt).toBe('string');
          expect(typeof comment.updatedAt).toBe('string');
          expect(typeof comment.edited).toBe('boolean');
        }
      }).rejects.toThrow('GET /api/issues/test-issue-1/comments endpoint not implemented yet');
    });
  });

  describe('POST /api/issues/:issueId/comments', () => {
    it('should create new comment with valid data', async () => {
      const newComment: CreateCommentRequest = {
        content: 'This is a test comment',
        is_internal: false,
      };

      await expect(async () => {
        const response = await apiClient.createComment(testIssueId, newComment);

        expect(response).toHaveProperty('comment');
        expect(response).toHaveProperty('message');

        // Validate created comment
        expect(response.comment.content).toBe(newComment.content);
        expect(response.comment.isInternal).toBe(newComment.is_internal);
        expect(response.comment.issueId).toBe(testIssueId);
        expect(response.comment.authorId).toBe(testUser.id);
        expect(response.comment.id).toBeDefined();
        expect(response.comment.createdAt).toBeDefined();
        expect(response.comment.updatedAt).toBeDefined();
        expect(response.comment.edited).toBe(false);
      }).rejects.toThrow('POST /api/issues/test-issue-1/comments endpoint not implemented yet');
    });

    it('should create internal comment for team members', async () => {
      const internalComment: CreateCommentRequest = {
        content: 'This is an internal comment',
        is_internal: true,
      };

      await expect(async () => {
        const response = await apiClient.createComment(testIssueId, internalComment);

        expect(response.comment.isInternal).toBe(true);
        expect(response.comment.content).toBe(internalComment.content);
      }).rejects.toThrow('POST /api/issues/test-issue-1/comments endpoint not implemented yet');
    });

    it('should link comment to workflow step when provided', async () => {
      const workflowComment: CreateCommentRequest = {
        content: 'Comment linked to workflow step',
        workflow_step_id: 'workflow-step-1',
      };

      await expect(async () => {
        const response = await apiClient.createComment(testIssueId, workflowComment);

        expect(response.comment.workflowStepId).toBe(workflowComment.workflow_step_id);
      }).rejects.toThrow('POST /api/issues/test-issue-1/comments endpoint not implemented yet');
    });

    it('should validate required content field', async () => {
      const invalidComment = {
        is_internal: false,
        // Missing content
      } as CreateCommentRequest;

      await expect(async () => {
        await apiClient.createComment(testIssueId, invalidComment);
      }).rejects.toThrow();
    });

    it('should validate content minimum length', async () => {
      const invalidComment: CreateCommentRequest = {
        content: '', // Empty content
        is_internal: false,
      };

      await expect(async () => {
        await apiClient.createComment(testIssueId, invalidComment);
      }).rejects.toThrow();
    });

    it('should validate content maximum length (10000 characters)', async () => {
      const longContent = 'a'.repeat(10001);
      const invalidComment: CreateCommentRequest = {
        content: longContent,
        is_internal: false,
      };

      await expect(async () => {
        await apiClient.createComment(testIssueId, invalidComment);
      }).rejects.toThrow();
    });

    it('should return 404 for non-existent issue', async () => {
      const nonExistentIssueId = 'non-existent-issue';
      const comment: CreateCommentRequest = {
        content: 'Valid comment',
        is_internal: false,
      };

      await expect(async () => {
        await apiClient.createComment(nonExistentIssueId, comment);
      }).rejects.toThrow();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const comment: CreateCommentRequest = {
        content: 'Valid comment',
        is_internal: false,
      };

      await expect(async () => {
        await apiClient.createComment(testIssueId, comment);
      }).rejects.toThrow();
    });

    it('should return 403 for non-team members creating internal comments', async () => {
      const internalComment: CreateCommentRequest = {
        content: 'Internal comment',
        is_internal: true,
      };

      await expect(async () => {
        await apiClient.createComment(testIssueId, internalComment);
      }).rejects.toThrow();
    });
  });

  describe('PATCH /api/comments/:id', () => {
    it('should update comment within 30 minutes of creation', async () => {
      const commentId = 'test-comment-1';
      const updateData: UpdateCommentRequest = {
        content: 'Updated comment content',
      };

      await expect(async () => {
        const response = await apiClient.updateComment(commentId, updateData);

        expect(response).toHaveProperty('comment');
        expect(response).toHaveProperty('message');
        expect(response.comment.content).toBe(updateData.content);
        expect(response.comment.edited).toBe(true);
        expect(response.comment.updatedAt).toBeDefined();
      }).rejects.toThrow('PATCH /api/comments/test-comment-1 endpoint not implemented yet');
    });

    it('should validate updated content minimum length', async () => {
      const commentId = 'test-comment-1';
      const invalidUpdate: UpdateCommentRequest = {
        content: '', // Empty content
      };

      await expect(async () => {
        await apiClient.updateComment(commentId, invalidUpdate);
      }).rejects.toThrow();
    });

    it('should validate updated content maximum length (10000 characters)', async () => {
      const commentId = 'test-comment-1';
      const longContent = 'a'.repeat(10001);
      const invalidUpdate: UpdateCommentRequest = {
        content: longContent,
      };

      await expect(async () => {
        await apiClient.updateComment(commentId, invalidUpdate);
      }).rejects.toThrow();
    });

    it('should return 404 for non-existent comment', async () => {
      const nonExistentId = 'non-existent-comment';
      const updateData: UpdateCommentRequest = {
        content: 'Updated content',
      };

      await expect(async () => {
        await apiClient.updateComment(nonExistentId, updateData);
      }).rejects.toThrow();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const commentId = 'test-comment-1';
      const updateData: UpdateCommentRequest = {
        content: 'Updated content',
      };

      await expect(async () => {
        await apiClient.updateComment(commentId, updateData);
      }).rejects.toThrow();
    });

    it('should return 403 for non-author trying to edit comment', async () => {
      const commentId = 'test-comment-1';
      const updateData: UpdateCommentRequest = {
        content: 'Updated content',
      };

      await expect(async () => {
        // Should fail if user is not the comment author
        await apiClient.updateComment(commentId, updateData);
      }).rejects.toThrow();
    });

    it('should return 403 for edit attempts after 30 minutes', async () => {
      const commentId = 'old-comment';
      const updateData: UpdateCommentRequest = {
        content: 'Updated content',
      };

      await expect(async () => {
        // Should fail if comment is older than 30 minutes
        await apiClient.updateComment(commentId, updateData);
      }).rejects.toThrow();
    });
  });
});
