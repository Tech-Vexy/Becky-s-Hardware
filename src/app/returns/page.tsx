'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { RotateCcw, Plus, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Return, Sale, ReturnItem, PaymentMethod } from '@/lib/types/database';

export default function ReturnsPage() {
  const { user, canMakeSales } = useAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Process Return Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiptNo, setSelectedReceiptNo] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<
    Array<{
      product_id: string;
      product_name: string;
      max_qty: number;
      return_qty: number;
      unit_price: number;
      restock: boolean;
      condition: 'good' | 'damaged';
    }>
  >([]);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('cash');
  const [returnReason, setReturnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const rList = await localDb.returns.orderBy('created_at').reverse().toArray();
    setReturns(rList);
    const sList = await localDb.sales.where('status').equals('completed').toArray();
    setSales(sList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSale = (receiptNo: string) => {
    setSelectedReceiptNo(receiptNo);
    const sale = sales.find((s) => s.receipt_number === receiptNo);
    setSelectedSale(sale || null);

    if (sale && sale.items) {
      setReturnItems(
        sale.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name_snapshot,
          max_qty: item.quantity,
          return_qty: 0,
          unit_price: item.unit_price_kes,
          restock: true,
          condition: 'good',
        }))
      );
    } else {
      setReturnItems([]);
    }
  };

  const handleUpdateItemReturnQty = (index: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, return_qty: Math.min(item.max_qty, Math.max(0, qty)) } : item))
    );
  };

  const totalRefundAmount = returnItems.reduce(
    (sum, item) => sum + item.return_qty * item.unit_price,
    0
  );

  const handleProcessReturn = async () => {
    if (!selectedSale || !user || !returnReason.trim()) {
      alert('Please specify the return reason and select a valid receipt.');
      return;
    }

    const activeReturns = returnItems.filter((i) => i.return_qty > 0);
    if (activeReturns.length === 0) {
      alert('Please enter return quantity > 0 for at least one item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const returnNumber = `RET-${dateStr}-${randCode}`;
      const returnId = `00000000-0000-0000-0011-${Date.now().toString().slice(-12)}`;

      const items: ReturnItem[] = activeReturns.map((i) => ({
        id: `reti_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        return_id: returnId,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.return_qty,
        unit_price_kes: i.unit_price,
        line_total_kes: i.return_qty * i.unit_price,
        restock_inventory: i.restock,
        condition: i.condition,
      }));

      const newReturn: Return = {
        id: returnId,
        return_number: returnNumber,
        sale_id: selectedSale.id,
        sale_receipt_number: selectedSale.receipt_number,
        customer_id: selectedSale.customer_id,
        customer_name: selectedSale.customer_name_snapshot,
        cashier_id: user.user_id,
        refund_method: refundMethod,
        total_refund_kes: totalRefundAmount,
        reason: returnReason.trim(),
        created_at: new Date().toISOString(),
        items: items,
      };

      // 1. Save locally in Dexie
      await localDb.returns.put(newReturn);

      // 2. Restock product if good condition
      for (const item of activeReturns) {
        if (item.restock && item.condition === 'good') {
          const prod = await localDb.products.get(item.product_id);
          if (prod) {
            await localDb.products.update(item.product_id, {
              stock_on_hand: prod.stock_on_hand + item.return_qty,
              updated_at: new Date().toISOString(),
            });

            await localDb.stockMovements.put({
              id: `mov_ret_${Date.now()}_${item.product_id.slice(-6)}`,
              product_id: item.product_id,
              product_name: item.product_name,
              sku: prod.sku,
              movement_type: 'sale_return',
              quantity_delta: item.return_qty,
              unit_cost_kes: prod.buying_price_kes,
              reason: `Sales return ${returnNumber} from receipt ${selectedSale.receipt_number}`,
              created_by: user.user_id,
              created_by_name: user.full_name,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      // 3. Queue for Supabase cloud sync
      await syncEngine.queueOperation('return', {
        return_id: returnId,
        return_number: returnNumber,
        sale_id: selectedSale.id,
        customer_id: selectedSale.customer_id,
        refund_method: refundMethod,
        total_refund_kes: totalRefundAmount,
        reason: returnReason.trim(),
        items: items,
      });

      await loadData();
      setIsModalOpen(false);
      setSelectedReceiptNo('');
      setSelectedSale(null);
      setReturnItems([]);
      setReturnReason('');
      alert(`Return ${returnNumber} processed successfully. Refund: ${formatKES(totalRefundAmount)}`);
    } catch (e: any) {
      alert(`Return processing error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Returns & Refunds</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process item returns, defect write-offs, and customer refunds or credit note adjustments.
          </p>
        </div>

        {canMakeSales && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>Process Sale Return</span>
          </Button>
        )}
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-4">Original Receipt</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Refund Method</th>
                <th className="py-3 px-4 text-right">Refund Amount (KES)</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No customer returns on record.
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.return_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{r.sale_receipt_number || '—'}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.customer_name || 'Walk-In'}</td>
                    <td className="py-3 px-4">
                      <span className="uppercase font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">
                        {r.refund_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-red-600">
                      {formatKES(r.total_refund_kes)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{r.reason}</td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(r.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Return Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Process Customer Sale Return"
        description="Verify receipt number, select items to restock or scrap, and issue refund."
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700">Select Sale Receipt</label>
            <select
              value={selectedReceiptNo}
              onChange={(e) => handleSelectSale(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold focus:outline-none"
            >
              <option value="">-- Choose Sale by Receipt Number --</option>
              {sales.map((s) => (
                <option key={s.id} value={s.receipt_number}>
                  {s.receipt_number} - {s.customer_name_snapshot || 'Walk-In'} - {formatKES(s.total_kes)} (
                  {formatDate(s.created_at)})
                </option>
              ))}
            </select>
          </div>

          {selectedSale && (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Sold Qty</th>
                      <th className="p-2.5 text-center">Return Qty</th>
                      <th className="p-2.5">Condition</th>
                      <th className="p-2.5 text-right">Refund Line</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-900">{item.product_name}</td>
                        <td className="p-2.5 text-center text-slate-500">{item.max_qty}</td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.max_qty}
                            value={item.return_qty}
                            onChange={(e) => handleUpdateItemReturnQty(idx, parseFloat(e.target.value) || 0)}
                            className="w-16 text-center font-bold p-1 rounded border border-slate-300"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={item.condition}
                            onChange={(e) => {
                              const val = e.target.value as 'good' | 'damaged';
                              setReturnItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, condition: val } : it))
                              );
                            }}
                            className="p-1 rounded border border-slate-200 text-[11px]"
                          >
                            <option value="good">Good (Restock)</option>
                            <option value="damaged">Damaged (Scrap)</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-slate-900">
                          {formatKES(item.return_qty * item.unit_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Refund Method</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="cash">Cash Refund</option>
                    <option value="mpesa">M-Pesa Reversal / Transfer</option>
                    <option value="credit">Customer Credit Note</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Total Refund Payable</label>
                  <div className="text-xl font-extrabold text-red-600 mt-1">
                    {formatKES(totalRefundAmount)}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Reason for Return (Required)</label>
                <input
                  type="text"
                  placeholder="e.g. Customer purchased 4 inch bend instead of 3 inch; undamaged"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleProcessReturn}
              disabled={!selectedSale || totalRefundAmount <= 0}
              isLoading={isSubmitting}
              className="font-bold"
            >
              Confirm Return & Refund
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
