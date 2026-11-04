import { localDb, type OfflineReceiptRecord } from '@/lib/dexie/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { roundMoney, vatFromInclusiveTotal } from '@/lib/utils/money';
import type {
  SyncQueueItem,
  SyncOperationType,
  Sale,
  StockMovement,
  Payment,
  SaleItem,
  Product,
} from '@/lib/types/database';

export interface SyncEngineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;
}

type StatusListener = (status: SyncEngineStatus) => void;

class SyncEngine {
  private isSyncing = false;
  private listeners: Set<StatusListener> = new Set();
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;
  private pendingCount = 0;
  private isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
  private pollIntervalId: any = null;
  private syncDebounceTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));

      // Fast auto-refresh polling every 15 seconds when online
      this.startPolling(15000);

      // Trigger instant background sync when user refocuses the tab / window
      window.addEventListener('focus', () => {
        this.triggerImmediateSync('window_focus');
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.triggerImmediateSync('tab_visible');
        }
      });
    }
  }

  /**
   * Starts active polling interval for background cloud updates.
   */
  public startPolling(intervalMs: number = 15000): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
    this.pollIntervalId = setInterval(() => {
      // Pause polling if the tab is hidden to conserve device bandwidth/battery
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (this.isOnline && !this.isSyncing) {
        this.syncAll().catch((err) => console.warn('[SyncEngine] Background poll failed:', err));
      }
    }, intervalMs);
  }

  /**
   * Halts active polling.
   */
  public stopPolling(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  /**
   * Debounced sync trigger to prevent duplicate requests when multiple focus/online events occur.
   */
  public triggerImmediateSync(reason?: string): void {
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
    }
    this.syncDebounceTimeout = setTimeout(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncAll().catch((err) => console.warn(`[SyncEngine] Sync on ${reason} deferred:`, err));
      }
    }, 250);
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    void this.refreshPendingCount().then(() => this.emit());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  private async refreshPendingCount(): Promise<void> {
    this.pendingCount = await this.getPendingCount();
  }

  private notify() {
    // Refresh the queue depth before broadcasting so subscribers (navbar,
    // sync center) never receive a stale count.
    void this.refreshPendingCount().finally(() => this.emit());
  }

  public getStatus(): SyncEngineStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
    };
  }

  public async getPendingCount(): Promise<number> {
    try {
      return await localDb.syncQueue.where('status').equals('pending').count();
    } catch {
      return 0;
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notify();
    if (online) {
      console.log('Network reconnected. Initiating full sync...');
      this.triggerImmediateSync('network_reconnected');
    }
  }

  /**
   * Performs an offline-capable checkout.
   * 1. Validates local stock in Dexie.
   * 2. Atomically records sale & stock movements locally.
   * 3. Queues transaction with unique idempotency key for cloud sync.
   * 4. If online, triggers immediate background sync.
   */
  public async processCheckout(payload: {
    customer_id?: string | null;
    customer_name?: string | null;
    cashier_id: string;
    cashier_name: string;
    items: Array<{
      product_id: string;
      product_name: string;
      sku: string;
      quantity: number;
      unit_price_kes: number;
      discount_kes: number;
    }>;
    payments: Array<{
      method: any;
      amount_kes: number;
      provider_reference?: string;
      verification_status?: any;
      notes?: string;
    }>;
    notes?: string;
  }): Promise<{ success: boolean; receipt_number: string; sale_id: string; offline_queued: boolean }> {
    const clientId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const idempotencyKey = `idemp_${clientId}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const receiptNumber = `RCP-${dateStr}-${randCode}`;
    const saleId = `00000000-0000-0000-0006-${Date.now().toString().slice(-12)}`;
    const sanitizedCustomerId =
      payload.customer_id && typeof payload.customer_id === 'string' && payload.customer_id.trim()
        ? payload.customer_id.trim()
        : null;

    // 1. Calculate totals (all money rounded to 2dp)
    let subtotal = 0;
    let totalDiscount = 0;
    const saleItems: SaleItem[] = [];

    for (const item of payload.items) {
      const lineDiscount = item.discount_kes || 0;
      const lineTotal = Math.max(
        0,
        roundMoney(item.quantity * item.unit_price_kes - lineDiscount)
      );
      subtotal += item.quantity * item.unit_price_kes;
      totalDiscount += lineDiscount;

      saleItems.push({
        id: `00000000-0000-0000-0007-${Math.random().toString().slice(2, 14)}`,
        sale_id: saleId,
        product_id: item.product_id,
        product_name_snapshot: item.product_name,
        sku_snapshot: item.sku,
        quantity: item.quantity,
        unit_price_kes: item.unit_price_kes,
        discount_kes: lineDiscount,
        line_total_kes: lineTotal,
      });
    }

    subtotal = roundMoney(subtotal);
    totalDiscount = roundMoney(totalDiscount);
    const totalKes = roundMoney(Math.max(0, subtotal - totalDiscount));
    const taxKes = vatFromInclusiveTotal(totalKes); // 16% VAT standard in Kenya
    let totalPaid = 0;

    const payments: Payment[] = payload.payments.map((p) => {
      const amount = roundMoney(p.amount_kes);
      totalPaid += amount;
      return {
        id: `00000000-0000-0000-0008-${Math.random().toString().slice(2, 14)}`,
        sale_id: saleId,
        method: p.method,
        amount_kes: amount,
        provider_reference: p.provider_reference || null,
        // Offline M-Pesa is NEVER marked verified without trusted verification
        verification_status:
          p.method === 'mpesa'
            ? 'unverified'
            : p.verification_status || 'verified',
        received_by: payload.cashier_id,
        received_at: new Date().toISOString(),
        notes: p.notes || null,
      };
    });

    // 2. Perform atomic local transaction in Dexie
    await localDb.transaction(
      'rw',
      [
        localDb.storeSettings,
        localDb.products,
        localDb.sales,
        localDb.stockMovements,
        localDb.offlineReceipts,
        localDb.syncQueue,
      ],
      async () => {
      const settings = await localDb.storeSettings.get(
        '00000000-0000-0000-0000-000000000001'
      );
      const allowNegativeStock = settings?.allow_negative_stock ?? false;

      // Items queued for the cloud. The server re-prices from the catalogue,
      // so negotiated POS prices are transmitted as an explicit line discount
      // rather than a trusted unit price.
      const queuedItems: Array<{
        product_id: string;
        quantity: number;
        discount_kes: number;
      }> = [];

      // Deduct stock and log movements in local virtual store
      for (const item of payload.items) {
        const prod = await localDb.products.get(item.product_id);
        if (!prod) {
          throw new Error(
            `Product ${item.sku || item.product_id} is no longer in the local catalogue.`
          );
        }

        if (!allowNegativeStock && prod.stock_on_hand < item.quantity) {
          throw new Error(
            `Insufficient stock for ${prod.product_name}. Available: ${prod.stock_on_hand}, requested: ${item.quantity}.`
          );
        }

        const newStock = roundMoney(prod.stock_on_hand - item.quantity);
        await localDb.products.update(item.product_id, {
          stock_on_hand: newStock,
          updated_at: new Date().toISOString(),
        });

        const masterPrice = Number(prod.selling_price_kes) || 0;
        const negotiatedDiscount = roundMoney(
          Math.max(0, masterPrice - item.unit_price_kes) * item.quantity
        );
        queuedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          discount_kes: roundMoney(negotiatedDiscount + (item.discount_kes || 0)),
        });

        const mov: StockMovement = {
          id: `mov_${Date.now()}_${item.product_id.slice(-6)}`,
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku,
          movement_type: 'sale',
          quantity_delta: -item.quantity,
          unit_cost_kes: prod.buying_price_kes,
          reason: `Sale checkout ${receiptNumber}`,
          created_by: payload.cashier_id,
          created_by_name: payload.cashier_name,
          created_at: new Date().toISOString(),
        };
        await localDb.stockMovements.put(mov);
      }

      // Save sale locally
      const saleRecord: Sale = {
        id: saleId,
        receipt_number: receiptNumber,
        customer_id: sanitizedCustomerId,
        customer_name_snapshot: payload.customer_name,
        cashier_id: payload.cashier_id,
        cashier_name_snapshot: payload.cashier_name,
        status: 'completed',
        subtotal_kes: subtotal,
        discount_kes: totalDiscount,
        tax_kes: taxKes,
        total_kes: totalKes,
        amount_paid_kes: roundMoney(totalPaid),
        offline_id: clientId,
        idempotency_key: idempotencyKey,
        is_offline_sync: !this.isOnline,
        notes: payload.notes,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        items: saleItems,
        payments: payments,
      };
      await localDb.sales.put(saleRecord);

      // Save receipt record for instant local printing
      const receiptRecord: OfflineReceiptRecord = {
        receipt_number: receiptNumber,
        sale_id: saleId,
        customer_name: payload.customer_name || 'Walk-In Customer',
        total_kes: totalKes,
        amount_paid_kes: roundMoney(totalPaid),
        payment_method: payload.payments.map((p) => p.method).join(', '),
        provider_reference: payload.payments.find((p) => p.provider_reference)?.provider_reference,
        items_count: payload.items.length,
        cashier_name: payload.cashier_name,
        created_at: new Date().toISOString(),
        // Flipped to 'synced' only after the server acknowledges the sale.
        sync_status: 'queued',
      };
      await localDb.offlineReceipts.put(receiptRecord);

      // Queue for cloud synchronization
      const queueItem: SyncQueueItem = {
        client_id: clientId,
        idempotency_key: idempotencyKey,
        operation_type: 'checkout',
        payload: {
          offline_id: clientId,
          idempotency_key: idempotencyKey,
          receipt_number: receiptNumber,
          customer_id: sanitizedCustomerId,
          // Item-level discounts below already cover negotiated prices and
          // explicit line discounts; a header discount would double-count.
          discount_kes: 0,
          is_offline_sync: !this.isOnline,
          notes: payload.notes,
          items: queuedItems,
          payments: payload.payments.map((p) => ({
            method: p.method,
            amount_kes: roundMoney(p.amount_kes),
            provider_reference: p.provider_reference,
            verification_status: p.method === 'mpesa' ? 'unverified' : 'verified',
            notes: p.notes,
          })),
        },
        status: 'pending',
        retry_count: 0,
        created_at: new Date().toISOString(),
      };
      await localDb.syncQueue.put(queueItem);
    });

    this.notify();

    // Trigger immediate background sync if online
    if (this.isOnline) {
      this.syncPendingQueue().catch((err) => {
        console.warn('Background sync deferred:', err);
      });
    }

    return {
      success: true,
      receipt_number: receiptNumber,
      sale_id: saleId,
      offline_queued: !this.isOnline,
    };
  }

  /**
   * Queue any generic operation (e.g. stock adjustment, repayment, receiving)
   */
  public async queueOperation(
    operationType: SyncOperationType,
    payload: any
  ): Promise<{ success: boolean; idempotency_key: string }> {
    const clientId = `${operationType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = `idemp_${clientId}`;

    const queueItem: SyncQueueItem = {
      client_id: clientId,
      idempotency_key: idempotencyKey,
      operation_type: operationType,
      payload: { ...payload, idempotency_key: idempotencyKey },
      status: 'pending',
      retry_count: 0,
      created_at: new Date().toISOString(),
    };

    await localDb.syncQueue.put(queueItem);
    this.notify();

    if (this.isOnline) {
      this.syncPendingQueue().catch(console.error);
    }

    return { success: true, idempotency_key: idempotencyKey };
  }

  /**
   * Synchronizes all pending operations to Supabase using trusted RPCs
   */
  public async syncPendingQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    this.isSyncing = true;
    this.notify();

    try {
      return await this.executePushQueue();
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  /**
   * Internal worker executing pending mutation queue without lock contention.
   */
  private async executePushQueue(): Promise<{ synced: number; failed: number }> {
    let syncedCount = 0;
    let failedCount = 0;

    try {
      const pendingItems = await localDb.syncQueue
        .where('status')
        .equals('pending')
        .toArray();

      if (pendingItems.length === 0) {
        return { synced: 0, failed: 0 };
      }

      console.log(`Syncing ${pendingItems.length} queued operations to Cloud Supabase...`);

      for (const item of pendingItems) {
        try {
          if (isSupabaseConfigured()) {
            let syncError: any = null;

            if (item.operation_type === 'product_upsert') {
              const { error } = await supabase.from('products').upsert(item.payload);
              syncError = error;
            } else if (item.operation_type === 'profile_upsert') {
              const { error } = await supabase.from('profiles').upsert(item.payload);
              syncError = error;
            } else if (item.operation_type === 'invoice_upsert') {
              try {
                const { error } = await supabase.from('invoices').upsert(item.payload);
                syncError = error;
              } catch (e) {
                console.warn('Cloud invoice sync fallback:', e);
              }
            } else if (item.operation_type === 'customer_upsert') {
              const { error } = await supabase.from('customers').upsert(item.payload);
              syncError = error;
            } else if (item.operation_type === 'supplier_upsert') {
              const { error } = await supabase.from('suppliers').upsert(item.payload);
              syncError = error;
            } else if (item.operation_type === 'expense_upsert') {
              const { error } = await supabase.from('expenses').upsert(item.payload);
              syncError = error;
            } else if (item.operation_type === 'purchase_upsert') {
              const { error } = await supabase.from('purchases').upsert(item.payload);
              syncError = error;
            } else if (item.operation_type === 'settings_upsert') {
              const { error } = await supabase.from('store_settings').upsert(item.payload);
              syncError = error;
            } else if (item.operation_type === 'payment_verification') {
              const { error } = await supabase.rpc('rpc_verify_payment', {
                p_payment_id: item.payload.payment_id,
                p_status: item.payload.status,
                p_notes: item.payload.notes || null,
              });
              syncError = error;
            } else if (item.operation_type === 'checkout') {
              const { data, error } = await supabase.rpc('rpc_checkout', { payload: item.payload });
              syncError = error;
              if (!error && data?.sale_id) {
                await localDb.offlineReceipts
                  .where('receipt_number')
                  .equals(item.payload.receipt_number)
                  .modify({ sync_status: 'synced', sale_id: data.sale_id });
              }
            } else {
              let rpcName = '';
              switch (item.operation_type) {
                case 'receive_purchase':
                  rpcName = 'rpc_receive_purchase';
                  break;
                case 'repayment':
                  rpcName = 'rpc_record_repayment';
                  break;
                case 'stock_adjustment':
                  rpcName = 'rpc_record_stock_adjustment';
                  break;
                case 'return':
                  rpcName = 'rpc_process_return';
                  break;
                default:
                  console.warn(`Unsupported sync operation type: ${item.operation_type}`);
                  break;
              }

              if (rpcName) {
                const { error } = await supabase.rpc(rpcName, { payload: item.payload });
                syncError = error;
              }
            }

            if (syncError) {
              console.error(`Sync RPC error on ${item.idempotency_key}:`, syncError);

              // Check for duplicate sales by receipt number
              if (item.operation_type === 'checkout' && (syncError.message?.includes('duplicate') || syncError.code === '23505')) {
                await localDb.syncQueue.update(item.id!, {
                  status: 'conflict',
                  last_error: syncError.message,
                  conflict_data: {
                    local_version: item.payload,
                    remote_version: null,
                    conflict_type: 'duplicate',
                  },
                  retry_count: item.retry_count + 1,
                });
                failedCount++;
                continue;
              }

              if (item.retry_count >= 5) {
                await localDb.syncQueue.update(item.id!, {
                  status: 'failed',
                  last_error: syncError.message,
                  retry_count: item.retry_count + 1,
                });
              } else {
                await localDb.syncQueue.update(item.id!, {
                  last_error: syncError.message,
                  retry_count: item.retry_count + 1,
                });
              }
              failedCount++;
              continue;
            }
          }

          // Mark as synced locally
          await localDb.syncQueue.update(item.id!, {
            status: 'synced',
            synced_at: new Date().toISOString(),
          });

          syncedCount++;
        } catch (itemErr: any) {
          console.error(`Error syncing item ${item.idempotency_key}:`, itemErr);
          await localDb.syncQueue.update(item.id!, {
            last_error: itemErr.message || 'Unknown network error',
            retry_count: item.retry_count + 1,
          });
          failedCount++;
        }
      }

      this.lastSyncTime = new Date().toISOString();
      this.lastError = failedCount > 0 ? `${failedCount} items failed during sync` : null;
    } catch (globalErr: any) {
      console.error('Fatal error in executePushQueue:', globalErr);
      this.lastError = globalErr.message;
    }

    return { synced: syncedCount, failed: failedCount };
  }

  /**
   * Pulls the latest database records from Cloud Supabase into the local IndexedDB virtual store.
   */
  public async pullRemoteData(): Promise<{ pulled: number; errors: string[] }> {
    if (!isSupabaseConfigured() || !this.isOnline) {
      return { pulled: 0, errors: ['Supabase not configured or client offline'] };
    }

    let pulledCount = 0;
    const errors: string[] = [];

    try {
      // 1. Pull Categories
      try {
        const { data: remoteCats, error: catErr } = await supabase
          .from('product_categories')
          .select('*')
          .eq('active', true);

        if (!catErr && remoteCats && remoteCats.length > 0) {
          for (const c of remoteCats) {
            await localDb.categories.put({
              id: c.id,
              name: c.name,
              description: c.description || undefined,
              active: c.active,
            });
            pulledCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Categories pull: ${err.message}`);
      }

      // 2. Pull Products
      try {
        const { data: remoteProds, error: prodErr } = await supabase
          .from('products')
          .select('*, product_categories(name)')
          .eq('active', true);

        if (!prodErr && remoteProds && remoteProds.length > 0) {
          for (const p of remoteProds) {
            const catName = p.product_categories?.name || p.category_name || 'General Hardware';
            const localProduct: Product = {
              id: p.id,
              sku: p.sku,
              barcode: p.barcode || undefined,
              product_name: p.product_name,
              category_name: catName,
              brand: p.brand || undefined,
              size_or_pack: p.size_or_pack || undefined,
              colour: p.colour || undefined,
              specification: p.specification || undefined,
              unit_of_measure: p.unit_of_measure || 'pcs',
              selling_price_kes: Number(p.selling_price_kes) || 0,
              buying_price_kes: Number(p.buying_price_kes) || 0,
              minimum_selling_price_kes: Number(p.minimum_selling_price_kes) || 0,
              stock_on_hand: Number(p.stock_on_hand) || 0,
              stock_reserved: Number(p.stock_reserved) || 0,
              low_stock_level: Number(p.low_stock_level) || 5,
              critical_stock_level: Number(p.critical_stock_level) || 2,
              reorder_quantity: Number(p.reorder_quantity) || 15,
              allow_decimal: Boolean(p.allow_decimal),
              low_stock_alert_enabled: Boolean(p.low_stock_alert_enabled ?? true),
              active: Boolean(p.active),
              stock_location: p.stock_location || 'SHOP',
              notes: p.notes || undefined,
              created_at: p.created_at,
              updated_at: p.updated_at,
            };
            await localDb.products.put(localProduct);
            pulledCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Products pull: ${err.message}`);
      }

      // 3. Pull Customers
      try {
        const { data: remoteCusts, error: custErr } = await supabase
          .from('customers')
          .select('*')
          .eq('active', true);

        if (!custErr && remoteCusts && remoteCusts.length > 0) {
          for (const c of remoteCusts) {
            await localDb.customers.put({
              id: c.id,
              customer_code: c.customer_code,
              full_name: c.full_name,
              phone: c.phone || '',
              email: c.email || '',
              address: c.address || '',
              credit_limit_kes: Number(c.credit_limit_kes) || 0,
              active: c.active,
              created_at: c.created_at,
              updated_at: c.updated_at,
            });
            pulledCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Customers pull: ${err.message}`);
      }

      // 4. Pull Suppliers
      try {
        const { data: remoteSups, error: supErr } = await supabase
          .from('suppliers')
          .select('*')
          .eq('active', true);

        if (!supErr && remoteSups && remoteSups.length > 0) {
          for (const s of remoteSups) {
            await localDb.suppliers.put({
              id: s.id,
              supplier_code: s.supplier_code,
              name: s.name,
              phone: s.phone || '',
              email: s.email || '',
              address: s.address || '',
              tax_pin: s.tax_pin || '',
              active: s.active,
              created_at: s.created_at,
              updated_at: s.updated_at,
            });
            pulledCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Suppliers pull: ${err.message}`);
      }

      // 5. Pull Invoices
      try {
        const { data: remoteInvs, error: invErr } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!invErr && remoteInvs && remoteInvs.length > 0) {
          for (const inv of remoteInvs) {
            await localDb.invoices.put({
              id: inv.id,
              invoice_number: inv.invoice_number,
              sale_id: inv.sale_id,
              sale_receipt_number: inv.sale_receipt_number,
              customer_id: inv.customer_id,
              customer_name: inv.customer_name,
              customer_phone: inv.customer_phone,
              customer_kra_pin: inv.customer_kra_pin,
              customer_address: inv.customer_address,
              issue_date: inv.issue_date,
              due_date: inv.due_date,
              status: inv.status,
              subtotal_kes: Number(inv.subtotal_kes) || 0,
              tax_kes: Number(inv.tax_kes) || 0,
              total_kes: Number(inv.total_kes) || 0,
              amount_paid_kes: Number(inv.amount_paid_kes) || 0,
              balance_due_kes: Number(inv.balance_due_kes) || 0,
              notes: inv.notes,
              payment_terms: inv.payment_terms,
              items: inv.items || [],
              created_by: inv.created_by,
              created_by_name: inv.created_by_name,
              created_at: inv.created_at,
              updated_at: inv.updated_at,
            });
            pulledCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Invoices pull: ${err.message}`);
      }

      // 6. Pull Sales with Line Items and Payments (Enables cross-browser sync!)
      try {
        const { data: remoteSales, error: salesErr } = await supabase
          .from('sales')
          .select('*, sale_items(*), payments(*)')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!salesErr && remoteSales && remoteSales.length > 0) {
          for (const s of remoteSales) {
            // Deduplicate if local sale was saved under temporary client UUID
            const existingByReceipt = await localDb.sales
              .where('receipt_number')
              .equals(s.receipt_number)
              .first();

            if (existingByReceipt && existingByReceipt.id !== s.id) {
              await localDb.sales.delete(existingByReceipt.id);
            }

            const localSale: Sale = {
              id: s.id,
              receipt_number: s.receipt_number,
              customer_id: s.customer_id,
              customer_name_snapshot: s.customer_name_snapshot,
              cashier_id: s.cashier_id,
              cashier_name_snapshot: s.cashier_name_snapshot,
              status: s.status,
              subtotal_kes: Number(s.subtotal_kes) || 0,
              discount_kes: Number(s.discount_kes) || 0,
              tax_kes: Number(s.tax_kes) || 0,
              total_kes: Number(s.total_kes) || 0,
              amount_paid_kes: Number(s.amount_paid_kes) || 0,
              offline_id: s.offline_id,
              idempotency_key: s.idempotency_key,
              is_offline_sync: Boolean(s.is_offline_sync),
              notes: s.notes,
              completed_at: s.completed_at,
              created_at: s.created_at,
              updated_at: s.updated_at,
              items: (s.sale_items || []).map((si: any) => ({
                id: si.id,
                sale_id: si.sale_id,
                product_id: si.product_id,
                product_name_snapshot: si.product_name_snapshot,
                sku_snapshot: si.sku_snapshot,
                quantity: Number(si.quantity) || 0,
                unit_price_kes: Number(si.unit_price_kes) || 0,
                discount_kes: Number(si.discount_kes) || 0,
                line_total_kes: Number(si.line_total_kes) || 0,
              })),
              payments: (s.payments || []).map((p: any) => ({
                id: p.id,
                sale_id: p.sale_id,
                method: p.method,
                amount_kes: Number(p.amount_kes) || 0,
                provider_reference: p.provider_reference,
                received_by: p.received_by,
                received_at: p.received_at || p.created_at,
                verification_status: p.verification_status,
                verified_by: p.verified_by,
                verified_at: p.verified_at,
                notes: p.notes,
              })),
            };

            await localDb.sales.put(localSale);

            // Maintain offline receipts ledger for reprinting in all browsers
            const receiptRecord: OfflineReceiptRecord = {
              receipt_number: localSale.receipt_number,
              sale_id: localSale.id,
              customer_name: localSale.customer_name_snapshot || 'Walk-In Customer',
              total_kes: localSale.total_kes,
              amount_paid_kes: localSale.amount_paid_kes,
              payment_method: (localSale.payments || []).map((p) => p.method).join(', ') || 'cash',
              provider_reference: (localSale.payments || []).find((p) => p.provider_reference)?.provider_reference || undefined,
              items_count: localSale.items?.length || 0,
              cashier_name: localSale.cashier_name_snapshot || 'Staff',
              created_at: localSale.created_at,
              sync_status: 'synced',
            };
            await localDb.offlineReceipts.put(receiptRecord);
            pulledCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Sales pull: ${err.message}`);
      }

      // 7. Pull Customer Credit Repayments
      try {
        const { data: remoteRepays, error: repayErr } = await supabase
          .from('customer_repayments')
          .select('*')
          .order('received_at', { ascending: false })
          .limit(200);

        if (!repayErr && remoteRepays && remoteRepays.length > 0) {
          for (const r of remoteRepays) {
            await localDb.customerRepayments.put({
              id: r.id,
              customer_id: r.customer_id,
              customer_name: r.customer_name || undefined,
              receipt_number: r.receipt_number,
              amount_kes: Number(r.amount_kes) || 0,
              method: r.method,
              provider_reference: r.provider_reference || r.reference || null,
              notes: r.notes || null,
              received_by: r.received_by,
              received_at: r.received_at,
            });
            pulledCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Repayments pull: ${err.message}`);
      }

      // 8. Pull Purchases & Stock Orders
      try {
        const { data: remotePurchases, error: purchErr } = await supabase
          .from('purchases')
          .select('*, purchase_items(*)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!purchErr && remotePurchases && remotePurchases.length > 0) {
          for (const pu of remotePurchases) {
            const subtotal = Number(pu.subtotal_kes) || Number(pu.total_kes) || 0;
            const tax = Number(pu.tax_kes) || 0;
            const total = Number(pu.total_kes) || subtotal;
            await localDb.purchases.put({
              id: pu.id,
              po_number: pu.po_number,
              supplier_id: pu.supplier_id,
              supplier_name: pu.supplier_name || null,
              status: pu.status,
              subtotal_kes: subtotal,
              tax_kes: tax,
              total_kes: total,
              expected_delivery: pu.expected_delivery_date || pu.expected_delivery || null,
              notes: pu.notes || null,
              created_by: pu.created_by,
              created_at: pu.created_at,
              items: (pu.purchase_items || []).map((pi: any) => ({
                id: pi.id,
                purchase_id: pi.purchase_id,
                product_id: pi.product_id,
                product_name_snapshot: pi.product_name_snapshot || pi.product_name || 'Product',
                sku_snapshot: pi.sku_snapshot || pi.sku || 'SKU',
                quantity: Number(pi.quantity) || 0,
                unit_cost_kes: Number(pi.unit_cost_kes) || 0,
                line_total_kes: Number(pi.line_total_kes) || 0,
              })),
            });
            pulledCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Purchases pull: ${err.message}`);
      }

      this.lastSyncTime = new Date().toISOString();

      // Broadcast live event to open UI tabs / windows
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('beckys-hardware:data-refreshed', {
            detail: { type: 'all', pulled: pulledCount, timestamp: this.lastSyncTime },
          })
        );
        window.dispatchEvent(new CustomEvent('beckys-hardware:sales-updated'));
      }
    } catch (globalErr: any) {
      console.error('Fatal error during pullRemoteData:', globalErr);
      errors.push(globalErr.message);
    }

    return { pulled: pulledCount, errors };
  }

  /**
   * Bi-directional Full Synchronization:
   * 1. Pushes pending local changes to Supabase cloud.
   * 2. Pulls latest cloud state into local virtual store.
   */
  public async syncAll(): Promise<{ pushed: number; pulled: number; failed: number; errors: string[] }> {
    if (this.isSyncing) {
      return { pushed: 0, pulled: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    this.notify();

    try {
      // Step 1: Push local queue
      const pushRes = await this.executePushQueue();

      // Step 2: Pull remote state
      const pullRes = await this.pullRemoteData();

      this.lastSyncTime = new Date().toISOString();
      this.lastError =
        pushRes.failed > 0 || pullRes.errors.length > 0
          ? `${pushRes.failed} pushes failed, ${pullRes.errors.length} pulls failed`
          : null;

      return {
        pushed: pushRes.synced,
        pulled: pullRes.pulled,
        failed: pushRes.failed,
        errors: pullRes.errors,
      };
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }
}

export const syncEngine = new SyncEngine();
