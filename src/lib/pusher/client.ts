'use client';

import Pusher from 'pusher-js';

let pusherInstance: Pusher | null = null;

export const PUSHER_CHANNEL_STORE = 'beckys-hardware-channel';

export const PUSHER_EVENTS = {
  DAILY_SUMMARY: 'daily-summary',
  STOCK_ALERT: 'stock-alert',
  PAYMENT_RECEIVED: 'payment-received',
  STORE_ANNOUNCEMENT: 'store-announcement',
} as const;

export interface PusherEventPayload {
  type?: 'system' | 'inventory' | 'payment' | 'sale' | 'credit';
  title: string;
  message: string;
  link?: string;
  data?: Record<string, any>;
  timestamp?: string;
}

export function isPusherConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  return Boolean(key && key.trim());
}

export function getPusherClient(): Pusher | null {
  if (typeof window === 'undefined') return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

  if (!key) {
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(key, {
      cluster,
      forceTLS: true,
    });
  }

  return pusherInstance;
}

export function disconnectPusher(): void {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}
