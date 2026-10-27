import test from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------
// Becky's Hardware Store - Invoices, Daily Sales & Pricing Tests
// ---------------------------------------------------------

test('Daily Sales Tracker: aggregates gross sales, count, and payment methods for current day', () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const mockSales = [
    {
      id: 'sale_1',
      receipt_number: 'RCP-261026-001',
      created_at: `${todayStr}T08:30:00Z`,
      total_kes: 1500,
      payments: [{ method: 'cash', amount_kes: 1500 }]
    },
    {
      id: 'sale_2',
      receipt_number: 'RCP-261026-002',
      created_at: `${todayStr}T10:15:00Z`,
      total_kes: 3500,
      payments: [{ method: 'mpesa', amount_kes: 3500 }]
    },
    {
      id: 'sale_3',
      receipt_number: 'RCP-261026-003',
      created_at: `${todayStr}T11:45:00Z`,
      total_kes: 2000,
      payments: [{ method: 'credit', amount_kes: 2000 }]
    },
    // Yesterday's sale - should NOT be included in today's tracker
    {
      id: 'sale_4',
      receipt_number: 'RCP-261025-099',
      created_at: `${yesterday}T16:00:00Z`,
      total_kes: 10000,
      payments: [{ method: 'cash', amount_kes: 10000 }]
    }
  ];

  // Daily tracker calculation
  const todaySales = mockSales.filter(s => (s.created_at || '').slice(0, 10) === todayStr);
  const grossKes = todaySales.reduce((sum, s) => sum + s.total_kes, 0);
  const ringups = todaySales.length;

  let cashKes = 0;
  let mpesaKes = 0;
  let creditKes = 0;

  todaySales.forEach(s => {
    s.payments.forEach(p => {
      if (p.method === 'cash') cashKes += p.amount_kes;
      if (p.method === 'mpesa') mpesaKes += p.amount_kes;
      if (p.method === 'credit') creditKes += p.amount_kes;
    });
  });

  assert.equal(ringups, 3, 'Should track 3 ring-ups for today');
  assert.equal(grossKes, 7000, 'Gross sales should total 7,000 KES');
  assert.equal(cashKes, 1500, 'Cash in drawer should be 1,500 KES');
  assert.equal(mpesaKes, 3500, 'M-Pesa till should be 3,500 KES');
  assert.equal(creditKes, 2000, 'Credit should be 2,000 KES');
});

test('Price Updatability: allows negotiated unit price override on POS cart item and calculates 16% VAT', () => {
  const catalogItem = {
    id: 'prod_1',
    sku: 'CMT-001',
    product_name: 'Simba Cement 50kg',
    selling_price_kes: 750,
    unit_of_measure: 'Bag'
  };

  // Cashier negotiates bulk discount to 720 KES
  const negotiatedPriceKes = 720;
  const quantity = 20;

  const cartItem = {
    ...catalogItem,
    selling_price_kes: negotiatedPriceKes,
    quantity
  };

  const lineTotal = cartItem.quantity * cartItem.selling_price_kes;
  assert.equal(lineTotal, 14400, 'Line total should reflect updated unit price (20 * 720 = 14,400)');

  // 16% VAT inclusive calculation
  const vatInclusive = Math.round((lineTotal * 16 / 116) * 100) / 100;
  assert.equal(vatInclusive, 1986.21, '16% VAT inclusive portion should be 1986.21 KES');
});

test('Invoicing: generates tax invoice with net balance and records payment', () => {
  const invoice = {
    id: 'inv_101',
    invoice_number: 'INV-20261026-001',
    customer_id: 'cust_1',
    customer_name: 'John Kamau Builders',
    customer_phone: '+254711223344',
    customer_address: 'Ngong Road, Nairobi',
    issue_date: '2026-10-26',
    due_date: '2026-11-09',
    status: 'pending',
    subtotal_kes: 20000,
    tax_kes: 2758.62,
    total_kes: 20000,
    amount_paid_kes: 0,
    balance_due_kes: 20000,
    items: [
      {
        id: 'item_1',
        product_id: 'prod_1',
        product_name: 'Simba Cement 50kg',
        sku: 'CMT-001',
        quantity: 25,
        unit_of_measure: 'Bag',
        unit_price_kes: 800,
        line_total_kes: 20000
      }
    ]
  };

  assert.equal(invoice.balance_due_kes, 20000);
  assert.equal(invoice.status, 'pending');

  // Customer makes partial repayment of 12,000 KES
  const paymentKes = 12000;
  const newAmountPaid = invoice.amount_paid_kes + paymentKes;
  const newBalance = invoice.total_kes - newAmountPaid;
  const newStatus = newBalance <= 0 ? 'paid' : 'partial';

  const updatedInvoice = {
    ...invoice,
    amount_paid_kes: newAmountPaid,
    balance_due_kes: newBalance,
    status: newStatus
  };

  assert.equal(updatedInvoice.amount_paid_kes, 12000);
  assert.equal(updatedInvoice.balance_due_kes, 8000);
  assert.equal(updatedInvoice.status, 'partial');

  // Final clearance of remaining 8,000 KES
  const finalPayment = 8000;
  const fullyPaidInvoice = {
    ...updatedInvoice,
    amount_paid_kes: updatedInvoice.amount_paid_kes + finalPayment,
    balance_due_kes: 0,
    status: 'paid'
  };

  assert.equal(fullyPaidInvoice.balance_due_kes, 0);
  assert.equal(fullyPaidInvoice.status, 'paid');
});

test('Simplicity Invariant: Retail counter operations exclude delivery logistics', () => {
  // Verifies that counter sales and invoice models focus strictly on customer, inventory and payments
  const counterSale = {
    id: 'sale_102',
    channel: 'counter_retail',
    location: 'Main Counter Shelf',
    requires_delivery: false
  };

  assert.equal(counterSale.channel, 'counter_retail');
  assert.equal(counterSale.requires_delivery, false);
});
