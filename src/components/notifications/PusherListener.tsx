'use client';

import React, { useEffect, useRef } from 'react';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import {
  getPusherClient,
  isPusherConfigured,
  PUSHER_CHANNEL_STORE,
  PUSHER_EVENTS,
  type PusherEventPayload,
} from '@/lib/pusher/client';

/**
 * Pusher Realtime Listener
 * Subscribes to the store's Pusher websocket channel and dispatches incoming
 * events to in-app toasts, sound chimes, and local device/PWA notifications.
 */
export const PusherListener: React.FC = () => {
  const { addNotification } = useNotifications();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!isPusherConfigured()) {
      return;
    }

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(PUSHER_CHANNEL_STORE);
    isSubscribedRef.current = true;

    // 1. Daily Summary Broadcast
    channel.bind(PUSHER_EVENTS.DAILY_SUMMARY, (payload: PusherEventPayload) => {
      if (!payload?.title) return;
      addNotification({
        type: payload.type || 'system',
        title: payload.title,
        message: payload.message || 'End of day store digest ready.',
        link: payload.link || '/reports',
        data: payload.data,
      });
    });

    // 2. Stock / Inventory Alert
    channel.bind(PUSHER_EVENTS.STOCK_ALERT, (payload: PusherEventPayload) => {
      if (!payload?.title) return;
      addNotification({
        type: 'inventory',
        title: payload.title,
        message: payload.message,
        link: payload.link || '/inventory',
        data: payload.data,
      });
    });

    // 3. Payment Received
    channel.bind(PUSHER_EVENTS.PAYMENT_RECEIVED, (payload: PusherEventPayload) => {
      if (!payload?.title) return;
      addNotification({
        type: 'payment',
        title: payload.title,
        message: payload.message,
        link: payload.link || '/payments',
        data: payload.data,
      });
    });

    // 4. Store Announcement
    channel.bind(PUSHER_EVENTS.STORE_ANNOUNCEMENT, (payload: PusherEventPayload) => {
      if (!payload?.title) return;
      addNotification({
        type: 'system',
        title: payload.title,
        message: payload.message,
        link: payload.link,
      });
    });

    return () => {
      if (isSubscribedRef.current) {
        channel.unbind_all();
        pusher.unsubscribe(PUSHER_CHANNEL_STORE);
        isSubscribedRef.current = false;
      }
    };
  }, [addNotification]);

  return null;
};
