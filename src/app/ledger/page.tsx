'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAutoRefresh } from '@/lib/sync/useAutoRefresh';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen,
  Search,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { Sale, Expense, CustomerRepayment, Payment } from '@/lib/types/database';

interface LedgerEntry {
  id: string;
  date: string;
  type: 'sale' | 'expense' | 'repayment' | 'payment';
  description: string;
  amount_kes: number;
  balance_kes: number;
  reference: string;
  user: string;
  details?: any;
}

export default function LedgerPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'expense' | 'repayment' | 'payment'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const loadLedgerData = async () => {
    const allEntries: LedgerEntry[] = [];

    // 1. Load Sales (completed)
    const sales = await localDb.sales.where('status').equals('completed').toArray();
    for (const sale of sales) {
      const totalCash = sale.payments?.reduce((sum, p) => sum + (p.method === 'cash' ? p.amount_kes : 0), 0) || 0;
      const totalMpesa = sale.payments?.reduce((sum, p) => sum + (p.method === 'mpesa' ? p.amount_kes : 0), 0) || 0;
      const totalCard = sale.payments?.reduce((sum, p) => sum + (p.method === 'card' ? p.amount_kes : 0), 0) || 0;
      const totalBank = sale.payments?.reduce((sum, p) => sum + (p.method === 'bank_transfer' ? p.amount_kes : 0), 0) || 0;
      const totalCheque = sale.payments?.reduce((sum, p) => sum + (p.method === 'cheque' ? p.amount_kes : 0), 0) || 0;

      // Add individual payment entries for detailed tracking
      if (sale.payments) {
        for (const payment of sale.payments) {
          allEntries.push({
            id: `sale_${sale.id}_${payment.id}`,
            date: sale.created_at,
            type: 'sale',
            description: `Sale: ${sale.customer_name_snapshot || 'Walk-In'} (${payment.method})`,
            amount_kes: payment.amount_kes,
            balance_kes: 0, // Will be calculated after sorting
            reference: sale.receipt_number,
            user: sale.cashier_name_snapshot || 'Unknown',
            details: { sale, payment },
          });
        }
      }
    }

    // 2. Load Expenses
    const expenses = await localDb.expenses.toArray();
    for (const expense of expenses) {
      allEntries.push({
        id: `expense_${expense.id}`,
        date: expense.created_at,
        type: 'expense',
        description: `Expense: ${expense.category} - ${expense.description}`,
        amount_kes: -expense.amount_kes,
        balance_kes: 0,
        reference: expense.expense_number,
        user: expense.created_by_name || 'Unknown',
        details: expense,
      });
    }

    // 3. Load Customer Repayments
    const repayments = await localDb.customerRepayments.toArray();
    for (const repayment of repayments) {
      allEntries.push({
        id: `repayment_${repayment.id}`,
        date: repayment.received_at,
        type: 'repayment',
        description: `Credit Repayment: ${repayment.customer_name}`,
        amount_kes: repayment.amount_kes,
        balance_kes: 0,
        reference: repayment.receipt_number,
        user: repayment.received_by_name || 'Unknown',
        details: repayment,
      });
    }

    // Sort by date ascending for running balance calculation
    allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    for (const entry of allEntries) {
      runningBalance += entry.amount_kes;
      entry.balance_kes = runningBalance;
    }

    // Sort by date descending for display
    allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setEntries(allEntries);
  };

  useEffect(() => {
    loadLedgerData();
  }, []);

  // Auto-refresh on background sync
  useAutoRefresh(loadLedgerData, ['all']);

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((e) => e.type === typeFilter);
    }

    // Apply date range filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateRange === 'today') {
      filtered = filtered.filter((e) => new Date(e.date) >= today);
    } else if (dateRange === 'week') {
      filtered = filtered.filter((e) => new Date(e.date) >= weekAgo);
    } else if (dateRange === 'month') {
      filtered = filtered.filter((e) => new Date(e.date) >= monthAgo);
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate >= start && entryDate <= end;
      });
    }

    // Apply search filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.reference.toLowerCase().includes(q) ||
          e.user.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [entries, typeFilter, dateRange, searchQuery, customStartDate, customEndDate]);

  const stats = useMemo(() => {
    const totalIncome = filteredEntries
      .filter((e) => e.amount_kes > 0)
      .reduce((sum, e) => sum + e.amount_kes, 0);
    const totalExpense = filteredEntries
      .filter((e) => e.amount_kes < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount_kes), 0);
    const netCashFlow = totalIncome - totalExpense;
    const currentBalance = filteredEntries.length > 0 ? filteredEntries[0].balance_kes : 0;

    return { totalIncome, totalExpense, netCashFlow, currentBalance };
  }, [filteredEntries]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sale: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      expense: 'bg-red-100 text-red-800 border-red-200',
      repayment: 'bg-blue-100 text-blue-800 border-blue-200',
      payment: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[type] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <TrendingUp className="h-3 w-3" />;
      case 'expense':
        return <TrendingDown className="h-3 w-3" />;
      case 'repayment':
        return <ArrowUpRight className="h-3 w-3" />;
      case 'payment':
        return <DollarSign className="h-3 w-3" />;
      default:
        return <BookOpen className="h-3 w-3" />;
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Reference', 'Amount (KES)', 'Balance (KES)', 'User'];
    const rows = filteredEntries.map((e) => [
      formatDate(e.date),
      e.type,
      `"${e.description.replace(/"/g, '""')}"`,
      e.reference,
      e.amount_kes.toFixed(2),
      e.balance_kes.toFixed(2),
      e.user,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Ledger</h1>
            <Badge variant="default">{filteredEntries.length} Transactions</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified view of all financial transactions with running balance
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-500">Total Income</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatKES(stats.totalIncome)}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-xs font-semibold text-slate-500">Total Expenses</span>
          </div>
          <div className="text-2xl font-black text-red-600">{formatKES(stats.totalExpense)}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500">Net Cash Flow</span>
          </div>
          <div className={`text-2xl font-black ${stats.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatKES(stats.netCashFlow)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500">Current Balance</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatKES(stats.currentBalance)}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, reference, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="sale">Sales</option>
            <option value="expense">Expenses</option>
            <option value="repayment">Repayments</option>
            <option value="payment">Payments</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px]">{formatDate(entry.date)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`text-[10px] border ${getTypeColor(entry.type)}`}>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(entry.type)}
                          <span>{entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</span>
                        </div>
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{entry.description}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{entry.reference}</td>
                    <td className={`py-3 px-4 text-right font-bold ${entry.amount_kes >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatKES(entry.amount_kes)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatKES(entry.balance_kes)}</td>
                    <td className="py-3 px-4 text-[10px] text-slate-500">{entry.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
