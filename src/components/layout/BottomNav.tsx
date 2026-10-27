'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Grid,
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
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Catalogue', href: '/catalogue', icon: Boxes },
  { name: 'POS', href: '/pos', icon: ShoppingCart, isPos: true },
  { name: 'Stock', href: '/inventory', icon: ClipboardList },
];

const MORE_MODULES = [
  { name: 'Invoices & Billing', href: '/invoices', icon: FileText, desc: 'KRA tax invoices & A4 PDF' },
  { name: 'Purchases & Receiving', href: '/purchases', icon: Truck, desc: 'Stock in & supplier POs' },
  { name: 'Customers & Credit', href: '/customers', icon: Users, desc: 'Ledger & repayments' },
  { name: 'Suppliers', href: '/suppliers', icon: Building2, desc: 'Directory & contacts' },
  { name: 'Payments & M-Pesa', href: '/payments', icon: CreditCard, desc: 'Reconcile transactions' },
  { name: 'Sales Returns', href: '/returns', icon: RotateCcw, desc: 'Refunds & damaged items' },
  { name: 'Store Expenses', href: '/expenses', icon: Receipt, desc: 'Casual labor & fuel' },
  { name: 'Financial Reports', href: '/reports', icon: BarChart3, desc: 'Daily Z-report & P&L' },
  { name: 'Audit Logs', href: '/audit-logs', icon: History, desc: 'System trace & activity' },
  { name: 'Store Settings', href: '/settings', icon: Settings, desc: 'KRA PIN, printer & profile' },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Don't show bottom nav on login screen
  if (pathname === '/login') return null;

  const isMoreModuleActive = MORE_MODULES.some((m) => pathname === m.href);

  return (
    <>
      {/* "More" Bottom Sheet / Popover */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Sheet Container */}
          <div className="relative z-50 w-full max-w-xl mx-auto bg-white rounded-t-3xl md:rounded-2xl border border-slate-200 shadow-2xl p-5 mb-0 md:mb-20 animate-in fade-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Grid className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">All Store Modules</h3>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              {MORE_MODULES.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex flex-col p-3 rounded-xl border transition-all text-left group ${
                      isActive
                        ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-xs'
                        : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          isActive
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 group-hover:text-amber-700'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold leading-tight line-clamp-1">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-1 pl-0.5">{item.desc}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Primary Default Bottom Bar */}
      <nav
        aria-label="Application Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none md:bottom-3"
      >
        <div className="pointer-events-auto w-full md:w-auto md:min-w-[460px] bg-white/95 backdrop-blur-md border-t md:border border-slate-200/90 md:rounded-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:shadow-xl px-3 py-1.5 md:py-2 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-around md:gap-4">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              if (item.isPos) {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="relative -top-3 flex flex-col items-center group focus:outline-none"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 ${
                        isActive
                          ? 'bg-amber-600 text-white ring-4 ring-amber-100'
                          : 'bg-amber-500 text-slate-950 hover:bg-amber-600 hover:text-white'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span
                      className={`text-[10px] font-extrabold mt-0.5 ${
                        isActive ? 'text-amber-800' : 'text-slate-700'
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[56px] min-h-[44px] active:scale-95 ${
                    isActive
                      ? 'text-amber-600 font-extrabold'
                      : 'text-slate-500 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span className="text-[10px] mt-0.5 font-bold">{item.name}</span>
                </Link>
              );
            })}

            {/* Clean "More" Button */}
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[56px] min-h-[44px] active:scale-95 focus:outline-none ${
                isMoreOpen || isMoreModuleActive
                  ? 'text-amber-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
              aria-label="Open more modules"
            >
              <Grid
                className={`h-5 w-5 ${
                  isMoreOpen || isMoreModuleActive ? 'text-amber-600' : 'text-slate-500'
                }`}
              />
              <span className="text-[10px] mt-0.5 font-bold">More</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
