'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Grid3x3,
  Truck,
  Users,
  Building2,
  CreditCard,
  RotateCcw,
  Receipt,
  BarChart3,
  History,
  Settings,
  X,
  FileText,
  BookOpen,
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { name: 'Home',      href: '/',          icon: LayoutDashboard },
  { name: 'Catalogue', href: '/catalogue', icon: Boxes },
  { name: 'POS',       href: '/pos',       icon: ShoppingCart,   isPos: true },
  { name: 'Stock',     href: '/inventory', icon: ClipboardList },
];

const MORE_MODULES = [
  { name: 'Financial Ledger',       href: '/ledger',      icon: BookOpen,    desc: 'Unified cash book & balance',    color: 'from-cyan-500 to-cyan-600' },
  { name: 'Invoices & Billing',     href: '/invoices',    icon: FileText,   desc: 'KRA tax invoices & A4 PDF',     color: 'from-purple-500 to-purple-600' },
  { name: 'Purchases & Receiving',  href: '/purchases',   icon: Truck,      desc: 'Stock in & supplier POs',       color: 'from-blue-500 to-blue-600' },
  { name: 'Customers & Credit',     href: '/customers',   icon: Users,      desc: 'Ledger & repayments',           color: 'from-emerald-500 to-emerald-600' },
  { name: 'Suppliers',              href: '/suppliers',   icon: Building2,  desc: 'Directory & contacts',          color: 'from-teal-500 to-teal-600' },
  { name: 'Payments & M-Pesa',      href: '/payments',    icon: CreditCard, desc: 'Reconcile transactions',        color: 'from-green-500 to-green-600' },
  { name: 'Sales Returns',          href: '/returns',     icon: RotateCcw,  desc: 'Refunds & damaged items',       color: 'from-rose-500 to-rose-600' },
  { name: 'Store Expenses',         href: '/expenses',    icon: Receipt,    desc: 'Casual labor & fuel',           color: 'from-amber-500 to-amber-600' },
  { name: 'Financial Reports',      href: '/reports',     icon: BarChart3,  desc: 'Daily Z-report & P&L',          color: 'from-indigo-500 to-indigo-600' },
  { name: 'Audit Logs',             href: '/audit-logs',  icon: History,    desc: 'System trace & activity',       color: 'from-slate-500 to-slate-600' },
  { name: 'Store Settings',         href: '/settings',    icon: Settings,   desc: 'KRA PIN, printer & profile',    color: 'from-slate-600 to-slate-700' },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  if (pathname === '/login') return null;

  const isMoreModuleActive = MORE_MODULES.some((m) => pathname === m.href);

  return (
    <>
      {/* ── "More" Bottom Sheet ──────────────────────────────────────── */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Sheet */}
          <div className="relative z-10 w-full max-w-2xl mx-auto bg-white rounded-t-3xl shadow-2xl animate-slide-in overflow-hidden pb-safe">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-none">Store Modules</h2>
                <p className="text-xs text-slate-400 mt-0.5">All sections of your hardware store</p>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grid of modules */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 max-h-[65vh] overflow-y-auto no-scrollbar">
              {MORE_MODULES.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`group flex items-start gap-3 rounded-2xl border p-3.5 transition-all active:scale-[0.97] ${
                      isActive
                        ? 'border-amber-400 bg-amber-50 shadow-sm'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-bold leading-tight ${isActive ? 'text-amber-900' : 'text-slate-800'} line-clamp-1`}>
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Primary Bottom Bar ───────────────────────────────────────── */}
      <nav
        aria-label="Application Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none md:bottom-3"
      >
        <div className="pointer-events-auto w-full md:w-auto md:min-w-[480px] glass border-t md:border border-slate-200/80 md:rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.07)] md:shadow-xl">
          <div className="flex items-center justify-around px-2 py-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:pb-1 md:px-3">

            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              /* ── POS FAB ──────────────────────────────────────── */
              if (item.isPos) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative -top-4 flex flex-col items-center focus:outline-none group"
                    aria-label="Open POS"
                  >
                    <div
                      className={`flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-90 ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white ring-4 ring-amber-200 shadow-amber-300/40'
                          : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 shadow-amber-300/30'
                      }`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <span className={`mt-0.5 text-[10px] font-extrabold tracking-wide ${isActive ? 'text-amber-700' : 'text-slate-600'}`}>
                      {item.name}
                    </span>
                  </Link>
                );
              }

              /* ── Regular Nav Item ─────────────────────────────── */
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-xl transition-all min-w-[56px] active:scale-95 group"
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active pill background */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-amber-50" />
                  )}
                  {/* Active top indicator line */}
                  {isActive && (
                    <span className="absolute -top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-amber-500" />
                  )}

                  <Icon
                    className={`relative h-5 w-5 transition-colors ${
                      isActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span
                    className={`relative text-[10px] mt-0.5 font-bold transition-colors ${
                      isActive ? 'text-amber-700' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}

            {/* ── More Button ─────────────────────────────────────── */}
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-xl transition-all min-w-[56px] active:scale-95 group focus:outline-none"
              aria-label="More modules"
              aria-expanded={isMoreOpen}
            >
              {(isMoreOpen || isMoreModuleActive) && (
                <span className="absolute inset-0 rounded-xl bg-amber-50" />
              )}
              {(isMoreOpen || isMoreModuleActive) && (
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-amber-500" />
              )}

              <Grid3x3
                className={`relative h-5 w-5 transition-colors ${
                  isMoreOpen || isMoreModuleActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-700'
                }`}
                strokeWidth={isMoreOpen || isMoreModuleActive ? 2.2 : 1.8}
              />
              <span
                className={`relative text-[10px] mt-0.5 font-bold transition-colors ${
                  isMoreOpen || isMoreModuleActive ? 'text-amber-700' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              >
                More
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
