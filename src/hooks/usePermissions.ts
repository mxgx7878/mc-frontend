// src/hooks/usePermissions.ts
// ============================================
// PERMISSION HOOK
// Use this hook to check permissions anywhere in the app
// ============================================

import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  ROLE_PERMISSIONS,
  canAccessAdminArea,
  getRoleDisplayName,
  getRoleBadgeStyles,
  getRoleIcon,
} from '../config/permissions';
import type { Permission,Role } from '../config/permissions';

interface UsePermissionsReturn {
  // Current user role
  role: Role | null;
  roleDisplayName: string;
  roleBadgeStyles: string;
  roleIcon: string;

  // Permission checking functions
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Quick access checks
  canAccessAdmin: boolean;
  isReadOnly: boolean; // For accountant role

  // ==================== PROJECT PERMISSIONS ====================
  canViewAllProjects: boolean;
  canViewOwnProjects: boolean;
  canEditProjects: boolean;
  canCreateProjects: boolean;
  canDeleteProjects: boolean;

  // ==================== ORDER PERMISSIONS ====================
  canViewAllOrders: boolean;
  canViewOwnOrders: boolean;
  canCreateOrders: boolean;
  canEditOrders: boolean;
  canMarkDelivered: boolean;
  canAssignSupplier: boolean;
  canCancelOrders: boolean;
  canUpdateOrderStatus: boolean;

  // ==================== PRICING PERMISSIONS ====================
  canViewCostPrice: boolean;
  canViewProfitMargin: boolean;
  canEditSupplierRates: boolean;
  canEnterQuotedRates: boolean;
  canViewClientPrice: boolean;

  // ==================== USER PERMISSIONS ====================
  canViewUsers: boolean;
  canViewUserDetails: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageRoles: boolean;

  // ==================== PRODUCT PERMISSIONS ====================
  canViewProducts: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canApproveProducts: boolean;

  // ==================== SUPPLIER PERMISSIONS ====================
  canViewSuppliers: boolean;
  canViewSupplierZones: boolean;
  canEditSupplierZones: boolean;
  canApproveSuppliers: boolean;
  canViewSupplierOffers: boolean;

  // ==================== CLIENT PERMISSIONS ====================
  canViewClients: boolean;
  canViewClientDetails: boolean;
  canEditClients: boolean;
  canManageClientPricing: boolean;

  // ==================== REPORT PERMISSIONS ====================
  canViewReports: boolean;
  canViewRevenueReports: boolean;
  canViewSupplierPerformance: boolean;
  canViewClientSpend: boolean;
  canExportReports: boolean;

  // ==================== PAYMENT PERMISSIONS ====================
  canViewPayments: boolean;
  canProcessPayments: boolean;
  canRefundPayments: boolean;
  canMarkSupplierPaid: boolean;

  // ==================== SYSTEM PERMISSIONS ====================
  canViewDashboard: boolean;
  canManageCategories: boolean;
  canViewLogs: boolean;
  canManageSettings: boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const user = useAuthStore((state) => state.user);
  const role = (user?.role as Role) ?? null;

