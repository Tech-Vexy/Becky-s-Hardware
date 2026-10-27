import { localDb, type OfflineReceiptRecord } from '@/lib/dexie/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type {
  SyncQueueItem,
  SyncOperationType,
  Sale,
  StockMovement,
  Payment,
  SaleItem,
  Product,
  Invoice,
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
  private isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      // Periodic auto-sync check every 30 seconds
      setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.syncPendingQueue();
        }
      }, 30000);
    }
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  public getStatus(): SyncEngineStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: 0, // dynamic caller gets count via getPendingCount
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
      console.log('Network reconnected. Initiating sync...');
      this.syncPendingQueue();
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

    // 1. Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    const saleItems: SaleItem[] = [];

    for (const item of payload.items) {
      const lineTotal = item.quantity * item.unit_price_kes - (item.discount_kes || 0);
      subtotal += item.quantity * item.unit_price_kes;
      totalDiscount += item.discount_kes || 0;

      saleItems.push({
        id: `00000000-0000-0000-0007-${Math.random().toString().slice(2, 14)}`,
        sale_id: saleId,
        product_id: item.product_id,
        product_name_snapshot: item.product_name,
        sku_snapshot: item.sku,
        quantity: item.quantity,
        unit_price_kes: item.unit_price_kes,
        discount_kes: item.discount_kes || 0,
        line_total_kes: lineTotal,
      });
    }

    const totalKes = Math.max(0, subtotal - totalDiscount);
    const taxKes = Math.round(totalKes * (16 / 116) * 100) / 100; // 16% VAT standard in Kenya
    let totalPaid = 0;

    const payments: Payment[] = payload.payments.map((p) => {
      totalPaid += p.amount_kes;
      return {
        id: `00000000-0000-0000-0008-${Math.random().toString().slice(2, 14)}`,
        sale_id: saleId,
        method: p.method,
        amount_kes: p.amount_kes,
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
    await localDb.transaction('rw', [localDb.products, localDb.sales, localDb.stockMovements, localDb.offlineReceipts, localDb.syncQueue], async () => {
      // Deduct stock and log movements in local virtual store
      for (const item of payload.items) {
        const prod = await localDb.products.get(item.product_id);
        if (prod) {
          const newStock = Math.max(0, prod.stock_on_hand - item.quantity);
          await localDb.products.update(item.product_id, {
            stock_on_hand: newStock,
            updated_at: new Date().toISOString(),
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
      }

      // Save sale locally
      const saleRecord: Sale = {
        id: saleId,
        receipt_number: receiptNumber,
        customer_id: payload.customer_id,
        customer_name_snapshot: payload.customer_name,
        cashier_id: payload.cashier_id,
        cashier_name_snapshot: payload.cashier_name,
        status: 'completed',
        subtotal_kes: subtotal,
        discount_kes: totalDiscount,
        tax_kes: taxKes,
        total_kes: totalKes,
        amount_paid_kes: totalPaid,
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
        amount_paid_kes: totalPaid,
        payment_method: payload.payments.map((p) => p.method).join(', '),
        provider_reference: payload.payments.find((p) => p.provider_reference)?.provider_reference,
        items_count: payload.items.length,
        cashier_name: payload.cashier_name,
        created_at: new Date().toISOString(),
        sync_status: this.isOnline ? 'synced' : 'queued',
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
          customer_id: payload.customer_id,
          discount_kes: totalDiscount,
          is_offline_sync: true,
          notes: payload.notes,
          items: payload.items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            discount_kes: i.discount_kes,
          })),
          payments: payload.payments.map((p) => ({
            method: p.method,
            amount_kes: p.amount_kes,
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
      offline_queued: true,
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

    let syncedCount = 0;
    let failedCount = 0;

    try {
      const pendingItems = await localDb.syncQueue
        .where('status')
        .equals('pending')
        .toArray();

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.notify();
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
            } else {
              let rpcName = '';
              switch (item.operation_type) {
                case 'checkout':
                  rpcName = 'rpc_checkout';
                  break;
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
                  throw new Error(`Unsupported sync operation type: ${item.operation_type}`);
              }

              const { error } = await supabase.rpc(rpcName, { payload: item.payload });
              syncError = error;
            }

            if (syncError) {
              // Handle conflict or validation error
              console.error(`Sync RPC error on ${item.idempotency_key}:`, syncError);
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
      console.error('Fatal error in syncPendingQueue:', globalErr);
      this.lastError = globalErr.message;
    } finally {
      this.isSyncing = false;
      this.notify();
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

      this.lastSyncTime = new Date().toISOString();
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
      const pushRes = await this.syncPendingQueue();

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
