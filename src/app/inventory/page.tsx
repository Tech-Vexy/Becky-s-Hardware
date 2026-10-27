'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { formatKES, formatQuantity, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Lock,
  CheckCircle2,
  Edit2,
  PackagePlus,
  Boxes,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { StockMovement, Product, StockMovementType, ProductCategory } from '@/lib/types/database';

export default function InventoryPage() {
  const { user, canManageInventory, canAlterPrices } = useAuth();
  const { showToast } = useNotifications();
  const isAdmin = canManageInventory || canAlterPrices || user?.role === 'admin';

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [movementFilter, setMovementFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Stock Adjustment Modal State
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [entryMode, setEntryMode] = useState<'delta' | 'count'>('count');
  const [countedStock, setCountedStock] = useState('0');
  const [adjType, setAdjType] = useState<StockMovementType>('stocktake');
  const [deltaQuantity, setDeltaQuantity] = useState<string>('0');
  const [reason, setReason] = useState('Routine physical stocktake discrepancy');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-Adjustment Catalog Update State
  const [updateCatalogDetails, setUpdateCatalogDetails] = useState(false);
  const [adjProductName, setAdjProductName] = useState('');
  const [adjSellingPrice, setAdjSellingPrice] = useState('0');
  const [adjBuyingCost, setAdjBuyingCost] = useState('0');
  const [adjLowStock, setAdjLowStock] = useState('10');
  const [adjUom, setAdjUom] = useState('pcs');

  // Direct Edit Catalog Modal State
  const [isEditCatalogOpen, setIsEditCatalogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [catalogEditForm, setCatalogEditForm] = useState({
    product_name: '',
    sku: '',
    barcode: '',
    category_name: 'Fasteners & Wire',
    selling_price_kes: 0,
    buying_price_kes: 0,
    stock_on_hand: 0,
    low_stock_level: 10,
    unit_of_measure: 'pcs',
    allow_decimal: false,
    reason: '',
  });

  // Direct Add Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    product_name: '',
    sku: '',
    barcode: '',
    category_name: 'Fasteners & Wire',
    selling_price_kes: 0,
    buying_price_kes: 0,
    stock_on_hand: 0,
    low_stock_level: 10,
    unit_of_measure: 'pcs',
    allow_decimal: false,
  });

  const loadInventory = async () => {
    // Concurrently fetch movements, products, and categories
    const [movs, prods, cats] = await Promise.all([
      localDb.stockMovements.orderBy('created_at').reverse().toArray(),
      localDb.products.where('active').equals(1).toArray(),
      localDb.categories.toArray(),
    ]);

    setMovements(movs);
    setProducts(prods);
    setCategories(cats);

    if (prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
      syncAdjFieldsWithProduct(prods[0]);
    }
  };

  const syncAdjFieldsWithProduct = (prod: Product) => {
    setCountedStock(prod.stock_on_hand.toString());
    setAdjProductName(prod.product_name);
    setAdjSellingPrice(prod.selling_price_kes.toString());
    setAdjBuyingCost((prod.buying_price_kes || 0).toString());
    setAdjLowStock((prod.low_stock_level || 10).toString());
    setAdjUom(prod.unit_of_measure || 'pcs');
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Single-pass memoized stock valuation calculations
  const { totalStockUnits, totalCostValuation, totalRetailValuation, potentialMargin } = useMemo(() => {
    let units = 0;
    let cost = 0;
    let retail = 0;

    for (const p of products) {
      units += p.stock_on_hand;
      cost += p.stock_on_hand * (p.buying_price_kes || 0);
      retail += p.stock_on_hand * p.selling_price_kes;
    }

    return {
      totalStockUnits: units,
      totalCostValuation: cost,
      totalRetailValuation: retail,
      potentialMargin: retail - cost,
    };
  }, [products]);

  const filteredMovements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return movements.filter((m) => {
      const matchType = movementFilter === 'All' || m.movement_type === movementFilter;
      const matchSearch =
        !q ||
        m.product_name?.toLowerCase().includes(q) ||
        m.sku?.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.created_by_name?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [movements, movementFilter, searchQuery]);

  const selectedProductObj = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const handleProductSelectChange = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      syncAdjFieldsWithProduct(prod);
    }
  };

  // Stock Adjustment + Optional Catalog Update in one atomic flow
  const handleStockAdjustment = async () => {
    if (!selectedProductId || !reason.trim() || !user) {
      alert('Please select a product and enter a valid business reason for the stock adjustment.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) {
      alert('Product not found.');
      return;
    }

    let delta = 0;
    if (entryMode === 'count') {
      const counted = parseFloat(countedStock);
      if (isNaN(counted) || counted < 0) {
        alert('Please enter a valid non-negative physical counted stock.');
        return;
      }
      delta = counted - prod.stock_on_hand;
    } else {
      delta = parseFloat(deltaQuantity);
      if (isNaN(delta)) {
        alert('Adjustment quantity must be a valid number.');
        return;
      }
    }

    if (delta === 0 && !updateCatalogDetails) {
      alert('Adjustment cannot result in zero stock change unless catalog details are being updated.');
      return;
    }

    if (prod.stock_on_hand + delta < 0) {
      alert(
        `Adjustment cannot reduce stock below zero. Current stock is ${prod.stock_on_hand}, requested delta is ${delta}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const newStock = prod.stock_on_hand + delta;
      const nowIso = new Date().toISOString();

      // Construct updated product payload
      const updatedProd: Product = {
        ...prod,
        stock_on_hand: newStock,
        product_name: updateCatalogDetails ? adjProductName.trim() || prod.product_name : prod.product_name,
        selling_price_kes: updateCatalogDetails ? Math.max(0, parseFloat(adjSellingPrice) || 0) : prod.selling_price_kes,
        buying_price_kes: updateCatalogDetails ? Math.max(0, parseFloat(adjBuyingCost) || 0) : prod.buying_price_kes,
        low_stock_level: updateCatalogDetails ? Math.max(0, parseFloat(adjLowStock) || 0) : prod.low_stock_level,
        unit_of_measure: updateCatalogDetails ? adjUom || prod.unit_of_measure : prod.unit_of_measure,
        updated_at: nowIso,
      };

      // 1. Update Dexie local storage
      await localDb.products.update(prod.id, updatedProd);

      // 2. If stock quantity changed, log audited stock movement
      if (delta !== 0) {
        const movementRecord: StockMovement = {
          id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          product_id: prod.id,
          product_name: updatedProd.product_name,
          sku: updatedProd.sku,
          movement_type: adjType,
          quantity_delta: delta,
          unit_cost_kes: updatedProd.buying_price_kes,
          reason: reason.trim(),
          created_by: user.user_id,
          created_by_name: user.full_name,
          created_at: nowIso,
        };
        await localDb.stockMovements.put(movementRecord);

        // Queue in syncEngine for Supabase cloud sync
        syncEngine.queueOperation('stock_adjustment', {
          product_id: prod.id,
          quantity_delta: delta,
          movement_type: adjType,
          reason: reason.trim(),
        }).catch(console.error);
      }

      // 3. Queue product upsert to sync new catalog details & stock to Supabase
      syncEngine.queueOperation('product_upsert', updatedProd).catch(console.error);

      showToast(
        'inventory',
        'Inventory Updated',
        `${updatedProd.product_name}: stock adjusted to ${newStock} ${updatedProd.unit_of_measure}${
          updateCatalogDetails ? ' (catalog details updated)' : ''
        }.`,
        '/inventory'
      );

      await loadInventory();
      setIsAdjModalOpen(false);
      setDeltaQuantity('0');
      setUpdateCatalogDetails(false);
    } catch (e: any) {
      alert(`Adjustment error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Direct Catalog Edit Modal
  const handleOpenCatalogEdit = (productOrId?: Product | string) => {
    let target: Product | undefined;
    if (typeof productOrId === 'string') {
      target = products.find((p) => p.id === productOrId);
    } else if (productOrId) {
      target = productOrId;
    } else {
      target = products.find((p) => p.id === selectedProductId) || products[0];
    }

    if (!target) return;

    setEditingProduct(target);
    setCatalogEditForm({
      product_name: target.product_name,
      sku: target.sku,
      barcode: target.barcode || '',
      category_name: target.category_name || 'Fasteners & Wire',
      selling_price_kes: target.selling_price_kes,
      buying_price_kes: target.buying_price_kes || 0,
      stock_on_hand: target.stock_on_hand,
      low_stock_level: target.low_stock_level || 10,
      unit_of_measure: target.unit_of_measure || 'pcs',
      allow_decimal: !!target.allow_decimal,
      reason: 'Catalog attribute update from inventory ledger',
    });
    setIsEditCatalogOpen(true);
  };

  // Save Direct Catalog Edit
  const handleSaveCatalogEdit = async () => {
    if (!editingProduct || !user) return;
    if (!catalogEditForm.product_name.trim()) {
      showToast('system', 'Validation Error', 'Product name is required.', '/inventory');
      return;
    }
    if (catalogEditForm.selling_price_kes < 0) {
      showToast('system', 'Validation Error', 'Selling price cannot be negative.', '/inventory');
      return;
    }

    try {
      const stockDelta = Number(catalogEditForm.stock_on_hand) - editingProduct.stock_on_hand;
      const nowIso = new Date().toISOString();

      const updatedProd: Product = {
        ...editingProduct,
        product_name: catalogEditForm.product_name.trim(),
        sku: catalogEditForm.sku.trim().toUpperCase() || editingProduct.sku,
        barcode: catalogEditForm.barcode.trim() || undefined,
        category_name: catalogEditForm.category_name,
        selling_price_kes: Number(catalogEditForm.selling_price_kes) || 0,
        buying_price_kes: Number(catalogEditForm.buying_price_kes) || 0,
        stock_on_hand: Number(catalogEditForm.stock_on_hand) || 0,
        low_stock_level: Number(catalogEditForm.low_stock_level) || 10,
        unit_of_measure: catalogEditForm.unit_of_measure || 'pcs',
        allow_decimal: catalogEditForm.allow_decimal,
        updated_at: nowIso,
      };

      // 1. Update in local Dexie database
      await localDb.products.update(editingProduct.id, updatedProd);

      // 2. If stock quantity was modified directly, record audited stock movement
      if (stockDelta !== 0) {
        const moveRecord: StockMovement = {
          id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          product_id: editingProduct.id,
          product_name: updatedProd.product_name,
          sku: updatedProd.sku,
          movement_type: 'adjustment',
          quantity_delta: stockDelta,
          unit_cost_kes: updatedProd.buying_price_kes,
          reason: catalogEditForm.reason.trim() || `Inventory ledger catalog edit by ${user.full_name}`,
          created_by: user.user_id,
          created_by_name: user.full_name,
          created_at: nowIso,
        };
        await localDb.stockMovements.put(moveRecord);

        syncEngine.queueOperation('stock_adjustment', {
          product_id: editingProduct.id,
          quantity_delta: stockDelta,
          movement_type: 'adjustment',
          reason: moveRecord.reason,
        }).catch(console.error);
      }

      // 3. Queue product upsert to Supabase
      syncEngine.queueOperation('product_upsert', updatedProd).catch(console.error);

      showToast(
        'inventory',
        'Catalog Updated',
        `${updatedProd.product_name} updated successfully.`,
        '/inventory'
      );

      await loadInventory();
      setIsEditCatalogOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      showToast('system', 'Update Failed', err.message || 'Could not update catalog item', '/inventory');
    }
  };

  // Open Direct Add Product Modal
  const handleOpenAddProduct = () => {
    setNewProductForm({
      product_name: '',
      sku: '',
      barcode: '',
      category_name: categories[0]?.name || 'Fasteners & Wire',
      selling_price_kes: 0,
      buying_price_kes: 0,
      stock_on_hand: 0,
      low_stock_level: 10,
      unit_of_measure: 'pcs',
      allow_decimal: false,
    });
    setIsAddProductOpen(true);
  };

  // Save Direct Add Product
  const handleSaveNewProduct = async () => {
    if (!user) return;
    if (!newProductForm.product_name.trim()) {
      showToast('system', 'Validation Error', 'Product name is required.', '/inventory');
      return;
    }

    try {
      const newId = `00000000-0000-0000-0001-${Date.now().toString().slice(-12)}`;
      const generatedSku =
        newProductForm.sku.trim().toUpperCase() ||
        `HW-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowIso = new Date().toISOString();

      const newProd: Product = {
        id: newId,
        product_name: newProductForm.product_name.trim(),
        sku: generatedSku,
        barcode: newProductForm.barcode.trim() || undefined,
        category_name: newProductForm.category_name,
        selling_price_kes: Number(newProductForm.selling_price_kes) || 0,
        buying_price_kes: Number(newProductForm.buying_price_kes) || 0,
        stock_on_hand: Number(newProductForm.stock_on_hand) || 0,
        stock_reserved: 0,
        low_stock_level: Number(newProductForm.low_stock_level) || 5,
        critical_stock_level: 2,
        reorder_quantity: 20,
        unit_of_measure: newProductForm.unit_of_measure || 'pcs',
        allow_decimal: newProductForm.allow_decimal,
        low_stock_alert_enabled: true,
        active: true,
        created_at: nowIso,
        updated_at: nowIso,
      };

      // 1. Put in Dexie
      await localDb.products.put(newProd);

      // 2. If initial stock > 0, record initial opening stock movement
      if (newProd.stock_on_hand > 0) {
        const initialMove: StockMovement = {
          id: `open_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          product_id: newId,
          product_name: newProd.product_name,
          sku: newProd.sku,
          movement_type: 'opening_balance',
          quantity_delta: newProd.stock_on_hand,
          unit_cost_kes: newProd.buying_price_kes,
          reason: 'Initial catalog creation from inventory ledger',
          created_by: user.user_id,
          created_by_name: user.full_name,
          created_at: nowIso,
        };
        await localDb.stockMovements.put(initialMove);
      }

      // 3. Queue cloud sync
      syncEngine.queueOperation('product_upsert', newProd).catch(console.error);

      showToast(
        'inventory',
        'Product Added',
        `${newProd.product_name} added to catalog successfully.`,
        '/inventory'
      );

      await loadInventory();
      setIsAddProductOpen(false);
    } catch (err: any) {
      showToast('system', 'Add Failed', err.message || 'Could not add product', '/inventory');
    }
  };

  const handleExportLedgerCSV = () => {
    const headers = ['Timestamp', 'SKU', 'Product Name', 'Movement Type', 'Delta Quantity', 'Unit Cost KES', 'Reason', 'Recorded By'];
    const rows = movements.map((m) => [
      m.created_at,
      m.sku || '',
      `"${(m.product_name || '').replace(/"/g, '""')}"`,
      m.movement_type,
      m.quantity_delta,
      m.unit_cost_kes || 0,
      `"${m.reason.replace(/"/g, '""')}"`,
      `"${(m.created_by_name || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stock_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoryOptions: string[] = Array.from(
    new Set([
      'Fasteners & Wire',
      'Plumbing & Drainage',
      'Electrical & Lighting',
      'Paints & Solvents',
      'Building & Masonry',
      'Roofing & Timber',
      'Hand & Power Tools',
      ...categories.map((c) => c.name),
      ...products.map((p) => p.category_name),
    ])
  ).filter((c): c is string => Boolean(c));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Ledger</h1>
            <Badge variant="default">{movements.length} Audited Logs</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable physical stocktake records, purchase deliveries, sales deductions, and real-time catalog updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportLedgerCSV} className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddProduct}
                className="flex items-center gap-1.5 text-slate-700 hover:text-amber-700"
              >
                <PackagePlus className="h-4 w-4 text-amber-600" />
                <span>+ New Item</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCatalogEdit()}
                className="flex items-center gap-1.5 text-slate-700 hover:text-amber-700"
              >
                <Edit2 className="h-4 w-4 text-amber-600" />
                <span>Edit Catalog Item</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAdjModalOpen(true)}
                className="flex items-center gap-1.5 font-bold"
              >
                <Plus className="h-4 w-4" />
                <span>Record Stock Adjustment</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stock Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Stock Units
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {Math.round(totalStockUnits).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{products.length} distinct SKUs on floor</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Inventory Cost Value
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatKES(totalCostValuation)}</div>
            <div className="text-xs text-slate-400 mt-0.5">At landed wholesale cost</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Retail Valuation
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatKES(totalRetailValuation)}</div>
            <div className="text-xs text-slate-400 mt-0.5">At shelf selling price</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Projected Gross Margin
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700">{formatKES(potentialMargin)}</div>
            <div className="text-xs text-purple-600 font-semibold mt-0.5">
              {totalRetailValuation > 0
                ? `${Math.round((potentialMargin / totalRetailValuation) * 100)}% Gross Margin`
                : '—'}
            </div>
          </div>
        </Card>
      </div>

      {/* Movement Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reason, SKU, user, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={movementFilter}
            onChange={(e) => setMovementFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Movement Types</option>
            <option value="stocktake">Stocktakes & Physical Counts</option>
            <option value="adjustment">Stock Adjustments</option>
            <option value="sale">Customer Sales</option>
            <option value="purchase_receipt">Purchase Deliveries</option>
            <option value="damage">Damage & Scrap Write-Offs</option>
            <option value="opening_balance">Opening Balance</option>
            <option value="sale_return">Sales Returns</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Item SKU & Name</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4 text-right">Quantity Delta</th>
                <th className="py-3 px-4">Reason / Audit Trail</th>
                <th className="py-3 px-4">Recorded By</th>
                {isAdmin && <th className="py-3 px-4 text-right">Catalog Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-slate-400">
                    No stock movements recorded under this filter.
                  </td>
                </tr>
              ) : (
                filteredMovements.slice(0, 100).map((m) => {
                  const isPositive = m.quantity_delta > 0;
                  const isZero = m.quantity_delta === 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {formatDate(m.created_at)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.product_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">SKU: {m.sku}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`uppercase font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                            m.movement_type === 'stocktake'
                              ? 'bg-blue-100 text-blue-800'
                              : m.movement_type === 'damage'
                              ? 'bg-red-100 text-red-800'
                              : m.movement_type === 'sale'
                              ? 'bg-amber-100 text-amber-800'
                              : m.movement_type === 'purchase_receipt'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.movement_type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold">
                        {isZero ? (
                          <span className="text-slate-400 text-xs">0</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-0.5 text-xs ${
                              isPositive ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            {isPositive ? `+${m.quantity_delta}` : m.quantity_delta}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-800 font-medium">{m.reason}</td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">{m.created_by_name || 'Staff'}</td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenCatalogEdit(m.product_id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 px-2 py-1 rounded-lg transition-colors"
                            title="Quick Edit Catalog Details for this Product"
                          >
                            <Edit2 className="h-3 w-3 text-amber-700" />
                            <span>Edit Catalog</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title="Record Inventory Stock Adjustment"
        description="Physical stocktake reconciliation, damage write-offs, count discrepancy logging, and catalog updates."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700">Select Hardware Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelectChange(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-amber-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.product_name} (Current: {p.stock_on_hand} {p.unit_of_measure})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setEntryMode('count')}
              className={`py-1.5 rounded-lg font-bold text-center transition-colors ${
                entryMode === 'count' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Physical Count Mode (Stocktake)
            </button>
            <button
              onClick={() => setEntryMode('delta')}
              className={`py-1.5 rounded-lg font-bold text-center transition-colors ${
                entryMode === 'delta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Direct Delta (+ / -)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Movement Category</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as StockMovementType)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="stocktake">Periodic Stocktake Count</option>
                <option value="adjustment">General Ledger Correction</option>
                <option value="damage">Damaged / Broken / Scrap</option>
                <option value="opening_balance">Opening Balance Entry</option>
              </select>
            </div>

            <div>
              {entryMode === 'count' ? (
                <div>
                  <label className="font-bold text-slate-700">Physical Stock Counted</label>
                  <input
                    type="number"
                    step="any"
                    value={countedStock}
                    onChange={(e) => setCountedStock(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-extrabold text-sm focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 45"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700">Quantity Delta</label>
                  <input
                    type="number"
                    step="any"
                    value={deltaQuantity}
                    onChange={(e) => setDeltaQuantity(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-extrabold text-sm focus:outline-none focus:border-amber-500"
                    placeholder="e.g. +5 or -2"
                  />
                </div>
              )}
            </div>
          </div>

          {selectedProductObj && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex justify-between items-center">
              <div>
                <span className="text-slate-400">Current Shelf Stock:</span>{' '}
                <strong className="text-slate-900">{selectedProductObj.stock_on_hand} {selectedProductObj.unit_of_measure}</strong>
              </div>
              <div>
                <span className="text-slate-400">New Resulting Stock:</span>{' '}
                <strong className="text-amber-800">
                  {entryMode === 'count'
                    ? `${countedStock} ${selectedProductObj.unit_of_measure}`
                    : `${selectedProductObj.stock_on_hand + (parseFloat(deltaQuantity) || 0)} ${selectedProductObj.unit_of_measure}`}
                </strong>
              </div>
            </div>
          )}

          {/* Admin Option: In-Adjustment Catalog Update */}
          {isAdmin && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateCatalogDetails}
                    onChange={(e) => setUpdateCatalogDetails(e.target.checked)}
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                    Also Update Product Catalog Details (Prices, Unit, Alert Level)
                  </span>
                </label>
                <span className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider">Admin</span>
              </div>

              {updateCatalogDetails && (
                <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700">Product Name</label>
                    <input
                      type="text"
                      value={adjProductName}
                      onChange={(e) => setAdjProductName(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg border border-slate-300 font-bold text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Selling Price (KES)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={adjSellingPrice}
                      onChange={(e) => setAdjSellingPrice(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg border border-slate-300 font-black text-amber-700 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Buying Cost (KES)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={adjBuyingCost}
                      onChange={(e) => setAdjBuyingCost(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Low Stock Reorder Alert Level</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={adjLowStock}
                      onChange={(e) => setAdjLowStock(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Unit of Measure</label>
                    <select
                      value={adjUom}
                      onChange={(e) => setAdjUom(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="bags">Bags (bags)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="meters">Meters (m)</option>
                      <option value="litres">Litres (L)</option>
                      <option value="boxes">Boxes (boxes)</option>
                      <option value="rolls">Rolls (rolls)</option>
                      <option value="pairs">Pairs (pairs)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700">Reason / Explanation (Required for Audit)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Physical count discrepancy found during weekly count"
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
            />
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Physical stocktake discrepancy',
                'Broken / damaged during handling',
                'Moisture / rust exposure damage',
                'Cement bag leakage or spillage',
                'Delivery count correction',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setReason(chip)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAdjModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStockAdjustment}
              isLoading={isSubmitting}
              className="font-bold"
            >
              Commit Adjustment {updateCatalogDetails ? '& Update Catalog' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Admin Direct Edit Catalog Modal */}
      <Modal
        isOpen={isEditCatalogOpen}
        onClose={() => setIsEditCatalogOpen(false)}
        title={`Admin: Update Catalog Item — ${editingProduct?.product_name || 'Select Item'}`}
        description="Update shelf prices, stock on hand, units, and inventory thresholds right from the ledger."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Product Switcher inside Edit Modal */}
          <div>
            <label className="font-bold text-slate-700">Catalog Item to Edit</label>
            <select
              value={editingProduct?.id || ''}
              onChange={(e) => handleOpenCatalogEdit(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.product_name} ({formatKES(p.selling_price_kes)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700">Product Name *</label>
              <input
                type="text"
                value={catalogEditForm.product_name}
                onChange={(e) => setCatalogEditForm({ ...catalogEditForm, product_name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Selling Price (KES) *</label>
              <input
                type="number"
                step="any"
                min="0"
                value={catalogEditForm.selling_price_kes}
                onChange={(e) =>
                  setCatalogEditForm({ ...catalogEditForm, selling_price_kes: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-black text-amber-700 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Buying Cost (KES)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={catalogEditForm.buying_price_kes}
                onChange={(e) =>
                  setCatalogEditForm({ ...catalogEditForm, buying_price_kes: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-medium text-slate-700 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Physical Stock on Hand</label>
              <input
                type="number"
                step="any"
                min="0"
                value={catalogEditForm.stock_on_hand}
                onChange={(e) =>
                  setCatalogEditForm({ ...catalogEditForm, stock_on_hand: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:outline-none focus:border-amber-500"
              />
              {editingProduct && catalogEditForm.stock_on_hand !== editingProduct.stock_on_hand && (
                <div className="text-[11px] text-amber-700 font-bold mt-1">
                  Delta: {catalogEditForm.stock_on_hand - editingProduct.stock_on_hand > 0 ? '+' : ''}
                  {catalogEditForm.stock_on_hand - editingProduct.stock_on_hand} {catalogEditForm.unit_of_measure} (will be logged in stock ledger)
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700">Low Stock Reorder Alert Level</label>
              <input
                type="number"
                step="any"
                min="0"
                value={catalogEditForm.low_stock_level}
                onChange={(e) =>
                  setCatalogEditForm({ ...catalogEditForm, low_stock_level: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Category</label>
              <select
                value={catalogEditForm.category_name}
                onChange={(e) => setCatalogEditForm({ ...catalogEditForm, category_name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">Unit of Measure</label>
              <select
                value={catalogEditForm.unit_of_measure}
                onChange={(e) => setCatalogEditForm({ ...catalogEditForm, unit_of_measure: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="bags">Bags (bags)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="meters">Meters (m)</option>
                <option value="litres">Litres (L)</option>
                <option value="boxes">Boxes (boxes)</option>
                <option value="rolls">Rolls (rolls)</option>
                <option value="pairs">Pairs (pairs)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">SKU Code</label>
              <input
                type="text"
                value={catalogEditForm.sku}
                onChange={(e) => setCatalogEditForm({ ...catalogEditForm, sku: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Barcode / EAN</label>
              <input
                type="text"
                value={catalogEditForm.barcode}
                onChange={(e) => setCatalogEditForm({ ...catalogEditForm, barcode: e.target.value })}
                placeholder="Optional scan barcode"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700">Reason / Change Note (For Audit Log)</label>
              <input
                type="text"
                value={catalogEditForm.reason}
                onChange={(e) => setCatalogEditForm({ ...catalogEditForm, reason: e.target.value })}
                placeholder="e.g. Supplier price revision, packaging specification change"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="inv_allow_decimal"
              checked={catalogEditForm.allow_decimal}
              onChange={(e) => setCatalogEditForm({ ...catalogEditForm, allow_decimal: e.target.checked })}
              className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
            />
            <label htmlFor="inv_allow_decimal" className="font-semibold text-slate-700 text-xs">
              Allow fractional decimal sales (e.g. 2.5 meters of pipe, 0.5 kg nails)
            </label>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsEditCatalogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveCatalogEdit}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Save Changes & Sync Catalog
            </Button>
          </div>
        </div>
      </Modal>

      {/* Admin Direct Quick Add Product Modal */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="Admin: Quick Add Product to Catalog"
        description="Add a new hardware item immediately to the catalog from the inventory ledger."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Bamburi Cement 50kg, Ordinary Nails 3 inch"
                value={newProductForm.product_name}
                onChange={(e) => setNewProductForm({ ...newProductForm, product_name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Selling Price (KES) *</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={newProductForm.selling_price_kes}
                onChange={(e) =>
                  setNewProductForm({ ...newProductForm, selling_price_kes: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-black text-amber-700 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Buying Cost (KES)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={newProductForm.buying_price_kes}
                onChange={(e) =>
                  setNewProductForm({ ...newProductForm, buying_price_kes: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Initial Stock on Hand</label>
              <input
                type="number"
                step="any"
                min="0"
                value={newProductForm.stock_on_hand}
                onChange={(e) =>
                  setNewProductForm({ ...newProductForm, stock_on_hand: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Low Stock Alert Level</label>
              <input
                type="number"
                step="any"
                min="0"
                value={newProductForm.low_stock_level}
                onChange={(e) =>
                  setNewProductForm({ ...newProductForm, low_stock_level: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Category</label>
              <select
                value={newProductForm.category_name}
                onChange={(e) => setNewProductForm({ ...newProductForm, category_name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">Unit of Measure</label>
              <select
                value={newProductForm.unit_of_measure}
                onChange={(e) => setNewProductForm({ ...newProductForm, unit_of_measure: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="bags">Bags (bags)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="meters">Meters (m)</option>
                <option value="litres">Litres (L)</option>
                <option value="boxes">Boxes (boxes)</option>
                <option value="rolls">Rolls (rolls)</option>
                <option value="pairs">Pairs (pairs)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">SKU Code (Auto-generated if empty)</label>
              <input
                type="text"
                placeholder="e.g. CEM-BAMB-50"
                value={newProductForm.sku}
                onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Barcode / EAN (Optional)</label>
              <input
                type="text"
                value={newProductForm.barcode}
                onChange={(e) => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                placeholder="Optional scan barcode"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="inv_new_allow_decimal"
              checked={newProductForm.allow_decimal}
              onChange={(e) => setNewProductForm({ ...newProductForm, allow_decimal: e.target.checked })}
              className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
            />
            <label htmlFor="inv_new_allow_decimal" className="font-semibold text-slate-700 text-xs">
              Allow fractional decimal sales (e.g. 2.5 meters of pipe, 0.5 kg nails)
            </label>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsAddProductOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveNewProduct}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Add Product & Sync Catalog
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
