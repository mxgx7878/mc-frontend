// src/pages/supplier/DeliveryZones.tsx
import { Home, Package, DollarSign, MapPin, Settings, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DeliveryZonesManagement from '../../components/supplier/DeliveryZonesManagement';

const DeliveryZonesPage = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/supplier/dashboard', icon: <Home size={20} /> },
    { label: 'My Products', path: '/supplier/products', icon: <Package size={20} /> },
    { label: 'Orders', path: '/supplier/orders', icon: <DollarSign size={20} /> },
    { label: 'Delivery Zones', path: '/supplier/zones', icon: <MapPin size={20} /> },
    { label: 'Profile', path: '/supplier/profile', icon: <User size={20} /> },
    { label: 'Settings', path: '/supplier/settings', icon: <Settings size={20} /> },
  ];

  return (
    <DashboardLayout menuItems={menuItems}>
      <DeliveryZonesManagement />
    </DashboardLayout>
  );
};

export default DeliveryZonesPage;