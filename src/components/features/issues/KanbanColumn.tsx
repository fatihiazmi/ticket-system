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
        'flex h-full min-h-[600px] flex-col transition-colors duration-200',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <CardHeader className={cn('flex-shrink-0 pb-4', color)}>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          <Badge variant='secondary' className='text-xs'>
            {issues.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col p-4'>
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          <div className='flex-1 space-y-4'>
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
          <div className='flex h-40 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-muted-foreground'>
            Drop issues here
          </div>
        )}
      </CardContent>
    </Card>
  );
}
