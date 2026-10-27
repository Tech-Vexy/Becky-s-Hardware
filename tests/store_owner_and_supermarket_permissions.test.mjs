import test from 'node:test';
import assert from 'node:assert/strict';

// Supermarket-style Role Permissions Matrix
const ROLES = {
  admin: {
    label: 'Store Owner / Admin',
    canManageStaff: true,
    canManageInventory: true,
    canMakeSales: true,
    canViewFinancials: true,
    canVerifyPayments: true,
    canAlterPrices: true,
    canDeleteRecords: true,
    canAccessSettings: true,
  },
  store_manager: {
    label: 'Store Manager',
    canManageStaff: true,
    canManageInventory: true,
    canMakeSales: true,
    canViewFinancials: true,
    canVerifyPayments: true,
    canAlterPrices: true,
    canDeleteRecords: false,
    canAccessSettings: true,
  },
  cashier: {
    label: 'Cashier',
    canManageStaff: false,
    canManageInventory: false,
    canMakeSales: true,
    canViewFinancials: false,
    canVerifyPayments: false,
    canAlterPrices: false,
    canDeleteRecords: false,
    canAccessSettings: false,
  },
  inventory_clerk: {
    label: 'Inventory Clerk',
    canManageStaff: false,
    canManageInventory: true,
    canMakeSales: false,
    canViewFinancials: false,
    canVerifyPayments: false,
    canAlterPrices: false,
    canDeleteRecords: false,
    canAccessSettings: false,
  },
  accountant: {
    label: 'Accountant',
    canManageStaff: false,
    canManageInventory: false,
    canMakeSales: false,
    canViewFinancials: true,
    canVerifyPayments: true,
    canAlterPrices: false,
    canDeleteRecords: false,
    canAccessSettings: false,
  },
};

function hasCapability(role, capability) {
  const caps = ROLES[role];
  if (!caps) return false;
  return Boolean(caps[capability]);
}

test('Initial State: Only Store Owner (Admin) exists initially', () => {
  const initialStaffList = [
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Becky Admin (Store Owner)',
      phone: '+254 712 345 678',
      role: 'admin',
      active: true,
    },
  ];

  assert.equal(initialStaffList.length, 1, 'Only 1 user exists at startup');
  assert.equal(initialStaffList[0].role, 'admin', 'The initial user must be Store Owner Admin');
  assert.equal(initialStaffList[0].active, true, 'The Store Owner must be active');
});

test('Store Owner provisions new employees with supermarket restrictions', () => {
  const staffList = [
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Becky Admin (Store Owner)',
      phone: '+254 712 345 678',
      role: 'admin',
      active: true,
    },
  ];

  // Store Owner adds a cashier
  const newCashier = {
    user_id: 'emp-001',
    full_name: 'Mercy Achieng',
    phone: '+254 733 444 555',
    role: 'cashier',
    active: true,
  };
  staffList.push(newCashier);

  assert.equal(staffList.length, 2);
  assert.equal(hasCapability(newCashier.role, 'canMakeSales'), true, 'Cashier can make sales at POS');
  assert.equal(hasCapability(newCashier.role, 'canAlterPrices'), false, 'Cashier CANNOT alter retail prices');
  assert.equal(hasCapability(newCashier.role, 'canManageStaff'), false, 'Cashier CANNOT add or manage staff');
  assert.equal(hasCapability(newCashier.role, 'canManageInventory'), false, 'Cashier CANNOT adjust inventory');
});

test('Supermarket role constraints: Inventory Clerk vs Store Owner', () => {
  assert.equal(hasCapability('inventory_clerk', 'canManageInventory'), true, 'Inventory Clerk can manage stock');
  assert.equal(hasCapability('inventory_clerk', 'canMakeSales'), false, 'Inventory Clerk cannot make sales at POS');
  assert.equal(hasCapability('inventory_clerk', 'canAlterPrices'), false, 'Inventory Clerk cannot change prices');

  // Store Owner has all capabilities
  assert.equal(hasCapability('admin', 'canAlterPrices'), true, 'Owner can alter prices');
  assert.equal(hasCapability('admin', 'canManageInventory'), true, 'Owner can manage inventory');
  assert.equal(hasCapability('admin', 'canManageStaff'), true, 'Owner can manage staff');
  assert.equal(hasCapability('admin', 'canDeleteRecords'), true, 'Owner can delete records');
});

test('Inventory Stocktake Calculation: Physical Count vs Book Balance at single shop location', () => {
  const currentStock = 50; // bags of cement on book
  const countedStock = 45; // physically counted at the shop

  const delta = countedStock - currentStock;
  assert.equal(delta, -5, 'Calculates a negative delta of -5 bags');

  const newStock = currentStock + delta;
  assert.equal(newStock, 45, 'New stock equals the physically counted quantity');
});

test('Single Store Location: Inventory operates at single shop location without godowns', () => {
  const product = {
    sku: 'CEM-SIM-50KG',
    product_name: 'Simba Cement 50kg',
    stock_on_hand: 100,
    stock_location: 'SHOP',
  };

  // Direct inventory adjustment in the single shop
  const adjustmentQty = -5; // 5 damaged bags written off
  const updatedStock = product.stock_on_hand + adjustmentQty;

  assert.equal(product.stock_location, 'SHOP', 'Product is stationed at the single shop location');
  assert.equal(updatedStock, 95, 'Stock adjustment directly updates single store inventory');
});

test('Supabase Authentication: Initial User becomes Store Owner Admin, subsequent users get assigned roles', () => {
  // Simulates public.handle_new_user() trigger logic
  function simulateHandleNewUser(existingProfilesCount, userMetadata) {
    if (existingProfilesCount === 0) {
      return 'admin'; // First user is always Store Owner Admin!
    }
    return userMetadata?.role || 'cashier';
  }

  // First signup: Store Owner
  const roleUser1 = simulateHandleNewUser(0, { full_name: 'Director Becky', role: 'admin' });
  assert.equal(roleUser1, 'admin', 'First user must be admin store owner');

  // Second signup: Cashier
  const roleUser2 = simulateHandleNewUser(1, { full_name: 'Mercy Achieng', role: 'cashier' });
  assert.equal(roleUser2, 'cashier', 'Subsequent employee gets cashier role');

  // Third signup: Inventory Clerk
  const roleUser3 = simulateHandleNewUser(2, { full_name: 'David Omondi', role: 'inventory_clerk' });
  assert.equal(roleUser3, 'inventory_clerk', 'Subsequent employee gets inventory clerk role');

  // Ensure Cashier cannot alter prices, but Admin can
  assert.equal(hasCapability(roleUser2, 'canAlterPrices'), false);
  assert.equal(hasCapability(roleUser1, 'canAlterPrices'), true);
});

