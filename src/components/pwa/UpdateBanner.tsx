'use client';

import React from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

interface UpdateBannerProps {
  /** Set true when a new service worker is waiting to activate */
  isVisible: boolean;
  /** Call this to tell the waiting SW to skipWaiting and reload the page */
  onUpdate: () => void;
  /** Dismiss without updating (user can update later by reloading) */
  onDismiss: () => void;
}

/**
 * UpdateBanner — slim amber bar shown when a new version of the PWA is
 * available. The AppShell wires this up via the service worker's
 * `waiting` state. One-click reload applies the update immediately.
 */
export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  isVisible,
  onUpdate,
  onDismiss,
}) => {
  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative z-20 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 animate-slide-down"
    >
      {/* Left: Icon + copy */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Sparkles className="h-4 w-4 flex-shrink-0 text-amber-100" />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-white leading-tight">
            Update available
          </p>
          <p className="text-[11px] text-amber-100 hidden sm:block">
            A new version of Becky's Hardware is ready — reload to apply.
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onUpdate}
          className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 px-3.5 py-1.5 text-[13px] font-bold text-white active:scale-95 transition-all"
          aria-label="Reload to update"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reload &amp; Update</span>
        </button>
        <button
          onClick={onDismiss}
          className="flex h-7 w-7 items-center justify-center rounded-xl text-amber-200 hover:bg-amber-800/40 hover:text-white transition-colors"
          aria-label="Dismiss update banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
