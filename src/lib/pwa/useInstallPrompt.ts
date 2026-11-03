/**
 * useInstallPrompt — captures the browser's beforeinstallprompt event and
 * exposes a trigger function so we can show our own install banner at the
 * right moment rather than relying on the browser's default UI.
 */

'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface UseInstallPromptReturn {
  /** True when the app can be installed (prompt is available and not yet installed) */
  canInstall: boolean;
  /** True once the user has accepted or dismissed — don't re-show */
  isInstalled: boolean;
  /** Call this to trigger the native install dialog */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  /** Manually dismiss the banner without triggering install */
  dismissBanner: () => void;
  /** Whether the banner has been dismissed this session */
  isBannerDismissed: boolean;
}

const DISMISSED_KEY = 'becky_pwa_install_dismissed';

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already dismissed this session
    try {
      const dismissed = sessionStorage.getItem(DISMISSED_KEY);
      if (dismissed === 'true') setIsBannerDismissed(true);
    } catch {}

    // Check if already installed (running in standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') setIsInstalled(true);
      return outcome;
    } catch {
      return 'unavailable';
    }
  };

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    } catch {}
  };

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    promptInstall,
    dismissBanner,
    isBannerDismissed,
  };
}
