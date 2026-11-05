'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { NotificationProvider } from '@/lib/notifications/NotificationContext';
import { RealtimeListener } from '@/components/notifications/RealtimeListener';
import { PusherListener } from '@/components/notifications/PusherListener';
import { DailySummaryNotifier } from '@/components/notifications/DailySummaryNotifier';
import { ToastContainer } from '@/components/notifications/ToastContainer';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { UpdateBanner } from '@/components/pwa/UpdateBanner';
import { OfflineBar } from '@/components/pwa/OfflineBar';
import { initializeLocalStoreDatabase } from '@/lib/dexie/db';
import { Spinner } from '@/components/ui/Spinner';
import { Wrench } from 'lucide-react';

// ─── Full-screen branded loading screen ─────────────────────────────────────

const AppLoadingScreen: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 select-none">
    {/* Ambient radial glow */}
    <div
      aria-hidden="true"
      className="absolute h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"
    />

    {/* Branded hardware icon with dual orbital rings */}
    <div className="relative mb-6">
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-2xl animate-glow-pulse">
        <Wrench className="h-8 w-8 text-white drop-shadow-md" strokeWidth={2.2} />
      </div>

      {/* Orbital precision spinner ring */}
      <div className="absolute -inset-3 flex items-center justify-center pointer-events-none">
        <Spinner variant="orbital" size="xl" className="h-24 w-24 opacity-80" />
      </div>
    </div>

    {/* Wordmark */}
    <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">
      BECKY'S HARDWARE
    </h1>
    <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-amber-500">
      Hardware &amp; Building Supplies
    </p>

    {/* Authentic Shimmer Loading Bar */}
    <div className="mt-8 w-52 h-1.5 rounded-full bg-slate-800/90 overflow-hidden shadow-inner border border-slate-700/50">
      <div className="h-full w-full rounded-full shimmer-progress" />
    </div>

    <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
      <Spinner size="xs" variant="primary" />
      <span>Loading store ledger &amp; catalogue…</span>
    </div>
  </div>
);

// ─── Inner content (requires auth context) ──────────────────────────────────

const AppContent: React.FC<{
  children: React.ReactNode;
  swUpdateWaiting: boolean;
  onSwUpdate: () => void;
  onSwUpdateDismiss: () => void;
}> = ({ children, swUpdateWaiting, onSwUpdate, onSwUpdateDismiss }) => {
  const pathname = usePathname();
  const router   = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Full-screen branded loading splash
  if (isLoading) {
    return <AppLoadingScreen />;
  }

  // Login screen — full-screen, no chrome
  if (pathname === '/login') {
    return <main className="min-h-screen">{children}</main>;
  }

  // Guard: Never render store dashboard or chrome if unauthenticated
  if (!isAuthenticated) {
    return <AppLoadingScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* ── PWA system banners (stacked beneath the sticky nav) ──────── */}
      <InstallBanner />
      <UpdateBanner
        isVisible={swUpdateWaiting}
        onUpdate={onSwUpdate}
        onDismiss={onSwUpdateDismiss}
      />
      <OfflineBar />

      {/* ── Chrome ───────────────────────────────────────────────────── */}
      <DailySummaryNotifier />
      <Navbar />
      <main className="flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 pb-28">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
};

// ─── Root shell (registers SW, bootstraps DB) ────────────────────────────────

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [swUpdateWaiting, setSwUpdateWaiting] = useState(false);
  const [swRegistration, setSwRegistration]   = useState<ServiceWorkerRegistration | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // ── Apply the waiting SW, then hard-reload ──────────────────────────────
  const handleSwUpdate = useCallback(() => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Wait for the new SW to take control, then reload
      const onControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, {
        once: true,
      });
    }
  }, [swRegistration]);

  const handleSwUpdateDismiss = useCallback(() => {
    setUpdateDismissed(true);
    setSwUpdateWaiting(false);
  }, []);

  useEffect(() => {
    // Bootstrap IndexedDB virtual store replica
    initializeLocalStoreDatabase();

    // Register PWA service worker with update detection
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        setSwRegistration(reg);
        console.log('[AppShell] SW registered, scope:', reg.scope);

        // A new SW is already waiting (installed on a previous visit)
        if (reg.waiting) {
          setSwUpdateWaiting(true);
        }

        // New SW installed while the page is open
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // A new version is ready but not yet active
              setSwUpdateWaiting(true);
            }
          });
        });

        // Register Background Sync if supported
        if ('SyncManager' in window) {
          (reg as any).sync
            .register('becky-sync')
            .catch((err: unknown) => console.warn('[AppShell] Background sync registration failed:', err));
        }

        // Register Periodic Background Sync if supported (requires permission)
        if ('periodicSync' in reg) {
          (reg as any).periodicSync
            .register('becky-periodic-sync', { minInterval: 60 * 60 * 1000 }) // 1 hour
            .catch((err: unknown) =>
              console.warn('[AppShell] Periodic sync registration failed:', err)
            );
        }

        // Poll for SW updates every 10 minutes while the tab is active
        const updateInterval = setInterval(() => {
          reg.update().catch(() => {});
        }, 10 * 60 * 1000);

        return () => clearInterval(updateInterval);
      })
      .catch((err) => console.warn('[AppShell] SW registration failed:', err));

    // Listen for messages from the SW (e.g. background sync trigger)
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BACKGROUND_SYNC_TRIGGERED') {
        import('@/lib/sync/syncEngine')
          .then(({ syncEngine }) => syncEngine.syncAll())
          .catch(console.error);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <RealtimeListener />
        <PusherListener />
        <AppContent
          swUpdateWaiting={swUpdateWaiting && !updateDismissed}
          onSwUpdate={handleSwUpdate}
          onSwUpdateDismiss={handleSwUpdateDismiss}
        >
          {children}
        </AppContent>
        <ToastContainer />
      </NotificationProvider>
    </AuthProvider>
  );
};
