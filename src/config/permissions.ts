// src/config/permissions.ts
// ============================================
// PERMISSION MANAGEMENT SYSTEM
// Single source of truth for all role-based permissions
// ============================================

// Available roles in the system
export type Role = 'admin' | 'support' | 'accountant' | 'supplier' | 'client';

// All available permissions in the system
export type Permission =
  // ==================== PROJECTS ====================
  | 'projects.view_all'        // View all projects (admin area)
  | 'projects.view_own'        // View own projects only
  | 'projects.edit'            // Edit project details
  | 'projects.create'          // Create new projects
  | 'projects.delete'          // Delete/archive projects

  // ==================== ORDERS ====================
  | 'orders.view_all'          // View all orders (admin area)
  | 'orders.view_own'          // View own orders only
  | 'orders.create'            // Create new orders
  | 'orders.edit'              // Edit order details
  | 'orders.mark_delivered'    // Mark order as delivered
  | 'orders.assign_supplier'   // Assign supplier to order items
  | 'orders.cancel'            // Cancel orders
  | 'orders.update_status'     // Update order workflow status

  // ==================== PRICING ====================
  | 'pricing.view_cost_price'      // View supplier cost price
  | 'pricing.view_profit_margin'   // View profit margin
  | 'pricing.edit_supplier_rates'  // Edit supplier rates/offers
  | 'pricing.enter_quoted_rates'   // Enter quoted rates & client surcharges
  | 'pricing.view_client_price'    // View client-facing price

  // ==================== USERS ====================
  | 'users.view'               // View user list
  | 'users.view_details'       // View user details
  | 'users.create'             // Create new users
  | 'users.edit'               // Edit user details
  | 'users.delete'             // Delete/deactivate users
  | 'users.manage_roles'       // Assign/change user roles

  // ==================== PRODUCTS ====================
  | 'products.view'            // View products catalog
  | 'products.create'          // Create master products
  | 'products.edit'            // Edit product details
  | 'products.delete'          // Delete products
  | 'products.approve'         // Approve/reject products & offers

  // ==================== SUPPLIERS ====================
  | 'suppliers.view'           // View suppliers list
  | 'suppliers.view_zones'     // View delivery zones
  | 'suppliers.edit_zones'     // Edit delivery zones
  | 'suppliers.approve'        // Approve supplier accounts
  | 'suppliers.view_offers'    // View supplier offers

  // ==================== CLIENTS ====================
  | 'clients.view'             // View clients list
  | 'clients.view_details'     // View client details
  | 'clients.edit'             // Edit client details
  | 'clients.manage_pricing'   // Manage client-specific pricing

  // ==================== REPORTS ====================
  | 'reports.view'             // View reports section
  | 'reports.view_revenue'     // View revenue reports
  | 'reports.view_supplier_performance' // View supplier performance
  | 'reports.view_client_spend'         // View client spending reports
  | 'reports.export'           // Export report data

  // ==================== PAYMENTS ====================
  | 'payments.view'            // View payments
  | 'payments.process'         // Process payments
  | 'payments.refund'          // Process refunds
  | 'payments.mark_paid'       // Mark supplier as paid

  // ==================== SYSTEM ====================
  | 'system.view_dashboard'    // View admin dashboard
  | 'system.manage_categories' // Manage product categories
  | 'system.view_logs'         // View system logs
  | 'system.manage_settings';  // Manage system settings


