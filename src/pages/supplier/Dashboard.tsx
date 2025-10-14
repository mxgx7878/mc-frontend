// src/pages/supplier/Dashboard.tsx
import DashboardLayout from '../../components/layout/DashboardLayout';
import {supplierMenuItems} from '../../utils/menuItems';

const SupplierDashboard = () => {

  return (
    <DashboardLayout menuItems={supplierMenuItems}>
      <div className="bg-white rounded-xl shadow-card p-8">
        <h1 className="text-3xl font-bold text-secondary-900">Supplier Dashboard</h1>
        <p className="text-secondary-600 mt-2">Manage your products and orders</p>
      </div>
    </DashboardLayout>
  );
};

export default SupplierDashboard;