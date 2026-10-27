'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ClipboardList,
  Truck,
  Building2,
  Users,
  CreditCard,
  RotateCcw,
  Receipt,
  BarChart3,
  History,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { canAccessModule } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, module: 'dashboard' },
    { name: 'Point of Sale (POS)', href: '/pos', icon: ShoppingCart, module: 'pos', highlight: true },
    { name: 'Product Catalogue', href: '/catalogue', icon: Boxes, module: 'catalogue' },
    { name: 'Inventory Ledger', href: '/inventory', icon: ClipboardList, module: 'inventory' },
    { name: 'Purchases & Receiving', href: '/purchases', icon: Truck, module: 'purchases' },
    { name: 'Suppliers', href: '/suppliers', icon: Building2, module: 'suppliers' },
    { name: 'Customers & Credit', href: '/customers', icon: Users, module: 'customers' },
    { name: 'Payments & M-Pesa', href: '/payments', icon: CreditCard, module: 'payments' },
    { name: 'Sales Returns', href: '/returns', icon: RotateCcw, module: 'returns' },
    { name: 'Store Expenses', href: '/expenses', icon: Receipt, module: 'expenses' },
    { name: 'Financial Reports', href: '/reports', icon: BarChart3, module: 'reports' },
    { name: 'Audit Logs', href: '/audit-logs', icon: History, module: 'audit_logs' },
    { name: 'Store Settings', href: '/settings', icon: Settings, module: 'settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 md:hidden">
          <span className="text-sm font-bold text-slate-800">Store Navigation</span>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-full flex-col justify-between overflow-y-auto px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              if (!canAccessModule(item.module)) return null;

              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : item.highlight
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                      : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Store Info Footer */}
          <div className="mt-6 border-t border-slate-100 pt-4 px-2">
            <div className="text-[11px] font-bold text-slate-900">Becky's Hardware Store</div>
            <div className="text-[9px] text-amber-700 font-mono mt-0.5">KRA PIN: P051234567X</div>
          </div>
        </div>
      </aside>
    </>
  );
};