  // Memoize permission checks to avoid recalculating on every render
  return useMemo(() => {
    // Core permission check function
    const hasPermission = (permission: Permission): boolean => {
      if (!role) return false;
      return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
    };

    // Check if user has ANY of the provided permissions
    const hasAnyPermission = (permissions: Permission[]): boolean => {
      return permissions.some((p) => hasPermission(p));
    };

    // Check if user has ALL of the provided permissions
    const hasAllPermissions = (permissions: Permission[]): boolean => {
      return permissions.every((p) => hasPermission(p));
    };

    // Quick access values
    const canAccessAdmin = role ? canAccessAdminArea(role) : false;
    const isReadOnly = role === 'accountant';

    return {
      // Role info
      role,
      roleDisplayName: role ? getRoleDisplayName(role) : '',
      roleBadgeStyles: role ? getRoleBadgeStyles(role) : '',
      roleIcon: role ? getRoleIcon(role) : '',

      // Permission checking functions
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,

      // Quick access
      canAccessAdmin,
      isReadOnly,

      // ==================== PROJECT PERMISSIONS ====================
      canViewAllProjects: hasPermission('projects.view_all'),
      canViewOwnProjects: hasPermission('projects.view_own'),
      canEditProjects: hasPermission('projects.edit'),
      canCreateProjects: hasPermission('projects.create'),
      canDeleteProjects: hasPermission('projects.delete'),

      // ==================== ORDER PERMISSIONS ====================
      canViewAllOrders: hasPermission('orders.view_all'),
      canViewOwnOrders: hasPermission('orders.view_own'),
      canCreateOrders: hasPermission('orders.create'),
      canEditOrders: hasPermission('orders.edit'),
      canMarkDelivered: hasPermission('orders.mark_delivered'),
      canAssignSupplier: hasPermission('orders.assign_supplier'),
      canCancelOrders: hasPermission('orders.cancel'),
      canUpdateOrderStatus: hasPermission('orders.update_status'),

      // ==================== PRICING PERMISSIONS ====================
      canViewCostPrice: hasPermission('pricing.view_cost_price'),
      canViewProfitMargin: hasPermission('pricing.view_profit_margin'),
      canEditSupplierRates: hasPermission('pricing.edit_supplier_rates'),
      canEnterQuotedRates: hasPermission('pricing.enter_quoted_rates'),
      canViewClientPrice: hasPermission('pricing.view_client_price'),

      // ==================== USER PERMISSIONS ====================
      canViewUsers: hasPermission('users.view'),
      canViewUserDetails: hasPermission('users.view_details'),
      canCreateUsers: hasPermission('users.create'),
      canEditUsers: hasPermission('users.edit'),
      canDeleteUsers: hasPermission('users.delete'),
      canManageRoles: hasPermission('users.manage_roles'),

      // ==================== PRODUCT PERMISSIONS ====================
      canViewProducts: hasPermission('products.view'),
      canCreateProducts: hasPermission('products.create'),
      canEditProducts: hasPermission('products.edit'),
      canDeleteProducts: hasPermission('products.delete'),
      canApproveProducts: hasPermission('products.approve'),

      // ==================== SUPPLIER PERMISSIONS ====================
      canViewSuppliers: hasPermission('suppliers.view'),
      canViewSupplierZones: hasPermission('suppliers.view_zones'),
      canEditSupplierZones: hasPermission('suppliers.edit_zones'),
      canApproveSuppliers: hasPermission('suppliers.approve'),
      canViewSupplierOffers: hasPermission('suppliers.view_offers'),

      // ==================== CLIENT PERMISSIONS ====================
      canViewClients: hasPermission('clients.view'),
      canViewClientDetails: hasPermission('clients.view_details'),
      canEditClients: hasPermission('clients.edit'),
      canManageClientPricing: hasPermission('clients.manage_pricing'),

      // ==================== REPORT PERMISSIONS ====================
      canViewReports: hasPermission('reports.view'),
      canViewRevenueReports: hasPermission('reports.view_revenue'),
      canViewSupplierPerformance: hasPermission('reports.view_supplier_performance'),
      canViewClientSpend: hasPermission('reports.view_client_spend'),
      canExportReports: hasPermission('reports.export'),

      // ==================== PAYMENT PERMISSIONS ====================
      canViewPayments: hasPermission('payments.view'),
      canProcessPayments: hasPermission('payments.process'),
      canRefundPayments: hasPermission('payments.refund'),
      canMarkSupplierPaid: hasPermission('payments.mark_paid'),

      // ==================== SYSTEM PERMISSIONS ====================
      canViewDashboard: hasPermission('system.view_dashboard'),
      canManageCategories: hasPermission('system.manage_categories'),
      canViewLogs: hasPermission('system.view_logs'),
      canManageSettings: hasPermission('system.manage_settings'),
    };
  }, [role]);
};

export default usePermissions;