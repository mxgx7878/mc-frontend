// src/pages/admin/Dashboard.tsx
import { Home, Users, Package, ShoppingCart, Settings, BarChart, MapPin } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const AdminDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { label: 'Products', path: '/admin/master-products', icon: <Package size={20} /> },
    { label: 'Supplier Delivery Zones', path: '/admin/supplier-zones', icon: <MapPin size={20} /> },
    { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
    { label: 'Reports', path: '/admin/reports', icon: <BarChart size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="bg-white rounded-xl shadow-card p-8">
        <h1 className="text-3xl font-bold text-secondary-900">Admin Dashboard</h1>
        <p className="text-secondary-600 mt-2">System overview and management</p>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;