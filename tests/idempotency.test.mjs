import test from 'node:test';
import assert from 'node:assert/strict';

class MockDatabase {
  constructor() {
    this.sales = new Map();
    this.idempotencyIndex = new Set();
    this.stock = {
      'BRD-001': 100,
    };
  }

  executeCheckoutRPC(payload) {
    const key = payload.idempotency_key;

    // Idempotency guard check
    if (this.idempotencyIndex.has(key)) {
      const existing = this.sales.get(key);
      return {
        idempotent_duplicate: true,
        sale_id: existing.id,
        receipt_number: existing.receipt_number,
        total_kes: existing.total_kes,
        remaining_stock: this.stock[payload.item.sku],
      };
    }

    // First execution: deduct stock and insert sale
    this.stock[payload.item.sku] -= payload.item.qty;
    const saleRecord = {
      id: `sale_${Date.now()}`,
      receipt_number: payload.receipt_number,
      total_kes: payload.total_kes,
      idempotency_key: key,
    };

    this.idempotencyIndex.add(key);
    this.sales.set(key, saleRecord);

    return {
      idempotent_duplicate: false,
      sale_id: saleRecord.id,
      receipt_number: saleRecord.receipt_number,
      total_kes: saleRecord.total_kes,
      remaining_stock: this.stock[payload.item.sku],
    };
  }
}

test('Idempotency: Re-syncing an offline sale does not double-deduct inventory', (t) => {
  const db = new MockDatabase();
  const idempotencyKey = 'idemp_offline_pos_sale_8877';

  const checkoutPayload = {
    idempotency_key: idempotencyKey,
    receipt_number: 'RCP-20261022-A1B2',
    total_kes: 4500,
    item: { sku: 'BRD-001', qty: 10 },
  };

  // Initial Sync (e.g. Network restored)
  const firstSync = db.executeCheckoutRPC(checkoutPayload);
  assert.equal(firstSync.idempotent_duplicate, false);
  assert.equal(firstSync.remaining_stock, 90, 'Initial stock 100 - 10 = 90');

  // Retry / Duplicate Sync (e.g. timeout retry or duplicate worker push)
  const duplicateSync = db.executeCheckoutRPC(checkoutPayload);
  assert.equal(duplicateSync.idempotent_duplicate, true);
  assert.equal(duplicateSync.sale_id, firstSync.sale_id, 'Must return same sale ID');
  assert.equal(
    duplicateSync.remaining_stock,
    90,
    'Stock must REMAIN 90 and NOT be deducted a second time to 80'
  );
});
