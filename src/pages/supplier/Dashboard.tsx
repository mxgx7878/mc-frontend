// src/pages/supplier/Dashboard.tsx
import { Home, Package, DollarSign, MapPin, Settings, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const SupplierDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/supplier/dashboard', icon: <Home size={20} /> },
    { label: 'My Products', path: '/supplier/products', icon: <Package size={20} /> },
    { label: 'Orders', path: '/supplier/orders', icon: <DollarSign size={20} /> },
    { label: 'Delivery Zones', path: '/supplier/zones', icon: <MapPin size={20} /> }, // 👈 ADD THIS
    { label: 'Profile', path: '/supplier/profile', icon: <User size={20} /> },
    { label: 'Settings', path: '/supplier/settings', icon: <Settings size={20} /> },
  ];

  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="bg-white rounded-xl shadow-card p-8">
        <h1 className="text-3xl font-bold text-secondary-900">Supplier Dashboard</h1>
        <p className="text-secondary-600 mt-2">Manage your products and orders</p>
      </div>
    </DashboardLayout>
  );
};

export default SupplierDashboard;