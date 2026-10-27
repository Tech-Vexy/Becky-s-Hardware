'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { NotificationProvider } from '@/lib/notifications/NotificationContext';
import { RealtimeListener } from '@/components/notifications/RealtimeListener';
import { ToastContainer } from '@/components/notifications/ToastContainer';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { initializeLocalStoreDatabase } from '@/lib/dexie/db';

const AppContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, isSupabase } = useAuth();

  useEffect(() => {
    // If Supabase is configured and user is not authenticated and not already on /login, redirect
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // On login screen, render full-screen view without navbar/bottom bar
  if (pathname === '/login') {
    return <main className="min-h-screen bg-slate-100">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 pb-28 md:pb-28">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Bootstrap IndexedDB virtual replica on client launch
    initializeLocalStoreDatabase();

    // Register PWA service worker for robust offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA service worker registration failed:', err);
      });
    }
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <RealtimeListener />
        <AppContent>{children}</AppContent>
        <ToastContainer />
      </NotificationProvider>
    </AuthProvider>
  );
};