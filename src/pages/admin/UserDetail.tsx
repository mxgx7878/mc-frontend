// src/pages/admin/UserDetail.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  Building2,
  MapPin,
  User as UserIcon,
  Calendar,
  Shield,
  Package,
  Truck,
  Home,
  Users,
  ShoppingCart,
  Settings,
  BarChart,
  CreditCard
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Buttons';
import { usersAPI } from '../../api/handlers/users.api';

// Role Badge Component
const RoleBadge = ({ role }: { role: 'admin' | 'client' | 'supplier' }) => {
  const styles = {
    admin: 'bg-error-100 text-error-700 border-error-200',
    client: 'bg-primary-100 text-primary-700 border-primary-200',
    supplier: 'bg-success-100 text-success-700 border-success-200',
  };

  const icons = {
    admin: '👑',
    client: '👤',
    supplier: '🏢',
  };

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${styles[role]}`}>
      <span className="text-lg">{icons[role]}</span>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

// Info Row Component
const InfoRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-4 py-4 border-b border-secondary-100 last:border-0">
    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
      <Icon size={20} className="text-primary-600" />
    </div>
    <div className="flex-1">
      <p className="text-sm text-secondary-500 mb-1">{label}</p>
      <p className="text-base font-medium text-secondary-900">{value || 'N/A'}</p>
    </div>
  </div>
);

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { label: 'Products', path: '/admin/products', icon: <Package size={20} /> },
    { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
    { label: 'Reports', path: '/admin/reports', icon: <BarChart size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  // Fetch User Details
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getUser(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout menuItems={menuItems}>
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout menuItems={menuItems}>
        <div className="text-center py-12">
          <p className="text-error-500 mb-4">Failed to load user details</p>
          <Button onClick={() => navigate('/admin/users')} variant="outline" fullWidth={false}>
            <ArrowLeft size={20} />
            Back to Users
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Users
          </button>
          <Button
            onClick={() => navigate(`/admin/users/${id}/edit`)}
            variant="primary"
            fullWidth={false}
          >
            <Edit2 size={20} />
            Edit User
          </Button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Header Section with Profile Image */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                {user.profile_image ? (
                  <img
                    src={`${import.meta.env.VITE_IMAGE_BASE_URL}${user.profile_image}`}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-primary-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                <div className="flex items-center gap-4">
                  <RoleBadge role={user.role} />
                  {user.client_public_id && (
                    <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm font-medium">
                      ID: {user.client_public_id}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
              <UserIcon size={24} className="text-primary-600" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <InfoRow icon={Mail} label="Email Address" value={user.email} />
                <InfoRow icon={Phone} label="Contact Number" value={user.contact_number} />
                <InfoRow icon={UserIcon} label="Contact Person" value={user.contact_name} />
              </div>
              <div className="space-y-4">
                <InfoRow icon={Building2} label="Company" value={user.company?.name} />
                <InfoRow icon={Calendar} label="Joined Date" value={new Date(user.created_at).toLocaleDateString()} />
                <InfoRow 
                  icon={Shield} 
                  label="Status" 
                  value={
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.isDeleted 
                        ? 'bg-error-100 text-error-700' 
                        : 'bg-success-100 text-success-700'
                    }`}>
                      {user.isDeleted ? 'Deleted' : 'Active'}
                    </span>
                  } 
                />
              </div>
            </div>
          </div>

          {/* Client-Specific Information */}
          {user.role === 'client' && (
            <div className="border-t border-secondary-200 p-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
                <MapPin size={24} className="text-primary-600" />
                Address Information
              </h2>
              <div className="space-y-4">
                <InfoRow icon={Home} label="Shipping Address" value={user.shipping_address} />
                <InfoRow icon={CreditCard} label="Billing Address" value={user.billing_address} />
                {user.lat && user.long && (
                  <InfoRow 
                    icon={MapPin} 
                    label="Coordinates" 
                    value={`${user.lat.toFixed(6)}, ${user.long.toFixed(6)}`} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Supplier-Specific Information */}
          {user.role === 'supplier' && (
            <div className="border-t border-secondary-200 p-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
                <Truck size={24} className="text-primary-600" />
                Business Information
              </h2>
              <div className="space-y-4">
                <InfoRow icon={MapPin} label="Business Location" value={user.location} />
                <InfoRow 
                  icon={Truck} 
                  label="Delivery Radius" 
                  value={user.delivery_radius ? `${user.delivery_radius} km` : 'N/A'} 
                />
              </div>
            </div>
          )}

          {/* Notes Section (if exists) */}
          {user.notes && (
            <div className="border-t border-secondary-200 p-8 bg-secondary-50">
              <h2 className="text-xl font-bold text-secondary-900 mb-4">Notes</h2>
              <p className="text-secondary-700 whitespace-pre-wrap">{user.notes}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDetail;