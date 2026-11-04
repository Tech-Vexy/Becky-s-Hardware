'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { useAutoRefresh } from '@/lib/sync/useAutoRefresh';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Truck,
  Plus,
  Search,
  Download,
  Lock,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { Purchase, Supplier, Product, StockMovement } from '@/lib/types/database';

export default function PurchasesPage() {
  const { user, canManageInventory } = useAuth();
  const { showToast } = useNotifications();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    po_number: '',
    supplier_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_delivery: '',
    notes: '',
    status: 'pending' as 'pending' | 'ordered' | 'received' | 'cancelled',
  });

  const loadPurchases = useCallback(async () => {
    const [allPurchases, allSuppliers] = await Promise.all([
      localDb.purchases.orderBy('created_at').reverse().toArray(),
      localDb.suppliers.filter((x) => x.active === true).toArray(),
    ]);
    setPurchases(allPurchases);
    setSuppliers(allSuppliers);
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Live Auto-Refresh upon background polling or peer stock receipts
  useAutoRefresh(loadPurchases, ['purchases', 'all']);

  const filteredPurchases = purchases.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchSearch = !q || p.po_number.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleOpenAdd = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData({
      po_number: `PO-${dateStr}-${randCode}`,
      supplier_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery: '',
      notes: '',
      status: 'pending',
    });
    setIsModalOpen(true);
  };

  const handleSavePurchase = async () => {
    if (!formData.supplier_id) {
      showToast('system', 'Validation Error', 'Please select a supplier.', '/purchases');
      return;
    }

    try {
      const newId = `00000000-0000-0000-0008-${Date.now().toString().slice(-12)}`;
      const supplier = suppliers.find((s) => s.id === formData.supplier_id);
      const newPurchase: Purchase = {
        id: newId,
        po_number: formData.po_number,
        supplier_id: formData.supplier_id || null,
        supplier_name: supplier?.name || 'Unknown',
        status: formData.status,
        order_date: formData.order_date,
        expected_delivery: formData.expected_delivery || null,
        notes: formData.notes || null,
        subtotal_kes: 0,
        tax_kes: 0,
        total_kes: 0,
        created_by: user?.user_id || '00000000-0000-0000-0000-000000000001',
        created_by_name: user?.full_name || 'Store Owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await localDb.purchases.put(newPurchase);
      syncEngine.queueOperation('purchase_upsert', newPurchase).catch(console.error);
      showToast('inventory', 'Purchase Order Created', `PO ${formData.po_number} created successfully.`, '/purchases');
      await loadPurchases();
      setIsModalOpen(false);
    } catch (e: any) {
      showToast('system', 'Error', e.message || 'Failed to create purchase', '/purchases');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchases & Receiving</h1>
            <Badge variant="default">{purchases.length} Orders</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Supplier purchase orders and stock receiving workflows.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          {canManageInventory ? (
            <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 font-bold">
              <Plus className="h-4 w-4" />
              <span>New Purchase Order</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Lock className="h-3.5 w-3.5" />
              <span>Purchases reserved for Store Owner</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="ordered">Ordered</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">PO #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No purchase orders found.</td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.po_number}</td>
                    <td className="py-3 px-4 font-medium">{p.supplier_name}</td>
                    <td className="py-3 px-4">{formatDate(p.order_date)}</td>
                    <td className="py-3 px-4">{p.expected_delivery ? formatDate(p.expected_delivery) : '—'}</td>
                    <td className="py-3 px-4 text-right font-bold">{formatKES(p.total_kes)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={p.status === 'received' ? 'default' : 'secondary'}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Purchase Order" description="Create a supplier purchase order for stock replenishment." maxWidth="md">
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700">PO Number</label>
            <input
              type="text"
              value={formData.po_number}
              onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700">Supplier</label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Order Date</label>
              <input
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Expected Delivery</label>
              <input
                type="date"
                value={formData.expected_delivery}
                onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSavePurchase} className="font-bold">Create PO</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
