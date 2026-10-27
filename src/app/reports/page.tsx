'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  Printer,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Coins,
  Building,
  CheckCircle2,
} from 'lucide-react';
import type { Sale, Expense, CustomerRepayment, Product } from '@/lib/types/database';

export default function ReportsPage() {
  const { user, role, hasRole } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [repayments, setRepayments] = useState<CustomerRepayment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadReports = async () => {
      const s = await localDb.sales.where('status').equals('completed').toArray();
      setSales(s);
      const e = await localDb.expenses.toArray();
      setExpenses(e);
      const r = await localDb.customerRepayments.toArray();
      setRepayments(r);
      const p = await localDb.products.where('active').equals(1).toArray();
      setProducts(p);
    };
    loadReports();
  }, []);

  const grossSales = sales.reduce((sum, s) => sum + s.total_kes, 0);
  const totalTax = sales.reduce((sum, s) => sum + s.tax_kes, 0);

  // Cash drawer calculation (Z-Report)
  const cashSales = sales.reduce((sum, s) => {
    const cash = s.payments?.filter((p) => p.method === 'cash').reduce((acc, p) => acc + p.amount_kes, 0) || 0;
    return sum + cash;
  }, 0);

  const cashRepayments = repayments
    .filter((r) => r.method === 'cash')
    .reduce((sum, r) => sum + r.amount_kes, 0);

  const cashExpenses = expenses
    .filter((e) => e.payment_method === 'cash')
    .reduce((sum, e) => sum + e.amount_kes, 0);

  const netCashInDrawer = cashSales + cashRepayments - cashExpenses;

  // Inventory valuation by category
  const categoryValuations: Record<string, { count: number; cost: number; retail: number }> = {};
  for (const p of products) {
    const cat = p.category_name || 'General';
    if (!categoryValuations[cat]) {
      categoryValuations[cat] = { count: 0, cost: 0, retail: 0 };
    }
    categoryValuations[cat].count += 1;
    categoryValuations[cat].cost += p.stock_on_hand * (p.buying_price_kes || 0);
    categoryValuations[cat].retail += p.stock_on_hand * p.selling_price_kes;
  }

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Inventory Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily register Z-report, physical cash reconciliation, tax summaries, and inventory margins.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrintZReport}
          className="flex items-center gap-1.5 font-bold"
        >
          <Printer className="h-4 w-4" />
          <span>Print Daily Z-Report</span>
        </Button>
      </div>

      {/* Daily Register Z-Report Box */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-amber-700">Daily Register</div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">Physical Cash Drawer & ETR Reconciliation (Z-Report)</h2>
            <div className="text-xs text-slate-500">Date: {new Date().toLocaleDateString('en-GB')} • Store: Becky's Hardware Store</div>
          </div>
          <div className="text-right mt-2 sm:mt-0">
            <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-md font-bold text-slate-800">
              KRA PIN: P051234567X
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase">Cash from Sales</div>
            <div className="text-xl font-black text-slate-900 mt-1">{formatKES(cashSales)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Completed cash checkouts</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase">Cash Repayments</div>
            <div className="text-xl font-black text-emerald-700 mt-1">+{formatKES(cashRepayments)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Paid by credit customers</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase">Petty Cash Expenses</div>
            <div className="text-xl font-black text-red-600 mt-1">-{formatKES(cashExpenses)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Casual labor & fuel disbursements</div>
          </div>

          <div className="bg-amber-500 text-slate-950 p-4 rounded-xl shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider">Expected Cash In Drawer</div>
            <div className="text-2xl font-black mt-1">{formatKES(netCashInDrawer)}</div>
            <div className="text-[11px] font-semibold mt-0.5">Actual drawer balance to tally</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100">
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Gross Hardware Sales:</span>
            <span className="font-bold text-slate-900">{formatKES(grossSales)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">16% VAT Collected:</span>
            <span className="font-bold text-slate-900">{formatKES(totalTax)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Total Customer Invoices:</span>
            <span className="font-bold text-slate-900">{sales.length} transactions</span>
          </div>
        </div>
      </div>

      {/* Inventory Stock Valuation by Category */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Catalogue Valuation & Margin by Category</h3>
            <p className="text-xs text-slate-500">
              Breakdown of stock valuation at landed cost and retail selling price.
            </p>
          </div>
          <Badge variant="default">{Object.keys(categoryValuations).length} Categories</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-center">SKU Count</th>
                <th className="py-2.5 px-4 text-right">Wholesale Cost (KES)</th>
                <th className="py-2.5 px-4 text-right">Retail Potential (KES)</th>
                <th className="py-2.5 px-4 text-right">Projected Profit</th>
                <th className="py-2.5 px-4 text-center">Est. Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {Object.entries(categoryValuations).map(([cat, val]) => {
                const profit = val.retail - val.cost;
                const margin = val.retail > 0 ? Math.round((profit / val.retail) * 100) : 0;

                return (
                  <tr key={cat} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{cat}</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">{val.count}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatKES(val.cost)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatKES(val.retail)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-extrabold text-emerald-700">
                      {formatKES(profit)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="font-bold text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
                        {margin}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
