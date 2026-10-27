'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatQuantity, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Building2,
  Receipt,
} from 'lucide-react';
import type { Purchase, Supplier, Product, PurchaseItem } from '@/lib/types/database';

export default function PurchasesPage() {
  const { user, canManageInventory } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Create PO Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<
    Array<{
      product_id: string;
      product_name: string;
      sku: string;
      quantity: number;
      unit_cost_kes: number;
    }>
  >([]);

  // Adding single line item in modal
  const [lineProductId, setLineProductId] = useState('');
  const [lineQty, setLineQty] = useState('10');
  const [lineCost, setLineCost] = useState('0');

  const loadData = async () => {
    // Concurrently load purchases, suppliers, and active products
    const [pList, sList, prList] = await Promise.all([
      localDb.purchases.orderBy('created_at').reverse().toArray(),
      localDb.suppliers.where('active').equals(1).toArray(),
      localDb.products.where('active').equals(1).toArray(),
    ]);

    setPurchases(pList);
    setSuppliers(sList);
    if (sList.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(sList[0].id);
    }
    setProducts(prList);
    if (prList.length > 0 && !lineProductId) {
      setLineProductId(prList[0].id);
      setLineCost(prList[0].buying_price_kes?.toString() || '100');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductSelectChange = (pid: string) => {
    setLineProductId(pid);
    const p = products.find((prod) => prod.id === pid);
    if (p) {
      setLineCost(p.buying_price_kes?.toString() || p.selling_price_kes.toString());
    }
  };

  const handleAddLineItem = () => {
    const p = products.find((prod) => prod.id === lineProductId);
    if (!p) return;
    const qty = parseFloat(lineQty) || 1;
    const cost = parseFloat(lineCost) || 0;

    setPoItems((prev) => [
      ...prev,
      {
        product_id: p.id,
        product_name: p.product_name,
        sku: p.sku,
        quantity: qty,
        unit_cost_kes: cost,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const poSubtotal = useMemo(
    () => poItems.reduce((sum, item) => sum + item.quantity * item.unit_cost_kes, 0),
    [poItems]
  );

  const handleCreatePO = async (autoReceive = false) => {
    if (poItems.length === 0 || !user) {
      alert('Please add at least one line item to the purchase order.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const poNumber = `PO-${dateStr}-${randCode}`;
    const purchaseId = `00000000-0000-0000-0009-${Date.now().toString().slice(-12)}`;

    const items: PurchaseItem[] = poItems.map((i) => ({
      id: `poi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      purchase_id: purchaseId,
      product_id: i.product_id,
      product_name_snapshot: i.product_name,
      sku_snapshot: i.sku,
      quantity: i.quantity,
      unit_cost_kes: i.unit_cost_kes,
      line_total_kes: i.quantity * i.unit_cost_kes,
    }));

    const newPurchase: Purchase = {
      id: purchaseId,
      po_number: poNumber,
      supplier_id: supplier?.id || null,
      supplier_name: supplier?.name || 'Local Supplier',
      status: autoReceive ? 'received' : 'draft',
      supplier_invoice_no: invoiceNo || null,
      subtotal_kes: poSubtotal,
      tax_kes: Math.round(poSubtotal * 0.16 * 100) / 100,
      total_kes: Math.round(poSubtotal * 1.16 * 100) / 100,
      notes: poNotes || null,
      created_by: user.user_id,
      received_by: autoReceive ? user.user_id : null,
      received_at: autoReceive ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      items: items,
    };

    // Save purchase order locally
    await localDb.purchases.put(newPurchase);

    if (autoReceive) {
      // Increment stock in Dexie virtual store
      for (const item of poItems) {
        const prod = await localDb.products.get(item.product_id);
        if (prod) {
          await localDb.products.update(item.product_id, {
            stock_on_hand: prod.stock_on_hand + item.quantity,
            buying_price_kes: item.unit_cost_kes,
            updated_at: new Date().toISOString(),
          });

          await localDb.stockMovements.put({
            id: `mov_rcv_${Date.now()}_${item.product_id.slice(-6)}`,
            product_id: item.product_id,
            product_name: item.product_name,
            sku: item.sku,
            movement_type: 'purchase_receipt',
            quantity_delta: item.quantity,
            unit_cost_kes: item.unit_cost_kes,
            reason: `Stock received under PO ${poNumber}`,
            created_by: user.user_id,
            created_by_name: user.full_name,
            created_at: new Date().toISOString(),
          });

          // Sync updated stock & cost to Supabase catalog
          const refreshedProd = await localDb.products.get(item.product_id);
          if (refreshedProd) {
            syncEngine.queueOperation('product_upsert', refreshedProd).catch(console.error);
          }
        }
      }

      // Queue in syncEngine for Supabase cloud sync
      await syncEngine.queueOperation('receive_purchase', {
        purchase_id: purchaseId,
        po_number: poNumber,
        supplier_id: supplier?.id,
        items: items,
      });
    }

    await loadData();
    setIsModalOpen(false);
    setPoItems([]);
    setInvoiceNo('');
    setPoNotes('');
  };

  const handleReceiveExistingPO = async (po: Purchase) => {
    if (!user || po.status === 'received') return;
    if (!confirm(`Confirm receiving delivery for ${po.po_number}? This will update physical stock balances.`)) {
      return;
    }

    if (po.items) {
      for (const item of po.items) {
        const prod = await localDb.products.get(item.product_id);
        if (prod) {
          await localDb.products.update(item.product_id, {
            stock_on_hand: prod.stock_on_hand + item.quantity,
            buying_price_kes: item.unit_cost_kes,
            updated_at: new Date().toISOString(),
          });

          await localDb.stockMovements.put({
            id: `mov_rcv_${Date.now()}_${item.product_id.slice(-6)}`,
            product_id: item.product_id,
            product_name: item.product_name_snapshot,
            sku: item.sku_snapshot,
            movement_type: 'purchase_receipt',
            quantity_delta: item.quantity,
            unit_cost_kes: item.unit_cost_kes,
            reason: `Stock received under PO ${po.po_number}`,
            created_by: user.user_id,
            created_by_name: user.full_name,
            created_at: new Date().toISOString(),
          });

          // Sync updated stock & cost to Supabase catalog
          const refreshedProd = await localDb.products.get(item.product_id);
          if (refreshedProd) {
            syncEngine.queueOperation('product_upsert', refreshedProd).catch(console.error);
          }
        }
      }
    }

    await localDb.purchases.update(po.id, {
      status: 'received',
      received_by: user.user_id,
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await syncEngine.queueOperation('receive_purchase', {
      purchase_id: po.id,
      po_number: po.po_number,
    });

    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchases & Stock Receiving</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage purchase orders, record incoming supplier delivery notes, and update landed stock.
          </p>
        </div>

        {canManageInventory && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>New Purchase Order</span>
          </Button>
        )}
      </div>

      {/* PO List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Invoice / Delivery Ref</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total Cost (KES)</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No purchase orders on record. Click "New Purchase Order" to record received inventory.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.po_number}</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{p.supplier_name || 'Generic Supplier'}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.supplier_invoice_no || '—'}
                    </td>

                    <td className="py-3 px-4">
                      {p.status === 'received' ? (
                        <Badge variant="success" className="flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" />
                          Received
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          Draft / Pending
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {formatKES(p.total_kes)}
                    </td>

                    <td className="py-3 px-4 text-slate-500">{formatDate(p.created_at)}</td>

                    <td className="py-3 px-4 text-right">
                      {p.status === 'draft' && canManageInventory && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleReceiveExistingPO(p)}
                          className="text-[11px] font-bold"
                        >
                          Receive Stock
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

      {/* New Purchase Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Hardware Purchase Order"
        description="Select supplier and add catalogue products for receiving into store inventory."
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.tax_pin || 'No PIN'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">Supplier Invoice / Delivery Note #</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. BAM-INV-2026-981"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Line item add box */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Add Products to Order
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <select
                  value={lineProductId}
                  onChange={(e) => handleProductSelectChange(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={lineQty}
                  onChange={(e) => setLineQty(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Unit Cost (KES)"
                  value={lineCost}
                  onChange={(e) => setLineCost(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
                <Button variant="secondary" size="sm" onClick={handleAddLineItem} className="font-bold">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Added items list */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {poItems.length === 0 ? (
              <div className="text-center py-6 text-slate-400">No items added to this PO yet.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Cost</th>
                    <th className="py-2 px-3 text-right">Total</th>
                    <th className="py-2 px-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {poItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.product_name}</td>
                      <td className="py-2 px-3">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">{formatKES(item.unit_cost_kes)}</td>
                      <td className="py-2 px-3 text-right font-bold">
                        {formatKES(item.quantity * item.unit_cost_kes)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-slate-300 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-between items-center text-sm font-bold bg-amber-50 p-3 rounded-xl border border-amber-200">
            <span>Estimated Total:</span>
            <span className="text-base text-amber-900">{formatKES(poSubtotal)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleCreatePO(false)}>
                Save Draft PO
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleCreatePO(true)}
                className="font-bold flex items-center gap-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                Receive & Update Stock Now
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
