'use client';

import React from 'react';
import Link from 'next/link';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import {
  ShoppingCart,
  Smartphone,
  AlertTriangle,
  CreditCard,
  Bell,
  X,
  ExternalLink,
} from 'lucide-react';
import type { NotificationType } from '@/lib/types/notifications';

function getToastIcon(type: NotificationType) {
  switch (type) {
    case 'sale':
      return <ShoppingCart className="h-4 w-4 text-emerald-600 shrink-0" />;
    case 'payment':
      return <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />;
    case 'inventory':
      return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
    case 'credit':
      return <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />;
    default:
      return <Bell className="h-4 w-4 text-slate-600 shrink-0" />;
  }
}

function getToastBorder(type: NotificationType) {
  switch (type) {
    case 'sale':
      return 'border-emerald-300 bg-emerald-50/95';
    case 'payment':
      return 'border-emerald-300 bg-emerald-50/95';
    case 'inventory':
      return 'border-amber-300 bg-amber-50/95';
    case 'credit':
      return 'border-blue-300 bg-blue-50/95';
    default:
      return 'border-slate-300 bg-white/95';
  }
}

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-2xl border p-3.5 shadow-xl backdrop-blur transition-all duration-300 animate-in slide-in-from-bottom-3 ${getToastBorder(
            t.type
          )}`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-1 rounded-lg bg-white/80 shadow-xs mt-0.5">
                {getToastIcon(t.type)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 leading-tight">
                  {t.title}
                </div>
                <div className="text-[11px] text-slate-700 mt-0.5 leading-snug line-clamp-2">
                  {t.message}
                </div>
                {t.link && (
                  <Link
                    href={t.link}
                    onClick={() => dismissToast(t.id)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:text-amber-900 mt-1 hover:underline"
                  >
                    <span>View Details</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                )}
              </div>
            </div>

            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
