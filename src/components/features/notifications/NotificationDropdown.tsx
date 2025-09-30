import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import {
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  toast,
} from '../../ui';
import type { NotificationWithDetails, NotificationType } from '../../../types/notifications';
import { cn } from '../../../lib/utils';

interface NotificationDropdownProps {
  notifications: NotificationWithDetails[];
  unreadCount: number;
  onMarkAsRead?: (notificationId: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onDelete?: (notificationId: string) => Promise<void>;
  onNotificationClick?: (notification: NotificationWithDetails) => void;
  isLoading?: boolean;
  className?: string;
}

const notificationTypeConfig: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
  }
> = {
  assignment: {
    icon: ({ className }) => <Bell className={className} />,
    color: 'bg-blue-100 text-blue-800',
    label: 'Assignment',
  },
  status_change: {
    icon: ({ className }) => <Check className={className} />,
    color: 'bg-green-100 text-green-800',
    label: 'Status Change',
  },
  approval_required: {
    icon: ({ className }) => <CheckCheck className={className} />,
    color: 'bg-orange-100 text-orange-800',
    label: 'Approval Required',
  },
  comment_added: {
    icon: ({ className }) => <Bell className={className} />,
    color: 'bg-purple-100 text-purple-800',
    label: 'New Comment',
  },
  mention: {
    icon: ({ className }) => <Bell className={className} />,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Mention',
  },
};

interface NotificationItemProps {
  notification: NotificationWithDetails;
  onMarkAsRead?: (notificationId: string) => Promise<void>;
  onDelete?: (notificationId: string) => Promise<void>;
  onClick?: (notification: NotificationWithDetails) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps): React.JSX.Element {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const config = notificationTypeConfig[notification.type];
  const IconComponent = config.icon;

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onMarkAsRead || notification.isRead) return;

    try {
      setIsProcessing(true);
      await onMarkAsRead(notification.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;

    try {
      setIsProcessing(true);
      await onDelete(notification.id);
      toast({
        title: 'Success',
        description: 'Notification deleted',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div
      className={cn(
        'group cursor-pointer border-b border-border p-3 transition-colors hover:bg-accent/50',
        !notification.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/50'
      )}
      onClick={() => onClick?.(notification)}
    >
      <div className='flex gap-3'>
        {/* Notification Icon */}
        <div className={cn('flex-shrink-0 rounded-full p-1.5', config.color)}>
          <IconComponent className='h-3 w-3' />
        </div>

        {/* Content */}
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex items-start justify-between gap-2'>
            <h4 className='line-clamp-1 text-sm font-medium'>{notification.title}</h4>
            <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
              {!notification.isRead && onMarkAsRead && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0'
                  onClick={handleMarkAsRead}
                  disabled={isProcessing}
                  title='Mark as read'
                >
                  <Check className='h-3 w-3' />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0 text-red-600 hover:text-red-700'
                  onClick={handleDelete}
                  disabled={isProcessing}
                  title='Delete notification'
                >
                  <Trash2 className='h-3 w-3' />
                </Button>
              )}
            </div>
          </div>

          <p className='mb-2 line-clamp-2 text-sm text-muted-foreground'>{notification.message}</p>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {/* Related Issue */}
              <Badge variant='outline' className='text-xs'>
                #{notification.relatedIssue.id}
              </Badge>

              {/* Issue Priority */}
              <Badge
                variant='outline'
                className={cn(
                  'text-xs',
                  notification.relatedIssue.priority === 'high' && 'border-red-200 text-red-700',
                  notification.relatedIssue.priority === 'medium' &&
                    'border-yellow-200 text-yellow-700',
                  notification.relatedIssue.priority === 'low' && 'border-green-200 text-green-700'
                )}
              >
                {notification.relatedIssue.priority}
              </Badge>

              {/* Actor */}
              {notification.actor && (
                <div className='flex items-center gap-1'>
                  <Avatar className='h-4 w-4'>
                    <AvatarFallback className='text-xs'>
                      {notification.actor.fullName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-xs text-muted-foreground'>
                    {notification.actor.fullName}
                  </span>
                </div>
              )}
            </div>

            <span className='text-xs text-muted-foreground'>
              {formatTime(notification.createdAt)}
            </span>
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500' />
        )}
      </div>
    </div>
  );
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
  isLoading = false,
  className,
}: NotificationDropdownProps): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  // Filter notifications
  const filteredNotifications = React.useMemo(() => {
    const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, filter]);

  const handleMarkAllAsRead = async () => {
    if (!onMarkAllAsRead) return;

    try {
      await onMarkAllAsRead();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = (notification: NotificationWithDetails) => {
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm' className='relative'>
            <Bell className='h-4 w-4' />
            {unreadCount > 0 && (
              <Badge
                variant='destructive'
                className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs'
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='max-h-96 w-80 overflow-hidden p-0'
          side='bottom'
          sideOffset={8}
        >
          {/* Header */}
          <div className='flex items-center justify-between border-b p-4'>
            <div className='flex items-center gap-2'>
              <Bell className='h-4 w-4' />
              <span className='font-medium'>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant='secondary' className='text-xs'>
                  {unreadCount} new
                </Badge>
              )}
            </div>

            <div className='flex items-center gap-1'>
              {/* Filter buttons */}
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setFilter('all')}
                className='h-6 px-2 text-xs'
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setFilter('unread')}
                className='h-6 px-2 text-xs'
              >
                Unread
              </Button>
            </div>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className='border-b bg-gray-50 p-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleMarkAllAsRead}
                className='w-full justify-start text-xs'
              >
                <CheckCheck className='mr-2 h-3 w-3' />
                Mark all as read
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className='max-h-80 overflow-y-auto'>
            {isLoading ? (
              <div className='space-y-3 p-4'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='flex animate-pulse gap-3'>
                    <div className='h-6 w-6 rounded-full bg-gray-200'></div>
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 w-3/4 rounded bg-gray-200'></div>
                      <div className='h-3 w-1/2 rounded bg-gray-200'></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className='p-8 text-center text-muted-foreground'>
                <Bell className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p className='text-sm'>
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div>
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <DropdownMenuSeparator />
          <div className='p-2'>
            <DropdownMenuItem className='w-full justify-center text-xs'>
              <Settings className='mr-2 h-3 w-3' />
              Notification Settings
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
