// src/components/common/PermissionGate.tsx
// ============================================
// PERMISSION GATE COMPONENT
// Use this to conditionally render UI based on permissions
// ============================================

import type { JSX, ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission, Role } from '../../config/permissions';

// ==================== MAIN PERMISSION GATE ====================

interface PermissionGateProps {
  /** Single permission to check */
  permission?: Permission;
  /** Multiple permissions to check */
  permissions?: Permission[];
  /** If true, requires ALL permissions. Default: any one permission is enough */
  requireAll?: boolean;
  /** Specific roles to allow (bypasses permission check) */
  allowedRoles?: Role[];
  /** Content to show if permission denied */
  fallback?: ReactNode;
  /** Children to render if permission granted */
  children: ReactNode;
}

/**
 * PermissionGate - Conditionally renders children based on user permissions
 *
 * @example
 * // Single permission
 * <PermissionGate permission="pricing.view_cost_price">
 *   <CostPriceColumn />
 * </PermissionGate>
 *
 * @example
 * // Multiple permissions (any)
 * <PermissionGate permissions={['orders.edit', 'orders.create']}>
 *   <OrderActions />
 * </PermissionGate>
 *
 * @example
 * // Multiple permissions (all required)
 * <PermissionGate permissions={['orders.edit', 'pricing.edit_supplier_rates']} requireAll>
 *   <AdvancedPricingEditor />
 * </PermissionGate>
 *
 * @example
 * // With fallback
 * <PermissionGate permission="orders.edit" fallback={<ViewOnlyBadge />}>
 *   <EditButton />
 * </PermissionGate>
 *
 * @example
 * // Role-based (bypasses permissions)
 * <PermissionGate allowedRoles={['admin']}>
 *   <DangerZone />
 * </PermissionGate>
 */
const PermissionGate = ({
  permission,
  permissions = [],
  requireAll = false,
  allowedRoles,
  fallback = null,
  children,
}: PermissionGateProps): JSX.Element => {
  const { role, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // If allowedRoles is specified, check role directly
  if (allowedRoles && allowedRoles.length > 0) {
    if (role && allowedRoles.includes(role)) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified, render children
  return <>{children}</>;
};

export default PermissionGate;


// ==================== SPECIALIZED GATE COMPONENTS ====================

/**
 * AdminOnlyGate - Only renders for admin users
 */
export const AdminOnlyGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  return (
    <PermissionGate allowedRoles={['admin']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

/**
 * ReadOnlyGate - Shows content for read-only users (accountant)
 * Useful for showing "Read Only" badges or alternative UI
 */
export const ReadOnlyGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  return (
    <PermissionGate allowedRoles={['accountant']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

/**
 * EditableGate - Shows edit controls for users who can edit
 * Excludes accountant role
 */
export const EditableGate = ({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  const { role, hasPermission } = usePermissions();

  // Accountant is always read-only
  if (role === 'accountant') {
    return <>{fallback}</>;
  }

  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};


// ==================== PRICING GATES ====================

/**
 * CostPriceGate - Shows cost price for authorized users
 * Admin, Accountant, Supplier can see cost price
 * Support and Client cannot
 */
export const CostPriceGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  return (
    <PermissionGate permission="pricing.view_cost_price" fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

/**
 * ProfitMarginGate - Shows profit margin for authorized users
 * Admin, Accountant, Supplier can see profit margin
 * Support and Client cannot
 */
export const ProfitMarginGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  return (
    <PermissionGate permission="pricing.view_profit_margin" fallback={fallback}>
      {children}
    </PermissionGate>
  );
};


// ==================== ORDER GATES ====================

/**
 * OrderEditGate - Shows order edit controls
 */
export const OrderEditGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  return (
    <PermissionGate permission="orders.edit" fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

/**
 * OrderCreateGate - Shows order create controls
 */
export const OrderCreateGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  return (
    <PermissionGate permission="orders.create" fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

/**
 * MarkDeliveredGate - Shows mark delivered button
 */
export const MarkDeliveredGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  return (
    <PermissionGate permission="orders.mark_delivered" fallback={fallback}>
      {children}
    </PermissionGate>
  );
};


// ==================== USER MANAGEMENT GATES ====================

/**
 * UserEditGate - Shows user edit controls
 */
export const UserEditGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  return (
    <PermissionGate permission="users.edit" fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

/**
 * UserDeleteGate - Shows user delete controls
 */
export const UserDeleteGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element => {
  return (
    <PermissionGate permission="users.delete" fallback={fallback}>
      {children}
    </PermissionGate>
  );
};


// ==================== INLINE PERMISSION CHECK COMPONENT ====================

interface ShowIfProps {
  /** Permission to check */
  can: Permission;
  /** Content to render if permitted */
  children: ReactNode;
  /** Optional content if not permitted */
  else?: ReactNode;
}

/**
 * ShowIf - Inline permission check with cleaner syntax
 *
 * @example
 * <ShowIf can="pricing.view_cost_price">
 *   ${costPrice}
 * </ShowIf>
 *
 * @example
 * <ShowIf can="orders.edit" else={<span>View Only</span>}>
 *   <EditButton />
 * </ShowIf>
 */
export const ShowIf = ({ can, children, else: elseContent = null }: ShowIfProps): JSX.Element => {
  const { hasPermission } = usePermissions();
  return hasPermission(can) ? <>{children}</> : <>{elseContent}</>;
};


// ==================== HIDE IF COMPONENT ====================

interface HideIfProps {
  /** Permission to check - hides if user HAS this permission */
  can: Permission;
  /** Content to render if NOT permitted */
  children: ReactNode;
}

/**
 * HideIf - Hides content if user HAS the permission
 * Useful for showing alternative content for lower-privilege users
 *
 * @example
 * <HideIf can="pricing.view_cost_price">
 *   <span>Cost price hidden</span>
 * </HideIf>
 */
export const HideIf = ({ can, children }: HideIfProps): JSX.Element => {
  const { hasPermission } = usePermissions();
  return !hasPermission(can) ? <>{children}</> : <></>;
};