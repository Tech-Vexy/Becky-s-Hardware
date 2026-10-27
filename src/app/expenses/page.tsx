'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Receipt, Plus, DollarSign, Wallet, TrendingDown } from 'lucide-react';
import type { Expense, PaymentMethod } from '@/lib/types/database';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    category: 'casual_labor' as any,
    amount_kes: 0,
    description: '',
    paid_to: '',
    payment_method: 'cash' as PaymentMethod,
    provider_reference: '',
    receipt_ref: '',
  });

  const loadExpenses = async () => {
    const list = await localDb.expenses.orderBy('expense_date').reverse().toArray();
    setExpenses(list);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount_kes, 0);

  const handleOpenAdd = () => {
    setFormData({
      expense_date: new Date().toISOString().slice(0, 10),
      category: 'casual_labor',
      amount_kes: 500,
      description: 'Offloading 50 bags of cement from supplier truck',
      paid_to: 'Casual Youth Group',
      payment_method: 'cash',
      provider_reference: '',
      receipt_ref: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!formData.description || formData.amount_kes <= 0 || !user) {
      alert('Description and valid amount are required.');
      return;
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const expNumber = `EXP-${dateStr}-${randCode}`;
    const expId = `00000000-0000-0000-0012-${Date.now().toString().slice(-12)}`;

    const newExpense: Expense = {
      id: expId,
      expense_number: expNumber,
      expense_date: formData.expense_date,
      category: formData.category,
      amount_kes: formData.amount_kes,
      description: formData.description.trim(),
      paid_to: formData.paid_to.trim() || 'Beneficiary',
      payment_method: formData.payment_method,
      provider_reference: formData.provider_reference.trim() || null,
      receipt_ref: formData.receipt_ref.trim() || null,
      created_by: user.user_id,
      created_by_name: user.full_name,
      created_at: new Date().toISOString(),
    };

    await localDb.expenses.put(newExpense);
    await loadExpenses();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Expenses & Petty Cash</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log offloading labor, diesel/transport, electricity tokens, municipal cess, and operational costs.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          <span>Record Store Expense</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Recorded Expenses
            </span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-600">{formatKES(totalExpenseAmount)}</div>
            <div className="text-xs text-slate-400 mt-0.5">{expenses.length} expense vouchers</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cash / Petty Cash Vouchers
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatKES(
                expenses
                  .filter((e) => e.payment_method === 'cash')
                  .reduce((sum, e) => sum + e.amount_kes, 0)
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Disbursed directly from cash register</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Casual Labor (Offloading)
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatKES(
                expenses
                  .filter((e) => e.category === 'casual_labor')
                  .reduce((sum, e) => sum + e.amount_kes, 0)
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Offloading cement & heavy steel</div>
          </div>
        </Card>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No store expenses logged. Click "Record Store Expense" to track petty cash.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.expense_number}</td>
                    <td className="py-3 px-4 text-slate-500">{e.expense_date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 uppercase text-[10px]">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{e.category.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{e.description}</td>
                    <td className="py-3 px-4 text-slate-600">{e.paid_to}</td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold">{e.payment_method}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-red-600">
                      {formatKES(e.amount_kes)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Daily Store Expense"
        description="Petty cash disbursement for casual labor, transport, municipal cess, or utility tokens."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Expense Date</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Expense Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none"
              >
                <option value="casual_labor">Casual Labor / Offloading</option>
                <option value="transport">Transport & Fuel</option>
                <option value="utilities">KPLC Tokens & Water</option>
                <option value="rent">Premises Rent</option>
                <option value="supplies">Store Stationery & Supplies</option>
                <option value="maintenance">Repairs & Maintenance</option>
                <option value="other">Other Operational Costs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Amount (KES)</label>
              <input
                type="number"
                value={formData.amount_kes}
                onChange={(e) => setFormData({ ...formData, amount_kes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-extrabold text-amber-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Paid Via</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 bg-white font-bold focus:outline-none"
              >
                <option value="cash">Register Cash (Petty Cash)</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Paid To (Person / Company)</label>
            <input
              type="text"
              placeholder="e.g. Mpesa casual offloaders, KPLC"
              value={formData.paid_to}
              onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700">Description / Details</label>
            <input
              type="text"
              placeholder="e.g. Offloading 100 bags Bamburi cement from trailer"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700">Receipt Ref / Transaction Code (Optional)</label>
            <input
              type="text"
              placeholder="e.g. KPLC Token # or M-Pesa Code"
              value={formData.provider_reference}
              onChange={(e) => setFormData({ ...formData, provider_reference: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveExpense} className="font-bold">
              Save Expense Voucher
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
