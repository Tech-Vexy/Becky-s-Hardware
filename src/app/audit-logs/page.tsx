'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  History,
  Search,
  Filter,
  Download,
  User,
  Calendar,
  Activity,
  Shield,
  Clock,
} from 'lucide-react';
import type { Sale, StockMovement, Expense, CustomerRepayment, Invoice } from '@/lib/types/database';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  operation_type: string;
  table_name: string;
  record_id: string;
  description: string;
  user_name: string;
  details?: any;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [operationFilter, setOperationFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');

  const loadAuditLogs = async () => {
    const entries: AuditLogEntry[] = [];

    // Load sales
    const sales = await localDb.sales.orderBy('created_at').reverse().limit(100).toArray();
    for (const s of sales) {
      entries.push({
        id: s.id,
        timestamp: s.created_at,
        operation_type: 'sale',
        table_name: 'sales',
        record_id: s.receipt_number,
        description: `POS Checkout: ${s.customer_name_snapshot || 'Walk-In'} - ${formatKES(s.total_kes)}`,
        user_name: s.cashier_name_snapshot || 'Unknown',
        details: s,
      });
    }

    // Load stock movements
    const movements = await localDb.stockMovements.orderBy('created_at').reverse().limit(100).toArray();
    for (const m of movements) {
      entries.push({
        id: m.id,
        timestamp: m.created_at,
        operation_type: m.movement_type,
        table_name: 'stock_movements',
        record_id: m.sku || m.product_id,
        description: `${m.movement_type}: ${m.product_name} (${m.quantity_delta > 0 ? '+' : ''}${m.quantity_delta})`,
        user_name: m.created_by_name || 'System',
        details: m,
      });
    }

    // Load expenses
    const expenses = await localDb.expenses.orderBy('created_at').reverse().limit(50).toArray();
    for (const e of expenses) {
      entries.push({
        id: e.id,
        timestamp: e.created_at,
        operation_type: 'expense',
        table_name: 'expenses',
        record_id: e.expense_number,
        description: `Expense: ${e.description} - ${formatKES(e.amount_kes)}`,
        user_name: e.created_by_name || 'Unknown',
        details: e,
      });
    }

    // Load repayments
    const repayments = await localDb.customerRepayments.orderBy('received_at').reverse().limit(50).toArray();
    for (const r of repayments) {
      entries.push({
        id: r.id,
        timestamp: r.received_at,
        operation_type: 'repayment',
        table_name: 'customer_repayments',
        record_id: r.receipt_number,
        description: `Repayment: ${r.customer_name} - ${formatKES(r.amount_kes)}`,
        user_name: r.received_by_name || 'Unknown',
        details: r,
      });
    }

    // Load invoices
    const invoices = await localDb.invoices.orderBy('created_at').reverse().limit(50).toArray();
    for (const i of invoices) {
      entries.push({
        id: i.id,
        timestamp: i.created_at,
        operation_type: 'invoice',
        table_name: 'invoices',
        record_id: i.invoice_number,
        description: `Invoice: ${i.customer_name} - ${formatKES(i.total_kes)}`,
        user_name: i.created_by_name || 'Unknown',
        details: i,
      });
    }

    // Sort by timestamp descending
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(entries);
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      const matchOperation = operationFilter === 'all' || log.operation_type === operationFilter;
      const matchTable = tableFilter === 'all' || log.table_name === tableFilter;
      const matchSearch =
        !q ||
        log.description.toLowerCase().includes(q) ||
        log.record_id.toLowerCase().includes(q) ||
        log.user_name.toLowerCase().includes(q);
      return matchOperation && matchTable && matchSearch;
    });
  }, [logs, operationFilter, tableFilter, searchQuery]);

  const { logsByOperation, logsByTable } = useMemo(() => {
    const byOp: Record<string, number> = {};
    const byTable: Record<string, number> = {};
    for (const log of logs) {
      byOp[log.operation_type] = (byOp[log.operation_type] || 0) + 1;
      byTable[log.table_name] = (byTable[log.table_name] || 0) + 1;
    }
    return { logsByOperation: byOp, logsByTable: byTable };
  }, [logs]);

  const getOperationColor = (op: string) => {
    const colors: Record<string, string> = {
      sale: 'bg-emerald-100 text-emerald-800',
      purchase_receipt: 'bg-blue-100 text-blue-800',
      adjustment: 'bg-amber-100 text-amber-800',
      damage: 'bg-red-100 text-red-800',
      opening_balance: 'bg-purple-100 text-purple-800',
      expense: 'bg-orange-100 text-orange-800',
      repayment: 'bg-teal-100 text-teal-800',
      invoice: 'bg-indigo-100 text-indigo-800',
    };
    return colors[op] || 'bg-slate-100 text-slate-800';
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Operation', 'Table', 'Record ID', 'Description', 'User'];
    const rows = logs.map((log) => [
      log.timestamp,
      log.operation_type,
      log.table_name,
      log.record_id,
      `"${log.description.replace(/"/g, '""')}"`,
      log.user_name,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Logs</h1>
            <Badge variant="default">{logs.length} Entries</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            System activity log tracking mutations across all business tables.
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
            <Activity className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500">Total Operations</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{logs.length}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500">Unique Users</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {new Set(logs.map((l) => l.user_name)).size}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500">Last 24 Hours</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {logs.filter((l) => Date.now() - new Date(l.timestamp).getTime() < 86400000).length}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500">Tables Affected</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{Object.keys(logsByTable).length}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, record ID, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Operations</option>
            {Object.keys(logsByOperation).map((op) => (
              <option key={op} value={op}>
                {op.charAt(0).toUpperCase() + op.slice(1)} ({logsByOperation[op]})
              </option>
            ))}
          </select>

          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Tables</option>
            {Object.keys(logsByTable).map((table) => (
              <option key={table} value={table}>
                {table} ({logsByTable[table]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit logs found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px]">{formatDate(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`text-[10px] ${getOperationColor(log.operation_type)}`}>
                        {log.operation_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{log.table_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.record_id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{log.description}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="font-medium">{log.user_name}</span>
                      </div>
                    </td>
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
