'use client';

import React from 'react';
import { Wrench, Download, X, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '@/lib/pwa/useInstallPrompt';

/**
 * InstallBanner — appears at the top of the app shell when the browser
 * signals that the PWA can be installed. Dismissed per-session.
 */
export const InstallBanner: React.FC = () => {
  const { canInstall, isInstalled, promptInstall, dismissBanner, isBannerDismissed } =
    useInstallPrompt();

  // Hide if: already installed, already dismissed this session, or can't install
  if (!canInstall || isInstalled || isBannerDismissed) return null;

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'dismissed') {
      dismissBanner();
    }
  };

  return (
    <div
      role="banner"
      aria-label="Install Becky's Hardware app"
      className="relative z-20 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 animate-slide-down"
    >
      {/* Left: Icon + copy */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-900 shadow-md">
          <Wrench className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-white leading-tight truncate">
            Install Becky's Hardware
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block truncate">
            Add to home screen for offline POS &amp; faster access
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 sm:hidden">
            Works offline · Fast access
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-[13px] font-bold text-slate-900 hover:bg-amber-400 active:scale-95 transition-all shadow-sm"
          aria-label="Install app"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
        <button
          onClick={dismissBanner}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          aria-label="Dismiss install banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
