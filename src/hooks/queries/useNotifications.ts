import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { queryKeys, invalidateQueries } from '../../lib/queryClient';
import { useNotificationStore } from '../../stores/notifications.store';
import type {
  Notification,
  CreateNotificationRequest,
  NotificationFilters,
  NotificationType,
} from '../../types/notifications';

// Services - These will be implemented later in the services phase
// For now we'll create placeholder functions that match the expected API
const notificationsService = {
  getNotifications: async (_filters?: NotificationFilters): Promise<Notification[]> => {
    // TODO: Implement actual service call
    throw new Error('Notifications service not implemented yet');
  },

  getUnreadNotifications: async (): Promise<Notification[]> => {
    // TODO: Implement actual service call
    throw new Error('Notifications service not implemented yet');
  },

  getNotification: async (_id: string): Promise<Notification> => {
    // TODO: Implement actual service call
    throw new Error('Notifications service not implemented yet');
  },

  createNotification: async (_data: CreateNotificationRequest): Promise<Notification> => {
    // TODO: Implement actual service call
    throw new Error('Notifications service not implemented yet');
  },

  markAsRead: async (_id: string): Promise<Notification> => {
    // TODO: Implement actual service call
    throw new Error('Notifications service not implemented yet');
  },

  markAllAsRead: async (): Promise<void> => {
    // TODO: Implement actual service call
    throw new Error('Notifications service not implemented yet');
  },

  deleteNotification: async (_id: string): Promise<void> => {
    // TODO: Implement actual service call
    throw new Error('Notifications service not implemented yet');
  },

  getUnreadCount: async (): Promise<number> => {
    // TODO: Implement actual service call
    throw new Error('Notifications service not implemented yet');
  },
};

// Query hooks for fetching data
export const useNotifications = (filters?: NotificationFilters) => {
  const setNotifications = useNotificationStore(state => state.setNotifications);
  const setLoading = useNotificationStore(state => state.setLoading);
  const setError = useNotificationStore(state => state.setError);

  return useQuery({
    queryKey: queryKeys.notifications.lists(),
    queryFn: async () => {
      setLoading(true);
      try {
        const notifications = await notificationsService.getNotifications(filters);
        setNotifications(notifications);
        return notifications;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - notifications should be fresh
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useUnreadNotifications = () => {
  const setNotifications = useNotificationStore(state => state.setNotifications);
  const setLoading = useNotificationStore(state => state.setLoading);
  const setError = useNotificationStore(state => state.setError);

  return useQuery({
    queryKey: queryKeys.notifications.unread(),
    queryFn: async () => {
      setLoading(true);
      try {
        const notifications = await notificationsService.getUnreadNotifications();
        // Update store with unread notifications only
        setNotifications(notifications);
        return notifications;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch unread notifications');
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for unread
  });
};

export const useNotification = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.notifications.detail(id),
    queryFn: () => notificationsService.getNotification(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUnreadCount = () => {
  const unreadCount = useNotificationStore(state => state.unreadCount);

  return useQuery({
    queryKey: [...queryKeys.notifications.all(), 'count'],
    queryFn: async () => {
      const count = await notificationsService.getUnreadCount();
      return count;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    initialData: unreadCount,
  });
};

// Mutation hooks for data modifications
export const useCreateNotification = () => {
  const addNotification = useNotificationStore(state => state.addNotification);

  return useMutation({
    mutationFn: (data: CreateNotificationRequest) => notificationsService.createNotification(data),
    onSuccess: newNotification => {
      // Add to store optimistically
      addNotification(newNotification);
      // Invalidate queries to refetch
      invalidateQueries.notifications();
    },
    onError: error => {
      console.error('Failed to create notification:', error);
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onMutate: async id => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.detail(id) });

      // Snapshot the previous value
      const previousNotification = queryClient.getQueryData(queryKeys.notifications.detail(id));

      // Optimistically update in store
      markAsRead(id);

      // Optimistically update in query cache
      queryClient.setQueryData(
        queryKeys.notifications.detail(id),
        (oldData: Notification | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, isRead: true };
        }
      );

      return { previousNotification, id };
    },
    onError: (_err, id, context) => {
      // Roll back optimistic update on error
      if (context?.previousNotification) {
        queryClient.setQueryData(queryKeys.notifications.detail(id), context.previousNotification);
      }
    },
    onSettled: () => {
      // Always refetch notifications and unread count
      invalidateQueries.notifications();
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onMutate: async () => {
      // Optimistically update store
      markAllAsRead();
    },
    onSuccess: () => {
      // Refetch all notification queries
      invalidateQueries.notifications();
    },
    onError: error => {
      console.error('Failed to mark all notifications as read:', error);
      // The store state will be corrected on the next fetch
    },
  });
};

export const useDeleteNotification = () => {
  const removeNotification = useNotificationStore(state => state.removeNotification);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onMutate: async id => {
      // Optimistically remove from store
      removeNotification(id);

      // Remove from query cache
      queryClient.removeQueries({ queryKey: queryKeys.notifications.detail(id) });

      return { id };
    },
    onSuccess: () => {
      // Refetch notifications
      invalidateQueries.notifications();
    },
    onError: error => {
      console.error('Failed to delete notification:', error);
      // The store state will be corrected on the next fetch
    },
  });
};

// Custom hooks for common patterns
export const useNotificationsByType = (type: NotificationType) => {
  const { data: notifications, ...rest } = useNotifications();
  const filteredNotifications =
    notifications?.filter(notification => notification.type === type) || [];
  return { data: filteredNotifications, ...rest };
};

export const useRecentNotifications = (limit: number = 5) => {
  const { data: notifications, ...rest } = useNotifications();
  const recentNotifications =
    notifications
      ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit) || [];
  return { data: recentNotifications, ...rest };
};

export const useHasUnreadNotifications = () => {
  const unreadCount = useNotificationStore(state => state.unreadCount);
  return unreadCount > 0;
};

// Real-time hook to automatically refetch notifications
export const useNotificationSync = (enabled = true) => {
  const queryClient = useQueryClient();

  // This will be enhanced with real-time subscriptions later
  // For now, just set up aggressive polling
  const query = useQuery({
    queryKey: [...queryKeys.notifications.all(), 'sync'],
    queryFn: () => notificationsService.getUnreadCount(),
    enabled,
    staleTime: 0,
    refetchInterval: 15 * 1000, // Every 15 seconds
    refetchIntervalInBackground: true,
  });

  // Use useEffect to handle data changes instead of deprecated onSuccess
  React.useEffect(() => {
    if (query.data !== undefined) {
      // Invalidate notifications when sync detects changes
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    }
  }, [query.data, queryClient]);

  return query;
};
