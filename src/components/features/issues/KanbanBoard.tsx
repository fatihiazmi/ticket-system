import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../ui';
import { IssueCard } from './IssueCard';
import { KanbanColumn } from './KanbanColumn';
import type { Issue, IssueStatus } from '../../../types/issues';
import type { UserProfile } from '../../../types/auth';
import { cn } from '../../../lib/utils';

interface KanbanBoardProps {
  issues: Issue[];
  currentUser: UserProfile;
  onStatusChange?: (issueId: string, status: IssueStatus) => void;
  onIssueClick?: (issueId: string) => void;
  onCreateIssue?: () => void;
  isLoading?: boolean;
  className?: string;
}

const columns: { status: IssueStatus; title: string; color: string }[] = [
  { status: 'new', title: 'New', color: 'bg-blue-100 border-blue-200' },
  { status: 'in_progress', title: 'In Progress', color: 'bg-purple-100 border-purple-200' },
  { status: 'dev_review', title: 'Dev Review', color: 'bg-orange-100 border-orange-200' },
  { status: 'qa_review', title: 'QA Review', color: 'bg-indigo-100 border-indigo-200' },
  { status: 'pm_review', title: 'PM Review', color: 'bg-pink-100 border-pink-200' },
  { status: 'resolved', title: 'Resolved', color: 'bg-green-100 border-green-200' },
];

export function KanbanBoard({
  issues,
  currentUser,
  onStatusChange,
  onIssueClick,
  onCreateIssue,
  isLoading = false,
  className,
}: KanbanBoardProps): React.JSX.Element {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [localIssues, setLocalIssues] = React.useState<Issue[]>(issues);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Update local issues when props change
  React.useEffect(() => {
    setLocalIssues(issues);
  }, [issues]);

  // Group issues by status
  const issuesByStatus = React.useMemo(() => {
    const grouped: Record<IssueStatus, Issue[]> = {
      new: [],
      in_progress: [],
      dev_review: [],
      qa_review: [],
      pm_review: [],
      resolved: [],
      rejected: [],
    };

    localIssues.forEach(issue => {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      }
    });

    return grouped;
  }, [localIssues]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active issue
    const activeIssue = localIssues.find(issue => issue.id === activeId);
    if (!activeIssue) return;

    // Determine the new status
    let newStatus: IssueStatus | null = null;

    // Check if dropped on a column
    const column = columns.find(col => col.status === overId);
    if (column) {
      newStatus = column.status;
    } else {
      // Check if dropped on another issue (inherit its status)
      const targetIssue = localIssues.find(issue => issue.id === overId);
      if (targetIssue) {
        newStatus = targetIssue.status;
      }
    }

    if (!newStatus || newStatus === activeIssue.status) return;

    // Optimistically update local state
    setLocalIssues(prev =>
      prev.map(issue => (issue.id === activeId ? { ...issue, status: newStatus! } : issue))
    );

    // Call the parent handler
    onStatusChange?.(activeId, newStatus);
  };

  const activeIssue = activeId ? localIssues.find(issue => issue.id === activeId) : null;

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6', className)}>
        {columns.map(column => (
          <Card key={column.status} className='min-h-[400px]'>
            <CardHeader className={cn('pb-3', column.color)}>
              <CardTitle className='text-sm font-medium'>{column.title}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 p-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='animate-pulse'>
                  <div className='h-20 rounded bg-gray-200'></div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Kanban Board</h2>
          <p className='text-muted-foreground'>Drag and drop issues to change their status</p>
        </div>

        {onCreateIssue && (
          <Button onClick={onCreateIssue} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Create Issue
          </Button>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className='grid min-h-[600px] grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6'>
          {columns.map(column => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              title={column.title}
              color={column.color}
              issues={issuesByStatus[column.status]}
              currentUser={currentUser}
              onIssueClick={onIssueClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIssue && (
            <div className='rotate-3 scale-105 transform opacity-90'>
              <IssueCard issue={activeIssue} currentUser={currentUser} className='shadow-lg' />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
