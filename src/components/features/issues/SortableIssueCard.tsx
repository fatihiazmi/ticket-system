import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IssueCard } from './IssueCard';
import type { Issue } from '../../../types/issues';
import type { UserProfile } from '../../../types/auth';

interface SortableIssueCardProps {
  issue: Issue;
  currentUser: UserProfile;
  onClick?: (issueId: string) => void;
}

export function SortableIssueCard({
  issue,
  currentUser,
  onClick,
}: SortableIssueCardProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-50' : ''}
    >
      <IssueCard
        issue={issue}
        currentUser={currentUser}
        onClick={onClick}
        className='cursor-grab active:cursor-grabbing'
      />
    </div>
  );
}
