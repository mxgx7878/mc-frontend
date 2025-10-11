// src/pages/client/Dashboard.tsx
import { Home, Package, ShoppingCart, FolderOpen, Settings,FolderKanban  } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ClientDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <Home size={20} /> },
    { label: 'Projects', path: '/client/projects', icon: <FolderOpen size={20} /> },
    { label: 'Orders', path: '/client/orders', icon: <ShoppingCart size={20} /> },
    { label: 'Products', path: '/client/products', icon: <Package size={20} /> },
    { label: 'Settings', path: '/client/settings', icon: <Settings size={20} /> },
  ];

  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="bg-white rounded-xl shadow-card p-8">
        <h1 className="text-3xl font-bold text-secondary-900">Client Dashboard</h1>
        <p className="text-secondary-600 mt-2">Welcome to your client portal</p>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;