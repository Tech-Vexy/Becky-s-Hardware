export type AppRole = 'admin' | 'owner' | 'store_manager' | 'cashier' | 'inventory_clerk' | 'accountant';

export type SaleStatus = 'draft' | 'completed' | 'voided';

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit' | 'cheque' | 'other';

export type PaymentVerificationStatus = 'unverified' | 'verified' | 'rejected';

export type StockMovementType =
  | 'opening_balance'
  | 'purchase_receipt'
  | 'sale'
  | 'sale_return'
  | 'adjustment'
  | 'damage'
  | 'transfer_in'
  | 'transfer_out'
  | 'stocktake';

export type PurchaseStatus = 'draft' | 'received' | 'cancelled';

export type ReturnCondition = 'good' | 'damaged' | 'scrap';

export interface StoreSettings {
  id: string;
  store_name: string;
  tagline: string;
  physical_address: string;
  phone: string;
  email: string;
  kra_pin: string;
  currency: string;
  vat_rate_percent: number;
  mpesa_paybill: string;
  mpesa_till: string;
  mpesa_account: string;
  receipt_header: string;
  receipt_footer: string;
  allow_offline_credit: boolean;
  max_offline_sale_kes: number;
  allow_negative_stock: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  user_id: string;
  full_name: string;
  phone?: string | null;
  role: AppRole;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  product_name: string;
  category_id?: string | null;
  category_name?: string | null;
  brand?: string | null;
  size_or_pack?: string | null;
  colour?: string | null;
  specification?: string | null;
  unit_of_measure: string;
  selling_price_kes: number;
  alternate_selling_price_kes?: number | null;
  minimum_selling_price_kes?: number | null;
  buying_price_kes?: number | null;
  stock_on_hand: number;
  stock_reserved: number;
  low_stock_level: number;
  critical_stock_level: number;
  reorder_quantity: number;
  allow_decimal: boolean;
  low_stock_alert_enabled: boolean;
  active: boolean;
  stock_location?: string | null; // Single shop location
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  archived_at?: string | null;
}

export interface Customer {
  id: string;
  customer_code?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  credit_limit_kes: number;
  active: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerBalance extends Customer {
  total_credit_sales_kes: number;
  total_repayments_kes: number;
  current_balance_kes: number;
  available_credit_kes: number;
}

export interface CustomerRepayment {
  id: string;
  customer_id: string;
  customer_name?: string;
  receipt_number: string;
  amount_kes: number;
  method: PaymentMethod;
  provider_reference?: string | null;
  received_by: string;
  received_by_name?: string;
  received_at: string;
  notes?: string | null;
  created_at?: string;
}

export interface Supplier {
  id: string;
  supplier_code?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_pin?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_cost_kes: number;
  line_total_kes: number;
}

export interface Purchase {
  id: string;
  po_number: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  status: PurchaseStatus;
  supplier_invoice_no?: string | null;
  subtotal_kes: number;
  tax_kes: number;
  total_kes: number;
  notes?: string | null;
  created_by?: string | null;
  received_by?: string | null;
  received_at?: string | null;
  created_at: string;
  updated_at?: string;
  items?: PurchaseItem[];
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price_kes: number;
  discount_kes: number;
  line_total_kes: number;
}

export interface Payment {
  id?: string;
  sale_id?: string;
  method: PaymentMethod;
  amount_kes: number;
  provider_reference?: string | null;
  received_by?: string;
  received_at?: string;
  verification_status: PaymentVerificationStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  notes?: string | null;
}

export interface Sale {
  id: string;
  receipt_number: string;
  customer_id?: string | null;
  customer_name_snapshot?: string | null;
  cashier_id: string;
  cashier_name_snapshot?: string | null;
  status: SaleStatus;
  subtotal_kes: number;
  discount_kes: number;
  tax_kes: number;
  total_kes: number;
  amount_paid_kes: number;
  offline_id?: string | null;
  idempotency_key?: string | null;
  is_offline_sync: boolean;
  notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;
  items?: SaleItem[];
  payments?: Payment[];
}

export interface ReturnItem {
  id?: string;
  return_id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price_kes: number;
  line_total_kes: number;
  restock_inventory: boolean;
  condition: ReturnCondition;
}

export interface Return {
  id: string;
  return_number: string;
  sale_id?: string | null;
  sale_receipt_number?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  cashier_id: string;
  refund_method: PaymentMethod;
  total_refund_kes: number;
  reason: string;
  created_at: string;
  items?: ReturnItem[];
}

export interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: 'casual_labor' | 'transport' | 'utilities' | 'rent' | 'supplies' | 'maintenance' | 'other';
  amount_kes: number;
  description: string;
  paid_to: string;
  payment_method: PaymentMethod;
  provider_reference?: string | null;
  receipt_ref?: string | null;
  created_by: string;
  created_by_name?: string;
  approved_by?: string | null;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  movement_type: StockMovementType;
  quantity_delta: number;
  unit_cost_kes?: number | null;
  reference_type?: string | null;
  reference_id?: string | null;
  reason: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_user_id?: string | null;
  actor_name?: string | null;
  action: string;
  table_name: string;
  record_id?: string | null;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  occurred_at: string;
}

export type SyncOperationType =
  | 'checkout'
  | 'receive_purchase'
  | 'repayment'
  | 'stock_adjustment'
  | 'return'
  | 'product_upsert'
  | 'profile_upsert'
  | 'invoice_upsert';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'cancelled';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id?: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_of_measure: string;
  unit_price_kes: number;
  line_total_kes: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  sale_id?: string | null;
  sale_receipt_number?: string | null;
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  customer_kra_pin?: string | null;
  customer_address?: string | null;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal_kes: number;
  tax_kes: number;
  total_kes: number;
  amount_paid_kes: number;
  balance_due_kes: number;
  notes?: string | null;
  payment_terms?: string | null;
  created_by: string;
  created_by_name?: string | null;
  created_at: string;
  updated_at?: string;
  items: InvoiceItem[];
}

export interface SyncQueueItem {
  id?: number;
  client_id: string;
  idempotency_key: string;
  operation_type: SyncOperationType;
  payload: any;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retry_count: number;
  last_error?: string | null;
  created_at: string;
  synced_at?: string | null;
}
