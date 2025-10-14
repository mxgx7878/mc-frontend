// src/pages/admin/Dashboard.tsx
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminMenuItems } from '../../utils/menuItems';

const AdminDashboard = () => {

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="bg-white rounded-xl shadow-card p-8">
        <h1 className="text-3xl font-bold text-secondary-900">Admin Dashboard</h1>
        <p className="text-secondary-600 mt-2">System overview and management</p>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;