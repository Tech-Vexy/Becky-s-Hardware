'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { formatKES, formatDate } from '@/lib/utils/formatters';
import { printTaxInvoice } from '@/lib/utils/invoicePrinter';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Trash2,
  Calendar,
  Building,
  User,
  ArrowRight,
  Eye,
} from 'lucide-react';
import type { Invoice, InvoiceItem, InvoiceStatus, Customer, Product, StockMovement } from '@/lib/types/database';

export default function InvoicesPage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Invoice Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerKraPin, setCustomerKraPin] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 14 Days');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // Item Selector row inside modal
  const [lineProductId, setLineProductId] = useState('');
  const [lineQty, setLineQty] = useState('1');
  const [linePrice, setLinePrice] = useState('0');

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank_transfer'>('mpesa');
  const [paymentRef, setPaymentRef] = useState('');

  // Selected Invoice Detail preview
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);

  const loadData = async () => {
    const invs = await localDb.invoices.orderBy('created_at').reverse().toArray();
    setInvoices(invs);
    const custs = await localDb.customers.where('active').equals(1).toArray();
    setCustomers(custs);
    if (custs.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(custs[0].id);
      setCustomCustomerName(custs[0].full_name);
      setCustomerPhone(custs[0].phone || '');
    }
    const prods = await localDb.products.where('active').equals(1).toArray();
    setProducts(prods);
    if (prods.length > 0 && !lineProductId) {
      setLineProductId(prods[0].id);
      setLinePrice(prods[0].selling_price_kes.toString());
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find((cust) => cust.id === id);
    if (c) {
      setCustomCustomerName(c.full_name);
      setCustomerPhone(c.phone || '');
    }
  };

  const handleProductSelectChange = (pid: string) => {
    setLineProductId(pid);
    const p = products.find((prod) => prod.id === pid);
    if (p) {
      setLinePrice(p.selling_price_kes.toString());
    }
  };

  const handleAddLineItem = () => {
    const p = products.find((prod) => prod.id === lineProductId);
    if (!p) return;
    const qty = parseFloat(lineQty) || 1;
    const price = parseFloat(linePrice) || 0;

    const newItem: InvoiceItem = {
      id: `ii_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product_id: p.id,
      product_name: p.product_name,
      sku: p.sku,
      quantity: qty,
      unit_of_measure: p.unit_of_measure || 'pcs',
      unit_price_kes: price,
      line_total_kes: qty * price,
    };

    setInvoiceItems((prev) => [...prev, newItem]);
  };

  const handleRemoveLineItem = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const invoiceSubtotal = invoiceItems.reduce((sum, item) => sum + item.line_total_kes, 0);
  const invoiceTax = Math.round(invoiceSubtotal * (16 / 116) * 100) / 100;
  const invoiceTotal = invoiceSubtotal;

  const handleCreateInvoice = async (asDraft: boolean = false) => {
    if (!customCustomerName.trim()) {
      showToast('system', 'Validation Error', 'Customer Name is required.', '/invoices');
      return;
    }
    if (invoiceItems.length === 0) {
      showToast('system', 'Validation Error', 'Please add at least one line item to the invoice.', '/invoices');
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const dateStr = nowIso.slice(0, 10).replace(/-/g, '');
      const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const invoiceNumber = `INV-${dateStr}-${randCode}`;
      const newInvoiceId = `00000000-0000-0000-0010-${Date.now().toString().slice(-12)}`;

      const newInvoice: Invoice = {
        id: newInvoiceId,
        invoice_number: invoiceNumber,
        customer_id: selectedCustomerId || null,
        customer_name: customCustomerName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_kra_pin: customerKraPin.trim() || null,
        customer_address: customerAddress.trim() || null,
        issue_date: issueDate,
        due_date: dueDate,
        status: asDraft ? 'draft' : 'pending',
        subtotal_kes: invoiceSubtotal,
        tax_kes: invoiceTax,
        total_kes: invoiceTotal,
        amount_paid_kes: 0,
        balance_due_kes: invoiceTotal,
        notes: invoiceNotes.trim() || null,
        payment_terms: paymentTerms,
        created_by: user?.user_id || '00000000-0000-0000-0000-000000000001',
        created_by_name: user?.full_name || 'Becky (Store Owner)',
        created_at: nowIso,
        updated_at: nowIso,
        items: invoiceItems,
      };

      // 1. Save in local Dexie database
      await localDb.invoices.put(newInvoice);

      // 2. If issued (not draft), deduct stock and record stock movements
      if (!asDraft) {
        for (const item of invoiceItems) {
          if (item.product_id) {
            const prod = await localDb.products.get(item.product_id);
            if (prod) {
              const newStock = Math.max(0, prod.stock_on_hand - item.quantity);
              await localDb.products.update(prod.id, {
                stock_on_hand: newStock,
                updated_at: nowIso,
              });

              const mov: StockMovement = {
                id: `mov_inv_${Date.now()}_${prod.id.slice(-6)}`,
                product_id: prod.id,
                product_name: prod.product_name,
                sku: prod.sku,
                movement_type: 'sale',
                quantity_delta: -item.quantity,
                unit_cost_kes: prod.buying_price_kes,
                reason: `Tax Invoice ${invoiceNumber}`,
                created_by: user?.user_id || '00000000-0000-0000-0000-000000000001',
                created_by_name: user?.full_name || 'Store Management',
                created_at: nowIso,
              };
              await localDb.stockMovements.put(mov);
            }
          }
        }
      }

      // 3. Queue cloud sync
      syncEngine.queueOperation('invoice_upsert', newInvoice).catch(console.error);

      showToast(
        'inventory',
        'Invoice Created',
        `Tax Invoice ${invoiceNumber} created successfully for ${newInvoice.customer_name}.`,
        '/invoices'
      );

      await loadData();
      setIsCreateModalOpen(false);
      setInvoiceItems([]);
      setInvoiceNotes('');

      // Open print view
      printTaxInvoice(newInvoice);
    } catch (err: any) {
      showToast('system', 'Error', err.message || 'Failed to create invoice', '/invoices');
    }
  };

  const handleOpenRecordPayment = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPaymentAmount(inv.balance_due_kes.toString());
    setPaymentRef('');
    setPaymentMethod('mpesa');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!payingInvoice) return;
    const paid = parseFloat(paymentAmount) || 0;
    if (paid <= 0) {
      showToast('system', 'Validation Error', 'Payment amount must be greater than zero.', '/invoices');
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const newPaidTotal = payingInvoice.amount_paid_kes + paid;
      const newBalance = Math.max(0, payingInvoice.total_kes - newPaidTotal);
      const newStatus: InvoiceStatus = newBalance === 0 ? 'paid' : 'partial';

      const updatedInvoice: Invoice = {
        ...payingInvoice,
        amount_paid_kes: newPaidTotal,
        balance_due_kes: newBalance,
        status: newStatus,
        updated_at: nowIso,
        notes: payingInvoice.notes
          ? `${payingInvoice.notes}\n[${new Date().toLocaleDateString('en-GB')}] Paid KES ${paid} via ${paymentMethod.toUpperCase()} (${paymentRef || 'No ref'})`
          : `[${new Date().toLocaleDateString('en-GB')}] Paid KES ${paid} via ${paymentMethod.toUpperCase()} (${paymentRef || 'No ref'})`,
      };

      await localDb.invoices.put(updatedInvoice);
      syncEngine.queueOperation('invoice_upsert', updatedInvoice).catch(console.error);

      showToast(
        'payment',
        'Payment Recorded',
        `KES ${paid.toLocaleString()} recorded for ${payingInvoice.invoice_number}. New status: ${newStatus.toUpperCase()}`,
        '/invoices'
      );

      await loadData();
      setIsPaymentModalOpen(false);
      setPayingInvoice(null);
    } catch (err: any) {
      showToast('system', 'Payment Error', err.message, '/invoices');
    }
  };

  // KPI Calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_kes, 0);
  const totalReceivables = invoices.reduce((sum, inv) => sum + inv.balance_due_kes, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount_paid_kes, 0);
  const overdueCount = invoices.filter(
    (inv) => inv.status !== 'paid' && new Date(inv.due_date).getTime() < Date.now()
  ).length;

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        const isPastDue = new Date(inv.due_date).getTime() < Date.now() && inv.status !== 'paid';
        if (!isPastDue) return false;
      } else if (inv.status !== statusFilter) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const num = inv.invoice_number.toLowerCase();
      const cust = inv.customer_name.toLowerCase();
      const phone = (inv.customer_phone || '').toLowerCase();
      return num.includes(q) || cust.includes(q) || phone.includes(q);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Invoices</h1>
            <Badge variant="default">{invoices.length} Invoices</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Official KRA Tax Invoices, contractor billing, payment reconciliation, and A4 PDF export.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setInvoiceItems([]);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 font-bold shadow-xs bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="h-4 w-4" />
          <span>+ Create Tax Invoice</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatKES(totalInvoiced)}</div>
            <div className="text-xs text-slate-400 mt-0.5">{invoices.length} invoices issued</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Balance Due (Receivables)</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-800">{formatKES(totalReceivables)}</div>
            <div className="text-xs text-amber-600 font-semibold mt-0.5">Pending collection</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Collected Payments</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-800">{formatKES(totalPaid)}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-0.5">Settled invoices</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Overdue Invoices</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-700">{overdueCount}</div>
            <div className="text-xs text-red-600 font-semibold mt-0.5">Past due date</div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, client, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(['all', 'pending', 'paid', 'partial', 'overdue'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === tab ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client / Site</th>
                <th className="py-3 px-4">Issue & Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Invoice Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No invoices matching this filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isOverdue =
                    inv.status !== 'paid' && new Date(inv.due_date).getTime() < Date.now();

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">{inv.invoice_number}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.items?.length || 0} line items
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inv.customer_name}</div>
                        {inv.customer_phone && (
                          <div className="text-[10px] text-slate-400">{inv.customer_phone}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        <div>Issued: <span className="font-medium text-slate-800">{inv.issue_date}</span></div>
                        <div className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}>
                          Due: {inv.due_date} {isOverdue && '(OVERDUE)'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`uppercase font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'pending'
                              ? isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                              : inv.status === 'partial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isOverdue && inv.status !== 'paid' ? 'Overdue' : inv.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatKES(inv.total_kes)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {inv.balance_due_kes <= 0 ? (
                          <span className="text-emerald-700 font-bold text-xs">Cleared (KES 0)</span>
                        ) : (
                          <span className="text-amber-800 font-black text-xs">
                            {formatKES(inv.balance_due_kes)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.balance_due_kes > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenRecordPayment(inv)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 transition-colors"
                              title="Record payment against invoice"
                            >
                              Record Pay
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => printTaxInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] border border-slate-200 transition-colors"
                            title="Print Official A4 Tax Invoice"
                          >
                            <Printer className="h-3 w-3 text-slate-600" />
                            <span>A4 Invoice</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tax Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Official Tax Invoice"
        description="Issue an A4 tax invoice for contractors, companies, or account customers."
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs">
          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-700">Select Registered Client</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="">-- Custom / One-off Client --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">Client / Company Name *</label>
              <input
                type="text"
                value={customCustomerName}
                onChange={(e) => setCustomCustomerName(e.target.value)}
                placeholder="e.g. Apex Builders Ltd, John Fundi"
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Client Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0712 345 678"
                className="w-full mt-1 p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Client KRA PIN (Optional)</label>
              <input
                type="text"
                value={customerKraPin}
                onChange={(e) => setCustomerKraPin(e.target.value.toUpperCase())}
                placeholder="e.g. A012345678Z"
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 font-mono text-xs uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="Due on Receipt">Due on Receipt (Immediate)</option>
                <option value="Net 7 Days">Net 7 Days</option>
                <option value="Net 14 Days">Net 14 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 font-semibold"
              />
            </div>
          </div>

          {/* Add Line Items Section */}
          <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3">
            <div className="font-bold text-slate-900 text-xs">Add Hardware Items to Invoice</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Product Item</label>
                <select
                  value={lineProductId}
                  onChange={(e) => handleProductSelectChange(e.target.value)}
                  className="w-full mt-0.5 p-2 rounded-lg border border-slate-300 bg-white font-medium text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.product_name} ({formatKES(p.selling_price_kes)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase">Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={lineQty}
                  onChange={(e) => setLineQty(e.target.value)}
                  className="w-full mt-0.5 p-2 rounded-lg border border-slate-300 font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase">Unit Price (KES)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={linePrice}
                  onChange={(e) => setLinePrice(e.target.value)}
                  className="w-full mt-0.5 p-2 rounded-lg border border-slate-300 font-bold text-xs text-amber-700"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="w-full font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200"
                >
                  + Add Item
                </Button>
              </div>
            </div>

            {/* Line items list */}
            {invoiceItems.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-3 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{item.product_name}</td>
                        <td className="py-2 px-3 text-center">
                          {item.quantity} {item.unit_of_measure}
                        </td>
                        <td className="py-2 px-3 text-right">{formatKES(item.unit_price_kes)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatKES(item.line_total_kes)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
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
              </div>
            )}
          </div>

          {/* Totals & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Customer Notes / Instructions (Optional)</label>
              <textarea
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="e.g. Site contact, project reference, or purchase order notes..."
                rows={3}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-bold text-slate-800">{formatKES(invoiceSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>16% VAT (Inclusive):</span>
                <span>{formatKES(invoiceTax)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Invoice Total:</span>
                <span className="text-amber-700">{formatKES(invoiceTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateInvoice(true)}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleCreateInvoice(false)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                Issue & Print Tax Invoice
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment: ${payingInvoice?.invoice_number || ''}`}
        description={`Record settlement against ${payingInvoice?.customer_name || 'Client'}`}
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Total Invoiced:</span>
              <strong className="text-slate-900">{formatKES(payingInvoice?.total_kes || 0)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Already Paid:</span>
              <strong className="text-emerald-700">{formatKES(payingInvoice?.amount_paid_kes || 0)}</strong>
            </div>
            <div className="flex justify-between text-sm font-black border-t border-amber-200/60 pt-1 text-amber-900">
              <span>Remaining Balance Due:</span>
              <span>{formatKES(payingInvoice?.balance_due_kes || 0)}</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="mpesa">M-Pesa (Till / STK / Paybill)</option>
              <option value="cash">Cash in Register</option>
              <option value="bank_transfer">Bank Transfer (EFT / RTGS)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700">Amount Received (KES) *</label>
            <input
              type="number"
              step="any"
              min="1"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-black text-amber-700 text-base"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700">Payment Reference / M-Pesa Code</label>
            <input
              type="text"
              placeholder="e.g. QK829JSD92 or Bank Slip Ref"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value.toUpperCase())}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePayment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
