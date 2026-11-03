'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatQuantity } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TagPill, TagInput, TAG_PRESETS } from '@/components/ui/TagInput';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  Download,
  Archive,
  RefreshCw,
  ArrowUpDown,
  Lock,
  Tag,
  X,
} from 'lucide-react';
import type { Product, ProductCategory, ProductTag, StockMovement } from '@/lib/types/database';

export default function CataloguePage() {
  const { user, canManageInventory, canAlterPrices } = useAuth();

  // ── Data ────────────────────────────────────────────────────────────────────
  const [products, setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [allTags, setAllTags]     = useState<ProductTag[]>([]);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter]       = useState<'all' | 'low' | 'out'>('all');
  const [statusFilter, setStatusFilter]     = useState<'active' | 'discontinued' | 'all'>('active');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // ── Edit / Add modal ─────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '', barcode: '', product_name: '',
    category_name: 'Fasteners & Wire', brand: 'Generic',
    unit_of_measure: 'pcs',
    selling_price_kes: 0, buying_price_kes: 0, minimum_selling_price_kes: 0,
    stock_on_hand: 0, low_stock_level: 10, reorder_quantity: 30,
    allow_decimal: false, stock_location: 'SHOP-FLOOR', notes: '', active: true,
  });
  const [formTags, setFormTags] = useState<string[]>([]);

  // ── Quick Adjust modal ───────────────────────────────────────────────────────
  const [isQuickAdjustOpen, setIsQuickAdjustOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct]   = useState<Product | null>(null);
  const [adjustMode, setAdjustMode]               = useState<'delta' | 'count'>('delta');
  const [adjustQuantity, setAdjustQuantity]       = useState('0');
  const [adjustReason, setAdjustReason]           = useState('Routine stocktake discrepancy');

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadCatalogue = useCallback(async () => {
    const [prods, cats, tags] = await Promise.all([
      localDb.products.toArray(),
      localDb.categories.toArray(),
      localDb.productTags.toArray(),
    ]);
    setProducts(prods);
    setCategories(cats);
    setAllTags(tags);
  }, []);

  useEffect(() => { loadCatalogue(); }, [loadCatalogue]);

  // ── Tag helper — ensure any preset used exists in DB ────────────────────────
  const handleCreateTag = useCallback(async (tag: Omit<ProductTag, 'created_at'>) => {
    const newTag: ProductTag = { ...tag, created_at: new Date().toISOString() };
    await localDb.productTags.put(newTag);
    syncEngine.queueOperation('tag_upsert', newTag).catch(console.error);
    setAllTags((prev) => [...prev.filter((t) => t.id !== newTag.id), newTag]);
  }, []);

  // ── Tags in current view (for filter bar) ───────────────────────────────────
  const usedTagIds = useMemo(() => {
    const ids = new Set<string>();
    products.forEach((p) => (p.tags ?? []).forEach((t) => ids.add(t)));
    return ids;
  }, [products]);

  const visibleTags = useMemo(
    () => allTags.filter((t) => usedTagIds.has(t.id)),
    [allTags, usedTagIds]
  );

  // ── Filtered products ────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (statusFilter === 'active'       && !p.active) return false;
      if (statusFilter === 'discontinued' &&  p.active) return false;
      if (selectedCategory !== 'All' && p.category_name !== selectedCategory) return false;
      if (stockFilter === 'low' && !(p.stock_on_hand > 0 && p.stock_on_hand <= p.low_stock_level)) return false;
      if (stockFilter === 'out' && p.stock_on_hand > 0)  return false;
      if (activeTagFilter && !(p.tags ?? []).includes(activeTagFilter)) return false;
      if (q && !(
        p.product_name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.brand   && p.brand.toLowerCase().includes(q))
      )) return false;
      return true;
    });
  }, [products, statusFilter, selectedCategory, stockFilter, activeTagFilter, searchQuery]);

  // ── Open add / edit ──────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: `HW-${Date.now().toString().slice(-6)}`,
      barcode: `616400${Math.floor(100000 + Math.random() * 900000)}`,
      product_name: '', category_name: categories[0]?.name || 'Fasteners & Wire',
      brand: 'Generic', unit_of_measure: 'pcs',
      selling_price_kes: 100, buying_price_kes: 75, minimum_selling_price_kes: 90,
      stock_on_hand: 20, low_stock_level: 5, reorder_quantity: 25,
      allow_decimal: false, stock_location: 'SHOP-FLOOR', notes: '', active: true,
    });
    setFormTags([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku, barcode: p.barcode || '', product_name: p.product_name,
      category_name: p.category_name || '', brand: p.brand || '',
      unit_of_measure: p.unit_of_measure,
      selling_price_kes: p.selling_price_kes, buying_price_kes: p.buying_price_kes || 0,
      minimum_selling_price_kes: p.minimum_selling_price_kes || p.selling_price_kes,
      stock_on_hand: p.stock_on_hand, low_stock_level: p.low_stock_level,
      reorder_quantity: p.reorder_quantity, allow_decimal: p.allow_decimal,
      stock_location: p.stock_location || 'SHOP-FLOOR', notes: p.notes || '', active: p.active,
    });
    setFormTags(p.tags ?? []);
    setIsModalOpen(true);
  };

  // ── Save product (with tags) ─────────────────────────────────────────────────
  const handleSaveProduct = async () => {
    if (!formData.product_name.trim() || !formData.sku.trim()) {
      alert('Product Name and SKU are required.'); return;
    }
    try {
      if (editingProduct) {
        const stockDelta = formData.stock_on_hand - editingProduct.stock_on_hand;
        const updated: Partial<Product> = {
          ...formData,
          product_name: formData.product_name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          tags: formTags,
          updated_at: new Date().toISOString(),
        };
        await localDb.products.update(editingProduct.id, updated);
        if (stockDelta !== 0 && user) {
          const move: StockMovement = {
            id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            product_id: editingProduct.id, product_name: formData.product_name,
            sku: formData.sku, movement_type: 'adjustment',
            quantity_delta: stockDelta, unit_cost_kes: formData.buying_price_kes,
            reason: `Catalogue edit by ${user.full_name}`,
            created_by: user.user_id, created_by_name: user.full_name,
            created_at: new Date().toISOString(),
          };
          await localDb.stockMovements.put(move);
          syncEngine.queueOperation('stock_adjustment', {
            product_id: editingProduct.id, quantity_delta: stockDelta,
            movement_type: 'adjustment', reason: move.reason,
          }).catch(console.error);
        }
        syncEngine.queueOperation('product_upsert', { id: editingProduct.id, ...updated }).catch(console.error);
      } else {
        const newId = `00000000-0000-0000-0001-${Date.now().toString().slice(-12)}`;
        const newProd: Product = {
          id: newId, ...formData,
          product_name: formData.product_name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          tags: formTags,
          stock_reserved: 0,
          critical_stock_level: Math.round(formData.low_stock_level * 0.4),
          low_stock_alert_enabled: true,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
        await localDb.products.put(newProd);
        if (newProd.stock_on_hand > 0 && user) {
          const openMove: StockMovement = {
            id: `open_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            product_id: newId, product_name: newProd.product_name, sku: newProd.sku,
            movement_type: 'opening_balance', quantity_delta: newProd.stock_on_hand,
            unit_cost_kes: newProd.buying_price_kes,
            reason: 'Initial catalogue product creation',
            created_by: user.user_id, created_by_name: user.full_name,
            created_at: new Date().toISOString(),
          };
          await localDb.stockMovements.put(openMove);
        }
        syncEngine.queueOperation('product_upsert', newProd).catch(console.error);
      }
      await loadCatalogue();
      setIsModalOpen(false);
    } catch (e: any) {
      alert(`Error saving product: ${e.message}`);
    }
  };

  const handleToggleActive = async (p: Product) => {
    const active = !p.active;
    await localDb.products.update(p.id, { active, updated_at: new Date().toISOString() });
    syncEngine.queueOperation('product_upsert', { id: p.id, active }).catch(console.error);
    await loadCatalogue();
  };

  const handleOpenQuickAdjust = (p: Product) => {
    setAdjustingProduct(p); setAdjustMode('delta');
    setAdjustQuantity('0'); setAdjustReason('Routine physical stocktake discrepancy');
    setIsQuickAdjustOpen(true);
  };

  const handleSaveQuickAdjust = async () => {
    if (!adjustingProduct || !user) return;
    const qty = parseFloat(adjustQuantity);
    if (isNaN(qty)) { alert('Enter a valid quantity.'); return; }
    const delta = adjustMode === 'delta' ? qty : qty - adjustingProduct.stock_on_hand;
    if (delta === 0) { alert('No change in stock.'); return; }
    const newStock = adjustingProduct.stock_on_hand + delta;
    if (newStock < 0) { alert('Cannot make stock negative.'); return; }
    await localDb.products.update(adjustingProduct.id, {
      stock_on_hand: newStock, updated_at: new Date().toISOString(),
    });
    const move: StockMovement = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      product_id: adjustingProduct.id, product_name: adjustingProduct.product_name,
      sku: adjustingProduct.sku,
      movement_type: adjustReason.toLowerCase().includes('damage') ? 'damage' : 'adjustment',
      quantity_delta: delta, unit_cost_kes: adjustingProduct.buying_price_kes,
      reason: adjustReason.trim(), created_by: user.user_id, created_by_name: user.full_name,
      created_at: new Date().toISOString(),
    };
    await localDb.stockMovements.put(move);
    syncEngine.queueOperation('stock_adjustment', {
      product_id: adjustingProduct.id, quantity_delta: delta,
      movement_type: move.movement_type, reason: adjustReason.trim(),
    }).catch(console.error);
    await loadCatalogue();
    setIsQuickAdjustOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['SKU','Barcode','Product Name','Category','Unit','Selling Price (KES)','Buying Price (KES)','Stock On Hand','Tags','Status'];
    const rows = products.map((p) => [
      p.sku, p.barcode || '', `"${p.product_name.replace(/"/g,'""')}"`,
      p.category_name, p.unit_of_measure, p.selling_price_kes,
      p.buying_price_kes || 0, p.stock_on_hand,
      `"${(p.tags ?? []).map((id) => allTags.find((t) => t.id === id)?.label ?? id).join(', ')}"`,
      p.active ? 'Active' : 'Discontinued',
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `hardware_catalogue_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Product Catalogue"
        description={`${products.length} hardware items · ${allTags.length} tags`}
        icon={<Boxes className="h-5 w-5" />}
        iconColor="from-blue-500 to-blue-700"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            {canAlterPrices ? (
              <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 font-bold">
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                <Lock className="h-3.5 w-3.5" />
                <span>Owner only</span>
              </div>
            )}
          </div>
        }
      />

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU, name, brand…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          {/* Status */}
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
            {(['active','discontinued','all'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${statusFilter === s ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Stock */}
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
            {([['all','All'],['low','Low'],['out','Out']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStockFilter(val)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  stockFilter === val
                    ? val === 'low' ? 'bg-amber-100 text-amber-800 shadow-xs'
                    : val === 'out' ? 'bg-red-100 text-red-800 shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tag filter bar ─────────────────────────────────────────────── */}
        {visibleTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide flex-shrink-0">
              <Tag className="h-3 w-3" /> Filter by tag:
            </span>
            {visibleTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTagFilter(activeTagFilter === tag.id ? null : tag.id)}
                className="transition-all"
              >
                <TagPill
                  tag={tag}
                  size="sm"
                  className={activeTagFilter === tag.id ? 'ring-2 ring-offset-1 ring-slate-500 scale-105' : 'opacity-70 hover:opacity-100'}
                />
              </button>
            ))}
            {activeTagFilter && (
              <button
                onClick={() => setActiveTagFilter(null)}
                className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 font-semibold"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-slate-400 font-medium px-1">
        Showing <strong className="text-slate-700">{filteredProducts.length}</strong> of {products.length} products
        {activeTagFilter && (
          <span> · tagged <strong className="text-slate-700">{allTags.find((t) => t.id === activeTagFilter)?.label}</strong></span>
        )}
      </p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No products match the current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow  = p.stock_on_hand > 0 && p.stock_on_hand <= p.low_stock_level;
                  const isOut  = p.stock_on_hand <= 0;
                  const pTags  = allTags.filter((t) => (p.tags ?? []).includes(t.id));

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${!p.active ? 'opacity-55' : ''}`}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div>{p.sku}</div>
                        {p.barcode && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{p.barcode}</div>}
                      </td>

                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="font-bold text-slate-900 truncate">{p.product_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {p.category_name}{p.brand ? ` · ${p.brand}` : ''}{p.specification ? ` · ${p.specification}` : ''}
                        </div>
                      </td>

                      {/* Tags column */}
                      <td className="py-3 px-4 max-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          {pTags.length > 0
                            ? pTags.map((t) => <TagPill key={t.id} tag={t} size="sm" />)
                            : <span className="text-[10px] text-slate-300 italic">—</span>
                          }
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium uppercase text-slate-600">{p.unit_of_measure}</td>

                      <td className="py-3 px-4 text-right font-extrabold text-amber-700">
                        {formatKES(p.selling_price_kes)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {p.buying_price_kes ? formatKES(p.buying_price_kes) : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          isOut  ? 'bg-red-100 text-red-700' :
                          isLow  ? 'bg-amber-100 text-amber-800' :
                                   'bg-emerald-50 text-emerald-700'
                        }`}>
                          {formatQuantity(p.stock_on_hand, p.unit_of_measure, p.allow_decimal)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {p.active ? 'Active' : 'Discontinued'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManageInventory && (
                            <button onClick={() => handleOpenQuickAdjust(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Quick stock adjustment">
                              <ArrowUpDown className="h-4 w-4" />
                            </button>
                          )}
                          {canAlterPrices && (
                            <button onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Edit product">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {canAlterPrices && (
                            <button onClick={() => handleToggleActive(p)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                p.active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={p.active ? 'Discontinue' : 'Reactivate'}>
                              {p.active ? <Archive className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                            </button>
                          )}
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

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit: ${editingProduct.product_name}` : 'Add New Hardware Product'}
        description="Manage catalogue specifications, pricing, stock levels, and product tags."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* SKU + Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">SKU Code</label>
              <input type="text" value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="font-bold text-slate-700">Barcode</label>
              <input type="text" value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="font-bold text-slate-700">Product Name</label>
            <input type="text" value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-amber-500"
              placeholder="e.g. Simba Cement 50kg, Ordinary Nails 3 inch" />
          </div>

          {/* Category + Brand + Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700">Category</label>
              <select value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-amber-500">
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700">Brand / Maker</label>
              <input type="text" value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Bamburi, Crown" />
            </div>
            <div>
              <label className="font-bold text-slate-700">Unit of Measure</label>
              <select value={formData.unit_of_measure}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-amber-500">
                {['pcs','kg','bag','roll','tin','length','sheet','pair','ft','m'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700">Selling Price (KES)</label>
              <input type="number" value={formData.selling_price_kes}
                onChange={(e) => setFormData({ ...formData, selling_price_kes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold text-amber-700 focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="font-bold text-slate-700">Buying Cost (KES)</label>
              <input type="number" value={formData.buying_price_kes}
                onChange={(e) => setFormData({ ...formData, buying_price_kes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="font-bold text-slate-700">Min Selling Price</label>
              <input type="number" value={formData.minimum_selling_price_kes}
                onChange={(e) => setFormData({ ...formData, minimum_selling_price_kes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Current Stock</label>
              <input type="number" value={formData.stock_on_hand}
                onChange={(e) => setFormData({ ...formData, stock_on_hand: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="font-bold text-slate-700">Low Stock Alert Level</label>
              <input type="number" value={formData.low_stock_level}
                onChange={(e) => setFormData({ ...formData, low_stock_level: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          {/* ── Tags section ──────────────────────────────────────────────── */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Tag className="h-3.5 w-3.5 text-amber-600" />
              Product Tags
              <span className="text-[10px] font-normal text-slate-400">(optional — helps with filtering &amp; promotions)</span>
            </label>
            <TagInput
              selectedTagIds={formTags}
              allTags={allTags}
              onChange={setFormTags}
              onCreateTag={handleCreateTag}
              placeholder="Add tags like 'On Promotion', 'Best Seller'…"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.allow_decimal}
                onChange={(e) => setFormData({ ...formData, allow_decimal: e.target.checked })}
                className="rounded border-slate-300" />
              <span className="font-semibold text-slate-700">Allow decimal quantities</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-slate-300" />
              <span className="font-semibold text-slate-700">Active for POS sales</span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveProduct} className="font-bold">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Quick Adjust Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isQuickAdjustOpen}
        onClose={() => setIsQuickAdjustOpen(false)}
        title={`Adjust Stock: ${adjustingProduct?.product_name || ''}`}
        description="Fast stock adjustment with automatic ledger logging."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
            <div>
              <div className="text-slate-500 font-bold">Current Stock</div>
              <div className="font-mono text-slate-400">SKU: {adjustingProduct?.sku}</div>
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {adjustingProduct?.stock_on_hand} {adjustingProduct?.unit_of_measure}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            {(['delta','count'] as const).map((mode) => (
              <button key={mode} onClick={() => {
                setAdjustMode(mode);
                if (mode === 'count') setAdjustQuantity(adjustingProduct?.stock_on_hand.toString() ?? '0');
              }}
                className={`py-1.5 rounded-lg font-bold text-center transition-colors ${adjustMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
                {mode === 'delta' ? 'Add / Remove (±)' : 'New Physical Count'}
              </button>
            ))}
          </div>

          <div>
            <label className="font-bold text-slate-700">
              {adjustMode === 'delta' ? 'Quantity Delta (+ or −)' : 'Actual Counted Quantity'}
            </label>
            <input type="number" step="any" value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none focus:border-amber-500" />
            {adjustMode === 'count' && adjustingProduct && (
              <div className="text-[11px] text-slate-500 mt-1">
                Delta:{' '}
                <strong className={(parseFloat(adjustQuantity)||0) >= adjustingProduct.stock_on_hand ? 'text-emerald-700' : 'text-red-600'}>
                  {(parseFloat(adjustQuantity)||0) - adjustingProduct.stock_on_hand > 0 ? '+' : ''}
                  {(parseFloat(adjustQuantity)||0) - adjustingProduct.stock_on_hand} {adjustingProduct.unit_of_measure}
                </strong>
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700">Reason</label>
            <select value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-amber-500">
              <option>Routine physical stocktake discrepancy</option>
              <option>Damaged in store or transit</option>
              <option>Rust or weather exposure damage</option>
              <option>Cement bag leakage or spillage</option>
              <option>Supplier delivery count correction</option>
              <option>Found unaccounted stock in store</option>
            </select>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsQuickAdjustOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveQuickAdjust} className="font-bold">
              Confirm Adjustment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
