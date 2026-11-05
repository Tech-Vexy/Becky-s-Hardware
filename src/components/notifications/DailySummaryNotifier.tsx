'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import {
  DAILY_SUMMARY_CONFIG_EVENT,
  buildDailySummary,
  dailySummaryMessage,
  dailySummaryTitle,
  getLastSentDateKey,
  isDailySummaryDue,
  loadDailySummaryConfig,
  markDailySummarySent,
  sendDailySummaryEmail,
} from '@/lib/notifications/dailySummary';

/**
 * Watches the clock while the portal is open and, once per trading day after
 * the configured closing time, raises the end-of-day sales & profit digest as
 * an in-app/PWA notification (plus email when enabled).
 */
export const DailySummaryNotifier: React.FC = () => {
  const { addNotification } = useNotifications();
  const isRunningRef = useRef(false);

  const runCheck = useCallback(async () => {
    if (isRunningRef.current) return;

    const config = loadDailySummaryConfig();
    if (!isDailySummaryDue(config, getLastSentDateKey())) return;

    isRunningRef.current = true;
    try {
      const summary = await buildDailySummary();
      if (config.localNotifications !== false) {
        addNotification({
          type: 'system',
          title: dailySummaryTitle(summary),
          message: dailySummaryMessage(summary),
          link: '/reports',
          data: summary,
        });
      }
      markDailySummarySent(summary.dateKey);

      if (config.email) {
        sendDailySummaryEmail(summary, config.recipientEmail).catch((err) =>
          console.warn('[DailySummary] Email dispatch failed:', err)
        );
      }
    } catch (err) {
      console.warn('[DailySummary] Could not build daily summary:', err);
    } finally {
      isRunningRef.current = false;
    }
  }, [addNotification]);

  useEffect(() => {
    runCheck();
    const interval = setInterval(runCheck, 60 * 1000);

    // Re-evaluate immediately when the schedule is changed in Settings
    const onConfigUpdated = () => runCheck();
    window.addEventListener(DAILY_SUMMARY_CONFIG_EVENT, onConfigUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener(DAILY_SUMMARY_CONFIG_EVENT, onConfigUpdated);
    };
  }, [runCheck]);

  return null;
};
