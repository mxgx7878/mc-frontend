// src/utils/menuItems.tsx
// ============================================
// MENU ITEMS WITH PERMISSION-BASED FILTERING
// ============================================
// NOTE: This file MUST be .tsx (not .ts) because it contains JSX

import {
  Home,
  Users,
  Package,
  ShoppingCart,
  MapPin,
  FolderOpen,
  DollarSign,
  User,
  PlusCircle,
  CreditCard,
  Archive,
  Tags,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Role } from '../config/permissions';

// ==================== TYPES ====================

export interface MenuItem {
  label: string;
  path: string;
  icon: ReactNode;
}

// ==================== CLIENT MENU ====================

export const clientMenuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/client/dashboard', icon: <Home size={20} /> },
  { label: 'Projects', path: '/client/projects', icon: <FolderOpen size={20} /> },
  { label: 'Orders', path: '/client/orders', icon: <ShoppingCart size={20} /> },
  { label: 'New Order', path: '/client/orders/create', icon: <PlusCircle size={20} /> },
];

// ==================== ADMIN MENU (Full Access) ====================

export const adminMenuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
  { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
  { label: 'Products', path: '/admin/master-products', icon: <Package size={20} /> },
  { label: 'Supplier Zones', path: '/admin/supplier-zones', icon: <MapPin size={20} /> },
  { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
  { label: 'Archives', path: '/admin/archives', icon: <Archive size={20} /> },
  // { label: 'Payments', path: '/admin/payments', icon: <CreditCard size={20} /> },
  // { label: 'Reports', path: '/admin/reports', icon: <BarChart3 size={20} /> },
  // { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
];

// ==================== SUPPLIER MENU ====================

export const supplierMenuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/supplier/dashboard', icon: <Home size={20} /> },
  { label: 'Platform Products', path: '/supplier/products', icon: <Package size={20} /> },
  { label: 'My Offers', icon: <Tags size={20} />, path: '/supplier/my-offers'},
  { label: 'Orders', path: '/supplier/orders', icon: <DollarSign size={20} /> },
  { label: 'Delivery Zones', path: '/supplier/zones', icon: <MapPin size={20} /> },
  { label: 'Profile', path: '/supplier/profile', icon: <User size={20} /> },
];

// ==================== SUPPORT MENU (Ops Support) ====================
// Can: view all, edit projects, create orders, mark delivered, enter quoted rates
// Cannot: view cost price, view profit margin, edit supplier rates

export const supportMenuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
  { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
  { label: 'Products', path: '/admin/master-products', icon: <Package size={20} /> },
  { label: 'Supplier Zones', path: '/admin/supplier-zones', icon: <MapPin size={20} /> },
  { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
  // No Payments, Reports, or Settings for Support
];

// ==================== ACCOUNTANT MENU ====================
// Can: view all (read-only), view cost price, view profit margin, reports
// Cannot: edit anything, create orders, mark delivered

export const accountantMenuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
  { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
  { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
  { label: 'Xero (Coming Soon)', path: '/admin/dashboard', icon: <CreditCard size={20} /> },
  // { label: 'Reports', path: '/admin/reports', icon: <BarChart3 size={20} /> },
  // No Products, Supplier Zones, or Settings for Accountant
];

// ==================== MENU GETTER BY ROLE ====================

/**
 * Get menu items based on user role
 * Returns the appropriate menu items for each role
 */
export const getMenuItemsByRole = (role: Role | null | undefined): MenuItem[] => {
  if (!role) {
    return []; // Return empty array if no role
  }
  
  switch (role) {
    case 'admin':
      return adminMenuItems;
    case 'support':
      return supportMenuItems;
    case 'accountant':
      return accountantMenuItems;
    case 'supplier':
      return supplierMenuItems;
    case 'client':
      return clientMenuItems;
    default:
      return [];
  }
};