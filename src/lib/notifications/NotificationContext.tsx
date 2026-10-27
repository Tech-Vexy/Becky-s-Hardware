'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppNotification, NotificationType, ToastItem } from '@/lib/types/notifications';
import { playNotificationSound } from '@/lib/notifications/sound';

const STORAGE_KEY = 'beckys_hardware_notifications';
const SOUND_ENABLED_KEY = 'beckys_hardware_notifications_sound';

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  toasts: ToastItem[];
  isRealtimeConnected: boolean;
  setIsRealtimeConnected: (connected: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  addNotification: (params: {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    data?: Record<string, any>;
  }) => void;
  /** Instantly surfaces a transient toast (no persistence, no sound). */
  showToast: (type: NotificationType, title: string, message: string, link?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissToast: (id: string) => void;
  requestWebNotificationPermission: () => Promise<boolean>;
  browserNotificationPermission: NotificationPermission | 'unsupported';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default');

  // Load persisted notifications and settings on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out any legacy mock notifications
          const clean = parsed.filter((n: AppNotification) => !n.id.startsWith('init-'));
          setNotifications(clean);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
        }
      } else {
        setNotifications([]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }

      const storedSound = localStorage.getItem(SOUND_ENABLED_KEY);
      if (storedSound !== null) {
        setSoundEnabledState(storedSound === 'true');
      }

      if ('Notification' in window) {
        setBrowserNotificationPermission(Notification.permission);
        // Automatically request notification permissions if not yet determined
        if (Notification.permission === 'default') {
          Notification.requestPermission().then((perm) => {
            setBrowserNotificationPermission(perm);
          }).catch((err) => {
            console.warn('Could not request notification permission:', err);
          });
        }
      } else {
        setBrowserNotificationPermission('unsupported');
      }
    } catch (e) {
      console.warn('Error reading notification storage:', e);
      setNotifications([]);
    }
  }, []);

  // Save notifications to localStorage on changes
  const saveNotifications = (newList: AppNotification[]) => {
    setNotifications(newList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      } catch (e) {
        console.warn('Could not persist notifications:', e);
      }
    }
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    }
  };

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: NotificationType, title: string, message: string, link?: string) => {
      const toastId = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
        id: toastId,
        type,
        title,
        message,
        link,
        created_at: Date.now(),
      };
      setToasts((prev) => [...prev.slice(-3), newToast]); // Show up to 4 toasts at once

      // Auto-dismiss toast after 5 seconds
      setTimeout(() => {
        dismissToast(toastId);
      }, 5000);
    },
    [dismissToast]
  );

  const requestWebNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      setBrowserNotificationPermission(permission);
      return permission === 'granted';
    } catch (err) {
      console.warn('Web notification request failed:', err);
      return false;
    }
  };

  const addNotification = useCallback(
    ({
      type,
      title,
      message,
      link,
      data,
    }: {
      type: NotificationType;
      title: string;
      message: string;
      link?: string;
      data?: Record<string, any>;
    }) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type,
        title,
        message,
        link,
        data,
        read: false,
        created_at: new Date().toISOString(),
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev.slice(0, 49)]; // Keep latest 50
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.warn('Failed saving notifications:', e);
          }
        }
        return updated;
      });

      // Play audio chime if enabled
      if (soundEnabled) {
        playNotificationSound(type);
      }

      // Add to floating toasts
      showToast(type, title, message, link);

      // Trigger Web Browser Notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: message,
            icon: '/icon-192.png',
            tag: newNotif.id,
          });
        } catch {
          // Ignore browser notification dispatch errors
        }
      }
    },
    [soundEnabled, showToast]
  );

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        isRealtimeConnected,
        setIsRealtimeConnected,
        soundEnabled,
        setSoundEnabled,
        addNotification,
        showToast,
        markAsRead,
        markAllAsRead,
        clearAll,
        dismissToast,
        requestWebNotificationPermission,
        browserNotificationPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
