// FILE PATH: src/config/menuItems.tsx
import {
  Home,
  FolderOpen,
  ShoppingCart,
  Package,
  // Settings,
  Users,
  MapPin,
  // BarChart,
  DollarSign,
  User,
  PlusCircle
} from "lucide-react";
import type { ReactNode } from "react";

interface MenuItem {
  label: string;
  path: string;
  icon: ReactNode;
}

// Client menu
export const clientMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/client/dashboard", icon: <Home size={20} /> },
  { label: "Projects", path: "/client/projects", icon: <FolderOpen size={20} /> },
  { label: "Orders", path: "/client/orders", icon: <ShoppingCart size={20} /> },
  { label: "New Order", path: "/client/orders/create", icon: <PlusCircle size={20} /> },
  // { label: "Products", path: "/client/products", icon: <Package size={20} /> },
  // { label: "Settings", path: "/client/settings", icon: <Settings size={20} /> },
];

// Admin menu
export const adminMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: <Home size={20} /> },
  { label: "Users", path: "/admin/users", icon: <Users size={20} /> },
  { label: "Products", path: "/admin/master-products", icon: <Package size={20} /> },
  { label: "Supplier Delivery Zones", path: "/admin/supplier-zones", icon: <MapPin size={20} /> },
  { label: "Orders", path: "/admin/orders", icon: <ShoppingCart size={20} /> },
  // { label: "Reports", path: "/admin/reports", icon: <BarChart size={20} /> },
  // { label: "Settings", path: "/admin/settings", icon: <Settings size={20} /> },
];

// Supplier menu
export const supplierMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/supplier/dashboard", icon: <Home size={20} /> },
  { label: "My Products", path: "/supplier/products", icon: <Package size={20} /> },
  { label: "Orders", path: "/supplier/orders", icon: <DollarSign size={20} /> },
  { label: "Delivery Zones", path: "/supplier/zones", icon: <MapPin size={20} /> },
  { label: "Profile", path: "/supplier/profile", icon: <User size={20} /> },
  // { label: "Settings", path: "/supplier/settings", icon: <Settings size={20} /> },
];

export type { MenuItem };