import * as React from 'react';
import { Send, AtSign, Lock, Users } from 'lucide-react';
import { Button, Card, CardContent, Avatar, AvatarFallback, toast } from '../../ui';
import type { CreateCommentRequest } from '../../../types/comments';
import type { UserProfile } from '../../../types/auth';
import { cn } from '../../../lib/utils';

interface CommentFormProps {
  issueId: string;
  currentUser: UserProfile;
  availableUsers?: UserProfile[];
  onSubmit: (data: CreateCommentRequest) => Promise<void>;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  replyToCommentId?: string;
  onCancelReply?: () => void;
}

export function CommentForm({
  issueId,
  currentUser,
  availableUsers = [],
  onSubmit,
  placeholder = 'Add a comment...',
  isLoading = false,
  className,
  replyToCommentId,
  onCancelReply,
}: CommentFormProps): React.JSX.Element {
  const [content, setContent] = React.useState('');
  const [isInternal, setIsInternal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showMentions, setShowMentions] = React.useState(false);
  const [mentionSearch, setMentionSearch] = React.useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = React.useState(0);
  const [cursorPosition, setCursorPosition] = React.useState(0);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Filter users for mentions
  const mentionSuggestions = React.useMemo(() => {
    if (!mentionSearch) return availableUsers.slice(0, 5);

    return availableUsers
      .filter(
        user =>
          user.fullName.toLowerCase().includes(mentionSearch.toLowerCase()) ||
          user.role.toLowerCase().includes(mentionSearch.toLowerCase())
      )
      .slice(0, 5);
  }, [availableUsers, mentionSearch]);

  // Handle textarea input
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setContent(value);
    setCursorPosition(cursorPos);

    // Check for mention trigger
    const beforeCursor = value.slice(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  // Handle mention selection
  const insertMention = (user: UserProfile) => {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);

    // Replace the @mention pattern with the full mention
    const mentionPattern = /@\w*$/;
    const beforeMention = beforeCursor.replace(mentionPattern, '');
    const newContent = `${beforeMention}@${user.fullName} ${afterCursor}`;

    setContent(newContent);
    setShowMentions(false);
    setMentionSearch('');

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = beforeMention.length + user.fullName.length + 2;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle keyboard navigation for mentions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && mentionSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedMentionIndex(prev => (prev < mentionSuggestions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedMentionIndex(prev => (prev > 0 ? prev - 1 : mentionSuggestions.length - 1));
          break;
        case 'Enter':
        case 'Tab':
          if (showMentions) {
            e.preventDefault();
            insertMention(mentionSuggestions[selectedMentionIndex]);
          }
          break;
        case 'Escape':
          setShowMentions(false);
          break;
      }
    }

    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      await onSubmit({
        issueId,
        content: content.trim(),
        isInternal,
        workflowStepId: replyToCommentId,
      });

      setContent('');
      setIsInternal(false);

      toast({
        title: 'Success',
        description: 'Comment added successfully',
        variant: 'success',
      });

      // Clear reply state if replying
      onCancelReply?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user can create internal comments
  const canCreateInternal =
    currentUser.role === 'product_manager' ||
    currentUser.role === 'developer' ||
    currentUser.role === 'qa';

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className={cn('relative', className)}>
      <Card>
        <CardContent className='p-4'>
          {/* Reply indicator */}
          {replyToCommentId && (
            <div className='mb-3 flex items-center justify-between rounded bg-blue-50 p-2 text-sm'>
              <span className='text-blue-700'>Replying to comment</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={onCancelReply}
                className='text-blue-700 hover:text-blue-800'
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Comment input */}
          <div className='space-y-3'>
            <div className='relative'>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className='max-h-[200px] min-h-[80px] w-full resize-none rounded-md border border-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                disabled={isSubmitting || isLoading}
              />

              {/* Mention suggestions */}
              {showMentions && mentionSuggestions.length > 0 && (
                <Card className='absolute bottom-full left-0 right-0 z-10 mb-2 max-h-48 overflow-y-auto'>
                  <CardContent className='p-2'>
                    <div className='mb-2 flex items-center gap-1 text-xs text-muted-foreground'>
                      <AtSign className='h-3 w-3' />
                      Mention someone
                    </div>
                    <div className='space-y-1'>
                      {mentionSuggestions.map((user, index) => (
                        <button
                          key={user.id}
                          className={cn(
                            'flex w-full items-center gap-2 rounded p-2 text-left hover:bg-accent',
                            index === selectedMentionIndex && 'bg-accent'
                          )}
                          onClick={() => insertMention(user)}
                        >
                          <Avatar className='h-6 w-6'>
                            <AvatarFallback className='text-xs'>
                              {user.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className='min-w-0 flex-1'>
                            <div className='truncate text-sm font-medium'>{user.fullName}</div>
                            <div className='text-xs text-muted-foreground'>{user.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Controls */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                {/* Internal comment toggle */}
                {canCreateInternal && (
                  <button
                    type='button'
                    onClick={() => setIsInternal(!isInternal)}
                    className={cn(
                      'flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors',
                      isInternal
                        ? 'border-orange-200 bg-orange-100 text-orange-800'
                        : 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                    disabled={isSubmitting || isLoading}
                  >
                    {isInternal ? <Lock className='h-3 w-3' /> : <Users className='h-3 w-3' />}
                    {isInternal ? 'Internal' : 'Public'}
                  </button>
                )}

                {/* Mention help text */}
                <div className='text-xs text-muted-foreground'>Type @ to mention someone</div>
              </div>

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting || isLoading}
                size='sm'
                className='flex items-center gap-2'
              >
                {isSubmitting ? (
                  'Posting...'
                ) : (
                  <>
                    <Send className='h-3 w-3' />
                    Comment
                  </>
                )}
              </Button>
            </div>

            {/* Keyboard shortcut hint */}
            <div className='text-xs text-muted-foreground'>
              Press <kbd className='rounded bg-gray-100 px-1 py-0.5 text-xs'>Ctrl</kbd> +{' '}
              <kbd className='rounded bg-gray-100 px-1 py-0.5 text-xs'>Enter</kbd> to submit
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
