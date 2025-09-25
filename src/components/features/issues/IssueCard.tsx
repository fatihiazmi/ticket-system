import type { Issue } from '../../../types/issues';
import type { UserProfile } from '../../../types/auth';

interface IssueCardProps {
  issue: Issue;
  currentUser: UserProfile;
  onStatusChange: (issueId: string, status: Issue['status']) => void;
  onPriorityChange: (issueId: string, priority: Issue['priority']) => void;
  onAssigneeChange: (issueId: string, assigneeId: string) => void;
  onDelete: (issueId: string) => void;
  onClick: (issueId: string) => void;
}

// Placeholder component for TDD - should fail until properly implemented
export function IssueCard(_props: IssueCardProps): React.JSX.Element {
  throw new Error('IssueCard component not implemented yet - TDD placeholder');
}
