'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  RotateCcw,
  Plus,
  Search,
  Package,
  AlertTriangle,
  Download,
  Lock,
} from 'lucide-react';
import type { Return, Sale, Product, StockMovement, PaymentMethod } from '@/lib/types/database';

export default function ReturnsPage() {
  const { user, canManageInventory } = useAuth();
  const { showToast } = useNotifications();
  const [returns, setReturns] = useState<Return[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    sale_id: '',
    return_number: '',
    return_date: new Date().toISOString().slice(0, 10),
    reason: '',
    items: [] as Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>,
    refund_method: 'cash' as PaymentMethod,
    refund_amount: 0,
    restock: true,
    notes: '',
  });

  const loadReturns = async () => {
    const [allReturns, allSales, allProducts] = await Promise.all([
      localDb.returns.orderBy('created_at').reverse().toArray(),
      localDb.sales.where('status').equals('completed').toArray(),
      localDb.products.filter((x) => x.active === true).toArray(),
    ]);
    setReturns(allReturns);
    setSales(allSales);
    setProducts(allProducts);
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const filteredReturns = returns.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return r.return_number.toLowerCase().includes(q) || (r.customer_name && r.customer_name.toLowerCase().includes(q));
  });

  const handleOpenAdd = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData({
      sale_id: '',
      return_number: `RET-${dateStr}-${randCode}`,
      return_date: new Date().toISOString().slice(0, 10),
      reason: '',
      items: [],
      refund_method: 'cash',
      refund_amount: 0,
      restock: true,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveReturn = async () => {
    if (!formData.sale_id || !formData.reason.trim()) {
      showToast('system', 'Validation Error', 'Please select a sale and provide a reason.', '/returns');
      return;
    }
    if (formData.items.length === 0) {
      showToast('system', 'Validation Error', 'Please add at least one item to return.', '/returns');
      return;
    }

    try {
      const newId = `00000000-0000-0000-0011-${Date.now().toString().slice(-12)}`;
      const newReturn: Return = {
        id: newId,
        return_number: formData.return_number,
        sale_id: formData.sale_id || null,
        return_date: formData.return_date,
        reason: formData.reason.trim(),
        refund_method: formData.refund_method,
        total_refund_kes: formData.refund_amount,
        restock: formData.restock,
        notes: formData.notes || null,
        cashier_id: user?.user_id || '00000000-0000-0000-0000-000000000001',
        customer_name: sales.find((s) => s.id === formData.sale_id)?.customer_name_snapshot || 'Unknown',
        created_by: user?.user_id || '00000000-0000-0000-0000-000000000001',
        created_by_name: user?.full_name || 'Store Owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await localDb.returns.put(newReturn);

      // Restock items if enabled
      if (formData.restock) {
        for (const item of formData.items) {
          const prod = await localDb.products.get(item.product_id);
          if (prod) {
            const newStock = prod.stock_on_hand + item.quantity;
            await localDb.products.update(prod.id, { stock_on_hand: newStock, updated_at: new Date().toISOString() });

            const movement: StockMovement = {
              id: `ret_${Date.now()}_${prod.id.slice(-6)}`,
              product_id: prod.id,
              product_name: prod.product_name,
              sku: prod.sku,
              movement_type: 'sale_return',
              quantity_delta: item.quantity,
              unit_cost_kes: prod.buying_price_kes,
              reason: `Return ${formData.return_number}`,
              created_by: user?.user_id || 'system',
              created_by_name: user?.full_name || 'System',
              created_at: new Date().toISOString(),
            };
            await localDb.stockMovements.put(movement);
          }
        }
      }

      syncEngine.queueOperation('return', newReturn).catch(console.error);
      showToast('inventory', 'Return Processed', `Return ${formData.return_number} recorded successfully.`, '/returns');
      await loadReturns();
      setIsModalOpen(false);
    } catch (e: any) {
      showToast('system', 'Error', e.message || 'Failed to process return', '/returns');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Returns</h1>
            <Badge variant="default">{returns.length} Returns</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Process refunds, restock items, and issue credit notes.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          {canManageInventory ? (
            <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 font-bold">
              <Plus className="h-4 w-4" />
              <span>Process Return</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Lock className="h-3.5 w-3.5" />
              <span>Returns reserved for Store Owner</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search return number, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Refund Amount</th>
                <th className="py-3 px-4">Restocked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No returns found.</td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.return_number}</td>
                    <td className="py-3 px-4">{formatDate(r.return_date)}</td>
                    <td className="py-3 px-4 font-medium">{r.customer_name || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{r.reason}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-red-600">{formatKES(r.total_refund_kes)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={r.restock ? 'default' : 'secondary'}>
                        {r.restock ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Process Sales Return" description="Select items to return and process refund." maxWidth="md">
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700">Original Sale</label>
            <select
              value={formData.sale_id}
              onChange={(e) => setFormData({ ...formData, sale_id: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            >
              <option value="">Select a sale...</option>
              {sales.slice(0, 20).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.receipt_number} - {s.customer_name_snapshot || 'Walk-In'} - {formatKES(s.total_kes)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700">Return Reason</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Defective product, wrong item"
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              checked={formData.restock}
              onChange={(e) => setFormData({ ...formData, restock: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="font-medium text-slate-700">Restock items to inventory</span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveReturn} className="font-bold">Process Return</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
