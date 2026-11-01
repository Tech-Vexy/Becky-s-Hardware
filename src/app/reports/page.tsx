'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  Smartphone,
  CreditCard,
  Calendar,
} from 'lucide-react';
import type { Sale, Expense, CustomerRepayment, Product } from '@/lib/types/database';

export default function ReportsPage() {
  const { user, role, hasRole } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [repayments, setRepayments] = useState<CustomerRepayment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      // Concurrently load sales, expenses, customer repayments, and active products
      const [s, e, r, p] = await Promise.all([
        localDb.sales.where('status').equals('completed').toArray(),
        localDb.expenses.toArray(),
        localDb.customerRepayments.toArray(),
        localDb.products.filter((x) => x.active === true).toArray(),
      ]);

      if (cancelled) return;

      setSales(s);
      setExpenses(e);
      setRepayments(r);
      setProducts(p);
    };
    loadReports();
    return () => {
      cancelled = true;
    };
  }, []);

  // Memoized cash drawer and sales calculations (Z-Report)
  const { grossSales, totalTax, cashSales, cashRepayments, cashExpenses, netCashInDrawer } = useMemo(() => {
    let gross = 0;
    let tax = 0;
    let cashFromSales = 0;

    for (const s of sales) {
      gross += s.total_kes;
      tax += s.tax_kes;
      if (s.payments) {
        for (const p of s.payments) {
          if (p.method === 'cash') cashFromSales += p.amount_kes;
        }
      }
    }

    let cashRepay = 0;
    for (const r of repayments) {
      if (r.method === 'cash') cashRepay += r.amount_kes;
    }

    let cashExp = 0;
    for (const exp of expenses) {
      if (exp.payment_method === 'cash') cashExp += exp.amount_kes;
    }

    return {
      grossSales: gross,
      totalTax: tax,
      cashSales: cashFromSales,
      cashRepayments: cashRepay,
      cashExpenses: cashExp,
      netCashInDrawer: cashFromSales + cashRepay - cashExp,
    };
  }, [sales, repayments, expenses]);

  // Payment type breakdown for daily reconciliation
  const paymentBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; amount: number }> = {
      cash: { count: 0, amount: 0 },
      mpesa: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      credit: { count: 0, amount: 0 },
      bank_transfer: { count: 0, amount: 0 },
      cheque: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 },
    };

    for (const s of sales) {
      if (s.payments) {
        for (const p of s.payments) {
          const method = p.method || 'other';
          if (!breakdown[method]) {
            breakdown[method] = { count: 0, amount: 0 };
          }
          breakdown[method].count += 1;
          breakdown[method].amount += p.amount_kes;
        }
      }
    }

    return breakdown;
  }, [sales]);

  // Today's sales specifically
  const todaySales = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return sales.filter(s => s.created_at.startsWith(todayStr));
  }, [sales]);

  // Issues detection
  const issues = useMemo(() => {
    const detected: string[] = [];

    // Check for voided sales
    const voidedCount = sales.filter(s => s.status === 'voided').length;
    if (voidedCount > 0) {
      detected.push(`${voidedCount} voided sales detected`);
    }

    // Check for credit sales
    const creditAmount = paymentBreakdown.credit?.amount || 0;
    if (creditAmount > 0) {
      detected.push(`Credit sales: ${formatKES(creditAmount)} outstanding`);
    }

    // Check for large single transactions
    const largeTransactions = sales.filter(s => s.total_kes > 50000);
    if (largeTransactions.length > 0) {
      detected.push(`${largeTransactions.length} transactions over KES 50,000`);
    }

    // Check for unverified M-Pesa payments
    let unverifiedMpesa = 0;
    for (const s of sales) {
      if (s.payments) {
        for (const p of s.payments) {
          if (p.method === 'mpesa' && p.verification_status === 'unverified') {
            unverifiedMpesa++;
          }
        }
      }
    }
    if (unverifiedMpesa > 0) {
      detected.push(`${unverifiedMpesa} unverified M-Pesa payments`);
    }

    return detected;
  }, [sales, paymentBreakdown]);

  // Memoized inventory valuation by category
  const categoryValuations = useMemo(() => {
    const valuations: Record<string, { count: number; cost: number; retail: number }> = {};
    for (const p of products) {
      const cat = p.category_name || 'General';
      if (!valuations[cat]) {
        valuations[cat] = { count: 0, cost: 0, retail: 0 };
      }
      valuations[cat].count += 1;
      valuations[cat].cost += p.stock_on_hand * (p.buying_price_kes || 0);
      valuations[cat].retail += p.stock_on_hand * p.selling_price_kes;
    }
    return valuations;
  }, [products]);

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

      {/* Daily Summary with Payment Reconciliation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Daily Payment Reconciliation</h3>
            <p className="text-xs text-slate-500">
              Breakdown of today's sales by payment method for end-of-day verification.
            </p>
          </div>
          <Badge variant="default">{todaySales.length} Transactions Today</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-800">Cash</span>
            </div>
            <div className="text-lg font-black text-emerald-900">{formatKES(paymentBreakdown.cash?.amount || 0)}</div>
            <div className="text-[10px] text-emerald-600">{paymentBreakdown.cash?.count || 0} txns</div>
          </div>

          <div className="bg-green-50 p-3 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="h-4 w-4 text-green-700" />
              <span className="text-xs font-bold text-green-800">M-Pesa</span>
            </div>
            <div className="text-lg font-black text-green-900">{formatKES(paymentBreakdown.mpesa?.amount || 0)}</div>
            <div className="text-[10px] text-green-600">{paymentBreakdown.mpesa?.count || 0} txns</div>
          </div>

          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-blue-700" />
              <span className="text-xs font-bold text-blue-800">Card</span>
            </div>
            <div className="text-lg font-black text-blue-900">{formatKES(paymentBreakdown.card?.amount || 0)}</div>
            <div className="text-[10px] text-blue-600">{paymentBreakdown.card?.count || 0} txns</div>
          </div>

          <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-purple-700" />
              <span className="text-xs font-bold text-purple-800">Credit</span>
            </div>
            <div className="text-lg font-black text-purple-900">{formatKES(paymentBreakdown.credit?.amount || 0)}</div>
            <div className="text-[10px] text-purple-600">{paymentBreakdown.credit?.count || 0} txns</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-4 w-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800">Bank</span>
            </div>
            <div className="text-lg font-black text-slate-900">{formatKES(paymentBreakdown.bank_transfer?.amount || 0)}</div>
            <div className="text-[10px] text-slate-600">{paymentBreakdown.bank_transfer?.count || 0} txns</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800">Other</span>
            </div>
            <div className="text-lg font-black text-slate-900">{formatKES(paymentBreakdown.other?.amount || 0)}</div>
            <div className="text-[10px] text-slate-600">{paymentBreakdown.other?.count || 0} txns</div>
          </div>
        </div>

        {issues.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              <span className="text-sm font-bold text-amber-900">Issues Requiring Attention</span>
            </div>
            <ul className="space-y-1">
              {issues.map((issue, idx) => (
                <li key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
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
