'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Download,
  Calendar,
  Building,
  User,
  Wrench,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import type { Expense, PaymentMethod } from '@/lib/types/database';

export default function ExpensesPage() {
  const { user, canManageInventory } = useAuth();
  const { showToast } = useNotifications();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Add / Edit Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    expense_number: '',
    expense_date: new Date().toISOString().slice(0, 10),
    category: 'general',
    description: '',
    amount_kes: 0,
    payment_method: 'cash' as PaymentMethod,
    reference_number: '',
    recipient: '',
    notes: '',
  });

  const EXPENSE_CATEGORIES = [
    { value: 'casual_labor', label: 'Casual Labor', icon: '👷' },
    { value: 'transport', label: 'Transport & Logistics', icon: '🚚' },
    { value: 'fuel', label: 'Fuel & Energy', icon: '⛽' },
    { value: 'kplc', label: 'KPLC Tokens & Bills', icon: '💡' },
    { value: 'municipal', label: 'Municipal Permits', icon: '📋' },
    { value: 'supplies', label: 'Office Supplies', icon: '📦' },
    { value: 'maintenance', label: 'Equipment Maintenance', icon: '🔧' },
    { value: 'general', label: 'General', icon: '📝' },
  ];

  const loadExpenses = async () => {
    const allExpenses = await localDb.expenses.orderBy('expense_date').reverse().toArray();
    setExpenses(allExpenses);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return expenses.filter((e) => {
      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchSearch =
        !q ||
        e.description.toLowerCase().includes(q) ||
        (e.recipient && e.recipient.toLowerCase().includes(q)) ||
        (e.reference_number && e.reference_number.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [expenses, categoryFilter, searchQuery]);

  const { totalExpenses, expensesByCategory } = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount_kes, 0);
    const byCat: Record<string, number> = {};
    for (const e of expenses) {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount_kes;
    }
    return { totalExpenses: total, expensesByCategory: byCat };
  }, [expenses]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData({
      expense_number: `EXP-${dateStr}-${randCode}`,
      expense_date: new Date().toISOString().slice(0, 10),
      category: 'general',
      description: '',
      amount_kes: 0,
      payment_method: 'cash',
      reference_number: '',
      recipient: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: Expense) => {
    setEditingExpense(e);
    setFormData({
      expense_number: e.expense_number,
      expense_date: e.expense_date,
      category: e.category,
      description: e.description,
      amount_kes: e.amount_kes,
      payment_method: e.payment_method,
      reference_number: e.reference_number || '',
      recipient: e.recipient || '',
      notes: e.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!formData.description.trim()) {
      showToast('system', 'Validation Error', 'Description is required.', '/expenses');
      return;
    }
    if (formData.amount_kes <= 0) {
      showToast('system', 'Validation Error', 'Amount must be greater than zero.', '/expenses');
      return;
    }

    try {
      if (editingExpense) {
        await localDb.expenses.update(editingExpense.id, {
          ...formData,
          description: formData.description.trim(),
          recipient: formData.recipient.trim() || null,
          reference_number: formData.reference_number.trim() || null,
          notes: formData.notes.trim() || null,
          updated_at: new Date().toISOString(),
        } as Partial<Expense>);

        syncEngine.queueOperation('expense_upsert', {
          id: editingExpense.id,
          ...formData,
        }).catch(console.error);

        showToast('inventory', 'Expense Updated', `${formData.description} updated successfully.`, '/expenses');
      } else {
        const newId = `00000000-0000-0000-0009-${Date.now().toString().slice(-12)}`;
        const newExpense: Expense = {
          id: newId,
          expense_number: formData.expense_number,
          expense_date: formData.expense_date,
          category: formData.category as Expense['category'],
          amount_kes: formData.amount_kes,
          description: formData.description.trim(),
          paid_to: formData.recipient.trim() || null,
          recipient: formData.recipient.trim() || null,
          reference_number: formData.reference_number.trim() || null,
          notes: formData.notes.trim() || null,
          payment_method: formData.payment_method,
          created_by: user?.user_id || '00000000-0000-0000-0000-000000000001',
          created_by_name: user?.full_name || 'Store Owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await localDb.expenses.put(newExpense);

        syncEngine.queueOperation('expense_upsert', newExpense).catch(console.error);

        showToast('inventory', 'Expense Recorded', `${formData.description} of ${formatKES(formData.amount_kes)} logged.`, '/expenses');
      }

      await loadExpenses();
      setIsModalOpen(false);
    } catch (e: any) {
      showToast('system', 'Error', e.message || 'Failed to save expense', '/expenses');
    }
  };

  const handleDeleteExpense = async (e: Expense) => {
    if (!confirm(`Are you sure you want to delete expense ${e.expense_number}? This action cannot be undone.`)) {
      return;
    }

    try {
      await localDb.expenses.delete(e.id);
      syncEngine.queueOperation('expense_delete', { id: e.id }).catch(console.error);
      await loadExpenses();
      showToast('inventory', 'Expense Deleted', `${e.description} removed.`, '/expenses');
    } catch (err: any) {
      showToast('system', 'Error', err.message || 'Failed to delete expense', '/expenses');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Expense Number',
      'Date',
      'Category',
      'Description',
      'Recipient',
      'Amount (KES)',
      'Payment Method',
      'Reference',
      'Recorded By',
    ];
    const rows = expenses.map((e) => [
      e.expense_number,
      e.expense_date,
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      e.recipient || '',
      e.amount_kes,
      e.payment_method,
      e.reference_number || '',
      e.created_by_name || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expenses_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Expenses</h1>
            <Badge variant="default">{expenses.length} Records</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Petty cash logging for casual labor, transport, fuel, KPLC tokens, and municipal permits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          {canManageInventory ? (
            <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 font-bold">
              <Plus className="h-4 w-4" />
              <span>Record Expense</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Lock className="h-3.5 w-3.5" />
              <span>Expense logging reserved for Store Owner</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-600">{formatKES(totalExpenses)}</div>
            <div className="text-xs text-slate-400 mt-0.5">All-time disbursements</div>
          </div>
        </Card>

        {EXPENSE_CATEGORIES.slice(0, 3).map((cat) => (
          <Card key={cat.value}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {cat.icon} {cat.label}
              </span>
              <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                <span className="text-sm">{cat.icon}</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-black text-slate-900">{formatKES(expensesByCategory[cat.value] || 0)}</div>
              <div className="text-xs text-slate-400 mt-0.5">{expenses.filter((e) => e.category === cat.value).length} transactions</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, recipient, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No expenses found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => {
                  const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === e.category);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.expense_number}</td>
                      <td className="py-3 px-4">{formatDate(e.expense_date)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1">
                          <span>{catInfo?.icon || '📝'}</span>
                          <span className="font-medium">{catInfo?.label || e.category}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{e.description}</td>
                      <td className="py-3 px-4 text-slate-500">{e.recipient || '—'}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-red-600">{formatKES(e.amount_kes)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {e.payment_method.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canManageInventory && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(e)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600"
                            >
                              <Wrench className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(e)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Record New Expense'}
        description="Log store operating expenses and petty cash disbursements."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Expense Number</label>
              <input
                type="text"
                value={formData.expense_number}
                onChange={(e) => setFormData({ ...formData, expense_number: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Expense Date</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Cement offloading casual labor"
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Amount (KES)</label>
              <input
                type="number"
                value={formData.amount_kes}
                onChange={(e) => setFormData({ ...formData, amount_kes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold text-red-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Recipient / Payee</label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                placeholder="e.g. John Kamau"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Reference Number</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="e.g. Receipt #12345"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Additional details..."
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveExpense} className="font-bold">
              {editingExpense ? 'Update Expense' : 'Record Expense'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
