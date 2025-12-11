// // src/utils/menuItems.ts
// // ============================================
// // MENU ITEMS WITH PERMISSION-BASED FILTERING
// // ============================================

// import {
//   LayoutDashboard,
//   Users,
//   Package,
//   ShoppingCart,
//   Settings,
//   MapPin,
//   Building2,
//   Truck,
//   FolderKanban,
//   CreditCard,
//   BarChart3,
//   Tags,
//   type LucideIcon,
// } from 'lucide-react';
// import { Permission, Role, roleHasPermission } from '../config/permissions';

// // ==================== TYPES ====================

// export interface MenuItem {
//   id: string;
//   label: string;
//   icon: LucideIcon;
//   path: string;
//   /** Permissions required to see this menu item (any one is enough) */
//   permissions?: Permission[];
//   /** If true, requires ALL permissions */
//   requireAllPermissions?: boolean;
//   /** Specific roles that can see this (bypasses permissions) */
//   allowedRoles?: Role[];
//   /** Badge count (optional) */
//   badge?: number;
//   /** Sub-menu items */
//   children?: MenuItem[];
// }

// // ==================== ADMIN MENU ITEMS (RAW) ====================
// // These are all the menu items - filtering happens based on role

// const allAdminMenuItems: MenuItem[] = [
//   {
//     id: 'dashboard',
//     label: 'Dashboard',
//     icon: LayoutDashboard,
//     path: '/admin/dashboard',
//     permissions: ['system.view_dashboard'],
//   },
//   {
//     id: 'users',
//     label: 'User Management',
//     icon: Users,
//     path: '/admin/users',
//     permissions: ['users.view'],
//   },
//   {
//     id: 'orders',
//     label: 'Orders',
//     icon: ShoppingCart,
//     path: '/admin/orders',
//     permissions: ['orders.view_all'],
//   },
//   {
//     id: 'master-products',
//     label: 'Master Products',
//     icon: Package,
//     path: '/admin/master-products',
//     permissions: ['products.view'],
//   },
//   {
//     id: 'categories',
//     label: 'Categories',
//     icon: Tags,
//     path: '/admin/categories',
//     permissions: ['system.manage_categories'],
//     allowedRoles: ['admin'], // Only admin can manage categories
//   },
//   {
//     id: 'supplier-zones',
//     label: 'Supplier Zones',
//     icon: MapPin,
//     path: '/admin/supplier-zones',
//     permissions: ['suppliers.view_zones'],
//   },
//   {
//     id: 'clients',
//     label: 'Clients',
//     icon: Building2,
//     path: '/admin/clients',
//     permissions: ['clients.view'],
//   },
//   {
//     id: 'suppliers',
//     label: 'Suppliers',
//     icon: Truck,
//     path: '/admin/suppliers',
//     permissions: ['suppliers.view'],
//   },
//   {
//     id: 'projects',
//     label: 'Projects',
//     icon: FolderKanban,
//     path: '/admin/projects',
//     permissions: ['projects.view_all'],
//   },
//   {
//     id: 'payments',
//     label: 'Payments',
//     icon: CreditCard,
//     path: '/admin/payments',
//     permissions: ['payments.view'],
//   },
//   {
//     id: 'reports',
//     label: 'Reports',
//     icon: BarChart3,
//     path: '/admin/reports',
//     permissions: ['reports.view'],
//   },
//   {
//     id: 'settings',
//     label: 'Settings',
//     icon: Settings,
//     path: '/admin/settings',
//     permissions: ['system.manage_settings'],
//     allowedRoles: ['admin'], // Only admin can access settings
//   },
// ];

// // ==================== FILTER FUNCTION ====================

// /**
//  * Filter menu items based on user's role and permissions
//  */
// export const filterMenuItemsByRole = (items: MenuItem[], role: Role): MenuItem[] => {
//   return items.filter((item) => {
//     // Check allowedRoles first (bypasses permissions)
//     if (item.allowedRoles && item.allowedRoles.length > 0) {
//       if (!item.allowedRoles.includes(role)) {
//         return false;
//       }
//       return true;
//     }

//     // Check permissions
//     if (item.permissions && item.permissions.length > 0) {
//       if (item.requireAllPermissions) {
//         // Require ALL permissions
//         return item.permissions.every((perm) => roleHasPermission(role, perm));
//       } else {
//         // Require ANY permission
//         return item.permissions.some((perm) => roleHasPermission(role, perm));
//       }
//     }

//     // No restrictions, show the item
//     return true;
//   });
// };

// /**
//  * Get filtered admin menu items for a specific role
//  */
// export const getAdminMenuItems = (role: Role): MenuItem[] => {
//   return filterMenuItemsByRole(allAdminMenuItems, role);
// };

// // ==================== STATIC EXPORTS (for backwards compatibility) ====================

