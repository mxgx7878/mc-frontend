// src/pages/client/Dashboard.tsx
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientMenuItems } from '../../utils/menuItems';

const ClientDashboard = () => {

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="bg-white rounded-xl shadow-card p-8">
        <h1 className="text-3xl font-bold text-secondary-900">Client Dashboard</h1>
        <p className="text-secondary-600 mt-2">Welcome to your client portal</p>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;