'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKES, formatQuantity } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Edit2,
  Download,
  AlertTriangle,
  Barcode,
  SlidersHorizontal,
  Archive,
  RefreshCw,
  CheckCircle2,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import type { Product, ProductCategory, StockMovement } from '@/lib/types/database';

export default function CataloguePage() {
  const { user, canManageInventory, canAlterPrices } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'discontinued' | 'all'>('active');

  // Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    product_name: '',
    category_name: 'Fasteners & Wire',
    brand: 'Generic',
    unit_of_measure: 'pcs',
    selling_price_kes: 0,
    buying_price_kes: 0,
    minimum_selling_price_kes: 0,
    stock_on_hand: 0,
    low_stock_level: 10,
    reorder_quantity: 30,
    allow_decimal: false,
    stock_location: 'SHOP-FLOOR',
    notes: '',
    active: true,
  });

  // Quick Stock Adjustment Modal
  const [isQuickAdjustOpen, setIsQuickAdjustOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustMode, setAdjustMode] = useState<'delta' | 'count'>('delta');
  const [adjustQuantity, setAdjustQuantity] = useState('0');
  const [adjustReason, setAdjustReason] = useState('Routine stocktake discrepancy');

  const loadCatalogue = async () => {
    // Concurrently load products and categories from local Dexie database
    const [prods, cats] = await Promise.all([
      localDb.products.toArray(),
      localDb.categories.toArray(),
    ]);
    setProducts(prods);
    setCategories(cats);
  };

  useEffect(() => {
    loadCatalogue();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      // Status filter
      if (statusFilter === 'active' && !p.active) return false;
      if (statusFilter === 'discontinued' && p.active) return false;

      // Category filter
      const matchCat = selectedCategory === 'All' || p.category_name === selectedCategory;

      // Search filter
      const matchSearch =
        !q ||
        p.product_name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q));

      // Stock filter
      let matchStock = true;
      if (stockFilter === 'low') {
        matchStock = p.stock_on_hand > 0 && p.stock_on_hand <= p.low_stock_level;
      } else if (stockFilter === 'out') {
        matchStock = p.stock_on_hand <= 0;
      }

      return matchCat && matchSearch && matchStock;
    });
  }, [products, statusFilter, selectedCategory, searchQuery, stockFilter]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: `HW-${Date.now().toString().slice(-6)}`,
      barcode: `616400${Math.floor(100000 + Math.random() * 900000)}`,
      product_name: '',
      category_name: categories[0]?.name || 'Fasteners & Wire',
      brand: 'Generic',
      unit_of_measure: 'pcs',
      selling_price_kes: 100,
      buying_price_kes: 75,
      minimum_selling_price_kes: 90,
      stock_on_hand: 20,
      low_stock_level: 5,
      reorder_quantity: 25,
      allow_decimal: false,
      stock_location: 'SHOP-FLOOR',
      notes: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      barcode: p.barcode || '',
      product_name: p.product_name,
      category_name: p.category_name || '',
      brand: p.brand || '',
      unit_of_measure: p.unit_of_measure,
      selling_price_kes: p.selling_price_kes,
      buying_price_kes: p.buying_price_kes || 0,
      minimum_selling_price_kes: p.minimum_selling_price_kes || p.selling_price_kes,
      stock_on_hand: p.stock_on_hand,
      low_stock_level: p.low_stock_level,
      reorder_quantity: p.reorder_quantity,
      allow_decimal: p.allow_decimal,
      stock_location: p.stock_location || 'SHOP-FLOOR',
      notes: p.notes || '',
      active: p.active,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.product_name.trim() || !formData.sku.trim()) {
      alert('Product Name and SKU are required.');
      return;
    }

    if (formData.selling_price_kes < 0) {
      alert('Selling price cannot be negative.');
      return;
    }

    try {
      if (editingProduct) {
        const stockDelta = formData.stock_on_hand - editingProduct.stock_on_hand;

        const updated: Partial<Product> = {
          ...formData,
          product_name: formData.product_name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          updated_at: new Date().toISOString(),
        };

        await localDb.products.update(editingProduct.id, updated);

        // If stock level was altered directly in edit, log an audited stock movement
        if (stockDelta !== 0 && user) {
          const moveRecord: StockMovement = {
            id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            product_id: editingProduct.id,
            product_name: formData.product_name,
            sku: formData.sku,
            movement_type: 'adjustment',
            quantity_delta: stockDelta,
            unit_cost_kes: formData.buying_price_kes,
            reason: `Catalogue product edit by ${user.full_name}`,
            created_by: user.user_id,
            created_by_name: user.full_name,
            created_at: new Date().toISOString(),
          };
          await localDb.stockMovements.put(moveRecord);

          syncEngine.queueOperation('stock_adjustment', {
            product_id: editingProduct.id,
            quantity_delta: stockDelta,
            movement_type: 'adjustment',
            reason: `Catalogue edit by ${user.full_name}`,
          }).catch(console.error);
        }

        // Queue product update to cloud
        syncEngine.queueOperation('product_upsert', {
          id: editingProduct.id,
          ...updated,
        }).catch(console.error);

      } else {
        const newId = `00000000-0000-0000-0001-${Date.now().toString().slice(-12)}`;
        const newProd: Product = {
          id: newId,
          ...formData,
          product_name: formData.product_name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          stock_reserved: 0,
          critical_stock_level: Math.round(formData.low_stock_level * 0.4),
          low_stock_alert_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await localDb.products.put(newProd);

        // Record initial opening balance if starting stock > 0
        if (newProd.stock_on_hand > 0 && user) {
          const initialMove: StockMovement = {
            id: `open_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            product_id: newId,
            product_name: newProd.product_name,
            sku: newProd.sku,
            movement_type: 'opening_balance',
            quantity_delta: newProd.stock_on_hand,
            unit_cost_kes: newProd.buying_price_kes,
            reason: 'Initial catalogue product creation',
            created_by: user.user_id,
            created_by_name: user.full_name,
            created_at: new Date().toISOString(),
          };
          await localDb.stockMovements.put(initialMove);
        }

        // Queue product creation to cloud
        syncEngine.queueOperation('product_upsert', newProd).catch(console.error);
      }

      await loadCatalogue();
      setIsModalOpen(false);
    } catch (e: any) {
      alert(`Error saving product: ${e.message}`);
    }
  };

  const handleToggleProductActive = async (p: Product) => {
    const updatedStatus = !p.active;
    await localDb.products.update(p.id, {
      active: updatedStatus,
      updated_at: new Date().toISOString(),
    });
    syncEngine.queueOperation('product_upsert', {
      id: p.id,
      active: updatedStatus,
    }).catch(console.error);
    await loadCatalogue();
  };

  const handleOpenQuickAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustMode('delta');
    setAdjustQuantity('0');
    setAdjustReason('Routine physical stocktake discrepancy');
    setIsQuickAdjustOpen(true);
  };

  const handleSaveQuickAdjust = async () => {
    if (!adjustingProduct || !user) return;
    const qty = parseFloat(adjustQuantity);
    if (isNaN(qty)) {
      alert('Please enter a valid numeric quantity.');
      return;
    }

    let delta = qty;
    if (adjustMode === 'count') {
      delta = qty - adjustingProduct.stock_on_hand;
    }

    if (delta === 0) {
      alert('Adjustment cannot result in zero change.');
      return;
    }

    const newStock = adjustingProduct.stock_on_hand + delta;
    if (newStock < 0) {
      alert(`Adjustment cannot make stock negative (Current: ${adjustingProduct.stock_on_hand}).`);
      return;
    }

    try {
      await localDb.products.update(adjustingProduct.id, {
        stock_on_hand: newStock,
        updated_at: new Date().toISOString(),
      });

      const movement: StockMovement = {
        id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        product_id: adjustingProduct.id,
        product_name: adjustingProduct.product_name,
        sku: adjustingProduct.sku,
        movement_type: adjustReason.toLowerCase().includes('damage') ? 'damage' : 'adjustment',
        quantity_delta: delta,
        unit_cost_kes: adjustingProduct.buying_price_kes,
        reason: adjustReason.trim(),
        created_by: user.user_id,
        created_by_name: user.full_name,
        created_at: new Date().toISOString(),
      };
      await localDb.stockMovements.put(movement);

      syncEngine.queueOperation('stock_adjustment', {
        product_id: adjustingProduct.id,
        quantity_delta: delta,
        movement_type: movement.movement_type,
        reason: adjustReason.trim(),
      }).catch(console.error);

      await loadCatalogue();
      setIsQuickAdjustOpen(false);
    } catch (e: any) {
      alert(`Adjustment failed: ${e.message}`);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Product Name',
      'Category',
      'Unit',
      'Selling Price (KES)',
      'Buying Price (KES)',
      'Stock On Hand',
      'Status',
    ];
    const rows = products.map((p) => [
      p.sku,
      p.barcode || '',
      `"${p.product_name.replace(/"/g, '""')}"`,
      p.category_name,
      p.unit_of_measure,
      p.selling_price_kes,
      p.buying_price_kes || 0,
      p.stock_on_hand,
      p.active ? 'Active' : 'Discontinued',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hardware_catalogue_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalogue</h1>
            <Badge variant="default">{products.length} Items</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full retail inventory specifications, selling prices, cost, and stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          {canAlterPrices ? (
            <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 font-bold">
              <Plus className="h-4 w-4" />
              <span>Add New Product</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Lock className="h-3.5 w-3.5" />
              <span>Price edits reserved for Store Owner</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU, name, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Active / Discontinued Filter */}
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('discontinued')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === 'discontinued' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Discontinued
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>

          {/* Stock Level Filter */}
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                stockFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                stockFilter === 'low' ? 'bg-amber-100 text-amber-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                stockFilter === 'out' ? 'bg-red-100 text-red-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost (KES)</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No hardware products match the current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock_on_hand > 0 && p.stock_on_hand <= p.low_stock_level;
                  const isOutOfStock = p.stock_on_hand <= 0;

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${!p.active ? 'opacity-60 bg-slate-50/40' : ''}`}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div>{p.sku}</div>
                        {p.barcode && <div className="text-[10px] text-slate-400 font-normal">{p.barcode}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.product_name}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.category_name} {p.brand && `• ${p.brand}`} {p.specification && `• ${p.specification}`}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium uppercase">{p.unit_of_measure}</td>

                      <td className="py-3 px-4 text-right font-extrabold text-amber-700">
                        {formatKES(p.selling_price_kes)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {p.buying_price_kes ? formatKES(p.buying_price_kes) : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {formatQuantity(p.stock_on_hand, p.unit_of_measure, p.allow_decimal)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {p.active ? (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-200 px-2 py-0.5 rounded-md">
                            Discontinued
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Adjust Button */}
                          {canManageInventory && (
                            <button
                              onClick={() => handleOpenQuickAdjust(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Quick stock count adjustment"
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </button>
                          )}

                          {/* Edit Details Button */}
                          {canAlterPrices && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Edit product details & prices"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Toggle Active / Discontinue Button */}
                          {canAlterPrices && (
                            <button
                              onClick={() => handleToggleProductActive(p)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                p.active
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={p.active ? 'Discontinue product' : 'Reactivate product'}
                            >
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product Details & Pricing' : 'Add New Hardware Product'}
        description="Store Owner can maintain catalogue specifications, retail price, stock location, and levels."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">SKU Code</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Product Name</label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-amber-500"
              placeholder="e.g. Simba Cement 50kg, Ordinary Nails 3 inch"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700">Category</label>
              <select
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700">Brand / Maker</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Bamburi, Crown, Duka"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Unit of Measure</label>
              <select
                value={formData.unit_of_measure}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="bag">Bags (bag)</option>
                <option value="roll">Rolls (roll)</option>
                <option value="tin">Tins (tin)</option>
                <option value="length">Lengths (length)</option>
                <option value="sheet">Sheets (sheet)</option>
                <option value="pair">Pairs (pair)</option>
                <option value="ft">Feet (ft)</option>
                <option value="m">Meters (m)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700">Selling Price (KES)</label>
              <input
                type="number"
                value={formData.selling_price_kes}
                onChange={(e) => setFormData({ ...formData, selling_price_kes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold text-amber-700 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Buying Cost (KES)</label>
              <input
                type="number"
                value={formData.buying_price_kes}
                onChange={(e) => setFormData({ ...formData, buying_price_kes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Min Selling Price (KES)</label>
              <input
                type="number"
                value={formData.minimum_selling_price_kes}
                onChange={(e) =>
                  setFormData({ ...formData, minimum_selling_price_kes: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Current Stock</label>
              <input
                type="number"
                value={formData.stock_on_hand}
                onChange={(e) => setFormData({ ...formData, stock_on_hand: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Low Stock Alert Level</label>
              <input
                type="number"
                value={formData.low_stock_level}
                onChange={(e) => setFormData({ ...formData, low_stock_level: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_decimal}
                onChange={(e) => setFormData({ ...formData, allow_decimal: e.target.checked })}
                className="rounded border-slate-300"
              />
              <span className="font-semibold text-slate-700">Allow Decimal Fractions (e.g. 2.5 kg nails or 3.2 m pipe)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-slate-300"
              />
              <span className="font-semibold text-slate-700">Product is Active for POS Sales</span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveProduct} className="font-bold">
              Save Product
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick Stock Adjustment Modal */}
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
              <div className="text-slate-500 font-bold">Current Physical Stock</div>
              <div className="font-mono text-xs text-slate-400">SKU: {adjustingProduct?.sku}</div>
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {adjustingProduct?.stock_on_hand} {adjustingProduct?.unit_of_measure}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setAdjustMode('delta')}
              className={`py-1.5 rounded-lg font-bold text-center transition-colors ${
                adjustMode === 'delta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Add / Remove (+ / -)
            </button>
            <button
              onClick={() => {
                setAdjustMode('count');
                setAdjustQuantity(adjustingProduct?.stock_on_hand.toString() || '0');
              }}
              className={`py-1.5 rounded-lg font-bold text-center transition-colors ${
                adjustMode === 'count' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              New Physical Count
            </button>
          </div>

          <div>
            <label className="font-bold text-slate-700">
              {adjustMode === 'delta' ? 'Quantity Delta (+ to increase, - to decrease)' : 'Actual Counted Quantity on Hand'}
            </label>
            <input
              type="number"
              step="any"
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none focus:border-amber-500"
              placeholder={adjustMode === 'delta' ? 'e.g. +10 or -5' : 'e.g. 45'}
            />
            {adjustMode === 'count' && adjustingProduct && (
              <div className="text-[11px] text-slate-500 mt-1">
                Calculated adjustment delta:{' '}
                <strong className={parseFloat(adjustQuantity) >= adjustingProduct.stock_on_hand ? 'text-emerald-700' : 'text-red-600'}>
                  {(parseFloat(adjustQuantity) || 0) - adjustingProduct.stock_on_hand > 0 ? '+' : ''}
                  {(parseFloat(adjustQuantity) || 0) - adjustingProduct.stock_on_hand} {adjustingProduct.unit_of_measure}
                </strong>
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700">Reason for Stock Adjustment</label>
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="Routine physical stocktake discrepancy">Routine physical stocktake discrepancy</option>
              <option value="Damaged in store or transit">Damaged in store or transit</option>
              <option value="Rust or weather exposure damage">Rust or weather exposure damage</option>
              <option value="Cement bag leakage or spillage">Cement bag leakage or spillage</option>
              <option value="Supplier delivery count correction">Supplier delivery count correction</option>
              <option value="Found unaccounted stock in store">Found unaccounted stock in store</option>
            </select>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsQuickAdjustOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveQuickAdjust} className="font-bold">
              Confirm Adjustment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}