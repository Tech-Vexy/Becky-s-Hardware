'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CloudOff, Wifi, RefreshCw } from 'lucide-react';

/**
 * OfflineBar — a slim, persistent bar shown beneath the navbar when the
 * browser loses connectivity. Automatically animates away when reconnected
 * and briefly shows a "Back online" confirmation before hiding.
 */
export const OfflineBar: React.FC = () => {
  const [isOnline, setIsOnline]           = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [visible, setVisible]             = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialise from actual navigator state
    setIsOnline(navigator.onLine);
    setVisible(!navigator.onLine);

    const goOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Show "reconnected" message briefly, then fade out
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setShowReconnected(false);
      }, 3000);
    };

    const goOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`relative z-20 flex items-center justify-center gap-2 px-4 py-1.5 text-[12px] font-semibold transition-all duration-300 ${
        isOnline
          ? 'bg-emerald-600 text-white animate-fade-in'
          : 'bg-slate-800 text-slate-200'
      }`}
    >
      {isOnline && showReconnected ? (
        <>
          <Wifi className="h-3.5 w-3.5 text-emerald-200 flex-shrink-0" />
          <span>Back online — syncing your store data…</span>
          <RefreshCw className="h-3 w-3 animate-spin opacity-70" />
        </>
      ) : (
        <>
          <CloudOff className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
          <span>
            You're offline — POS &amp; inventory still work.{' '}
            <span className="text-slate-400 font-normal">Sales will sync when you reconnect.</span>
          </span>
        </>
      )}
    </div>
  );
};
