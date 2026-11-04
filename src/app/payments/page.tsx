'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { useAutoRefresh } from '@/lib/sync/useAutoRefresh';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Lock,
} from 'lucide-react';
import type { Sale, Payment } from '@/lib/types/database';

export default function PaymentsPage() {
  const { user, hasRole } = useAuth();
  const { showToast } = useNotifications();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');

  const loadPayments = useCallback(async () => {
    const allSales = await localDb.sales.where('status').equals('completed').toArray();
    setSales(allSales);
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Live Auto-Refresh upon background polling or peer counter sales/payments
  useAutoRefresh(loadPayments, ['payments', 'sales', 'all']);

  // Flatten all payments from sales
  const allPayments = useMemo(() => {
    const payments: Array<Payment & { receipt_number: string; customer_name: string }> = [];
    for (const sale of sales) {
      if (sale.payments) {
        for (const payment of sale.payments) {
          payments.push({
            ...payment,
            receipt_number: sale.receipt_number,
            customer_name: sale.customer_name_snapshot || 'Walk-In',
          });
        }
      }
    }
    return payments.sort((a, b) => new Date(b.received_at ?? 0).getTime() - new Date(a.received_at ?? 0).getTime());
  }, [sales]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allPayments.filter((p) => {
      const matchVerification = verificationFilter === 'all' || p.verification_status === verificationFilter;
      const matchSearch =
        !q ||
        p.receipt_number.toLowerCase().includes(q) ||
        (p.provider_reference && p.provider_reference.toLowerCase().includes(q)) ||
        p.customer_name.toLowerCase().includes(q);
      return matchVerification && matchSearch;
    });
  }, [allPayments, verificationFilter, searchQuery]);

  const { totalPayments, verifiedCount, unverifiedCount, byMethod } = useMemo(() => {
    let total = 0;
    let verified = 0;
    let unverified = 0;
    const methodBreakdown: Record<string, { count: number; amount: number }> = {};

    for (const p of allPayments) {
      total += p.amount_kes;
      if (p.verification_status === 'verified') verified++;
      if (p.verification_status === 'unverified') unverified++;

      const method = p.method || 'other';
      if (!methodBreakdown[method]) {
        methodBreakdown[method] = { count: 0, amount: 0 };
      }
      methodBreakdown[method].count++;
      methodBreakdown[method].amount += p.amount_kes;
    }

    return { totalPayments: total, verifiedCount: verified, unverifiedCount: unverified, byMethod: methodBreakdown };
  }, [allPayments]);

  const handleVerifyPayment = async (payment: Payment & { receipt_number: string }) => {
    if (!hasRole('store_manager') && !hasRole('accountant') && !hasRole('admin')) {
      showToast('system', 'Permission Denied', 'Only Managers and Accountants can verify payments.', '/payments');
      return;
    }

    try {
      // Find the sale and update the payment
      const sale = sales.find((s) => s.receipt_number === payment.receipt_number);
      if (!sale) return;

      const updatedPayments = sale.payments?.map((p) =>
        p.id === payment.id ? { ...p, verification_status: 'verified' as const } : p
      );

      await localDb.sales.update(sale.id, { payments: updatedPayments });
      syncEngine.queueOperation('payment_verification', {
        payment_id: payment.id,
        status: 'verified',
      }).catch(console.error);

      showToast('payment', 'Payment Verified', `M-Pesa reference ${payment.provider_reference} verified.`, '/payments');
      await loadPayments();
    } catch (e: any) {
      showToast('system', 'Error', e.message || 'Failed to verify payment', '/payments');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Receipt #',
      'Customer',
      'Method',
      'Amount (KES)',
      'Reference',
      'Verification Status',
    ];
    const rows = allPayments.map((p) => [
      p.received_at,
      p.receipt_number,
      p.customer_name,
      p.method,
      p.amount_kes,
      p.provider_reference || '',
      p.verification_status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments & M-Pesa</h1>
            <Badge variant="default">{allPayments.length} Transactions</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">M-Pesa reconciliation ledger with trusted reference verification.</p>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collections</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{formatKES(totalPayments)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{allPayments.length} transactions</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Verified</span>
          <div className="text-2xl font-black text-emerald-700 mt-2">{verifiedCount}</div>
          <div className="text-xs text-emerald-600 mt-0.5">Trusted references</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Unverified</span>
          <div className="text-2xl font-black text-amber-700 mt-2">{unverifiedCount}</div>
          <div className="text-xs text-amber-600 mt-0.5">Requires verification</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">M-Pesa Only</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{formatKES(byMethod.mpesa?.amount || 0)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{byMethod.mpesa?.count || 0} transactions</div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Payment Method Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(byMethod).map(([method, data]) => (
            <div key={method} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">{method}</div>
              <div className="text-lg font-black text-slate-900 mt-1">{formatKES(data.amount)}</div>
              <div className="text-[10px] text-slate-400">{data.count} txns</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt, reference, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={verificationFilter}
          onChange={(e) => setVerificationFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No payments found.</td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">{formatDate(p.received_at)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.receipt_number}</td>
                    <td className="py-3 px-4 font-medium">{p.customer_name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {p.method}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">{formatKES(p.amount_kes)}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{p.provider_reference || '—'}</td>
                    <td className="py-3 px-4">
                      {p.verification_status === 'verified' ? (
                        <Badge variant="default" className="text-[10px]">
                          <CheckCircle2 className="h-3 w-3 inline mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.method === 'mpesa' && p.verification_status === 'unverified' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleVerifyPayment(p)}
                          className="text-[10px] font-bold h-7 px-2"
                        >
                          Verify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {unverifiedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-bold">Action Required:</span> {unverifiedCount} M-Pesa payments require verification by a Manager or Accountant.
          </div>
        </div>
      )}
    </div>
  );
}
