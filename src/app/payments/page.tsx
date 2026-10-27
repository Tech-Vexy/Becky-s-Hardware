'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  CreditCard,
  Smartphone,
  Coins,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
} from 'lucide-react';
import type { Sale, Payment, PaymentMethod, PaymentVerificationStatus } from '@/lib/types/database';

export default function PaymentsPage() {
  const { user, canVerifyPayments } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('All');
  const [verificationFilter, setVerificationFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadSales = async () => {
    const list = await localDb.sales.orderBy('created_at').reverse().toArray();
    setSales(list);
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Flatten payment records with memoization
  const allPayments = useMemo(() => {
    const list: Array<
      Payment & { receipt_number: string; customer_name?: string | null; cashier_name?: string | null }
    > = [];

    for (const s of sales) {
      if (s.payments) {
        for (const p of s.payments) {
          list.push({
            ...p,
            receipt_number: s.receipt_number,
            customer_name: s.customer_name_snapshot,
            cashier_name: s.cashier_name_snapshot,
          });
        }
      }
    }
    return list;
  }, [sales]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allPayments.filter((p) => {
      const matchMethod = selectedMethod === 'All' || p.method === selectedMethod;
      const matchVerif =
        verificationFilter === 'All' || p.verification_status === verificationFilter;
      const matchSearch =
        !q ||
        p.receipt_number.toLowerCase().includes(q) ||
        (p.provider_reference && p.provider_reference.toLowerCase().includes(q)) ||
        (p.customer_name && p.customer_name.toLowerCase().includes(q));
      return matchMethod && matchVerif && matchSearch;
    });
  }, [allPayments, selectedMethod, verificationFilter, searchQuery]);

  // Single-pass memoized payment metrics
  const { totalCollected, totalMpesa, unverifiedMpesa } = useMemo(() => {
    let collected = 0;
    let mpesa = 0;
    const unverified: typeof allPayments = [];

    for (const p of allPayments) {
      collected += p.amount_kes;
      if (p.method === 'mpesa') {
        mpesa += p.amount_kes;
        if (p.verification_status === 'unverified') {
          unverified.push(p);
        }
      }
    }

    return { totalCollected: collected, totalMpesa: mpesa, unverifiedMpesa: unverified };
  }, [allPayments]);

  const handleVerify = async (payment: Payment, newStatus: PaymentVerificationStatus) => {
    if (!user) return;
    try {
      // Update in Dexie sales
      const sale = await localDb.sales.get(payment.sale_id!);
      if (sale && sale.payments) {
        const updatedPayments = sale.payments.map((p) =>
          p.id === payment.id
            ? {
                ...p,
                verification_status: newStatus,
                verified_by: user.user_id,
                verified_at: new Date().toISOString(),
              }
            : p
        );
        await localDb.sales.update(sale.id, { payments: updatedPayments });
      }

      await loadSales();
    } catch (e: any) {
      alert(`Verification update failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payments & M-Pesa Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit payments, reconcile cashier M-Pesa references, and verify STK Push receipts.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenue Collected
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatKES(totalCollected)}</div>
            <div className="text-xs text-slate-400 mt-0.5">{allPayments.length} payment records</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              M-Pesa Collections
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatKES(totalMpesa)}</div>
            <div className="text-xs text-slate-400 mt-0.5">Till: 5432101 • Paybill: 247247</div>
          </div>
        </Card>

        <Card className={unverifiedMpesa.length > 0 ? 'border-amber-300 bg-amber-50/30' : ''}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending M-Pesa Verifications
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700">{unverifiedMpesa.length}</div>
            <div className="text-xs text-amber-800 font-semibold mt-0.5">
              Requires Store Manager / Accountant sign-off
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt, M-Pesa code, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Payment Methods</option>
            <option value="cash">Cash Only</option>
            <option value="mpesa">M-Pesa Only</option>
            <option value="credit">Customer Credit</option>
            <option value="bank_transfer">Bank / Cheque</option>
          </select>

          {/* Verification Status Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="unverified">Unverified Only</option>
            <option value="verified">Verified Only</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Receipt / Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Provider Reference / STK</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Amount (KES)</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No payment records found under this filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900">{p.receipt_number}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(p.received_at)}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="uppercase font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">
                        {p.method}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.provider_reference ? (
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          {p.provider_reference}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {p.customer_name || 'Walk-In Customer'}
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {formatKES(p.amount_kes)}
                    </td>

                    <td className="py-3 px-4">
                      {p.verification_status === 'verified' && (
                        <Badge variant="success" className="flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {p.verification_status === 'unverified' && (
                        <Badge variant="warning" className="flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                      {p.verification_status === 'rejected' && (
                        <Badge variant="danger" className="flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {canVerifyPayments && p.verification_status === 'unverified' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerify(p, 'verified')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold"
                            title="Verify reference code"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleVerify(p, 'rejected')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold"
                            title="Reject invalid code"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
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
