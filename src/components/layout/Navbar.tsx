'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { syncEngine, type SyncEngineStatus } from '@/lib/sync/syncEngine';
import { SyncCenterModal } from '@/components/sync/SyncCenterModal';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Spinner } from '@/components/ui/Spinner';
import {
  Wrench,
  Wifi,
  CloudOff,
  RefreshCw,
  ShoppingCart,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Activity,
  Zap,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(syncEngine.getStatus());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status) => {
      setSyncStatus(status);
      syncEngine.getPendingCount().then(setPendingCount);
    });
    syncEngine.getPendingCount().then(setPendingCount);
    return unsubscribe;
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'BH';

  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full">
        {/* Glass bar */}
        <div className="glass border-b border-slate-200/70 shadow-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">

            {/* ── Left: Branding ───────────────────────────────── */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
              aria-label="Becky's Hardware Store — Dashboard"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md group-hover:shadow-amber-300/40 transition-shadow duration-200">
                <Wrench className="h-4.5 w-4.5" strokeWidth={2.2} />
                {/* Live pulse dot */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse-fast ${syncStatus.isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${syncStatus.isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-extrabold tracking-tight text-slate-900 leading-none">
                  BECKY'S HARDWARE
                </p>
                <p className="text-[10px] font-semibold text-amber-700 tracking-widest mt-0.5 uppercase">
                  Hardware & Building Supplies
                </p>
              </div>
            </Link>

            {/* ── Right: Actions ───────────────────────────────── */}
            <div className="flex items-center gap-2">

              {/* POS Quick Launch */}
              <Link
                href="/pos"
                className="hidden sm:inline-flex items-center gap-1.5 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 text-[13px] font-bold text-white shadow-sm hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-all duration-150 select-none"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Open POS</span>
              </Link>

              {/* Sync / Online Status pill */}
              <button
                onClick={() => setIsSyncModalOpen(true)}
                title={`Auto-syncing every 15s. Click for Sync Center. Last sync: ${syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleTimeString() : 'Never'}`}
                className={`inline-flex items-center gap-1.5 h-9 rounded-xl border px-3 text-xs font-semibold transition-all duration-150 ${
                  syncStatus.isOnline
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {syncStatus.isSyncing ? (
                  <Spinner size="xs" variant={syncStatus.isOnline ? 'emerald' : 'primary'} />
                ) : syncStatus.isOnline ? (
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <CloudOff className="h-3.5 w-3.5 text-amber-600" />
                )}
                <span className="hidden md:inline">
                  {syncStatus.isSyncing ? 'Syncing...' : syncStatus.isOnline ? 'Live Synced' : 'Offline'}
                </span>
                {pendingCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
                {syncStatus.lastError && (
                  <span className="h-2 w-2 rounded-full bg-red-500" title={syncStatus.lastError} />
                )}
              </button>

              {/* Notification Bell */}
              <NotificationBell />

              {/* ── User Menu ───────────────────────────────────── */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 h-9 rounded-xl border border-slate-200 bg-white px-2.5 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  {/* Avatar */}
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-[10px] font-black shadow-sm select-none">
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-[12px] font-bold text-slate-900 leading-none">
                      {user?.full_name?.split(' ')[0] || 'Owner'}
                    </p>
                    <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mt-0.5">
                      Store Owner
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown */}
                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 z-50 animate-scale-in overflow-hidden"
                  >
                    {/* Profile header */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-sm shadow-lg">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate leading-tight">
                            {user?.full_name || 'Becky'}
                          </p>
                          {user?.phone && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user.phone}</p>
                          )}
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                            <Zap className="h-2.5 w-2.5" />
                            Store Owner
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status bar */}
                    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      <Activity className="h-3 w-3 text-emerald-500" />
                      <span className="text-[11px] text-slate-500">
                        {syncStatus.isOnline ? (
                          <span className="text-emerald-700 font-semibold">Connected · Syncing active</span>
                        ) : (
                          <span className="text-amber-700 font-semibold">Offline · Local mode</span>
                        )}
                      </span>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        href="/staff"
                        onClick={() => setIsUserMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-slate-400" />
                        <span>Store Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 p-1.5">
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await signOut();
                        }}
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <SyncCenterModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
    </>
  );
};
