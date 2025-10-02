import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Trash2, Reply, MoreHorizontal } from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Badge,
  toast,
} from '../../ui';
import type { CommentWithAuthor } from '../../../types/comments';
import type { UserProfile } from '../../../types/auth';
import { cn } from '../../../lib/utils';

interface CommentThreadProps {
  comments: CommentWithAuthor[];
  currentUser: UserProfile;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onReply?: (commentId: string) => void;
  isLoading?: boolean;
  className?: string;
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  currentUser: UserProfile;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onReply?: (commentId: string) => void;
}

function CommentItem({
  comment,
  currentUser,
  onEdit,
  onDelete,
  onReply,
}: CommentItemProps): React.JSX.Element {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(comment.content);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const canEdit = currentUser.id === comment.authorId || currentUser.role === 'product_manager';
  const canDelete = currentUser.id === comment.authorId || currentUser.role === 'product_manager';

  const handleEdit = () => {
    setEditContent(comment.content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!onEdit || editContent.trim() === comment.content.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSubmitting(true);
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Comment updated successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      await onDelete(comment.id);
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const renderContent = (content: string) => {
    // Simple mention highlighting - looks for @username patterns
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a username from a mention
        return (
          <span key={index} className='rounded bg-blue-100 px-1 font-medium text-blue-800'>
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className='group flex gap-4'>
      <Avatar className='h-9 w-9 flex-shrink-0 shadow-sm ring-2 ring-white'>
        <AvatarFallback className='bg-blue-100 text-xs font-medium text-blue-700'>
          {comment?.author?.fullName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className='min-w-0 flex-1'>
        <div className='mb-2 flex items-center gap-2'>
          <span className='text-sm font-medium text-gray-900'>{comment?.author?.fullName}</span>
          <Badge variant='outline' className='px-2 py-0.5 text-xs capitalize'>
            {comment?.author?.role?.replace('_', ' ')}
          </Badge>
          {comment?.isInternal && (
            <Badge variant='secondary' className='px-2 py-0.5 text-xs'>
              Internal
            </Badge>
          )}
          <span className='text-xs text-muted-foreground'>
            {formatTime(comment?.createdAt)}
            {comment?.edited && ' (edited)'}
          </span>
        </div>

        <div className='mb-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
          {isEditing ? (
            <div className='space-y-3'>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className='min-h-[80px] w-full resize-none rounded-md border border-input bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                rows={3}
                disabled={isSubmitting}
                placeholder='Edit your comment...'
              />
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  onClick={handleSaveEdit}
                  disabled={isSubmitting || !editContent.trim()}
                  className='text-xs'
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className='text-xs'
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className='whitespace-pre-wrap text-sm leading-relaxed text-gray-900'>
              {renderContent(comment?.content)}
            </div>
          )}
        </div>

        <div className='flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
          {onReply && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onReply(comment?.id)}
              className='h-auto px-2 py-1 text-xs hover:bg-blue-50 hover:text-blue-700'
            >
              <Reply className='mr-1 h-3 w-3' />
              Reply
            </Button>
          )}

          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto px-2 py-1 text-xs hover:bg-gray-100'
                >
                  <MoreHorizontal className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-[120px]'>
                {canEdit && (
                  <DropdownMenuItem onClick={handleEdit} className='text-xs'>
                    <Edit className='mr-2 h-3 w-3' />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className='text-xs text-red-600 hover:bg-red-50 hover:text-red-700'
                  >
                    <Trash2 className='mr-2 h-3 w-3' />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentThread({
  comments,
  currentUser,
  onEdit,
  onDelete,
  onReply,
  isLoading = false,
  className,
}: CommentThreadProps): React.JSX.Element {
  // Sort comments by creation date
  const sortedComments = React.useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [comments]);

  // Separate internal and public comments
  const publicComments = sortedComments.filter(comment => !comment.isInternal);
  const internalComments = sortedComments.filter(comment => comment.isInternal);

  // Show internal comments only to authorized users
  const canViewInternal =
    currentUser.role === 'product_manager' ||
    currentUser.role === 'developer' ||
    currentUser.role === 'qa';

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='flex animate-pulse gap-3'>
            <div className='h-8 w-8 flex-shrink-0 rounded-full bg-gray-200'></div>
            <div className='flex-1 space-y-2'>
              <div className='h-4 w-1/4 rounded bg-gray-200'></div>
              <div className='h-16 rounded bg-gray-200'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Public Comments */}
      {publicComments.length > 0 && (
        <div className='space-y-4'>
          <h3 className='text-sm font-medium text-muted-foreground'>
            Comments ({publicComments.length})
          </h3>
          <div className='space-y-4'>
            {publicComments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onEdit={onEdit}
                onDelete={onDelete}
                onReply={onReply}
              />
            ))}
          </div>
        </div>
      )}

      {/* Internal Comments */}
      {canViewInternal && internalComments.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>
              Internal Comments ({internalComments.length})
            </h3>
            <Badge variant='secondary' className='text-xs'>
              Team Only
            </Badge>
          </div>
          <Card className='border-dashed'>
            <CardContent className='space-y-4 p-4'>
              {internalComments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {comments.length === 0 && (
        <div className='py-8 text-center text-muted-foreground'>
          <p>No comments yet.</p>
          <p className='text-sm'>Be the first to comment on this issue.</p>
        </div>
      )}
    </div>
  );
}
