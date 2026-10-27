import Dexie, { type Table } from 'dexie';
import type {
  Product,
  ProductCategory,
  Customer,
  Supplier,
  Sale,
  Purchase,
  Return,
  Expense,
  StockMovement,
  CustomerRepayment,
  StoreSettings,
  SyncQueueItem,
  Profile,
  Invoice,
} from '@/lib/types/database';
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_SUPPLIERS,
  SEED_CUSTOMERS,
} from '@/lib/data/seedCatalogue';

export interface DraftCartItem {
  product_id: string;
  sku: string;
  product_name: string;
  unit_of_measure: string;
  selling_price_kes: number;
  quantity: number;
  discount_kes: number;
  allow_decimal: boolean;
  stock_on_hand: number;
}

export interface DraftCart {
  id: string; // 'current_pos_cart'
  customer_id?: string | null;
  customer_name?: string | null;
  items: DraftCartItem[];
  notes?: string;
  updated_at: string;
}

export interface OfflineReceiptRecord {
  receipt_number: string;
  sale_id: string;
  customer_name: string;
  total_kes: number;
  amount_paid_kes: number;
  payment_method: string;
  provider_reference?: string;
  items_count: number;
  cashier_name: string;
  created_at: string;
  sync_status: 'synced' | 'queued' | 'conflict';
}

export class HardwareStoreDexieDB extends Dexie {
  storeSettings!: Table<StoreSettings, string>;
  categories!: Table<ProductCategory, string>;
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  customerRepayments!: Table<CustomerRepayment, string>;
  suppliers!: Table<Supplier, string>;
  purchases!: Table<Purchase, string>;
  sales!: Table<Sale, string>;
  returns!: Table<Return, string>;
  expenses!: Table<Expense, string>;
  stockMovements!: Table<StockMovement, string>;
  draftCart!: Table<DraftCart, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  offlineReceipts!: Table<OfflineReceiptRecord, string>;
  invoices!: Table<Invoice, string>;

  constructor() {
    super('HardwareStoreLocalDB');
    this.version(1).stores({
      storeSettings: '&id',
      categories: '&id, name, active',
      products: '&id, sku, barcode, product_name, category_name, active, stock_on_hand',
      customers: '&id, customer_code, full_name, phone, active',
      customerRepayments: '&id, customer_id, receipt_number, received_at',
      suppliers: '&id, supplier_code, name, active',
      purchases: '&id, po_number, status, created_at',
      sales: '&id, receipt_number, customer_id, status, created_at, offline_id, idempotency_key',
      returns: '&id, return_number, sale_id, created_at',
      expenses: '&id, expense_number, expense_date, category',
      stockMovements: '&id, product_id, movement_type, created_at',
      draftCart: '&id, customer_id, updated_at',
      syncQueue: '++id, client_id, &idempotency_key, operation_type, status, created_at',
      offlineReceipts: '&receipt_number, sale_id, created_at',
    });

    this.version(2).stores({
      invoices: '&id, invoice_number, customer_id, status, issue_date, due_date, created_at',
    });
  }
}

export const localDb = new HardwareStoreDexieDB();

/**
 * Initializes and bootstraps the IndexedDB virtual replica with the Kenyan hardware catalogue
 * if not already initialized.
 */
export async function initializeLocalStoreDatabase(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const productsCount = await localDb.products.count();
    if (productsCount === 0) {
      console.log('Seeding IndexedDB virtual store with 193 hardware products & categories...');

      // 1. Store settings
      await localDb.storeSettings.put({
        id: '00000000-0000-0000-0000-000000000001',
        store_name: "Becky's Hardware Store",
        tagline: 'Ubora na Bei Nafuu - Quality Building Materials',
        physical_address: '',
        phone: '+254 712 345 678',
        email: 'sales@beckyshardware.co.ke',
        kra_pin: 'P051234567X',
        currency: 'KES',
        vat_rate_percent: 16.0,
        mpesa_paybill: '247247',
        mpesa_till: '5432101',
        mpesa_account: 'BECKY',
        receipt_header: "BECKY'S HARDWARE STORE",
        receipt_footer: 'Goods once sold are returnable within 7 days with original receipt. Asante kwa biashara yako!',
        allow_offline_credit: false,
        max_offline_sale_kes: 100000.0,
        allow_negative_stock: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 2. Categories
      const categoriesToInsert: ProductCategory[] = SEED_CATEGORIES.map((cat, i) => ({
        id: `00000000-0000-0000-0004-${(i + 1).toString().padStart(12, '0')}`,
        name: cat,
        active: true,
        created_at: new Date().toISOString(),
      }));
      await localDb.categories.bulkPut(categoriesToInsert);

      // 3. Products
      const productsToInsert: Product[] = SEED_PRODUCTS.map((p) => ({
        ...p,
        stock_reserved: 0,
        critical_stock_level: Math.round(p.low_stock_level * 0.4),
        low_stock_alert_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      await localDb.products.bulkPut(productsToInsert);

      // 4. Initial opening balance movements in local ledger
      const initialMovements: StockMovement[] = productsToInsert.slice(0, 30).map((p) => ({
        id: `00000000-0000-0000-0005-${p.sku}`,
        product_id: p.id,
        product_name: p.product_name,
        sku: p.sku,
        movement_type: 'opening_balance',
        quantity_delta: p.stock_on_hand,
        unit_cost_kes: p.buying_price_kes,
        reason: 'Initial hardware store stock take opening balance',
        created_by: 'system_bootstrap',
        created_by_name: 'Store Manager',
        created_at: new Date().toISOString(),
      }));
      await localDb.stockMovements.bulkPut(initialMovements);

      // 5. Suppliers
      await localDb.suppliers.bulkPut(SEED_SUPPLIERS);

      // 6. Customers
      await localDb.customers.bulkPut(SEED_CUSTOMERS);

      console.log('IndexedDB virtual store initialized successfully.');
    }
  } catch (error) {
    console.error('Error during local Dexie DB initialization:', error);
  }
}
