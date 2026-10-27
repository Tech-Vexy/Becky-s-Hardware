'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  ExternalLink,
  Wifi,
  CloudOff,
  ShoppingCart,
  Smartphone,
  AlertTriangle,
  CreditCard,
  Radio,
} from 'lucide-react';
import type { NotificationType, AppNotification } from '@/lib/types/notifications';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'sale':
      return <ShoppingCart className="h-4 w-4 text-emerald-600" />;
    case 'payment':
      return <Smartphone className="h-4 w-4 text-emerald-600" />;
    case 'inventory':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case 'credit':
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    default:
      return <Bell className="h-4 w-4 text-slate-600" />;
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffSeconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isRealtimeConnected,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestWebNotificationPermission,
    browserNotificationPermission,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const displayedNotifications = useMemo(
    () => (activeTab === 'unread' ? notifications.filter((n) => !n.read) : notifications),
    [activeTab, notifications]
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all focus:outline-none"
        aria-label="View notifications"
        title="Store Alerts & Realtime Feed"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-slate-900 tracking-tight">Notifications</h3>
                {isRealtimeConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>Realtime Live</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Radio className="h-2.5 w-2.5 text-amber-600" />
                    <span>Local Mode</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Sound Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                  title={soundEnabled ? 'Mute notification sound' : 'Enable notification chime'}
                >
                  {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-amber-700" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
                </button>

                {/* Mark All Read */}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors text-[10px] font-bold flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 mt-2.5 bg-slate-200/60 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 rounded-lg text-center transition-colors ${
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-1 rounded-lg text-center transition-colors ${
                  activeTab === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No {activeTab === 'unread' ? 'unread ' : ''}notifications at this time.
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3 text-xs transition-colors cursor-pointer flex items-start gap-2.5 ${
                    !n.read ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="p-1.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-extrabold text-slate-900 truncate text-[11px]">{n.title}</div>
                      <div className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(n.created_at)}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</div>

                    <div className="flex items-center justify-between mt-1.5">
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => {
                            markAsRead(n.id);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:underline"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      ) : (
                        <div></div>
                      )}

                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0" title="Unread"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px]">
            {browserNotificationPermission === 'default' ? (
              <button
                onClick={requestWebNotificationPermission}
                className="text-amber-700 hover:underline font-bold text-[10px] flex items-center gap-1"
              >
                <Bell className="h-3 w-3" />
                <span>Enable Desktop Popups</span>
              </button>
            ) : (
              <span className="text-slate-400 text-[10px]">
                {browserNotificationPermission === 'granted' ? 'Desktop alerts enabled' : ''}
              </span>
            )}

            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-slate-400 hover:text-red-600 font-bold text-[10px] flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
