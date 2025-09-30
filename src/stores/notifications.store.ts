import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from '../types/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

interface NotificationActions {
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUnreadCount: () => void;
  setLastFetched: (date: Date) => void;
}

interface NotificationStore extends NotificationState, NotificationActions {}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setNotifications: notifications => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        set({
          notifications,
          unreadCount,
          isLoading: false,
          error: null,
          lastFetched: new Date(),
        });
      },

      addNotification: notification => {
        const { notifications } = get();
        const newNotifications = [notification, ...notifications];
        const unreadCount = newNotifications.filter(n => !n.isRead).length;

        set({
          notifications: newNotifications,
          unreadCount,
        });
      },

      markAsRead: id => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        );
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;

        set({
          notifications: updatedNotifications,
          unreadCount,
        });
      },

      markAllAsRead: () => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          isRead: true,
        }));

        set({
          notifications: updatedNotifications,
          unreadCount: 0,
        });
      },

      removeNotification: id => {
        const { notifications } = get();
        const updatedNotifications = notifications.filter(n => n.id !== id);
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;

        set({
          notifications: updatedNotifications,
          unreadCount,
        });
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      setLoading: isLoading => {
        set({ isLoading });
      },

      setError: error => {
        set({ error, isLoading: false });
      },

      updateUnreadCount: () => {
        const { notifications } = get();
        const unreadCount = notifications.filter(n => !n.isRead).length;
        set({ unreadCount });
      },

      setLastFetched: lastFetched => {
        set({ lastFetched });
      },
    }),
    {
      name: 'notification-store',
      partialize: state => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

// Computed selectors
export const useUnreadNotifications = () => {
  const notifications = useNotificationStore(state => state.notifications);
  return notifications.filter(notification => !notification.isRead);
};

export const useRecentNotifications = (limit: number = 5) => {
  const notifications = useNotificationStore(state => state.notifications);
  return notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

export const useNotificationsByType = (type: Notification['type']) => {
  const notifications = useNotificationStore(state => state.notifications);
  return notifications.filter(notification => notification.type === type);
};

export const useHasUnreadNotifications = () => {
  const unreadCount = useNotificationStore(state => state.unreadCount);
  return unreadCount > 0;
};
