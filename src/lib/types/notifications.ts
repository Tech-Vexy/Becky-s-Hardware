export type NotificationType = 'sale' | 'payment' | 'inventory' | 'credit' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  created_at: number;
}
