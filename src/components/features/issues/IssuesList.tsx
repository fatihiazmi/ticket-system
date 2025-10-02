import * as React from 'react';
import { Search, Filter, SortAsc, SortDesc, Plus } from 'lucide-react';
import { Button, Input, Select, Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui';
import { IssueCard } from './IssueCard';
import type { Issue, IssueStatus, IssuePriority, IssueType } from '../../../types/issues';
import type { UserProfile } from '../../../types/auth';
import { cn } from '../../../lib/utils';

interface IssuesListProps {
  issues: Issue[];
  currentUser: UserProfile;
  isLoading?: boolean;
  onCreateIssue?: () => void;
  onIssueClick?: (issueId: string) => void;
  onStatusChange?: (issueId: string, status: IssueStatus) => void;
  onPriorityChange?: (issueId: string, priority: IssuePriority) => void;
  onAssigneeChange?: (issueId: string, assigneeId: string) => void;
  onDelete?: (issueId: string) => void;
  availableUsers?: UserProfile[];
  className?: string;
}

type SortField = 'title' | 'createdAt' | 'priority' | 'status' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface Filters {
  search: string;
  status: IssueStatus | 'all';
  priority: IssuePriority | 'all';
  type: IssueType | 'all';
  assignedTo: string | 'all' | 'unassigned';
}

const priorityOrder = { high: 3, medium: 2, low: 1 };
const statusOrder = {
  new: 1,
  in_progress: 2,
  dev_review: 3,
  qa_review: 4,
  pm_review: 5,
  resolved: 6,
  rejected: 7,
};

export function IssuesList({
  issues,
  currentUser,
  isLoading = false,
  onCreateIssue,
  onIssueClick,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDelete,
  availableUsers = [],
  className,
}: IssuesListProps): React.JSX.Element {
  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    status: 'all',
    priority: 'all',
    type: 'all',
    assignedTo: 'all',
  });

  const [sortField, setSortField] = React.useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');

  // Filter issues
  const filteredIssues = React.useMemo(() => {
    return issues.filter(issue => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          issue.title.toLowerCase().includes(searchLower) ||
          issue.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && issue.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && issue.priority !== filters.priority) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && issue.type !== filters.type) {
        return false;
      }

      // Assignee filter
      if (filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'unassigned' && issue.assignedTo) {
          return false;
        }
        if (filters.assignedTo !== 'unassigned' && issue.assignedTo !== filters.assignedTo) {
          return false;
        }
      }

      return true;
    });
  }, [issues, filters]);

  // Sort issues
  const sortedIssues = React.useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
        case 'updatedAt':
          aValue = new Date(a[sortField]).getTime();
          bValue = new Date(b[sortField]).getTime();
          break;
        case 'priority':
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredIssues, sortField, sortDirection]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      type: 'all',
      assignedTo: 'all',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(
    value => value !== 'all' && value !== ''
  ).length;

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardContent className='p-4'>
              <div className='space-y-3'>
                <div className='h-4 w-3/4 rounded bg-gray-200'></div>
                <div className='h-3 w-1/2 rounded bg-gray-200'></div>
                <div className='h-3 w-full rounded bg-gray-200'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h2 className='text-2xl font-bold'>Issues</h2>
          <p className='text-muted-foreground'>
            {sortedIssues.length} of {issues.length} issues
          </p>
        </div>

        {onCreateIssue && (
          <Button onClick={onCreateIssue} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Create Issue
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <Filter className='h-4 w-4' />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant='secondary' className='text-xs'>
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant='ghost' size='sm' onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search issues...'
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className='pl-10'
            />
          </div>

          {/* Filter Row */}
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <Select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value='all'>All Statuses</option>
              <option value='new'>New</option>
              <option value='in_progress'>In Progress</option>
              <option value='dev_review'>Dev Review</option>
              <option value='qa_review'>QA Review</option>
              <option value='pm_review'>PM Review</option>
              <option value='resolved'>Resolved</option>
              <option value='rejected'>Rejected</option>
            </Select>

            <Select
              value={filters.priority}
              onChange={e => handleFilterChange('priority', e.target.value)}
            >
              <option value='all'>All Priorities</option>
              <option value='high'>High</option>
              <option value='medium'>Medium</option>
              <option value='low'>Low</option>
            </Select>

            <Select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)}>
              <option value='all'>All Types</option>
              <option value='bug'>Bug</option>
              <option value='feature'>Feature</option>
            </Select>

            <Select
              value={filters.assignedTo}
              onChange={e => handleFilterChange('assignedTo', e.target.value)}
            >
              <option value='all'>All Assignees</option>
              <option value='unassigned'>Unassigned</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sort Controls */}
      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-sm font-medium'>Sort by:</span>
        {[
          { key: 'createdAt', label: 'Created' },
          { key: 'updatedAt', label: 'Updated' },
          { key: 'title', label: 'Title' },
          { key: 'priority', label: 'Priority' },
          { key: 'status', label: 'Status' },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={sortField === key ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleSort(key as SortField)}
            className='flex items-center gap-1'
          >
            {label}
            {sortField === key &&
              (sortDirection === 'asc' ? (
                <SortAsc className='h-3 w-3' />
              ) : (
                <SortDesc className='h-3 w-3' />
              ))}
          </Button>
        ))}
      </div>

      {/* Issues List */}
      {sortedIssues.length === 0 ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <div className='space-y-3'>
              <div className='text-muted-foreground'>
                {issues.length === 0
                  ? 'No issues found. Create your first issue to get started.'
                  : 'No issues match your current filters.'}
              </div>
              {issues.length > 0 && (
                <Button variant='outline' onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {sortedIssues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              currentUser={currentUser}
              onClick={onIssueClick}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onAssigneeChange={onAssigneeChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
