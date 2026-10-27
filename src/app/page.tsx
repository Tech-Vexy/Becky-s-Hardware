'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatQuantity, formatDate } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
  Boxes,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { Sale, Product, Customer } from '@/lib/types/database';

export default function DashboardPage() {
  const { role, user, canManageStaff } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  useEffect(() => {
    let cancelled = false;
    const loadDashboardData = async () => {
      // Concurrently load today's sales, recent sales, products, and customers to avoid serial waterfalls
      const todayStr = new Date().toISOString().slice(0, 10);
      const [forToday, recentSales, allProds, custs] = await Promise.all([
        localDb.sales
          .where('created_at')
          .startsWith(todayStr)
          .filter((s) => s.status === 'completed')
          .toArray(),
        localDb.sales.orderBy('created_at').reverse().limit(10).toArray(),
        localDb.products.where('active').equals(1).toArray(),
        localDb.customers.toArray(),
      ]);

      if (cancelled) return;

      setTodaySales(forToday);
      setSales(recentSales);
      setLowStockProducts(allProds.filter((p) => p.stock_on_hand <= p.low_stock_level));
      setCustomers(custs);
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Single-pass memoized aggregation of today's sales and M-Pesa verification metrics
  const { totalGrossSales, totalCash, totalMpesa, unverifiedMpesaCount } = useMemo(() => {
    let gross = 0;
    let cash = 0;
    let mpesa = 0;
    let unverified = 0;

    for (const s of todaySales) {
      gross += s.total_kes;
      if (s.payments) {
        for (const p of s.payments) {
          if (p.method === 'cash') cash += p.amount_kes;
          if (p.method === 'mpesa') {
            mpesa += p.amount_kes;
            if (p.verification_status === 'unverified') unverified++;
          }
        }
      }
    }

    return { totalGrossSales: gross, totalCash: cash, totalMpesa: mpesa, unverifiedMpesaCount: unverified };
  }, [todaySales]);

  const totalCustomerCreditLimit = useMemo(
    () => customers.reduce((sum, c) => sum + (c.credit_limit_kes || 0), 0),
    [customers]
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Becky's Hardware Store</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Logged in as <span className="font-bold text-amber-400">{user?.full_name}</span> (Store Owner)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md hover:bg-amber-400 transition-all active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Launch POS Checkout</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Gross Sales
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatKES(totalGrossSales)}</div>
            <div className="text-xs text-slate-400 mt-0.5">{todaySales.length} completed sales today</div>
          </div>
        </Card>

        {/* Cash in Drawer */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cash In Register
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatKES(totalCash)}</div>
            <div className="text-xs text-slate-400 mt-0.5">Physical cash drawer</div>
          </div>
        </Card>

        {/* M-Pesa Collections */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              M-Pesa Till & STK
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatKES(totalMpesa)}</div>
            <div className="text-xs text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
              {unverifiedMpesaCount > 0 ? (
                <span className="text-amber-700 font-bold">{unverifiedMpesaCount} unverified codes</span>
              ) : (
                'All payments verified'
              )}
            </div>
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-600">{lowStockProducts.length} items</div>
            <Link
              href="/inventory"
              className="text-xs text-red-700 font-semibold hover:underline mt-0.5 inline-block"
            >
              Review reorder ledger →
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/purchases"
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl hover:border-amber-500 hover:shadow-sm transition-all"
        >
          <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Receive Stock</div>
            <div className="text-[10px] text-slate-400">Supplier deliveries</div>
          </div>
        </Link>

        <Link
          href="/customers"
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl hover:border-amber-500 hover:shadow-sm transition-all"
        >
          <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Customer Credit</div>
            <div className="text-[10px] text-slate-400">Record repayment</div>
          </div>
        </Link>

        <Link
          href="/expenses"
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl hover:border-amber-500 hover:shadow-sm transition-all"
        >
          <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Store Expense</div>
            <div className="text-[10px] text-slate-400">Casual labor & fuel</div>
          </div>
        </Link>

        <Link
          href="/returns"
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl hover:border-amber-500 hover:shadow-sm transition-all"
        >
          <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Sales Return</div>
            <div className="text-[10px] text-slate-400">Refund or restock</div>
          </div>
        </Link>
      </div>

      {/* Main Content Split: Recent Sales & Low Stock List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent POS Checkouts</h3>
              <Link href="/payments" className="text-xs text-amber-700 font-bold hover:underline">
                View all →
              </Link>
            </div>

            {sales.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No sales recorded yet today. Launch the POS to start ringing up customers!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="font-mono text-[11px]">{sale.receipt_number}</span>
                        <Badge variant="default" className="text-[9px]">
                          {sale.payments?.map((p) => p.method).join('/') || 'Cash'}
                        </Badge>
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5">
                        {sale.customer_name_snapshot || 'Walk-In Customer'} • {formatDate(sale.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900 text-sm">{formatKES(sale.total_kes)}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold uppercase">Completed</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Items Requiring Reorder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Critical Reorder Alert</h3>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  {lowStockProducts.length}
                </span>
              </div>
              <Link href="/catalogue" className="text-xs text-amber-700 font-bold hover:underline">
                Catalogue →
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                All 193 hardware items have healthy stock levels!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {lowStockProducts.slice(0, 6).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{item.product_name}</div>
                      <div className="text-slate-400 text-[10px] font-mono">
                        SKU: {item.sku}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-red-600">
                        {formatQuantity(item.stock_on_hand, item.unit_of_measure, item.allow_decimal)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Reorder: {formatQuantity(item.reorder_quantity, item.unit_of_measure)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <Link
              href="/purchases"
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              <Truck className="h-3.5 w-3.5 text-amber-600" />
              <span>Create Supplier Purchase Order</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
