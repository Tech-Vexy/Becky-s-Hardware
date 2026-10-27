'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatDate } from '@/lib/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { History, Search, ShieldCheck } from 'lucide-react';

interface LocalAuditItem {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  actor_name: string;
  details: string;
  occurred_at: string;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LocalAuditItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  useEffect(() => {
    const buildAuditStream = async () => {
      const result: LocalAuditItem[] = [];

      // Collect sales
      const sales = await localDb.sales.toArray();
      for (const s of sales) {
        result.push({
          id: `audit_sale_${s.id}`,
          action: 'INSERT',
          table_name: 'sales',
          record_id: s.receipt_number,
          actor_name: s.cashier_name_snapshot || 'Cashier',
          details: `Checkout ${s.receipt_number} for KES ${s.total_kes} (${s.items?.length || 0} items)`,
          occurred_at: s.created_at,
        });
      }

      // Collect stock movements
      const movs = await localDb.stockMovements.toArray();
      for (const m of movs) {
        result.push({
          id: `audit_mov_${m.id}`,
          action: 'INSERT',
          table_name: 'stock_movements',
          record_id: m.sku || m.product_id,
          actor_name: m.created_by_name || 'Staff',
          details: `Movement [${m.movement_type}]: ${m.quantity_delta > 0 ? '+' : ''}${m.quantity_delta} pcs of ${m.product_name} (${m.reason})`,
          occurred_at: m.created_at,
        });
      }

      // Collect repayments
      const repays = await localDb.customerRepayments.toArray();
      for (const r of repays) {
        result.push({
          id: `audit_repay_${r.id}`,
          action: 'INSERT',
          table_name: 'customer_repayments',
          record_id: r.receipt_number,
          actor_name: r.received_by_name || 'Cashier',
          details: `Credit repayment ${r.receipt_number} of KES ${r.amount_kes} via ${r.method}`,
          occurred_at: r.received_at,
        });
      }

      // Collect returns
      const rets = await localDb.returns.toArray();
      for (const ret of rets) {
        result.push({
          id: `audit_ret_${ret.id}`,
          action: 'INSERT',
          table_name: 'returns',
          record_id: ret.return_number,
          actor_name: 'Cashier',
          details: `Customer return ${ret.return_number} for KES ${ret.total_refund_kes} (${ret.reason})`,
          occurred_at: ret.created_at,
        });
      }

      result.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
      setLogs(result);
    };

    buildAuditStream();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const matchAction = actionFilter === 'All' || l.action === actionFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      l.details.toLowerCase().includes(q) ||
      l.record_id.toLowerCase().includes(q) ||
      l.actor_name.toLowerCase().includes(q) ||
      l.table_name.toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological operational trail. Deleted financial history is prohibited; compensating movements are used instead.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail, actor, receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Audit List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Table</th>
                <th className="py-3 px-4">Record Identifier</th>
                <th className="py-3 px-4">Activity Description</th>
                <th className="py-3 px-4">Staff Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No audit records match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 100).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {formatDate(log.occurred_at)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-50 text-emerald-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 font-semibold">{log.table_name}</td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.record_id}</td>

                    <td className="py-3 px-4 font-medium text-slate-900">{log.details}</td>

                    <td className="py-3 px-4 text-slate-600">{log.actor_name}</td>
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
