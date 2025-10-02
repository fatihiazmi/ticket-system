import * as React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Clock, User, Calendar, Edit, Trash2, Save, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Input,
  Select,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  toast,
} from '../../ui';
import type { Issue, IssueStatus, IssuePriority, IssueType } from '../../../types/issues';
import type { UserProfile } from '../../../types/auth';
import { cn } from '../../../lib/utils';

interface IssueDetailsProps {
  issue: Issue;
  currentUser: UserProfile;
  availableUsers?: UserProfile[];
  onBack?: () => void;
  onUpdate?: (issueId: string, updates: Partial<Issue>) => Promise<void>;
  onDelete?: (issueId: string) => Promise<void>;
  onStatusChange?: (issueId: string, status: IssueStatus) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const statusConfig: Record<
  IssueStatus,
  { color: string; label: string; canTransitionTo: IssueStatus[] }
> = {
  new: {
    color: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
    label: 'New',
    canTransitionTo: ['in_progress'],
  },
  in_progress: {
    color: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
    label: 'In Progress',
    canTransitionTo: ['dev_review', 'new'],
  },
  dev_review: {
    color: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
    label: 'Dev Review',
    canTransitionTo: ['qa_review', 'in_progress', 'rejected'],
  },
  qa_review: {
    color: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200',
    label: 'QA Review',
    canTransitionTo: ['pm_review', 'dev_review', 'rejected'],
  },
  pm_review: {
    color: 'bg-pink-100 text-pink-800 ring-1 ring-pink-200',
    label: 'PM Review',
    canTransitionTo: ['resolved', 'qa_review', 'rejected'],
  },
  resolved: {
    color: 'bg-green-100 text-green-800 ring-1 ring-green-200',
    label: 'Resolved',
    canTransitionTo: ['pm_review'],
  },
  rejected: {
    color: 'bg-red-100 text-red-800 ring-1 ring-red-200',
    label: 'Rejected',
    canTransitionTo: ['new'],
  },
};

const priorityConfig = {
  high: { color: 'border-red-200 bg-red-50 text-red-700 ring-1 ring-red-200', label: 'High' },
  medium: {
    color: 'border-yellow-200 bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
    label: 'Medium',
  },
  low: { color: 'border-green-200 bg-green-50 text-green-700 ring-1 ring-green-200', label: 'Low' },
};

const typeConfig = {
  bug: { color: 'border-red-200 bg-red-50 text-red-700 ring-1 ring-red-200', label: 'Bug' },
  feature: {
    color: 'border-blue-200 bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    label: 'Feature',
  },
};

export function IssueDetails({
  issue,
  currentUser,
  availableUsers = [],
  onBack,
  onUpdate,
  onDelete,
  onStatusChange,
  isLoading = false,
  className,
}: IssueDetailsProps): React.JSX.Element {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState({
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    type: issue.type,
    assignedTo: issue.assignedTo || '',
    estimatedHours: issue.estimatedHours || 0,
  });
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  const status = statusConfig[issue.status];
  const priority = priorityConfig[issue.priority];
  const type = typeConfig[issue.type];

  const canEdit = currentUser.role === 'product_manager' || currentUser.id === issue.createdBy;
  const canTransition = canEdit || currentUser.role === 'developer' || currentUser.role === 'qa';

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return 'Invalid date';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const handleEdit = () => {
    setEditData({
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      type: issue.type,
      assignedTo: issue.assignedTo || '',
      estimatedHours: issue.estimatedHours || 0,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdate) return;

    try {
      setActionLoading(true);
      await onUpdate(issue.id, {
        title: editData.title,
        description: editData.description,
        priority: editData.priority,
        type: editData.type,
        assignedTo: editData.assignedTo || undefined,
        estimatedHours: editData.estimatedHours || undefined,
      });

      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Issue updated successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update issue',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      type: issue.type,
      assignedTo: issue.assignedTo || '',
      estimatedHours: issue.estimatedHours || 0,
    });
  };

  const handleStatusTransition = async (newStatus: IssueStatus) => {
    if (!onStatusChange) return;

    try {
      setActionLoading(true);
      await onStatusChange(issue.id, newStatus);
      toast({
        title: 'Success',
        description: `Issue moved to ${statusConfig[newStatus].label}`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      setActionLoading(true);
      await onDelete(issue.id);
      toast({
        title: 'Success',
        description: 'Issue deleted successfully',
        variant: 'success',
      });
      onBack?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete issue',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const assignedUser = availableUsers.find(user => user.id === issue.assignedTo);

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 w-1/4 rounded bg-gray-200'></div>
          <div className='h-12 rounded bg-gray-200'></div>
          <div className='h-32 rounded bg-gray-200'></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto max-w-7xl space-y-6', className)}>
      {/* Header */}
      <div className='mb-8 flex items-start justify-between'>
        <div className='flex items-center gap-4'>
          {onBack && (
            <Button variant='ghost' size='sm' onClick={onBack} className='shrink-0'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Issues
            </Button>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {canEdit && !isEditing && (
            <>
              <Button variant='outline' size='sm' onClick={handleEdit}>
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowDeleteModal(true)}
                className='text-red-600 hover:text-red-700'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </Button>
            </>
          )}

          {isEditing && (
            <>
              <Button variant='outline' size='sm' onClick={handleCancel}>
                <X className='mr-2 h-4 w-4' />
                Cancel
              </Button>
              <Button size='sm' onClick={handleSave} disabled={actionLoading}>
                <Save className='mr-2 h-4 w-4' />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4'>
        {/* Issue Content - Takes up 2/3 on lg, 3/4 on xl */}
        <div className='min-w-0 space-y-6 lg:col-span-2 xl:col-span-3'>
          {/* Issue Header with Title and Badges */}
          <div className='space-y-4'>
            <div className='flex flex-wrap items-start gap-3'>
              <Badge className={cn('px-2 py-1 text-xs font-medium', type.color)}>
                {type.label}
              </Badge>
              <Badge className={cn('px-2 py-1 text-xs font-medium', priority.color)}>
                {priority.label} Priority
              </Badge>
              <Badge className={cn('px-2 py-1 text-xs font-medium', status.color)}>
                {status.label}
              </Badge>
            </div>

            <div>
              <div className='mb-2 flex items-center gap-2 text-sm text-muted-foreground'>
                <span>#{issue.id}</span>
                <span>•</span>
                <span>Created {formatRelativeTime(issue.createdAt)}</span>
              </div>
              {isEditing ? (
                <Input
                  value={editData.title}
                  onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className='border-0 px-0 text-xl font-bold shadow-none focus-visible:ring-0'
                  placeholder='Issue title...'
                />
              ) : (
                <h1 className='pr-4 text-2xl font-bold leading-tight text-gray-900'>
                  {issue.title}
                </h1>
              )}
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={editData.description}
                  onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={8}
                  className='w-full resize-none rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                  placeholder='Describe the issue in detail...'
                />
              ) : (
                <div className='prose prose-sm max-w-none'>
                  <p className='whitespace-pre-wrap leading-relaxed text-gray-700'>
                    {issue.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Fields */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Edit Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>Type</label>
                    <Select
                      value={editData.type}
                      onChange={e =>
                        setEditData(prev => ({ ...prev, type: e.target.value as IssueType }))
                      }
                      className='mt-1'
                    >
                      <option value='bug'>Bug</option>
                      <option value='feature'>Feature</option>
                    </Select>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>Priority</label>
                    <Select
                      value={editData.priority}
                      onChange={e =>
                        setEditData(prev => ({
                          ...prev,
                          priority: e.target.value as IssuePriority,
                        }))
                      }
                      className='mt-1'
                    >
                      <option value='low'>Low</option>
                      <option value='medium'>Medium</option>
                      <option value='high'>High</option>
                    </Select>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>Assignee</label>
                    <Select
                      value={editData.assignedTo}
                      onChange={e => setEditData(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className='mt-1'
                    >
                      <option value=''>Unassigned</option>
                      {availableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>
                      Estimated Hours
                    </label>
                    <Input
                      type='number'
                      min='0'
                      step='0.5'
                      value={editData.estimatedHours}
                      onChange={e =>
                        setEditData(prev => ({
                          ...prev,
                          estimatedHours: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className='mt-1'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workflow Actions */}
          {canTransition && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Workflow Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-3'>
                  {status.canTransitionTo.map(newStatus => (
                    <Button
                      key={newStatus}
                      variant='outline'
                      size='sm'
                      onClick={() => handleStatusTransition(newStatus)}
                      disabled={actionLoading}
                      className='min-w-0 flex-1'
                    >
                      Move to {statusConfig[newStatus].label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Takes up 1/3 on lg, 1/4 on xl */}
        <div className='space-y-6 lg:col-span-1 xl:col-span-1'>
          {/* Issue Meta */}
          <Card className='lg:sticky lg:top-6'>
            <CardHeader>
              <CardTitle className='text-lg'>Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Assignee */}
              <div>
                <label className='mb-3 block text-sm font-medium text-muted-foreground'>
                  Assignee
                </label>
                <div className='flex items-center gap-3'>
                  {assignedUser ? (
                    <>
                      <Avatar className='h-8 w-8'>
                        <AvatarFallback className='bg-blue-100 text-xs text-blue-700'>
                          {assignedUser.fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium'>{assignedUser.fullName}</p>
                        <p className='text-xs capitalize text-muted-foreground'>
                          {assignedUser.role?.replace('_', ' ')}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className='flex items-center gap-3 text-muted-foreground'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                        <User className='h-4 w-4' />
                      </div>
                      <span className='text-sm'>Unassigned</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className='space-y-4'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                    Created
                  </label>
                  <div className='flex items-start gap-2 text-sm'>
                    <Calendar className='mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground' />
                    <span className='break-words text-xs leading-relaxed'>
                      {formatDate(issue.createdAt)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                    Last Updated
                  </label>
                  <div className='flex items-start gap-2 text-sm'>
                    <Calendar className='mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground' />
                    <span className='break-words text-xs leading-relaxed'>
                      {formatDate(issue.updatedAt)}
                    </span>
                  </div>
                </div>

                {issue.resolvedAt && (
                  <div>
                    <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                      Resolved
                    </label>
                    <div className='flex items-start gap-2 text-sm'>
                      <Calendar className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-600' />
                      <span className='break-words text-xs leading-relaxed'>
                        {formatDate(issue.resolvedAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Tracking */}
              {(issue.estimatedHours || issue.actualHours) && (
                <div className='space-y-3 border-t pt-4'>
                  <label className='block text-sm font-medium text-muted-foreground'>
                    Time Tracking
                  </label>
                  <div className='space-y-3'>
                    {issue.estimatedHours && (
                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-2'>
                          <Clock className='h-4 w-4 text-muted-foreground' />
                          <span>Estimated</span>
                        </div>
                        <span className='font-medium'>{issue.estimatedHours}h</span>
                      </div>
                    )}
                    {issue.actualHours && (
                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-2'>
                          <Clock className='h-4 w-4 text-muted-foreground' />
                          <span>Actual</span>
                        </div>
                        <span className='font-medium'>{issue.actualHours}h</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Issue</ModalTitle>
          </ModalHeader>
          <div className='py-4'>
            <p>Are you sure you want to delete this issue? This action cannot be undone.</p>
            <div className='mt-4 rounded border bg-gray-50 p-3'>
              <p className='font-medium'>{issue.title}</p>
              <p className='text-sm text-muted-foreground'>#{issue.id}</p>
            </div>
          </div>
          <ModalFooter>
            <Button variant='outline' onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={actionLoading}>
              Delete Issue
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
