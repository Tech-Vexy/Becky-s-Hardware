import test from 'node:test';
import assert from 'node:assert/strict';

// Simulated Hardware Store Products Database
const PRODUCT_CATALOGUE = {
  'CMT-001': { sku: 'CMT-001', name: 'Simba Cement 50kg', selling_price_kes: 750, stock_on_hand: 50, allow_decimal: false },
  'NLS-001': { sku: 'NLS-001', name: 'Ordinary Nails 3"', selling_price_kes: 200, stock_on_hand: 100, allow_decimal: true },
  'PVC-001': { sku: 'PVC-001', name: 'PVC Bend 90° 4"', selling_price_kes: 200, stock_on_hand: 5, allow_decimal: false },
};

function processAtomicCheckout({ items, payments, customer, allowNegativeStock = false }) {
  let subtotal = 0;
  const stockDeductions = [];

  for (const item of items) {
    const product = PRODUCT_CATALOGUE[item.sku];
    if (!product) throw new Error(`Product not found: ${item.sku}`);

    // Inventory integrity: Never trust client price; use trusted database price
    const unitPrice = product.selling_price_kes;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    // Check stock
    if (product.stock_on_hand < item.quantity && !allowNegativeStock) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${product.stock_on_hand}, Requested: ${item.quantity}`
      );
    }

    stockDeductions.push({
      sku: product.sku,
      initial: product.stock_on_hand,
      deducted: item.quantity,
      remaining: product.stock_on_hand - item.quantity,
    });
  }

  // 16% VAT inclusive calculation
  const total = subtotal;
  const tax = Math.round(total * (16 / 116) * 100) / 100;

  // Credit limit enforcement
  const creditPayment = payments.find((p) => p.method === 'credit');
  if (creditPayment) {
    if (!customer) throw new Error('Credit payment requires an authorized customer account');
    const availableCredit = customer.credit_limit_kes - customer.current_balance_kes;
    if (creditPayment.amount_kes > availableCredit) {
      throw new Error(
        `Credit limit exceeded. Customer available credit: KES ${availableCredit}, Requested credit: KES ${creditPayment.amount_kes}`
      );
    }
  }

  return {
    success: true,
    subtotal,
    tax,
    total,
    stockDeductions,
  };
}

test('Inventory Integrity: Prevents client price tampering', (t) => {
  const result = processAtomicCheckout({
    items: [
      // Client maliciously supplies price of KES 10 instead of true DB price KES 750
      { sku: 'CMT-001', quantity: 2, client_supplied_price: 10 },
    ],
    payments: [{ method: 'cash', amount_kes: 1500 }],
  });

  assert.equal(result.subtotal, 1500, 'Subtotal must be calculated from official DB price (2 x 750 = 1500)');
  assert.equal(result.total, 1500);
  assert.equal(result.stockDeductions[0].remaining, 48, 'Stock must be correctly deducted from 50 to 48');
});

test('Inventory Integrity: Rejects sale exceeding available stock', (t) => {
  assert.throws(
    () => {
      processAtomicCheckout({
        items: [{ sku: 'PVC-001', quantity: 10 }], // only 5 available
        payments: [{ method: 'cash', amount_kes: 2000 }],
      });
    },
    /Insufficient stock/,
    'Must throw insufficient stock error when requested qty exceeds stock on hand'
  );
});

test('Inventory Integrity: Enforces customer credit limit', (t) => {
  const customer = {
    id: 'cust-1',
    name: 'Fundi Kamau',
    credit_limit_kes: 20000,
    current_balance_kes: 18000, // only 2000 available
  };

  assert.throws(
    () => {
      processAtomicCheckout({
        items: [{ sku: 'CMT-001', quantity: 5 }], // 5 * 750 = 3750 KES
        payments: [{ method: 'credit', amount_kes: 3750 }],
        customer,
      });
    },
    /Credit limit exceeded/,
    'Must reject credit sale when requested amount exceeds available limit'
  );
});

test('Inventory Integrity: 16% VAT Inclusive Calculation', (t) => {
  const result = processAtomicCheckout({
    items: [{ sku: 'NLS-001', quantity: 5 }], // 5 * 200 = 1000 KES
    payments: [{ method: 'cash', amount_kes: 1000 }],
  });

  // Total 1000 KES, VAT = 1000 * 16 / 116 = 137.93 KES
  assert.equal(result.total, 1000);
  assert.equal(result.tax, 137.93);
});
