import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { IssueDetails } from '../components/features/issues/IssueDetails';
import { CommentThread } from '../components/features/comments/CommentThread';
import { useIssue } from '../hooks/queries/useIssues';
import { useCommentsByIssue } from '../hooks/queries/useComments';
import { useAuthStore } from '../stores/authStore';
import type { UserProfile } from '../types/auth';

// Convert database user to UserProfile interface
const convertUserProfile = (user: any): UserProfile | null => {
  if (!user) return null;

  return {
    id: user.id,
    fullName: user.full_name || user.fullName || 'Unknown User',
    avatarUrl: user.avatar_url || user.avatarUrl,
    role: user.role,
    isActive: user.is_active ?? user.isActive ?? true,
    createdAt: user.created_at || user.createdAt || new Date().toISOString(),
    updatedAt: user.updated_at || user.updatedAt || new Date().toISOString(),
  };
};

const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: issue, isLoading: issueLoading, error: issueError } = useIssue(id!);

  const { data: comments = [], isLoading: commentsLoading } = useCommentsByIssue(id!);

  // Early return if no user
  if (!user) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-96'>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to view this issue.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let userProfile: UserProfile | null = null;
  try {
    userProfile = convertUserProfile(user);
  } catch (error) {
    console.error('Error converting user profile:', error);
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-96'>
          <CardHeader>
            <CardTitle>Profile Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an issue loading your user profile. Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (issueError) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-96'>
          <CardHeader>
            <CardTitle className='text-red-600'>Error Loading Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {issueError instanceof Error ? issueError.message : 'An unexpected error occurred'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (issueLoading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
          <div className='animate-pulse space-y-6'>
            <div className='h-8 w-1/3 rounded bg-gray-200'></div>
            <div className='h-64 rounded bg-gray-200'></div>
            <div className='h-48 rounded bg-gray-200'></div>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-96'>
          <CardHeader>
            <CardTitle>Issue Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The issue you're looking for doesn't exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        {/* Use the IssueDetails component for everything except comments */}
        <IssueDetails
          issue={issue}
          currentUser={userProfile!}
          onBack={() => navigate('/issues')}
          className='mb-8'
        />

        {/* Comments Section - aligned with the main content layout */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4'>
          <div className='lg:col-span-2 xl:col-span-3'>
            <Card>
              <CardHeader>
                <CardTitle>Comments ({comments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <CommentThread
                  comments={comments as any} // TODO: Fix type mismatch
                  currentUser={userProfile!}
                  isLoading={commentsLoading}
                />
              </CardContent>
            </Card>
          </div>
          {/* Empty space to maintain grid alignment */}
          <div className='hidden lg:col-span-1 lg:block xl:col-span-1'>
            {/* This maintains the grid structure but doesn't display anything */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPage;
