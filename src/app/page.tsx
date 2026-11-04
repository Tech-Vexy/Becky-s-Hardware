'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAutoRefresh } from '@/lib/sync/useAutoRefresh';
import { formatKES, formatQuantity, formatDate } from '@/lib/utils/formatters';
import { StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { SkeletonStatCard, SkeletonTableRow } from '@/components/ui/Skeleton';
import {
  TrendingUp,
  Coins,
  Smartphone,
  AlertTriangle,
  Users,
  ShoppingCart,
  Truck,
  Receipt,
  RotateCcw,
  ArrowRight,
  LayoutDashboard,
  CheckCircle2,
  FileText,
  BarChart3,
  Package,
} from 'lucide-react';
import type { Sale, Product, Customer } from '@/lib/types/database';

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const [forToday, recent, allProds] = await Promise.all([
        localDb.sales
          .where('created_at')
          .startsWith(todayStr)
          .filter((s) => s.status === 'completed')
          .toArray(),
        localDb.sales.orderBy('created_at').reverse().limit(10).toArray(),
        localDb.products.filter((x) => x.active === true).toArray(),
      ]);
      setTodaySales(forToday);
      setRecentSales(recent);
      setLowStockProducts(allProds.filter((p) => p.stock_on_hand <= p.low_stock_level));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Live Auto-Refresh upon background polling or peer counter sales
  useAutoRefresh(loadDashboardData, ['sales', 'products', 'all']);

  const { totalGrossSales, totalCash, totalMpesa, unverifiedMpesaCount } = useMemo(() => {
    let gross = 0, cash = 0, mpesa = 0, unverified = 0;
    for (const s of todaySales) {
      gross += s.total_kes;
      for (const p of s.payments ?? []) {
        if (p.method === 'cash') cash += p.amount_kes;
        if (p.method === 'mpesa') {
          mpesa += p.amount_kes;
          if (p.verification_status === 'unverified') unverified++;
        }
      }
    }
    return { totalGrossSales: gross, totalCash: cash, totalMpesa: mpesa, unverifiedMpesaCount: unverified };
  }, [todaySales]);

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <PageHeader
        title="Store Dashboard"
        description={today}
        icon={<LayoutDashboard className="h-5 w-5" />}
        iconColor="from-slate-700 to-slate-900"
        action={
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Open POS</span>
          </Link>
        }
      />

      {/* ── KPI Stat Cards ──────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Today's Performance" className="mb-3" />
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Today's Gross Sales"
              value={formatKES(totalGrossSales)}
              sub={
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {todaySales.length} completed sales
                </span>
              }
              icon={<TrendingUp className="h-5 w-5" />}
              iconColor="from-emerald-500 to-emerald-600"
              cardGradient="from-emerald-50 to-white"
              accentBorder="border-emerald-200 hover:border-emerald-300"
            />

            <StatCard
              label="Cash in Register"
              value={formatKES(totalCash)}
              sub="Physical cash drawer"
              icon={<Coins className="h-5 w-5" />}
              iconColor="from-amber-500 to-amber-600"
              cardGradient="from-amber-50 to-white"
              accentBorder="border-amber-200 hover:border-amber-300"
            />

            <StatCard
              label="M-Pesa Till & STK"
              value={formatKES(totalMpesa)}
              sub={
                unverifiedMpesaCount > 0 ? (
                  <span className="text-amber-700 font-semibold">{unverifiedMpesaCount} unverified codes</span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    All verified
                  </span>
                )
              }
              icon={<Smartphone className="h-5 w-5" />}
              iconColor="from-green-500 to-green-600"
              cardGradient="from-green-50 to-white"
              accentBorder="border-green-200 hover:border-green-300"
            />

            <StatCard
              label="Low Stock Warnings"
              value={
                <span className={lowStockProducts.length > 0 ? 'text-red-600' : 'text-slate-900'}>
                  {lowStockProducts.length} items
                </span>
              }
              sub={
                lowStockProducts.length > 0 ? (
                  <Link href="/inventory" className="inline-flex items-center gap-1 text-red-700 font-bold hover:underline">
                    Review reorder ledger <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  'All stock levels healthy'
                )
              }
              icon={<AlertTriangle className="h-5 w-5" />}
              iconColor="from-red-500 to-red-600"
              cardGradient={lowStockProducts.length > 0 ? 'from-red-50 to-white' : 'from-white to-slate-50'}
              accentBorder={lowStockProducts.length > 0 ? 'border-red-200 hover:border-red-300' : 'border-slate-200 hover:border-slate-300'}
            />
          </div>
        )}
      </section>

      {/* ── Quick Actions ───────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Quick Actions" className="mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/purchases',  icon: Truck,     color: 'from-blue-500 to-blue-600',      label: 'Receive Stock',    sub: 'Supplier deliveries' },
            { href: '/customers',  icon: Users,     color: 'from-emerald-500 to-emerald-600', label: 'Customer Credit',  sub: 'Record repayment' },
            { href: '/expenses',   icon: Receipt,   color: 'from-amber-500 to-amber-600',     label: 'Store Expense',    sub: 'Casual labor & fuel' },
            { href: '/returns',    icon: RotateCcw, color: 'from-purple-500 to-purple-600',   label: 'Sales Return',     sub: 'Refund or restock' },
          ].map(({ href, icon: Icon, color, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-4 hover:border-amber-400 hover:shadow-md active:scale-[0.98] transition-all duration-200"
            >
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 leading-tight truncate">{label}</p>
                <p className="text-[11px] text-slate-400 font-medium truncate">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Main Split: Recent Sales & Low Stock ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent POS Checkouts */}
        <section className="rounded-2xl border-2 border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                <Receipt className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Recent POS Checkouts</h3>
            </div>
            <Link
              href="/payments"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-50 px-2">
            {isLoading ? (
              <div className="divide-y divide-slate-50 py-2">
                <SkeletonTableRow columns={3} />
                <SkeletonTableRow columns={3} />
                <SkeletonTableRow columns={3} />
              </div>
            ) : recentSales.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No sales today yet.</p>
                <p className="text-xs text-slate-300 mt-0.5">Launch POS to start ringing up customers!</p>
              </div>
            ) : (
              recentSales.slice(0, 6).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between px-3 py-3 hover:bg-slate-50 rounded-xl mx-0 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {sale.receipt_number}
                      </span>
                      <Badge variant="default" className="text-[9px] py-0 px-1.5">
                        {sale.payments?.map((p) => p.method).join('/') || 'Cash'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {sale.customer_name_snapshot || 'Walk-In'} · {formatDate(sale.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-extrabold text-slate-900">{formatKES(sale.total_kes)}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase">Completed</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {recentSales.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-50">
              <Link
                href="/reports"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 font-semibold transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                View financial reports & Z-Report
              </Link>
            </div>
          )}
        </section>

        {/* Critical Reorder Alert */}
        <section className="rounded-2xl border-2 border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Critical Reorder Alert</h3>
              {lowStockProducts.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-black px-1.5 border border-red-200">
                  {lowStockProducts.length}
                </span>
              )}
            </div>
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
            >
              Catalogue <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-50 px-2 overflow-y-auto max-h-72">
            {isLoading ? (
              <div className="divide-y divide-slate-50 py-2">
                <SkeletonTableRow columns={3} />
                <SkeletonTableRow columns={3} />
                <SkeletonTableRow columns={3} />
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">All 193 items have healthy stock!</p>
              </div>
            ) : (
              lowStockProducts.slice(0, 7).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-3 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.product_name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-extrabold text-red-600">
                      {formatQuantity(item.stock_on_hand, item.unit_of_measure, item.allow_decimal)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Reorder: {formatQuantity(item.reorder_quantity, item.unit_of_measure)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-3.5 border-t border-slate-100 mt-auto">
            <Link
              href="/purchases"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-bold text-sm transition-all"
            >
              <Truck className="h-4 w-4 text-amber-600" />
              Create Supplier Purchase Order
            </Link>
          </div>
        </section>
      </div>

      {/* ── Secondary Links ──────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Store Modules" className="mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/reports',    icon: BarChart3, color: 'text-indigo-600 bg-indigo-50',  label: 'Financial Reports', sub: 'Daily Z-Report & P&L' },
            { href: '/invoices',   icon: FileText,  color: 'text-purple-600 bg-purple-50',  label: 'Tax Invoices',      sub: 'KRA compliant billing' },
            { href: '/payments',   icon: Smartphone, color: 'text-green-600 bg-green-50',   label: 'M-Pesa Payments',   sub: 'Verify & reconcile' },
            { href: '/audit-logs', icon: Receipt,   color: 'text-slate-600 bg-slate-100',   label: 'Audit Logs',        sub: 'Full activity trace' },
          ].map(({ href, icon: Icon, color, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 hover:border-slate-200 hover:shadow-sm active:scale-[0.98] transition-all"
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate">{label}</p>
                <p className="text-[11px] text-slate-400 truncate">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