// ============================================
// ROLE PERMISSIONS MATRIX
// Maps each role to their allowed permissions
// ============================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // ==================== ADMIN ====================
  // Full access to everything
  admin: [
    // Projects - Full Access
    'projects.view_all',
    'projects.view_own',
    'projects.edit',
    'projects.create',
    'projects.delete',

    // Orders - Full Access
    'orders.view_all',
    'orders.view_own',
    'orders.create',
    'orders.edit',
    'orders.mark_delivered',
    'orders.assign_supplier',
    'orders.cancel',
    'orders.update_status',

    // Pricing - Full Access
    'pricing.view_cost_price',
    'pricing.view_profit_margin',
    'pricing.edit_supplier_rates',
    'pricing.enter_quoted_rates',
    'pricing.view_client_price',

    // Users - Full Access
    'users.view',
    'users.view_details',
    'users.create',
    'users.edit',
    'users.delete',
    'users.manage_roles',

    // Products - Full Access
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'products.approve',

    // Suppliers - Full Access
    'suppliers.view',
    'suppliers.view_zones',
    'suppliers.edit_zones',
    'suppliers.approve',
    'suppliers.view_offers',

    // Clients - Full Access
    'clients.view',
    'clients.view_details',
    'clients.edit',
    'clients.manage_pricing',

    // Reports - Full Access
    'reports.view',
    'reports.view_revenue',
    'reports.view_supplier_performance',
    'reports.view_client_spend',
    'reports.export',

    // Payments - Full Access
    'payments.view',
    'payments.process',
    'payments.refund',
    'payments.mark_paid',

    // System - Full Access
    'system.view_dashboard',
    'system.manage_categories',
    'system.view_logs',
    'system.manage_settings',
  ],

  // ==================== SUPPORT (OPS SUPPORT) ====================
  // Operational support - can manage orders and basic operations
  // NO access to: cost price, profit margin, supplier rate editing
  support: [
    // Projects - View All + Edit
    'projects.view_all',
    'projects.view_own',
    'projects.edit',

    // Orders - Full operational access
    'orders.view_all',
    'orders.view_own',
    'orders.create',
    'orders.edit',
    'orders.mark_delivered',
    'orders.assign_supplier',
    'orders.update_status',

    // Pricing - Can enter quoted rates, but NOT view cost/margin
    'pricing.enter_quoted_rates',
    'pricing.view_client_price',

    // Users - View and basic management
    'users.view',
    'users.view_details',
    'users.create',
    'users.edit',

    // Products - View only
    'products.view',

    // Suppliers - View only
    'suppliers.view',
    'suppliers.view_zones',
    'suppliers.view_offers',

    // Clients - View and edit
    'clients.view',
    'clients.view_details',
    'clients.edit',

    // System
    'system.view_dashboard',
  ],

  // ==================== ACCOUNTANT ====================
  // Financial oversight - Read-only for most, but can see all financial data
  // NO access to: editing, creating, operational actions
  accountant: [
    // Projects - Read Only
    'projects.view_all',
    'projects.view_own',
    // NO edit, create, delete

    // Orders - View Only
    'orders.view_all',
    'orders.view_own',
    // NO create, edit, mark_delivered, assign

    // Pricing - Full visibility (READ ONLY)
    'pricing.view_cost_price',
    'pricing.view_profit_margin',
    'pricing.view_client_price',
    // NO editing capabilities

    // Users - View Only
    'users.view',
    'users.view_details',
    // NO create, edit, delete

    // Products - View Only
    'products.view',

    // Suppliers - View Only
    'suppliers.view',
    'suppliers.view_zones',
    'suppliers.view_offers',

    // Clients - View Only
    'clients.view',
    'clients.view_details',

    // Reports - Full Access (primary role function)
    'reports.view',
    'reports.view_revenue',
    'reports.view_supplier_performance',
    'reports.view_client_spend',
    'reports.export',

    // Payments - View and mark paid
    'payments.view',
    'payments.mark_paid',

    // System
    'system.view_dashboard',
  ],

  // ==================== SUPPLIER ====================
  // Own data only + delivery management
  supplier: [
    // Projects - None (suppliers don't see projects)
    
    // Orders - Own orders only
    'orders.view_own',
    'orders.mark_delivered', // Own orders only

    // Pricing - Can see their own cost price
    'pricing.view_cost_price',
    'pricing.view_profit_margin',

    // Products - Manage own offers
    'products.view',
    'products.create', // Request new products

    // Suppliers - Own data
    'suppliers.view_zones',
    'suppliers.edit_zones',
    'suppliers.view_offers',
  ],

  // ==================== CLIENT ====================
  // Own data only
  client: [
    // Projects - Own only
    'projects.view_own',
    'projects.create',
    'projects.edit', // Own only

    // Orders - Own only
    'orders.view_own',
    'orders.create',

    // Pricing - Client price only
    'pricing.view_client_price',

    // Products - View catalog
    'products.view',
  ],
};


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a role has a specific permission
 */
export const roleHasPermission = (role: Role, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] ?? [];
};

/**
 * Check if role can access admin area
 */
export const canAccessAdminArea = (role: Role): boolean => {
  return ['admin', 'support', 'accountant'].includes(role);
};

/**
 * Get display name for a role
 */
export const getRoleDisplayName = (role: Role): string => {
  const names: Record<Role, string> = {
    admin: 'Administrator',
    support: 'Ops Support',
    accountant: 'Accounts',
    supplier: 'Supplier',
    client: 'Client',
  };
  return names[role] ?? role;
};

/**
 * Get role badge color classes
 */
export const getRoleBadgeStyles = (role: Role): string => {
  const styles: Record<Role, string> = {
    admin: 'bg-error-100 text-error-700 border-error-200',
    support: 'bg-warning-100 text-warning-700 border-warning-200',
    accountant: 'bg-purple-100 text-purple-700 border-purple-200',
    supplier: 'bg-success-100 text-success-700 border-success-200',
    client: 'bg-primary-100 text-primary-700 border-primary-200',
  };
  return styles[role] ?? 'bg-secondary-100 text-secondary-700 border-secondary-200';
};

/**
 * Get role icon
 */
export const getRoleIcon = (role: Role): string => {
  const icons: Record<Role, string> = {
    admin: '👑',
    support: '🎧',
    accountant: '💼',
    supplier: '🏢',
    client: '👤',
  };
  return icons[role] ?? '👤';
};