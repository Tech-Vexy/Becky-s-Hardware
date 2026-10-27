'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatPhoneKE, formatDate } from '@/lib/utils/formatters';
import { printThermalReceipt } from '@/lib/utils/receiptPrinter';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  Plus,
  Coins,
  CreditCard,
  Search,
  Receipt,
  Printer,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';
import type { Customer, CustomerRepayment, PaymentMethod, Sale } from '@/lib/types/database';

export default function CustomersPage() {
  const { user, role, hasRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [repayments, setRepayments] = useState<CustomerRepayment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Repayment Modal
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState<PaymentMethod>('mpesa');
  const [repayReference, setRepayReference] = useState('');
  const [repayNotes, setRepayNotes] = useState('');
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);

  // Add / Edit Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    customer_code: '',
    full_name: '',
    phone: '',
    email: '',
    address: '',
    credit_limit_kes: 0,
  });

  // Statement History Modal
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  const loadData = async () => {
    const [custList, repayList, salesList] = await Promise.all([
      localDb.customers.where('active').equals(1).toArray(),
      localDb.customerRepayments.orderBy('received_at').reverse().toArray(),
      localDb.sales.where('status').equals('completed').toArray(),
    ]);
    setCustomers(custList);
    setRepayments(repayList);
    setSales(salesList);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live balances per customer via single-pass aggregation
  const customerLedgers = useMemo(() => {
    // 1. Single pass: Aggregate total credit sales by customer_id
    const creditSalesByCustomer = new Map<string, number>();
    for (const s of sales) {
      if (!s.customer_id || !s.payments) continue;
      let creditPart = 0;
      for (const p of s.payments) {
        if (p.method === 'credit') {
          creditPart += p.amount_kes;
        }
      }
      if (creditPart > 0) {
        creditSalesByCustomer.set(
          s.customer_id,
          (creditSalesByCustomer.get(s.customer_id) || 0) + creditPart
        );
      }
    }

    // 2. Single pass: Aggregate total repayments by customer_id
    const repaymentsByCustomer = new Map<string, number>();
    for (const r of repayments) {
      if (!r.customer_id) continue;
      repaymentsByCustomer.set(
        r.customer_id,
        (repaymentsByCustomer.get(r.customer_id) || 0) + r.amount_kes
      );
    }

    // 3. Single pass: Compute customer balances with O(1) lookups
    return customers.map((c) => {
      const creditSalesTotal = creditSalesByCustomer.get(c.id) || 0;
      const repaymentsTotal = repaymentsByCustomer.get(c.id) || 0;
      const balance = Math.max(0, creditSalesTotal - repaymentsTotal);
      const availableCredit = Math.max(0, c.credit_limit_kes - balance);

      return {
        ...c,
        totalCreditSales: creditSalesTotal,
        totalRepayments: repaymentsTotal,
        currentBalance: balance,
        availableCredit,
      };
    });
  }, [customers, sales, repayments]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customerLedgers;
    return customerLedgers.filter((c) => {
      return (
        c.full_name.toLowerCase().includes(q) ||
        (c.customer_code && c.customer_code.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    });
  }, [customerLedgers, searchQuery]);

  const totalOutstandingCredit = useMemo(
    () => customerLedgers.reduce((sum, c) => sum + c.currentBalance, 0),
    [customerLedgers]
  );

  const handleOpenRepayment = (c: Customer) => {
    setTargetCustomer(c);
    setRepayAmount('');
    setRepayReference('');
    setRepayNotes('');
    setIsRepayModalOpen(true);
  };

  const handleSaveRepayment = async () => {
    if (!targetCustomer || !user) return;
    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid repayment amount in KES.');
      return;
    }

    setIsSubmittingRepay(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const receiptNo = `RPM-${dateStr}-${randCode}`;
      const repaymentId = `00000000-0000-0000-0010-${Date.now().toString().slice(-12)}`;

      const newRepayment: CustomerRepayment = {
        id: repaymentId,
        customer_id: targetCustomer.id,
        customer_name: targetCustomer.full_name,
        receipt_number: receiptNo,
        amount_kes: amount,
        method: repayMethod,
        provider_reference: repayReference.trim() || null,
        received_by: user.user_id,
        received_by_name: user.full_name,
        received_at: new Date().toISOString(),
        notes: repayNotes.trim() || null,
      };

      await localDb.customerRepayments.put(newRepayment);

      // Queue for Supabase sync
      await syncEngine.queueOperation('repayment', {
        customer_id: targetCustomer.id,
        amount_kes: amount,
        method: repayMethod,
        provider_reference: repayReference.trim() || undefined,
        notes: repayNotes.trim() || undefined,
      });

      await loadData();
      setIsRepayModalOpen(false);

      // Offer receipt print
      if (confirm(`Repayment of ${formatKES(amount)} recorded! Would you like to print the receipt?`)) {
        printThermalReceipt({
          storeName: "Becky's Hardware Store",
          kraPin: 'P051234567X',
          receiptNumber: receiptNo,
          date: new Date().toLocaleString('en-KE'),
          cashierName: user.full_name,
          customerName: targetCustomer.full_name,
          items: [
            {
              name: 'Customer Account Debt Repayment',
              quantity: 1,
              unit: 'entry',
              unitPrice: amount,
              total: amount,
            },
          ],
          subtotal: amount,
          discount: 0,
          tax: 0,
          total: amount,
          payments: [
            {
              method: repayMethod,
              amount: amount,
              reference: repayReference || undefined,
            },
          ],
          footerNotes: `Received with thanks towards customer ledger balance. Asante!`,
        });
      }
    } catch (e: any) {
      alert(`Repayment error: ${e.message}`);
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      customer_code: `CUST-00${customers.length + 1}`,
      full_name: '',
      phone: '+254 ',
      email: '',
      address: '',
      credit_limit_kes: 0,
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.full_name) {
      alert('Customer Name is required');
      return;
    }

    if (editingCustomer) {
      await localDb.customers.update(editingCustomer.id, {
        ...formData,
        updated_at: new Date().toISOString(),
      });
    } else {
      const newCust: Customer = {
        id: `00000000-0000-0000-0003-${Date.now().toString().slice(-12)}`,
        ...formData,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await localDb.customers.put(newCust);
    }

    await loadData();
    setIsCustomerModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Directory & Credit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit accounts for fundis, contractors, and home builders with limit checks and repayment tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddCustomer}
            className="flex items-center gap-1.5 font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Outstanding Credit Debt
          </span>
          <div className="text-2xl font-black text-red-600 mt-2">{formatKES(totalOutstandingCredit)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Across all customer credit accounts</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Repayments Collected
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatKES(repayments.reduce((sum, r) => sum + r.amount_kes, 0))}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{repayments.length} repayment receipts issued</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Registered Customers
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">{customers.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Contractors, fundis & walk-in clients</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name, code, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Customer Name & Phone</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Credit Purchases</th>
                <th className="py-3 px-4 text-right">Repayments</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Available Credit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.customer_code}</td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{c.full_name}</div>
                    <div className="text-[10px] text-slate-400">
                      {formatPhoneKE(c.phone)} {c.address && `• ${c.address}`}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right font-medium">
                    {c.credit_limit_kes > 0 ? formatKES(c.credit_limit_kes) : '— (Cash Only)'}
                  </td>

                  <td className="py-3 px-4 text-right text-slate-600 font-mono">
                    {formatKES(c.totalCreditSales)}
                  </td>

                  <td className="py-3 px-4 text-right text-emerald-700 font-mono">
                    {formatKES(c.totalRepayments)}
                  </td>

                  <td className="py-3 px-4 text-right font-black">
                    <span className={c.currentBalance > 0 ? 'text-red-600' : 'text-slate-400'}>
                      {formatKES(c.currentBalance)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-slate-700">
                    {formatKES(c.availableCredit)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.credit_limit_kes > 0 && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleOpenRepayment(c)}
                          className="text-[11px] font-bold h-7 px-2.5"
                        >
                          Record Repayment
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Repayment Modal */}
      <Modal
        isOpen={isRepayModalOpen}
        onClose={() => setIsRepayModalOpen(false)}
        title={`Record Credit Repayment: ${targetCustomer?.full_name || ''}`}
        description="Receive customer payment towards their outstanding hardware store balance."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
            <span className="text-slate-600">Current Outstanding Balance:</span>
            <span className="font-extrabold text-sm text-red-600">
              {formatKES(
                customerLedgers.find((cl) => cl.id === targetCustomer?.id)?.currentBalance || 0
              )}
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700">Repayment Amount (KES)</label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold text-base text-amber-700 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['mpesa', 'cash', 'bank_transfer'] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setRepayMethod(m)}
                className={`py-2 px-3 rounded-xl border font-bold text-xs uppercase transition-all ${
                  repayMethod === m
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>

          {repayMethod === 'mpesa' && (
            <div>
              <label className="font-bold text-emerald-900">M-Pesa Transaction Reference Code</label>
              <input
                type="text"
                placeholder="e.g. QHK8765432"
                value={repayReference}
                onChange={(e) => setRepayReference(e.target.value.toUpperCase())}
                className="w-full mt-1 p-2 rounded-xl border border-emerald-300 font-mono font-bold uppercase focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700">Notes / Payer info (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid via M-Pesa by site supervisor"
              value={repayNotes}
              onChange={(e) => setRepayNotes(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsRepayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleSaveRepayment}
              isLoading={isSubmittingRepay}
              className="font-bold"
            >
              Confirm & Issue Receipt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Register New Customer Account'}
        description="Add contractor, fundi, or credit customer details."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Customer Code</label>
              <input
                type="text"
                value={formData.customer_code}
                onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Credit Limit (KES)</label>
              <input
                type="number"
                value={formData.credit_limit_kes}
                onChange={(e) =>
                  setFormData({ ...formData, credit_limit_kes: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Full Name / Company Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none"
              placeholder="e.g. Fundi John Kamau"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Mobile Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
                placeholder="+254 712..."
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Site Location / Postal Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              placeholder="e.g. Syokimau Site, Plot 14"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCustomer} className="font-bold">
              Save Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
