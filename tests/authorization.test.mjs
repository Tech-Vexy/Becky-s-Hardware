import test from 'node:test';
import assert from 'node:assert/strict';

// Role definitions
const ROLES = {
  admin: {
    canManageStaff: true,
    canManageInventory: true,
    canMakeSales: true,
    canViewFinancials: true,
    canVerifyPayments: true,
    canAlterPrices: true,
    canDeleteRecords: true,
  },
  store_manager: {
    canManageStaff: true,
    canManageInventory: true,
    canMakeSales: true,
    canViewFinancials: true,
    canVerifyPayments: true,
    canAlterPrices: true,
    canDeleteRecords: false,
  },
  cashier: {
    canManageStaff: false,
    canManageInventory: false,
    canMakeSales: true,
    canViewFinancials: false,
    canVerifyPayments: false,
    canAlterPrices: false,
    canDeleteRecords: false,
  },
  inventory_clerk: {
    canManageStaff: false,
    canManageInventory: true,
    canMakeSales: false,
    canViewFinancials: false,
    canVerifyPayments: false,
    canAlterPrices: false,
    canDeleteRecords: false,
  },
  accountant: {
    canManageStaff: false,
    canManageInventory: false,
    canMakeSales: false,
    canViewFinancials: true,
    canVerifyPayments: true,
    canAlterPrices: false,
    canDeleteRecords: false,
  },
};

function checkPermission(role, capability) {
  const roleCaps = ROLES[role];
  if (!roleCaps) return false;
  return Boolean(roleCaps[capability]);
}

test('Role Authorization: Cashier Permissions', (t) => {
  assert.equal(checkPermission('cashier', 'canMakeSales'), true, 'Cashier must be permitted to make sales');
  assert.equal(checkPermission('cashier', 'canAlterPrices'), false, 'Cashier must NOT be permitted to alter product prices');
  assert.equal(checkPermission('cashier', 'canManageStaff'), false, 'Cashier must NOT manage staff accounts');
  assert.equal(checkPermission('cashier', 'canDeleteRecords'), false, 'Cashier must NOT delete financial or inventory history');
  assert.equal(checkPermission('cashier', 'canVerifyPayments'), false, 'Cashier cannot self-verify M-Pesa references');
});

test('Role Authorization: Inventory Clerk Permissions', (t) => {
  assert.equal(checkPermission('inventory_clerk', 'canManageInventory'), true, 'Inventory clerk can receive stock and adjust counts');
  assert.equal(checkPermission('inventory_clerk', 'canMakeSales'), false, 'Inventory clerk cannot process checkout sales');
  assert.equal(checkPermission('inventory_clerk', 'canViewFinancials'), false, 'Inventory clerk cannot view profit reports');
});

test('Role Authorization: Accountant Permissions', (t) => {
  assert.equal(checkPermission('accountant', 'canViewFinancials'), true, 'Accountant can review financial statements and Z-reports');
  assert.equal(checkPermission('accountant', 'canVerifyPayments'), true, 'Accountant can verify incoming M-Pesa payments');
  assert.equal(checkPermission('accountant', 'canMakeSales'), false, 'Accountant cannot conduct POS checkouts');
});

test('Role Authorization: Store Manager & Admin Permissions', (t) => {
  assert.equal(checkPermission('store_manager', 'canManageStaff'), true, 'Manager can manage staff');
  assert.equal(checkPermission('store_manager', 'canVerifyPayments'), true, 'Manager can verify payments');
  assert.equal(checkPermission('admin', 'canDeleteRecords'), true, 'Only admin has protected deletion rights');
});
