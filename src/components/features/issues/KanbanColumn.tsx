import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui';
import { SortableIssueCard } from './SortableIssueCard';
import type { Issue, IssueStatus } from '../../../types/issues';
import type { UserProfile } from '../../../types/auth';
import { cn } from '../../../lib/utils';

interface KanbanColumnProps {
  status: IssueStatus;
  title: string;
  color: string;
  issues: Issue[];
  currentUser: UserProfile;
  onIssueClick?: (issueId: string) => void;
}

export function KanbanColumn({
  status,
  title,
  color,
  issues,
  currentUser,
  onIssueClick,
}: KanbanColumnProps): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const issueIds = issues.map(issue => issue.id);

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'transition-colors duration-200',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <CardHeader className={cn('pb-3', color)}>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          <Badge variant='secondary' className='text-xs'>
            {issues.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='min-h-[300px] p-3'>
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          <div className='space-y-3'>
            {issues.map(issue => (
              <SortableIssueCard
                key={issue.id}
                issue={issue}
                currentUser={currentUser}
                onClick={onIssueClick}
              />
            ))}
          </div>
        </SortableContext>

        {issues.length === 0 && (
          <div className='flex h-24 items-center justify-center text-sm text-muted-foreground'>
            Drop issues here
          </div>
        )}
      </CardContent>
    </Card>
  );
}
