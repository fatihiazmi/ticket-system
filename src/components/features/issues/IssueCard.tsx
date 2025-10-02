import * as React from 'react';
import { Calendar, Clock, User, AlertCircle, Bug, Zap, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, Badge, Avatar, AvatarFallback, Button } from '../../ui';
import type { Issue, IssueStatus, IssuePriority } from '../../../types/issues';
import type { UserProfile } from '../../../types/auth';
import { cn } from '../../../lib/utils';

interface IssueCardProps {
  issue: Issue;
  currentUser: UserProfile;
  onStatusChange?: (issueId: string, status: IssueStatus) => void;
  onPriorityChange?: (issueId: string, priority: IssuePriority) => void;
  onAssigneeChange?: (issueId: string, assigneeId: string) => void;
  onDelete?: (issueId: string) => void;
  onClick?: (issueId: string) => void;
  className?: string;
}

const priorityConfig = {
  high: {
    color: 'border-red-200 bg-red-50 text-red-700',
    icon: AlertCircle,
    label: 'High',
  },
  medium: {
    color: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    icon: Clock,
    label: 'Medium',
  },
  low: {
    color: 'border-green-200 bg-green-50 text-green-700',
    icon: Clock,
    label: 'Low',
  },
};

const statusConfig = {
  new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
  in_progress: { color: 'bg-purple-100 text-purple-800', label: 'In Progress' },
  dev_review: { color: 'bg-orange-100 text-orange-800', label: 'Dev Review' },
  qa_review: { color: 'bg-indigo-100 text-indigo-800', label: 'QA Review' },
  pm_review: { color: 'bg-pink-100 text-pink-800', label: 'PM Review' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
  rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
};

const typeConfig = {
  bug: {
    color: 'border-red-200 bg-red-50 text-red-700',
    icon: Bug,
    label: 'Bug',
  },
  feature: {
    color: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: Zap,
    label: 'Feature',
  },
};

function IssueCardComponent({
  issue,
  currentUser,
  onClick,
  className,
}: IssueCardProps): React.JSX.Element {
  const priority = priorityConfig[issue.priority];
  const status = statusConfig[issue.status];
  const type = typeConfig[issue.type];
  const PriorityIcon = priority.icon;
  const TypeIcon = type.icon;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('button') || e.target.closest('[role="menuitem"]'))
    ) {
      return;
    }
    onClick?.(issue.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard navigation for accessibility
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(issue.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateString));
  };

  const canEdit = currentUser.role === 'product_manager' || currentUser.id === issue.createdBy;

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
        priority.color.includes('red') && 'border-l-4 border-l-red-500',
        className
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role='button'
      aria-label={`Issue: ${issue.title}`}
    >
      <CardContent className='p-6'>
        {/* Header */}
        <div className='mb-5 flex items-start justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='outline' className={cn('border text-xs', type.color)}>
              <TypeIcon className='mr-1 h-3 w-3' />
              {type.label}
            </Badge>
            <Badge variant='outline' className={cn('border text-xs', priority.color)}>
              <PriorityIcon className='mr-1 h-3 w-3' />
              {priority.label}
            </Badge>
          </div>

          {canEdit && (
            <Button variant='ghost' size='sm' className='opacity-0 group-hover:opacity-100'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          )}
        </div>

        {/* Title */}
        <h3 className='mb-4 line-clamp-3 text-base font-semibold leading-relaxed text-foreground'>
          {issue.title}
        </h3>

        {/* Description */}
        {issue.description && (
          <p className='mb-5 line-clamp-3 text-sm leading-relaxed text-muted-foreground'>
            {issue.description}
          </p>
        )}

        {/* Status Badge */}
        <div className='mb-5'>
          <Badge className={cn('text-xs', status.color)}>{status.label}</Badge>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between border-t border-border pt-4'>
          <div className='flex items-center gap-2'>
            {issue.assignedTo ? (
              <Avatar className='h-6 w-6'>
                <AvatarFallback className='text-xs'>
                  {issue.assignedTo.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <User className='h-3 w-3' />
                <span>Unassigned</span>
              </div>
            )}
          </div>

          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <Calendar className='h-3 w-3' />
            <span>{formatDate(issue.createdAt)}</span>
          </div>
        </div>

        {/* Time tracking (if available) */}
        {(issue.estimatedHours || issue.actualHours) && (
          <div className='mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground'>
            {issue.estimatedHours && (
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                <span>Est: {issue.estimatedHours}h</span>
              </div>
            )}
            {issue.actualHours && (
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                <span>Actual: {issue.actualHours}h</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const IssueCard = React.memo(IssueCardComponent);