// // Full admin menu (for actual admin role)
// export const adminMenuItems: MenuItem[] = [
//   {
//     id: 'dashboard',
//     label: 'Dashboard',
//     icon: LayoutDashboard,
//     path: '/admin/dashboard',
//   },
//   {
//     id: 'users',
//     label: 'User Management',
//     icon: Users,
//     path: '/admin/users',
//   },
//   {
//     id: 'orders',
//     label: 'Orders',
//     icon: ShoppingCart,
//     path: '/admin/orders',
//   },
//   {
//     id: 'master-products',
//     label: 'Master Products',
//     icon: Package,
//     path: '/admin/master-products',
//   },
//   {
//     id: 'categories',
//     label: 'Categories',
//     icon: Tags,
//     path: '/admin/categories',
//   },
//   {
//     id: 'supplier-zones',
//     label: 'Supplier Zones',
//     icon: MapPin,
//     path: '/admin/supplier-zones',
//   },
//   {
//     id: 'clients',
//     label: 'Clients',
//     icon: Building2,
//     path: '/admin/clients',
//   },
//   {
//     id: 'suppliers',
//     label: 'Suppliers',
//     icon: Truck,
//     path: '/admin/suppliers',
//   },
//   {
//     id: 'projects',
//     label: 'Projects',
//     icon: FolderKanban,
//     path: '/admin/projects',
//   },
//   {
//     id: 'payments',
//     label: 'Payments',
//     icon: CreditCard,
//     path: '/admin/payments',
//   },
//   {
//     id: 'reports',
//     label: 'Reports',
//     icon: BarChart3,
//     path: '/admin/reports',
//   },
//   {
//     id: 'settings',
//     label: 'Settings',
//     icon: Settings,
//     path: '/admin/settings',
//   },
// ];

// // Client menu items
// export const clientMenuItems: MenuItem[] = [
//   {
//     id: 'dashboard',
//     label: 'Dashboard',
//     icon: LayoutDashboard,
//     path: '/client/dashboard',
//   },
//   {
//     id: 'projects',
//     label: 'My Projects',
//     icon: FolderKanban,
//     path: '/client/projects',
//   },
//   {
//     id: 'orders',
//     label: 'My Orders',
//     icon: ShoppingCart,
//     path: '/client/orders',
//   },
//   {
//     id: 'profile',
//     label: 'Profile',
//     icon: Users,
//     path: '/client/profile',
//   },
// ];

// // Supplier menu items
// export const supplierMenuItems: MenuItem[] = [
//   {
//     id: 'dashboard',
//     label: 'Dashboard',
//     icon: LayoutDashboard,
//     path: '/supplier/dashboard',
//   },
//   {
//     id: 'products',
//     label: 'My Products',
//     icon: Package,
//     path: '/supplier/products',
//   },
//   {
//     id: 'orders',
//     label: 'Orders',
//     icon: ShoppingCart,
//     path: '/supplier/orders',
//   },
//   {
//     id: 'delivery-zones',
//     label: 'Delivery Zones',
//     icon: MapPin,
//     path: '/supplier/delivery-zones',
//   },
//   {
//     id: 'profile',
//     label: 'Profile',
//     icon: Users,
//     path: '/supplier/profile',
//   },
// ];

// // ==================== ROLE-SPECIFIC ADMIN MENUS ====================

// // Support role menu (limited admin access)
// export const supportMenuItems: MenuItem[] = [
//   {
//     id: 'dashboard',
//     label: 'Dashboard',
//     icon: LayoutDashboard,
//     path: '/admin/dashboard',
//   },
//   {
//     id: 'users',
//     label: 'User Management',
//     icon: Users,
//     path: '/admin/users',
//   },
//   {
//     id: 'orders',
//     label: 'Orders',
//     icon: ShoppingCart,
//     path: '/admin/orders',
//   },
//   {
//     id: 'master-products',
//     label: 'Master Products',
//     icon: Package,
//     path: '/admin/master-products',
//   },
//   {
//     id: 'supplier-zones',
//     label: 'Supplier Zones',
//     icon: MapPin,
//     path: '/admin/supplier-zones',
//   },
//   {
//     id: 'clients',
//     label: 'Clients',
//     icon: Building2,
//     path: '/admin/clients',
//   },
//   {
//     id: 'suppliers',
//     label: 'Suppliers',
//     icon: Truck,
//     path: '/admin/suppliers',
//   },
//   {
//     id: 'projects',
//     label: 'Projects',
//     icon: FolderKanban,
//     path: '/admin/projects',
//   },
// ];

// // Accountant role menu (read-only focus + reports)
// export const accountantMenuItems: MenuItem[] = [
//   {
//     id: 'dashboard',
//     label: 'Dashboard',
//     icon: LayoutDashboard,
//     path: '/admin/dashboard',
//   },
//   {
//     id: 'orders',
//     label: 'Orders',
//     icon: ShoppingCart,
//     path: '/admin/orders',
//   },
//   {
//     id: 'users',
//     label: 'Users',
//     icon: Users,
//     path: '/admin/users',
//   },
//   {
//     id: 'clients',
//     label: 'Clients',
//     icon: Building2,
//     path: '/admin/clients',
//   },
//   {
//     id: 'suppliers',
//     label: 'Suppliers',
//     icon: Truck,
//     path: '/admin/suppliers',
//   },
//   {
//     id: 'payments',
//     label: 'Payments',
//     icon: CreditCard,
//     path: '/admin/payments',
//   },
//   {
//     id: 'reports',
//     label: 'Reports',
//     icon: BarChart3,
//     path: '/admin/reports',
//   },
// ];

// // ==================== MENU GETTER BY ROLE ====================

// /**
//  * Get menu items based on user role
//  */
// export const getMenuItemsByRole = (role: Role): MenuItem[] => {
//   switch (role) {
//     case 'admin':
//       return adminMenuItems;
//     case 'support':
//       return supportMenuItems;
//     case 'accountant':
//       return accountantMenuItems;
//     case 'supplier':
//       return supplierMenuItems;
//     case 'client':
//       return clientMenuItems;
//     default:
//       return [];
//   }
// };