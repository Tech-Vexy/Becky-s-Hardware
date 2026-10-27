'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { syncEngine, type SyncEngineStatus } from '@/lib/sync/syncEngine';
import { SyncCenterModal } from '@/components/sync/SyncCenterModal';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  Wrench,
  Wifi,
  CloudOff,
  RefreshCw,
  ShoppingCart,
  User,
  ChevronDown,
  ShieldCheck,
  Settings,
  LogOut,
} from 'lucide-react';
import type { AppRole } from '@/lib/types/database';

export const Navbar: React.FC = () => {
  const { user, role, staffProfiles, setActiveEmployee, signOut } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(syncEngine.getStatus());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status) => {
      setSyncStatus(status);
      syncEngine.getPendingCount().then(setPendingCount);
    });
    syncEngine.getPendingCount().then(setPendingCount);
    return unsubscribe;
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-6 backdrop-blur">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md group-hover:bg-amber-700 transition-colors">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                BECKY'S HARDWARE
              </div>
              <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest mt-0.5">
                Kenyan Retail PWA
              </div>
            </div>
          </Link>
        </div>

        {/* Right: POS Quick Button, Active User Switcher, Online/Sync Badge */}
        <div className="flex items-center gap-2.5">
          {/* POS Touchscreen Launch */}
          <Link
            href="/pos"
            className="hidden sm:flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-all active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Open POS</span>
          </Link>

          {/* Online / Offline Sync Badge */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              syncStatus.isOnline
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
            title="Click to view synchronization queue"
          >
            {syncStatus.isOnline ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span className="hidden md:inline">{syncStatus.isOnline ? 'Online' : 'Offline'}</span>
            {pendingCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
            {syncStatus.isSyncing && <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />}
          </button>

          {/* Realtime Notification Center Bell */}
          <NotificationBell />

          {/* Store Owner Profile & Menu */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-all"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                {user?.full_name ? user.full_name[0] : 'B'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-[11px] font-bold leading-none">{user?.full_name.split(' ')[0]}</div>
                <div className="text-[9px] uppercase tracking-wider text-amber-700 font-extrabold mt-0.5">
                  Store Owner
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50">
                <div className="border-b border-slate-100 px-3 py-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Store Owner
                  </div>
                  <div className="text-xs font-black text-slate-900 mt-0.5">
                    {user?.full_name}
                  </div>
                  {user?.phone && (
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {user.phone}
                    </div>
                  )}
                </div>

                <div className="p-1 space-y-1">
                  <Link
                    href="/settings"
                    onClick={() => setIsRoleDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-amber-600" />
                    <span>Store Settings</span>
                  </Link>

                  <button
                    onClick={async () => {
                      setIsRoleDropdownOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sync Center Drawer / Modal */}
      <SyncCenterModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
    </>
  );
};