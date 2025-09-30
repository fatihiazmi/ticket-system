import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ViewHorizontalIcon,
  ListBulletIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { IssuesList } from '../components/features/issues/IssuesList';
import { KanbanBoard } from '../components/features/issues/KanbanBoard';
import { useIssues } from '../hooks/queries/useIssues';
import { useAuthStore } from '../stores/authStore';
import type { IssuePriority, IssueStatus } from '../types/issues';
import type { UserProfile } from '../types/auth';

type ViewMode = 'list' | 'kanban';

// Convert database user to UserProfile interface
const convertUserProfile = (user: any): UserProfile => ({
  id: user.id,
  fullName: user.full_name,
  avatarUrl: user.avatar_url,
  role: user.role,
  isActive: user.is_active,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const IssuesPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all');

  const {
    data: issues = [],
    isLoading,
    error,
  } = useIssues({
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
  });

  const handleIssueClick = (issueId: string) => {
    navigate(`/issues/${issueId}`);
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'dev_review', label: 'Dev Review' },
    { value: 'qa_review', label: 'QA Review' },
    { value: 'pm_review', label: 'PM Review' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-96'>
          <CardHeader>
            <CardTitle className='text-red-600'>Error Loading Issues</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant='outline' className='w-full'>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-96'>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need to be logged in to view issues.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Issues</h1>
              <p className='mt-2 text-gray-600'>
                Manage and track project issues across different workflows
              </p>
            </div>
            <Button className='flex items-center gap-2' disabled>
              <PlusIcon className='h-4 w-4' />
              Create Issue
            </Button>
          </div>

          {/* Filters and View Toggle */}
          <div className='flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center'>
            <div className='flex flex-wrap items-center gap-4'>
              {/* Search */}
              <div className='relative'>
                <MagnifyingGlassIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search issues...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-64 pl-10'
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as IssueStatus | 'all')}
                className='h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as IssuePriority | 'all')}
                className='h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Active Filters Display */}
              <div className='flex gap-2'>
                {statusFilter !== 'all' && (
                  <Badge variant='secondary' className='flex items-center gap-1'>
                    Status: {statusOptions.find(o => o.value === statusFilter)?.label}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className='ml-1 rounded-full p-0.5 hover:bg-gray-300'
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {priorityFilter !== 'all' && (
                  <Badge variant='secondary' className='flex items-center gap-1'>
                    Priority: {priorityOptions.find(o => o.value === priorityFilter)?.label}
                    <button
                      onClick={() => setPriorityFilter('all')}
                      className='ml-1 rounded-full p-0.5 hover:bg-gray-300'
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>

            {/* View Toggle */}
            <div className='flex items-center gap-2 rounded-lg border bg-white p-1'>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('kanban')}
                className='flex items-center gap-2'
              >
                <ViewHorizontalIcon className='h-4 w-4' />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('list')}
                className='flex items-center gap-2'
              >
                <ListBulletIcon className='h-4 w-4' />
                List
              </Button>
            </div>
          </div>

          {/* Issues Count */}
          <div className='mt-4 text-sm text-gray-600'>
            {isLoading
              ? 'Loading issues...'
              : `${issues.length} issue${issues.length !== 1 ? 's' : ''} found`}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'kanban' ? (
            <KanbanBoard
              issues={issues}
              currentUser={convertUserProfile(user)}
              onIssueClick={handleIssueClick}
              isLoading={isLoading}
            />
          ) : (
            <IssuesList
              issues={issues}
              currentUser={convertUserProfile(user)}
              onIssueClick={handleIssueClick}
              isLoading={isLoading}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default IssuesPage;
