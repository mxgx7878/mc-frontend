// src/pages/admin/UserManagement.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { PaginatedUsers, User, UserFilters } from '../../api/handlers/users.api';
import { 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Buttons';
import { usersAPI, companiesAPI } from '../../api/handlers/users.api';
import { adminMenuItems } from '../../utils/menuItems';


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
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${styles[role]}`}>
      <span>{icons[role]}</span>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

const UserManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [filters, setFilters] = useState<UserFilters>({
    role: '',
    company_id: '',
    page: 1,
    per_page: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setFilters(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);


  // Fetch Companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesAPI.getAll,
  });

  // Build query params
  const queryParams: UserFilters = {
    ...filters,
    isDeleted: activeTab === 'deleted',
    contact_name: debouncedSearch || undefined,
  };

  // fetch users
const { data: usersData, isLoading, error } = useQuery<PaginatedUsers>({
  queryKey: ['users', queryParams],
  queryFn: () => usersAPI.getUsers(queryParams),
  placeholderData: keepPreviousData,
});

  // Delete/Restore Mutation
  const deleteRestoreMutation = useMutation({
    mutationFn: usersAPI.deleteRestoreUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'User status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });

  // Handlers
  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleTabChange = (tab: 'active' | 'deleted') => {
    setActiveTab(tab);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // In UserManagement.tsx (line ~180)
const handleDeleteRestore = (userId: number, isDeleted: boolean) => {
  const action = isDeleted ? 'restore' : 'delete';
  if (window.confirm(`Are you sure you want to ${action} this user?`)) {
    deleteRestoreMutation.mutate(userId);
  }
};

  const clearFilters = () => {
    setFilters({
      role: '',
      company_id: '',
      page: 1,
      per_page: 10,
    });
    setSearchTerm('');
  };

  const users = usersData?.data || [];
  const pagination = {
    currentPage: usersData?.current_page || 1,
    lastPage: usersData?.last_page || 1,
    total: usersData?.total || 0,
    from: usersData?.from || 0,
    to: usersData?.to || 0,
  };

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">User Management</h1>
            <p className="text-secondary-600 mt-1">Manage system users and permissions</p>
          </div>
          <Button
            onClick={() => navigate('/admin/users/create')}
            variant="primary"
            fullWidth={false}
          >
            <UserPlus size={20} />
            Add User
          </Button>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-secondary-200">
            <div className="flex gap-1 p-1">
              <button
                onClick={() => handleTabChange('active')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'active'
                    ? 'bg-primary-50 text-primary-600 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                Active Users
                {activeTab === 'active' && pagination.total > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                    {pagination.total}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('deleted')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'deleted'
                    ? 'bg-primary-50 text-primary-600 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                Deleted Users
                {activeTab === 'deleted' && pagination.total > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full text-xs">
                    {pagination.total}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="border-b border-secondary-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" 
                    size={20} 
                  />
                  <input
                    type="text"
                    placeholder="Search by name, contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="px-4 py-3 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
                <option value="supplier">Supplier</option>
              </select>

              {/* Company Filter */}
              <select
                value={filters.company_id}
                onChange={(e) => handleFilterChange('company_id', e.target.value)}
                className="px-4 py-3 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
              >
                <option value="">All Companies</option>
                {companies.map((company: any) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(filters.role || filters.company_id || searchTerm) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  <p className="text-secondary-500">Loading users...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-error-500">
                <p className="mb-2">Failed to load users</p>
                <button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-secondary-500">
                <p className="mb-2">No users found</p>
                {(filters.role || filters.company_id || searchTerm) && (
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {users.map((user: User) => (
                    <tr key={user.id} className="hover:bg-secondary-50 transition-colors">
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            {user.profile_image ? (
                              <img
                                src={`${import.meta.env.VITE_IMAGE_BASE_URL}${user.profile_image}`}
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-primary-600 font-semibold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900">{user.name}</p>
                            <p className="text-sm text-secondary-500 flex items-center gap-1">
                              <Mail size={12} />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* Company */}
                      <td className="px-6 py-4">
                        {user.company ? (
                          <div className="flex items-center gap-2 text-sm text-secondary-700">
                            <Building2 size={14} className="text-secondary-400" />
                            {user.company.name}
                          </div>
                        ) : (
                          <span className="text-secondary-400 text-sm">N/A</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-secondary-900">{user.contact_name || 'N/A'}</p>
                          {user.contact_number && (
                            <p className="text-secondary-500 flex items-center gap-1 mt-1">
                              <Phone size={12} />
                              {user.contact_number}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        {user.location ? (
                          <div className="flex items-center gap-1 text-sm text-secondary-700">
                            <MapPin size={14} className="text-secondary-400" />
                            <span className="truncate max-w-[150px]">{user.location}</span>
                          </div>
                        ) : (
                          <span className="text-secondary-400 text-sm">N/A</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                            className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteRestore(user.id, user.isDeleted)}
                            disabled={deleteRestoreMutation.isPending}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              user.isDeleted
                                ? 'text-success-600 hover:bg-success-50'
                                : 'text-error-600 hover:bg-error-50'
                            }`}
                            title={user.isDeleted ? 'Restore User' : 'Delete User'}
                          >
                            {user.isDeleted ? <RotateCcw size={18} /> : <Trash2 size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && users.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-secondary-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary-600">
                  Showing {pagination.from} to {pagination.to} of {pagination.total} users
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Per Page Selector */}
                <select
                  value={filters.per_page}
                  onChange={(e) => handleFilterChange('per_page', Number(e.target.value))}
                  className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <span className="text-sm text-secondary-700 px-3">
                    Page {pagination.currentPage} of {pagination.lastPage}
                  </span>

                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.lastPage}
                    className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;