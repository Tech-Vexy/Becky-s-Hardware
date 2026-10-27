'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { localDb, type DraftCartItem } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { formatKES, formatQuantity } from '@/lib/utils/formatters';
import { printThermalReceipt } from '@/lib/utils/receiptPrinter';
import { printTaxInvoice } from '@/lib/utils/invoicePrinter';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Coins,
  Smartphone,
  CreditCard,
  User,
  ShoppingBag,
  ArrowLeft,
  X,
  CornerDownLeft,
  Edit2,
  PackagePlus,
  Boxes,
  Receipt,
  TrendingUp,
  Tag,
  Eye,
  FileText,
  CalendarDays,
} from 'lucide-react';
import type { Product, Customer, PaymentMethod, StockMovement, Sale, Invoice, InvoiceItem } from '@/lib/types/database';

export default function POSPage() {
  const { user, role, hasRole, canAlterPrices, canManageInventory } = useAuth();
  const isAdmin = canAlterPrices || canManageInventory || role === 'admin';
  const { showToast } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cart, setCart] = useState<DraftCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');

  // Catalog Management from POS (Admin)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    product_name: '',
    sku: '',
    barcode: '',
    category_name: 'General Hardware',
    selling_price_kes: 0,
    buying_price_kes: 0,
    stock_on_hand: 0,
    low_stock_level: 5,
    unit_of_measure: 'pcs',
    allow_decimal: false,
    reason: '',
  });

  const [newProductForm, setNewProductForm] = useState({
    product_name: '',
    sku: '',
    barcode: '',
    category_name: 'General Hardware',
    selling_price_kes: 0,
    buying_price_kes: 0,
    stock_on_hand: 10,
    low_stock_level: 5,
    unit_of_measure: 'pcs',
    allow_decimal: false,
  });

  // Modals
  const [isDecimalModalOpen, setIsDecimalModalOpen] = useState(false);
  const [decimalProduct, setDecimalProduct] = useState<Product | null>(null);
  const [decimalQty, setDecimalQty] = useState<string>('1.0');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [mpesaReference, setMpesaReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Live Daily Sales Tracking inside POS
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [isDailySalesModalOpen, setIsDailySalesModalOpen] = useState(false);
  const [dailySalesFilter, setDailySalesFilter] = useState<'all' | 'cash' | 'mpesa' | 'credit'>('all');
  const [dailySalesSearch, setDailySalesSearch] = useState('');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Item Price Update Modal (Sale override or Master Catalog update)
  const [isItemPriceModalOpen, setIsItemPriceModalOpen] = useState(false);
  const [priceEditingItem, setPriceEditingItem] = useState<DraftCartItem | null>(null);
  const [newUnitPriceInput, setNewUnitPriceInput] = useState<string>('');
  const [updateCatalogPermanently, setUpdateCatalogPermanently] = useState(false);

  const loadTodaySales = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const filtered = await localDb.sales
        .where('created_at')
        .startsWith(todayStr)
        .filter((s) => s.status === 'completed')
        .toArray();
      setTodaySales(
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
    } catch (err) {
      console.warn('Failed to load today sales in POS:', err);
    }
  }, []);

  // Load products, customers, draft cart & today sales concurrently from Dexie replica
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const [prods, custs, draft, filteredSales] = await Promise.all([
          localDb.products.where('active').equals(1).toArray(),
          localDb.customers.where('active').equals(1).toArray(),
          localDb.draftCart.get('current_pos_cart').catch(() => null),
          localDb.sales
            .where('created_at')
            .startsWith(todayStr)
            .filter((s) => s.status === 'completed')
            .toArray()
            .catch(() => []),
        ]);

        if (cancelled) return;

        setProducts(prods);
        setCustomers(custs);
        if (custs.length > 0 && !selectedCustomer) {
          setSelectedCustomer(custs[0]); // default to Walk-in
        }

        // Restore any in-progress draft sale from the offline virtual ledger
        if (draft && draft.items && draft.items.length > 0) {
          setCart(draft.items);
          const restoredCustomer = draft.customer_id
            ? custs.find((c) => c.id === draft.customer_id) || null
            : null;
          if (restoredCustomer) {
            setSelectedCustomer(restoredCustomer);
          }
        }

        setTodaySales(
          (filteredSales as Sale[]).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
      } catch (err) {
        console.warn('Failed to load initial POS data:', err);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist in-progress POS draft cart to IndexedDB for offline recovery
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (cart.length === 0) {
          await localDb.draftCart.delete('current_pos_cart');
        } else {
          await localDb.draftCart.put({
            id: 'current_pos_cart',
            customer_id: selectedCustomer?.id || null,
            customer_name: selectedCustomer?.full_name || 'Walk-In Customer',
            items: cart,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Failed to persist POS draft cart:', err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [cart, selectedCustomer]);

  // Auto-focus search input on mount and handle global POS hotkeys
  useEffect(() => {
    searchInputRef.current?.focus();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // '/' or 'F2' focuses search bar unless already typing in another input
      if (
        (e.key === '/' || e.key === 'F2') &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Reset highlighted index when search query changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category_name || 'General')))],
    [products]
  );

  // Fast, intelligent few-letter multi-token matching across hardware items
  const cleanQuery = searchQuery.toLowerCase().trim();
  const searchTokens = cleanQuery.split(/\s+/).filter(Boolean);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // When searching by name or letters, search across ALL categories automatically
        const matchCat =
          searchTokens.length > 0 ||
          selectedCategory === 'All' ||
          p.category_name === selectedCategory;
        if (!matchCat) return false;

        if (searchTokens.length === 0) return true;

        const prodName = p.product_name.toLowerCase();
        const sku = p.sku.toLowerCase();
        const barcode = (p.barcode || '').toLowerCase();
        const spec = (p.specification || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();

        // Every token must match in name, sku, barcode, spec, or brand
        return searchTokens.every(
          (token) =>
            prodName.includes(token) ||
            sku.includes(token) ||
            barcode.includes(token) ||
            spec.includes(token) ||
            brand.includes(token)
        );
      })
      .sort((a, b) => {
        if (searchTokens.length === 0) return 0;

        const aName = a.product_name.toLowerCase();
        const bName = b.product_name.toLowerCase();
        const aSku = a.sku.toLowerCase();
        const bSku = b.sku.toLowerCase();

        // 1. Exact SKU or Barcode match gets top priority
        const aExactSku = aSku === cleanQuery || a.barcode === cleanQuery;
        const bExactSku = bSku === cleanQuery || b.barcode === cleanQuery;
        if (aExactSku && !bExactSku) return -1;
        if (!aExactSku && bExactSku) return 1;

        // 2. Starts with full search query gets next priority
        const aStarts = aName.startsWith(cleanQuery);
        const bStarts = bName.startsWith(cleanQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // 3. First token starts with first word
        const firstToken = searchTokens[0];
        const aFirstStarts = aName.startsWith(firstToken);
        const bFirstStarts = bName.startsWith(firstToken);
        if (aFirstStarts && !bFirstStarts) return -1;
        if (!aFirstStarts && bFirstStarts) return 1;

        // 4. In stock items preferred over out-of-stock
        const aInStock = a.stock_on_hand > 0;
        const bInStock = b.stock_on_hand > 0;
        if (aInStock && !bInStock) return -1;
        if (!aInStock && bInStock) return 1;

        return 0;
      });
  }, [products, searchTokens, selectedCategory, cleanQuery]);

  const handleProductClick = (product: Product) => {
    if (product.allow_decimal) {
      setDecimalProduct(product);
      setDecimalQty('1.0');
      setIsDecimalModalOpen(true);
      return;
    }
    addToCart(product, 1);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1200);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, Math.max(0, filteredProducts.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        const target = filteredProducts[highlightedIndex] || filteredProducts[0];
        handleProductClick(target);
        // Select input text so cashier can immediately type the next item
        searchInputRef.current?.select();
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          sku: product.sku,
          product_name: product.product_name,
          unit_of_measure: product.unit_of_measure,
          selling_price_kes: product.selling_price_kes,
          quantity: quantity,
          discount_kes: 0,
          allow_decimal: product.allow_decimal,
          stock_on_hand: product.stock_on_hand,
        },
      ];
    });
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.product_id !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product_id === productId ? { ...i, quantity: newQty } : i))
      );
    }
  };

  // Open Quick Edit for an existing catalog item
  const handleOpenProductEdit = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProduct(product);
    setEditForm({
      product_name: product.product_name,
      sku: product.sku,
      barcode: product.barcode || '',
      category_name: product.category_name || 'General Hardware',
      selling_price_kes: product.selling_price_kes,
      buying_price_kes: product.buying_price_kes || 0,
      stock_on_hand: product.stock_on_hand,
      low_stock_level: product.low_stock_level || 5,
      unit_of_measure: product.unit_of_measure || 'pcs',
      allow_decimal: product.allow_decimal || false,
      reason: 'POS quick catalog/stock update',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenProductEditById = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      handleOpenProductEdit(prod);
    }
  };

  // Open Add Product modal directly from POS
  const handleOpenAddProduct = (presetName: string = '') => {
    const generatedSku = `HW-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewProductForm({
      product_name: presetName,
      sku: generatedSku,
      barcode: '',
      category_name: selectedCategory !== 'All' ? selectedCategory : 'General Hardware',
      selling_price_kes: 0,
      buying_price_kes: 0,
      stock_on_hand: 10,
      low_stock_level: 5,
      unit_of_measure: 'pcs',
      allow_decimal: false,
    });
    setIsAddProductModalOpen(true);
  };

  // Save product catalog & stock updates from POS
  const handleSaveProductEdit = async () => {
    if (!editingProduct || !user) return;
    if (!editForm.product_name.trim()) {
      showToast('system', 'Validation Error', 'Product name cannot be empty.', '/pos');
      return;
    }
    if (editForm.selling_price_kes < 0) {
      showToast('system', 'Validation Error', 'Selling price cannot be negative.', '/pos');
      return;
    }

    try {
      const stockDelta = Number(editForm.stock_on_hand) - editingProduct.stock_on_hand;
      const updatedProduct: Product = {
        ...editingProduct,
        product_name: editForm.product_name.trim(),
        sku: editForm.sku.trim().toUpperCase(),
        barcode: editForm.barcode.trim() || undefined,
        category_name: editForm.category_name,
        selling_price_kes: Number(editForm.selling_price_kes),
        buying_price_kes: Number(editForm.buying_price_kes),
        stock_on_hand: Number(editForm.stock_on_hand),
        low_stock_level: Number(editForm.low_stock_level),
        unit_of_measure: editForm.unit_of_measure,
        allow_decimal: editForm.allow_decimal,
        updated_at: new Date().toISOString(),
      };

      // 1. Update in local Dexie database
      await localDb.products.update(editingProduct.id, updatedProduct);

      // 2. If stock quantity changed, log audited stock movement
      if (stockDelta !== 0) {
        const moveRecord: StockMovement = {
          id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          product_id: editingProduct.id,
          product_name: updatedProduct.product_name,
          sku: updatedProduct.sku,
          movement_type: 'adjustment',
          quantity_delta: stockDelta,
          unit_cost_kes: updatedProduct.buying_price_kes,
          reason: editForm.reason || `POS quick edit by ${user.full_name}`,
          created_by: user.user_id,
          created_by_name: user.full_name,
          created_at: new Date().toISOString(),
        };
        await localDb.stockMovements.put(moveRecord);

        syncEngine.queueOperation('stock_adjustment', {
          product_id: editingProduct.id,
          quantity_delta: stockDelta,
          movement_type: 'adjustment',
          reason: moveRecord.reason,
        }).catch(console.error);
      }

      // 3. Queue cloud sync for product
      syncEngine.queueOperation('product_upsert', updatedProduct).catch(console.error);

      // 4. Update cart item if currently in cart
      setCart((prev) =>
        prev.map((item) =>
          item.product_id === editingProduct.id
            ? {
                ...item,
                product_name: updatedProduct.product_name,
                selling_price_kes: updatedProduct.selling_price_kes,
                stock_on_hand: updatedProduct.stock_on_hand,
                unit_of_measure: updatedProduct.unit_of_measure,
                sku: updatedProduct.sku,
                allow_decimal: updatedProduct.allow_decimal,
              }
            : item
        )
      );

      // 5. Refresh POS product list
      const refreshed = await localDb.products.where('active').equals(1).toArray();
      setProducts(refreshed);

      showToast(
        'inventory',
        'Catalog Updated',
        `${updatedProduct.product_name} updated successfully.`,
        '/pos'
      );
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      showToast('system', 'Update Failed', err.message || 'Could not update item', '/pos');
    }
  };

  // Add new product from POS and auto-ring up into cart
  const handleSaveNewProduct = async () => {
    if (!user) return;
    if (!newProductForm.product_name.trim()) {
      showToast('system', 'Validation Error', 'Product name is required.', '/pos');
      return;
    }

    try {
      const newId = `00000000-0000-0000-0001-${Date.now().toString().slice(-12)}`;
      const generatedSku =
        newProductForm.sku.trim().toUpperCase() ||
        `HW-${Math.floor(1000 + Math.random() * 9000)}`;

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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await localDb.products.put(newProd);

      if (newProd.stock_on_hand > 0) {
        const openMove: StockMovement = {
          id: `open_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          product_id: newId,
          product_name: newProd.product_name,
          sku: newProd.sku,
          movement_type: 'opening_balance',
          quantity_delta: newProd.stock_on_hand,
          unit_cost_kes: newProd.buying_price_kes,
          reason: `Initial stock entry from POS by ${user.full_name}`,
          created_by: user.user_id,
          created_by_name: user.full_name,
          created_at: new Date().toISOString(),
        };
        await localDb.stockMovements.put(openMove);
      }

      syncEngine.queueOperation('product_upsert', newProd).catch(console.error);

      const refreshed = await localDb.products.where('active').equals(1).toArray();
      setProducts(refreshed);

      // Auto-add to cart for the customer waiting at the counter!
      addToCart(newProd, 1);

      showToast(
        'inventory',
        'Item Created & Added',
        `${newProd.product_name} created in catalog & added to cart!`,
        '/pos'
      );

      setIsAddProductModalOpen(false);
    } catch (err: any) {
      showToast('system', 'Creation Failed', err.message || 'Could not add product', '/pos');
    }
  };

  const { cartSubtotal, cartTotal, cartTax, cartTotalQty } = useMemo(() => {
    let subtotal = 0;
    let qty = 0;
    for (const item of cart) {
      subtotal += item.quantity * item.selling_price_kes;
      qty += item.quantity;
    }
    const tax = Math.round(subtotal * (16 / 116) * 100) / 100;
    return { cartSubtotal: subtotal, cartTotal: subtotal, cartTax: tax, cartTotalQty: qty };
  }, [cart]);

  // Checkout Handler
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashTendered(cartTotal.toString());
    setMpesaReference('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleFinalizeCheckout = async () => {
    if (cart.length === 0 || !user) return;
    setIsProcessing(true);

    try {
      let paidAmount = cartTotal;
      if (paymentMethod === 'cash') {
        const tendered = parseFloat(cashTendered) || 0;
        if (tendered < cartTotal) {
          showToast(
            'system',
            'Cash Shortfall',
            'Cash tendered is less than the total amount due.',
            '/pos'
          );
          setIsProcessing(false);
          return;
        }
        paidAmount = cartTotal;
      }

      if (paymentMethod === 'credit') {
        if (!selectedCustomer || selectedCustomer.customer_code === 'CUST-001') {
          showToast(
            'credit',
            'Credit Sale Restricted',
            'Credit sales require a registered on-account customer, not a cash walk-in!',
            '/pos'
          );
          setIsProcessing(false);
          return;
        }
        if (cartTotal > selectedCustomer.credit_limit_kes) {
          showToast(
            'credit',
            'Credit Limit Exceeded',
            `Customer credit limit is ${formatKES(selectedCustomer.credit_limit_kes)}.`,
            '/pos'
          );
          setIsProcessing(false);
          return;
        }
      }

      const checkoutPayload = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.full_name || 'Walk-In Customer',
        cashier_id: user.user_id,
        cashier_name: user.full_name,
        items: cart.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          sku: i.sku,
          quantity: i.quantity,
          unit_price_kes: i.selling_price_kes,
          discount_kes: 0,
        })),
        payments: [
          {
            method: paymentMethod,
            amount_kes: paidAmount,
            provider_reference: mpesaReference.trim() || undefined,
            verification_status: paymentMethod === 'mpesa' ? 'unverified' : 'verified',
            notes: paymentNotes || undefined,
          },
        ],
        notes: paymentNotes || undefined,
      };

      const result = await syncEngine.processCheckout(checkoutPayload);

      // Refresh product list stock
      const updatedProds = await localDb.products.where('active').equals(1).toArray();
      setProducts(updatedProds);

      const saleData = {
        receiptNumber: result.receipt_number,
        date: new Date().toLocaleString('en-KE'),
        customerName: selectedCustomer?.full_name || 'Walk-In Customer',
        cashierName: user.full_name,
        items: [...cart],
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartTotal,
        paymentMethod: paymentMethod,
        mpesaReference: mpesaReference,
        tendered: parseFloat(cashTendered) || cartTotal,
        change: Math.max(0, (parseFloat(cashTendered) || cartTotal) - cartTotal),
      };

      setCompletedSale(saleData);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      setCart([]); // Clear cart
      await localDb.draftCart.delete('current_pos_cart'); // Clear persisted draft
      await loadTodaySales(); // Live refresh POS daily sales tracker
    } catch (err: any) {
      showToast(
        'system',
        'Checkout Failed',
        `Checkout failed: ${err?.message || 'Unknown error'}`,
        '/pos'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!completedSale) return;
    printThermalReceipt({
      storeName: "Becky's Hardware Store",
      tagline: 'Quality Building Materials & Tools',
      address: '',
      phone: '+254 712 345 678',
      kraPin: 'P051234567X',
      receiptNumber: completedSale.receiptNumber,
      date: completedSale.date,
      cashierName: completedSale.cashierName,
      customerName: completedSale.customerName,
      items: completedSale.items.map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        unit: i.unit_of_measure,
        unitPrice: i.selling_price_kes,
        total: i.quantity * i.selling_price_kes,
      })),
      subtotal: completedSale.subtotal,
      discount: 0,
      tax: completedSale.tax,
      total: completedSale.total,
      payments: [
        {
          method: completedSale.paymentMethod,
          amount: completedSale.total,
          reference: completedSale.mpesaReference || undefined,
        },
      ],
    });
  };

  const handlePrintSaleAsInvoice = () => {
    if (!completedSale) return;
    const nowIso = new Date().toISOString();
    const d = new Date();
    d.setDate(d.getDate() + 14);

    const inv: Invoice = {
      id: `inv_${Date.now()}`,
      invoice_number: `INV-${completedSale.receiptNumber.replace('RCP-', '')}`,
      sale_receipt_number: completedSale.receiptNumber,
      customer_name: completedSale.customerName,
      customer_phone: selectedCustomer?.phone || null,
      customer_address: selectedCustomer?.address || null,
      issue_date: nowIso.slice(0, 10),
      due_date: d.toISOString().slice(0, 10),
      status: 'paid',
      subtotal_kes: completedSale.subtotal,
      tax_kes: completedSale.tax,
      total_kes: completedSale.total,
      amount_paid_kes: completedSale.total,
      balance_due_kes: 0,
      payment_terms: 'Paid on Receipt',
      created_by: user?.user_id || 'cashier',
      created_by_name: completedSale.cashierName,
      created_at: nowIso,
      items: completedSale.items.map((i: any) => ({
        product_name: i.product_name,
        sku: i.sku,
        quantity: i.quantity,
        unit_of_measure: i.unit_of_measure,
        unit_price_kes: i.selling_price_kes,
        line_total_kes: i.quantity * i.selling_price_kes,
      })),
    };

    printTaxInvoice(inv);
  };

  // Open item unit price update modal from cart
  const handleOpenItemPriceEdit = (item: DraftCartItem) => {
    setPriceEditingItem(item);
    setNewUnitPriceInput(item.selling_price_kes.toString());
    setUpdateCatalogPermanently(false);
    setIsItemPriceModalOpen(true);
  };

  // Save item unit price update
  const handleSaveItemPriceEdit = async () => {
    if (!priceEditingItem) return;
    const newPrice = parseFloat(newUnitPriceInput);
    if (isNaN(newPrice) || newPrice < 0) {
      showToast('system', 'Invalid Price', 'Please enter a valid non-negative price.', '/pos');
      return;
    }

    // 1. Update in active cart
    setCart((prev) =>
      prev.map((i) =>
        i.product_id === priceEditingItem.product_id
          ? { ...i, selling_price_kes: newPrice }
          : i
      )
    );

    // 2. If permanent catalog update requested (and admin)
    if (updateCatalogPermanently && isAdmin) {
      try {
        const existingProd = await localDb.products.get(priceEditingItem.product_id);
        if (existingProd) {
          const updatedProd: Product = {
            ...existingProd,
            selling_price_kes: newPrice,
            updated_at: new Date().toISOString(),
          };
          await localDb.products.update(existingProd.id, updatedProd);
          syncEngine.queueOperation('product_upsert', updatedProd).catch(console.error);

          setProducts((prev) =>
            prev.map((p) => (p.id === existingProd.id ? updatedProd : p))
          );

          showToast(
            'inventory',
            'Catalog Price Updated',
            `${existingProd.product_name} master price updated to ${formatKES(newPrice)} and synced.`,
            '/pos'
          );
        }
      } catch (err: any) {
        showToast('system', 'Catalog Update Failed', err.message, '/pos');
      }
    } else {
      showToast(
        'inventory',
        'Sale Price Updated',
        `${priceEditingItem.product_name} unit price set to ${formatKES(newPrice)} for this checkout.`,
        '/pos'
      );
    }

    setIsItemPriceModalOpen(false);
    setPriceEditingItem(null);
  };

  // Instant reprint for any past sale from today's log
  const handleReprintPastReceipt = (sale: Sale) => {
    printThermalReceipt({
      storeName: "Becky's Hardware Store",
      tagline: 'Quality Building Materials & Tools',
      address: '',
      phone: '+254 712 345 678',
      kraPin: 'P051234567X',
      receiptNumber: sale.receipt_number,
      date: new Date(sale.created_at).toLocaleString('en-KE'),
      cashierName: sale.cashier_name_snapshot || user?.full_name || 'Cashier',
      customerName: sale.customer_name_snapshot || 'Walk-In Customer',
      items: (sale.items || []).map((i) => ({
        name: i.product_name_snapshot,
        quantity: i.quantity,
        unit: 'pcs',
        unitPrice: i.unit_price_kes,
        discount: i.discount_kes || 0,
        total: i.line_total_kes,
      })),
      subtotal: sale.subtotal_kes,
      discount: sale.discount_kes || 0,
      tax: sale.tax_kes,
      total: sale.total_kes,
      payments: (sale.payments || []).map((p) => ({
        method: p.method,
        amount: p.amount_kes,
        reference: p.provider_reference || undefined,
      })),
    });
  };

  // Generate and print official Tax Invoice directly from POS Cart
  const handleGenerateInvoiceFromCart = async () => {
    if (cart.length === 0 || !user) return;
    try {
      const nowIso = new Date().toISOString();
      const dateStr = nowIso.slice(0, 10).replace(/-/g, '');
      const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const invoiceNumber = `INV-${dateStr}-${randCode}`;
      const invoiceId = `00000000-0000-0000-0010-${Date.now().toString().slice(-12)}`;

      const invItems: InvoiceItem[] = cart.map((i) => ({
        id: `ii_${Date.now()}_${i.product_id.slice(-6)}`,
        product_id: i.product_id,
        product_name: i.product_name,
        sku: i.sku,
        quantity: i.quantity,
        unit_of_measure: i.unit_of_measure,
        unit_price_kes: i.selling_price_kes,
        line_total_kes: i.quantity * i.selling_price_kes,
      }));

      const d = new Date();
      d.setDate(d.getDate() + 14);

      const newInvoice: Invoice = {
        id: invoiceId,
        invoice_number: invoiceNumber,
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.full_name || 'Walk-In Customer',
        customer_phone: selectedCustomer?.phone || null,
        customer_address: selectedCustomer?.address || null,
        issue_date: nowIso.slice(0, 10),
        due_date: d.toISOString().slice(0, 10),
        status: 'pending',
        subtotal_kes: cartSubtotal,
        tax_kes: cartTax,
        total_kes: cartTotal,
        amount_paid_kes: 0,
        balance_due_kes: cartTotal,
        notes: 'Generated from POS Terminal checkout',
        payment_terms: 'Net 14 Days',
        created_by: user.user_id,
        created_by_name: user.full_name,
        created_at: nowIso,
        updated_at: nowIso,
        items: invItems,
      };

      await localDb.invoices.put(newInvoice);
      syncEngine.queueOperation('invoice_upsert', newInvoice).catch(console.error);

      showToast(
        'inventory',
        'Invoice Created',
        `Tax Invoice ${invoiceNumber} created for ${newInvoice.customer_name}.`,
        '/invoices'
      );

      printTaxInvoice(newInvoice);
    } catch (err: any) {
      showToast('system', 'Invoice Error', err.message || 'Could not create invoice', '/pos');
    }
  };

  // Single-pass memoized Today's Sales Calculations
  const { todayTotalGross, todayCashTotal, todayMpesaTotal, todayCreditTotal, todayCount } = useMemo(() => {
    let gross = 0;
    let cash = 0;
    let mpesa = 0;
    let credit = 0;

    for (const s of todaySales) {
      gross += s.total_kes;
      if (s.payments) {
        for (const p of s.payments) {
          if (p.method === 'cash') cash += p.amount_kes;
          else if (p.method === 'mpesa') mpesa += p.amount_kes;
          else if (p.method === 'credit') credit += p.amount_kes;
        }
      }
    }

    return {
      todayTotalGross: gross,
      todayCashTotal: cash,
      todayMpesaTotal: mpesa,
      todayCreditTotal: credit,
      todayCount: todaySales.length,
    };
  }, [todaySales]);

  const filteredDailySales = useMemo(() => {
    const q = dailySalesSearch.toLowerCase().trim();
    return todaySales.filter((s) => {
      if (dailySalesFilter !== 'all') {
        const hasMethod = s.payments?.some((p) => p.method === dailySalesFilter);
        if (!hasMethod) return false;
      }
      if (q) {
        const rcp = s.receipt_number.toLowerCase();
        const cust = (s.customer_name_snapshot || '').toLowerCase();
        const cashier = (s.cashier_name_snapshot || '').toLowerCase();
        const mpesaRefs = (s.payments || []).map((p) => (p.provider_reference || '').toLowerCase()).join(' ');
        return rcp.includes(q) || cust.includes(q) || cashier.includes(q) || mpesaRefs.includes(q);
      }
      return true;
    });
  }, [todaySales, dailySalesFilter, dailySalesSearch]);

  return (
    <div className="flex flex-col gap-3">
      {/* POS Daily Sales Quick-Tracker Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 px-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Today&apos;s Gross Sales</div>
              <div className="font-black text-sm sm:text-base text-emerald-400">{formatKES(todayTotalGross)}</div>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400">Transactions</span>
              <div className="font-bold text-white">{todayCount} ring-ups</div>
            </div>
            <div className="text-slate-700">•</div>
            <div>
              <span className="text-[10px] text-slate-400">Cash Drawer</span>
              <div className="font-bold text-amber-400">{formatKES(todayCashTotal)}</div>
            </div>
            <div className="text-slate-700">•</div>
            <div>
              <span className="text-[10px] text-slate-400">M-Pesa Till</span>
              <div className="font-bold text-emerald-400">{formatKES(todayMpesaTotal)}</div>
            </div>
            {todayCreditTotal > 0 && (
              <>
                <div className="text-slate-700">•</div>
                <div>
                  <span className="text-[10px] text-slate-400">On Credit</span>
                  <div className="font-bold text-blue-400">{formatKES(todayCreditTotal)}</div>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDailySalesModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 shadow-2xs hover:border-slate-600 active:scale-95"
        >
          <Receipt className="h-3.5 w-3.5 text-amber-400" />
          <span>Today&apos;s Sales Log ({todayCount})</span>
        </button>
      </div>
      {/* Mobile Mode Switcher (Touch tabs) */}
      <div className="flex lg:hidden bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-2 rounded-xl text-center transition-all ${
            mobileTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Product Tiles
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'cart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <span>Current Cart</span>
          {cart.length > 0 && (
            <span className="bg-amber-600 text-white rounded-full px-1.5 py-0.5 text-[10px] font-black">
              {cartTotalQty}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[calc(100vh-12rem)] lg:h-[calc(100vh-6.5rem)]">
        {/* Left Area: Product Catalogue Search & Grid */}
        <div
          className={`flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${
            mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
          }`}
        >
        {/* Search & Barcode Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-2 bg-white">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type a few letters of product name (e.g. cem, nail, mrm, wire)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm font-medium focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-slate-50/70 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenAddProduct(searchQuery)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  title="Add new hardware item to catalog"
                >
                  <PackagePlus className="h-4 w-4" />
                  <span>+ New Item</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  const sampleBarcode = '616400000001';
                  setSearchQuery(sampleBarcode);
                  searchInputRef.current?.focus();
                }}
                className="flex items-center gap-1.5 text-xs text-slate-600"
              >
                <Barcode className="h-4 w-4 text-amber-600" />
                <span>Simulate Scan</span>
              </Button>
            </div>
          </div>

          {/* Quick Helpful Hint / Result Counter */}
          {searchTokens.length > 0 && filteredProducts.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
              <span>
                Found <strong className="text-slate-800">{filteredProducts.length}</strong> matching hardware items
              </span>
              <span className="flex items-center gap-1 text-amber-900 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                <CornerDownLeft className="h-3 w-3 text-amber-700" />
                Press Enter to add top match
              </span>
            </div>
          )}
        </div>

        {/* Category Pills (Touch friendly) */}
        <div className="flex gap-2 p-3 overflow-x-auto border-b border-slate-100 bg-slate-50/60 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Tiles Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="text-sm font-bold text-slate-800">No products matching &quot;{searchQuery}&quot;</div>
              <div className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Can&apos;t find this hardware item on shelf? Create it now and it will be saved to the catalogue and added to your cart.
              </div>
              {isAdmin && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenAddProduct(searchQuery)}
                  className="flex items-center gap-2 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  <PackagePlus className="h-4 w-4" />
                  <span>Create &quot;{searchQuery}&quot; in Catalog</span>
                </Button>
              )}
            </div>
          ) : (
            filteredProducts.map((p, idx) => {
              const isOutOfStock = p.stock_on_hand <= 0;
              const isLowStock = p.stock_on_hand > 0 && p.stock_on_hand <= p.low_stock_level;
              const isHighlighted = searchTokens.length > 0 && idx === highlightedIndex;
              const isJustAdded = p.id === justAddedId;

              return (
                <button
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  disabled={isOutOfStock}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all relative group ${
                    isOutOfStock
                      ? 'border-slate-200 bg-slate-100/70 opacity-60 cursor-not-allowed'
                      : isJustAdded
                      ? 'border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50/40 shadow-md'
                      : isHighlighted
                      ? 'border-amber-500 ring-2 ring-amber-500/80 bg-amber-50/40 shadow-md'
                      : 'border-slate-200 bg-white hover:border-amber-500 hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>{p.sku}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-500 uppercase">{p.unit_of_measure}</span>
                        {isAdmin && (
                          <span
                            role="button"
                            onClick={(e) => handleOpenProductEdit(p, e)}
                            className="p-1 rounded hover:bg-amber-100 text-slate-400 hover:text-amber-800 transition-colors"
                            title="Admin: Quick Edit Catalog Details"
                          >
                            <Edit2 className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                      {p.product_name}
                    </h4>
                    {p.specification && (
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.specification}</div>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-2">
                    <div>
                      <div className="text-[10px] text-slate-400">Stock</div>
                      <div
                        className={`text-xs font-bold ${
                          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-700'
                        }`}
                      >
                        {formatQuantity(p.stock_on_hand, p.unit_of_measure, p.allow_decimal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-amber-700">
                        {formatKES(p.selling_price_kes)}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  {isJustAdded ? (
                    <span className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                      Added ✓
                    </span>
                  ) : isHighlighted ? (
                    <span className="absolute top-2 right-2 flex items-center gap-1 bg-amber-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                      <CornerDownLeft className="h-2.5 w-2.5" /> Enter
                    </span>
                  ) : isLowStock ? (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500" title="Low stock"></span>
                  ) : isOutOfStock ? (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" title="Out of stock"></span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

        {/* Right Area: POS Cart & Checkout */}
        <div
          className={`w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${
            mobileTab === 'products' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Mobile Back Button */}
          <div className="lg:hidden p-3 border-b border-slate-100 bg-amber-50/70 flex items-center justify-between">
            <button
              onClick={() => setMobileTab('products')}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Products</span>
            </button>
            <span className="text-[11px] font-bold text-amber-800">
              {cartTotalQty} Units
            </span>
          </div>

          {/* Customer Selector */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-600" />
              Customer
            </span>
            {selectedCustomer && selectedCustomer.credit_limit_kes > 0 && (
              <Badge variant="info">
                Credit Limit: {formatKES(selectedCustomer.credit_limit_kes)}
              </Badge>
            )}
          </div>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const c = customers.find((cust) => cust.id === e.target.value);
              setSelectedCustomer(c || null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.phone || 'No phone'})
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingBag className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Cart is currently empty</p>
              <p className="text-xs text-slate-400 mt-0.5">Click any product to add to sale</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40"
              >
                <div className="flex-1 pr-2">
                  <h5 className="text-xs font-bold text-slate-900 leading-tight">{item.product_name}</h5>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenItemPriceEdit(item)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-200 transition-colors"
                      title="Update or override price for this sale or catalog"
                    >
                      <span>{formatKES(item.selling_price_kes)}</span>
                      <span className="text-[10px] text-amber-600 font-normal">/{item.unit_of_measure}</span>
                      <Tag className="h-2.5 w-2.5 text-amber-600 ml-0.5" />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenProductEditById(item.product_id)}
                        className="text-[10px] text-slate-400 hover:text-amber-800 hover:underline flex items-center gap-0.5"
                        title="Admin: Edit full catalog specs"
                      >
                        <Edit2 className="h-2.5 w-2.5" />
                        <span>specs</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button
                      onClick={() => updateCartQty(item.product_id, item.quantity - (item.allow_decimal ? 0.5 : 1))}
                      className="p-1 hover:bg-slate-100 text-slate-600"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-800 min-w-8 text-center">
                      {formatQuantity(item.quantity, item.unit_of_measure, item.allow_decimal)}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.product_id, item.quantity + (item.allow_decimal ? 0.5 : 1))}
                      className="p-1 hover:bg-slate-100 text-slate-600"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-16">
                    <div className="text-xs font-extrabold text-slate-900">
                      {formatKES(item.quantity * item.selling_price_kes)}
                    </div>
                  </div>

                  <button
                    onClick={() => updateCartQty(item.product_id, 0)}
                    className="p-1 text-slate-300 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Charge Button */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatKES(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>16% VAT (Inclusive):</span>
              <span>{formatKES(cartTax)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
              <span>Total Payable:</span>
              <span className="text-amber-700">{formatKES(cartTotal)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="flex-1 text-base font-bold shadow-md"
            >
              Charge {formatKES(cartTotal)}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleGenerateInvoiceFromCart}
              disabled={cart.length === 0}
              className="px-3 text-xs font-bold text-slate-700 hover:text-amber-700 border-slate-300"
              title="Generate Official A4 Tax Invoice for Client"
            >
              <FileText className="h-4 w-4 text-amber-600" />
              <span className="hidden sm:inline">Invoice</span>
            </Button>
          </div>
        </div>
      </div>
      </div>

      {/* Decimal Quantity Modal (for loose cement, binding wire, nails per kg, sheets per m) */}
      <Modal
        isOpen={isDecimalModalOpen}
        onClose={() => setIsDecimalModalOpen(false)}
        title={`Enter Quantity: ${decimalProduct?.product_name || ''}`}
        description={`Sold by ${decimalProduct?.unit_of_measure} (Decimal allowed)`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700">
              Quantity in {decimalProduct?.unit_of_measure}
            </label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              value={decimalQty}
              onChange={(e) => setDecimalQty(e.target.value)}
              className="w-full text-center text-2xl font-extrabold rounded-xl border border-slate-300 py-3 mt-1 focus:border-amber-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            {[0.5, 1.0, 2.5, 5.0, 10.0].map((preset) => (
              <button
                key={preset}
                onClick={() => setDecimalQty(preset.toString())}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-amber-50"
              >
                +{preset}
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDecimalModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (decimalProduct) {
                  addToCart(decimalProduct, parseFloat(decimalQty) || 1);
                  setIsDecimalModalOpen(false);
                }
              }}
            >
              Add to Sale
            </Button>
          </div>
        </div>
      </Modal>

      {/* Multi-Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Complete Payment & Receipt"
        description={`Total Amount Due: ${formatKES(cartTotal)}`}
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Coins className="h-4 w-4 text-amber-600" />
                <span>Cash Payment</span>
              </button>

              <button
                onClick={() => setPaymentMethod('mpesa')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  paymentMethod === 'mpesa'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <span>M-Pesa STK / Till</span>
              </button>

              <button
                onClick={() => setPaymentMethod('credit')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  paymentMethod === 'credit'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <User className="h-4 w-4 text-blue-600" />
                <span>Customer Credit</span>
              </button>

              <button
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span>Bank / Cheque</span>
              </button>
            </div>
          </div>

          {/* Method specific inputs */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700">Cash Received (KES)</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full text-lg font-bold rounded-xl border border-slate-300 p-2.5 mt-1 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="flex justify-between text-xs font-bold pt-1">
                <span>Change to Return:</span>
                <span className="text-emerald-700 text-sm">
                  {formatKES(Math.max(0, (parseFloat(cashTendered) || 0) - cartTotal))}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'mpesa' && (
            <div className="space-y-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs">
              <div>
                <label className="font-bold text-emerald-950">M-Pesa Transaction Code</label>
                <input
                  type="text"
                  placeholder="e.g. QHG9123456"
                  value={mpesaReference}
                  onChange={(e) => setMpesaReference(e.target.value.toUpperCase())}
                  className="w-full uppercase font-mono font-bold text-base rounded-xl border border-emerald-300 p-2.5 mt-1 bg-white focus:outline-none"
                />
                <p className="text-[11px] text-emerald-800 mt-1">
                  Note: In strict compliance, M-Pesa payments recorded while offline are flagged as unverified
                  until confirmed via automated STK or Store Owner verification.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'credit' && (
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="font-bold">Customer Credit Ledger Account:</div>
              <div>Customer: {selectedCustomer?.full_name}</div>
              <div>Available Credit: {formatKES(selectedCustomer?.credit_limit_kes)}</div>
              <div className="text-[11px] text-blue-700 pt-1">
                Sale will increase customer's outstanding balance. A monthly statement is generated automatically.
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Sale Note / Customer Ref (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Site supervisor John, or PO #1042"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs mt-1"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="md"
              onClick={handleFinalizeCheckout}
              isLoading={isProcessing}
              className="font-bold"
            >
              Confirm & Issue Receipt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Completed Sale & Thermal Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Transaction Completed"
        description="Sale successfully committed to local virtual ledger & sync queue."
        maxWidth="sm"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-1">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Receipt Number</div>
            <div className="text-lg font-mono font-bold text-slate-900">{completedSale?.receiptNumber}</div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">
              {formatKES(completedSale?.total)}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Payment:</span>
              <span className="font-bold uppercase">{completedSale?.paymentMethod}</span>
            </div>
            {completedSale?.paymentMethod === 'cash' && (
              <div className="flex justify-between">
                <span className="text-slate-500">Change Given:</span>
                <span className="font-bold text-emerald-700">{formatKES(completedSale?.change)}</span>
              </div>
            )}
            {completedSale?.mpesaReference && (
              <div className="flex justify-between">
                <span className="text-slate-500">M-Pesa Ref:</span>
                <span className="font-mono font-bold">{completedSale.mpesaReference}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handlePrintReceipt}
              className="flex-1 flex items-center justify-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Thermal Receipt
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handlePrintSaleAsInvoice}
              className="flex-1 flex items-center justify-center gap-1.5 font-bold text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100"
            >
              <FileText className="h-4 w-4 text-amber-600" />
              A4 Tax Invoice
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsReceiptModalOpen(false)}
              className="px-4"
            >
              New Sale
            </Button>
          </div>
        </div>
      </Modal>

      {/* Admin Quick-Edit Catalog Modal from POS */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Admin: Quick Edit ${editingProduct?.product_name || 'Catalog Item'}`}
        description="Update shelf selling price, stock on hand, and catalog attributes right from the POS terminal."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700">Product Name *</label>
              <input
                type="text"
                value={editForm.product_name}
                onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Selling Price (KES) *</label>
              <input
                type="number"
                step="any"
                min="0"
                value={editForm.selling_price_kes}
                onChange={(e) => setEditForm({ ...editForm, selling_price_kes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-black text-amber-700 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Buying Cost (KES)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={editForm.buying_price_kes}
                onChange={(e) => setEditForm({ ...editForm, buying_price_kes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-medium text-slate-700 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Current Stock on Hand</label>
              <input
                type="number"
                step="any"
                min="0"
                value={editForm.stock_on_hand}
                onChange={(e) => setEditForm({ ...editForm, stock_on_hand: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:outline-none focus:border-amber-500"
              />
              {editingProduct && editForm.stock_on_hand !== editingProduct.stock_on_hand && (
                <div className="text-[11px] text-amber-700 font-bold mt-1">
                  Delta: {editForm.stock_on_hand - editingProduct.stock_on_hand > 0 ? '+' : ''}
                  {editForm.stock_on_hand - editingProduct.stock_on_hand} {editForm.unit_of_measure} (will be logged in stock ledger)
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700">Low Stock Reorder Alert Level</label>
              <input
                type="number"
                step="any"
                min="0"
                value={editForm.low_stock_level}
                onChange={(e) => setEditForm({ ...editForm, low_stock_level: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Category</label>
              <select
                value={editForm.category_name}
                onChange={(e) => setEditForm({ ...editForm, category_name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                {categories.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {!categories.includes(editForm.category_name) && (
                  <option value={editForm.category_name}>{editForm.category_name}</option>
                )}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">Unit of Measure</label>
              <select
                value={editForm.unit_of_measure}
                onChange={(e) => setEditForm({ ...editForm, unit_of_measure: e.target.value })}
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
                value={editForm.sku}
                onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Barcode / EAN</label>
              <input
                type="text"
                value={editForm.barcode}
                onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                placeholder="Optional scan barcode"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="pos_allow_decimal"
              checked={editForm.allow_decimal}
              onChange={(e) => setEditForm({ ...editForm, allow_decimal: e.target.checked })}
              className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
            />
            <label htmlFor="pos_allow_decimal" className="font-semibold text-slate-700 text-xs">
              Allow fractional decimal sales (e.g. 2.5 meters of pipe, 0.5 kg nails)
            </label>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSaveProductEdit} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Save Changes & Sync
            </Button>
          </div>
        </div>
      </Modal>

      {/* Admin Add-Product Modal from POS */}
      <Modal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        title="Admin: Quick Add Product to Catalog"
        description="Add a new hardware item immediately to catalog and ring it up."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Simba Cement 50kg, Ordinary Nails 3 inch"
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
                onChange={(e) => setNewProductForm({ ...newProductForm, selling_price_kes: parseFloat(e.target.value) || 0 })}
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
                onChange={(e) => setNewProductForm({ ...newProductForm, buying_price_kes: parseFloat(e.target.value) || 0 })}
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
                onChange={(e) => setNewProductForm({ ...newProductForm, stock_on_hand: parseFloat(e.target.value) || 0 })}
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
                onChange={(e) => setNewProductForm({ ...newProductForm, low_stock_level: parseFloat(e.target.value) || 0 })}
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
                {categories.filter((c) => c !== 'All').map((c) => (
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
              <label className="font-bold text-slate-700">SKU Code (Auto-generated or custom)</label>
              <input
                type="text"
                value={newProductForm.sku}
                onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Barcode / EAN</label>
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
              id="new_allow_decimal"
              checked={newProductForm.allow_decimal}
              onChange={(e) => setNewProductForm({ ...newProductForm, allow_decimal: e.target.checked })}
              className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
            />
            <label htmlFor="new_allow_decimal" className="font-semibold text-slate-700 text-xs">
              Allow fractional decimal sales (e.g. 2.5 meters of pipe, 0.5 kg nails)
            </label>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsAddProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSaveNewProduct} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Create & Ring Up Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Item Price Override & Master Catalog Update Modal */}
      <Modal
        isOpen={isItemPriceModalOpen}
        onClose={() => setIsItemPriceModalOpen(false)}
        title={`Update Price: ${priceEditingItem?.product_name || 'Item'}`}
        description="Adjust unit price for this checkout or update the master catalog price."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Product / SKU:</div>
            <div className="font-bold text-slate-900 text-sm">{priceEditingItem?.product_name}</div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              SKU: {priceEditingItem?.sku} • Sold by: {priceEditingItem?.unit_of_measure}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Unit Selling Price (KES) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={newUnitPriceInput}
              onChange={(e) => setNewUnitPriceInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-amber-700 text-base focus:outline-none focus:border-amber-500"
              placeholder="e.g. 750"
              autoFocus
            />
            <div className="text-[11px] text-slate-400 mt-1">
              Current price: <strong className="text-slate-700">{formatKES(priceEditingItem?.selling_price_kes || 0)}</strong>
            </div>
          </div>

          {/* Admin Permanent Catalog Update Toggle */}
          {isAdmin && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateCatalogPermanently}
                  onChange={(e) => setUpdateCatalogPermanently(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-900 text-xs">
                    Update Master Catalog Price Permanently
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    If checked, this item&apos;s default shelf price in the catalog will be updated and synchronized across the store for all future sales.
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsItemPriceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveItemPriceEdit}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {updateCatalogPermanently ? 'Save & Update Catalog' : 'Apply to This Sale'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Today's Sales Tracker & Receipt Reprint Modal */}
      <Modal
        isOpen={isDailySalesModalOpen}
        onClose={() => setIsDailySalesModalOpen(false)}
        title="Today's Sales & Register Log"
        description={`Live sales tracking for today (${new Date().toLocaleDateString('en-GB')})`}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Sales</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">{formatKES(todayTotalGross)}</div>
              <div className="text-[10px] text-slate-400">{todayCount} ring-ups</div>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-700">Cash in Register</span>
              <div className="text-lg font-black text-amber-900 mt-0.5">{formatKES(todayCashTotal)}</div>
              <div className="text-[10px] text-amber-700">Drawer cash</div>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700">M-Pesa Till</span>
              <div className="text-lg font-black text-emerald-900 mt-0.5">{formatKES(todayMpesaTotal)}</div>
              <div className="text-[10px] text-emerald-700">Digital collections</div>
            </div>
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-700">Credit / Account</span>
              <div className="text-lg font-black text-blue-900 mt-0.5">{formatKES(todayCreditTotal)}</div>
              <div className="text-[10px] text-blue-700">On account</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt, customer, ref..."
                value={dailySalesSearch}
                onChange={(e) => setDailySalesSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              {(['all', 'cash', 'mpesa', 'credit'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setDailySalesFilter(method)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    dailySalesFilter === method ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Sales List Table */}
          <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Time & Receipt</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDailySales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No sales recorded for today yet.
                    </td>
                  </tr>
                ) : (
                  filteredDailySales.map((s) => {
                    const isSelected = selectedSaleDetail?.id === s.id;
                    const payMethods = (s.payments || []).map((p) => p.method).join(', ');
                    const timeStr = new Date(s.created_at).toLocaleTimeString('en-KE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <React.Fragment key={s.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3">
                            <div className="font-mono text-[11px] font-bold text-slate-900">{s.receipt_number}</div>
                            <div className="text-[10px] text-slate-400">{timeStr}</div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-800">{s.customer_name_snapshot || 'Walk-In'}</div>
                            <div className="text-[10px] text-slate-400">{(s.items || []).length} items</div>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`uppercase font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                              payMethods.includes('mpesa')
                                ? 'bg-emerald-100 text-emerald-800'
                                : payMethods.includes('cash')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {payMethods || 'cash'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            {formatKES(s.total_kes)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedSaleDetail(isSelected ? null : s)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                                title="View items"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReprintPastReceipt(s)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200 transition-colors"
                                title="Reprint Receipt"
                              >
                                <Printer className="h-3 w-3" />
                                <span>Reprint</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Item Details */}
                        {isSelected && (
                          <tr className="bg-amber-50/30">
                            <td colSpan={5} className="p-3 pl-6 border-b border-amber-100">
                              <div className="text-[11px] font-bold text-slate-700 mb-1.5">Items Purchased:</div>
                              <div className="space-y-1">
                                {(s.items || []).map((it, idx) => (
                                  <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                                    <span>
                                      {it.quantity} x {it.product_name_snapshot} ({formatKES(it.unit_price_kes)})
                                    </span>
                                    <span className="font-bold text-slate-900">{formatKES(it.line_total_kes)}</span>
                                  </div>
                                ))}
                              </div>
                              {s.payments && s.payments.length > 0 && (
                                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex justify-between text-[10px] text-slate-500">
                                  <span>Payment Reference:</span>
                                  <span className="font-mono font-bold text-slate-700">
                                    {s.payments.map((p) => `${p.method.toUpperCase()} ${p.provider_reference || ''}`).join(', ')}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDailySalesModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
