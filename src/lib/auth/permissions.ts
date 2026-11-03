/**
 * Single source of truth for role-based permissions.
 *
 * Both the UI (via AuthContext) and the test-suite consume this module so a
 * role's capabilities cannot drift between screens. Database RLS remains the
 * final authority; these checks only decide what the operator can see/do.
 */

export type PermissionRole =
  | 'admin'
  | 'owner'
  | 'store_manager'
  | 'cashier'
  | 'inventory_clerk'
  | 'accountant';

export interface RolePermissions {
  canManageStaff: boolean;
  canManageInventory: boolean;
  canMakeSales: boolean;
  canViewFinancials: boolean;
  canVerifyPayments: boolean;
  canAlterPrices: boolean;
  canDeleteRecords: boolean;
}

const FULL_ACCESS: RolePermissions = {
  canManageStaff: true,
  canManageInventory: true,
  canMakeSales: true,
  canViewFinancials: true,
  canVerifyPayments: true,
  canAlterPrices: true,
  canDeleteRecords: true,
};

const NO_ACCESS: RolePermissions = {
  canManageStaff: false,
  canManageInventory: false,
  canMakeSales: false,
  canViewFinancials: false,
  canVerifyPayments: false,
  canAlterPrices: false,
  canDeleteRecords: false,
};

export const ROLE_PERMISSIONS: Record<PermissionRole, RolePermissions> = {
  admin: { ...FULL_ACCESS },
  // 'owner' is the legacy alias used by the client Profile type.
  owner: { ...FULL_ACCESS },
  store_manager: {
    ...FULL_ACCESS,
    // Destructive corrections must be performed by the store owner.
    canDeleteRecords: false,
  },
  cashier: {
    ...NO_ACCESS,
    canMakeSales: true,
  },
  inventory_clerk: {
    ...NO_ACCESS,
    canManageInventory: true,
  },
  accountant: {
    ...NO_ACCESS,
    canViewFinancials: true,
    canVerifyPayments: true,
  },
};

/**
 * Resolves a role to its permission set. Unknown/missing roles fall back to
 * cashier (least privilege) rather than administrator.
 */
export function getPermissions(role: string | null | undefined): RolePermissions {
  if (role && role in ROLE_PERMISSIONS) {
    return { ...ROLE_PERMISSIONS[role as PermissionRole] };
  }
  return { ...ROLE_PERMISSIONS.cashier };
}

/** Whether `role` is one of `allowed`, treating 'owner' as 'admin'. */
export function roleMatches(role: string | null | undefined, allowed: readonly string[]): boolean {
  if (!role) return false;
  if (role === 'owner' && allowed.includes('admin')) return true;
  if (role === 'admin' && allowed.includes('owner')) return true;
  return allowed.includes(role);
}

/**
 * Maps a navigation module to the permission that unlocks it. Catalogue and
 * POS stay visible to every authenticated operator; financial modules require
 * financial visibility.
 */
export function canAccessModule(moduleName: string, permissions: RolePermissions): boolean {
  const module = moduleName.replace(/^\//, '');

  switch (module) {
    case 'settings':
    case 'staff':
    case 'audit-logs':
      return permissions.canManageStaff;
    case 'reports':
    case 'expenses':
    case 'payments':
    case 'invoices':
      return permissions.canViewFinancials || permissions.canVerifyPayments;
    case 'inventory':
    case 'purchases':
    case 'suppliers':
      return permissions.canManageInventory || permissions.canViewFinancials;
    case 'returns':
      return permissions.canMakeSales;
    case 'customers':
      return permissions.canMakeSales || permissions.canViewFinancials;
    case '':
    case 'pos':
    case 'catalogue':
    case 'more':
      return true;
    default:
      return true;
  }
}
