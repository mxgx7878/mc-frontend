// FILE PATH: src/pages/admin/Archives.tsx

/**
 * Admin Archives Page
 * Displays archived Orders, Users, and Projects in tabs
 * Admin only - view and restore archived items
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  ShoppingCart,
  Users,
  FolderOpen,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
  Building2,
  Package,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminMenuItems } from '../../utils/menuItems';
import { archivesAPI, type ArchiveParams } from '../../api/handlers/archives.api';

// Tab type
type TabType = 'orders' | 'users' | 'projects';

const Archives = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  
  // Pagination state for each tab
  const [pagination, setPagination] = useState({
    orders_page: 1,
    users_page: 1,
    projects_page: 1,
    per_page: 10,
  });

  // Build params for API
  const getParams = (): ArchiveParams => ({
    orders_per_page: pagination.per_page,
    users_per_page: pagination.per_page,
    projects_per_page: pagination.per_page,
  });

  // Fetch archives data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['archives', pagination],
    queryFn: () => archivesAPI.getArchives(getParams()),
  });

  // Handle page change
  const handlePageChange = (tab: TabType, page: number) => {
    setPagination((prev) => ({
      ...prev,
      [`${tab}_page`]: page,
    }));
  };

  // Navigation handlers
  const handleViewOrder = (orderId: number) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleViewUser = (userId: number) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleViewProject = (projectId: number) => {
    navigate(`/client/projects/${projectId}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  // Tab configuration
  const tabs = [
    {
      id: 'orders' as TabType,
      label: 'Orders',
      icon: ShoppingCart,
      count: data?.data?.orders?.total || 0,
      color: 'blue',
    },
    {
      id: 'users' as TabType,
      label: 'Users',
      icon: Users,
      count: data?.data?.users?.total || 0,
      color: 'purple',
    },
    {
      id: 'projects' as TabType,
      label: 'Projects',
      icon: FolderOpen,
      count: data?.data?.projects?.total || 0,
      color: 'green',
    },
  ];

  // Render pagination
  const renderPagination = (
    currentPage: number,
    lastPage: number,
    total: number,
    tab: TabType
  ) => {
    if (total === 0) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Showing page {currentPage} of {lastPage} ({total} items)
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(tab, currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            {currentPage} / {lastPage}
          </span>
          <button
            onClick={() => handlePageChange(tab, currentPage + 1)}
            disabled={currentPage === lastPage}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  // Render Orders Table
  const renderOrdersTable = () => {
    const orders = data?.data?.orders?.data || [];
    const paginationData = data?.data?.orders;

    if (orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Archive size={48} className="mb-4 text-gray-300" />
          <p className="text-lg font-medium">No archived orders</p>
          <p className="text-sm">Archived orders will appear here</p>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Archived On
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-blue-600">
                      {order.po_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {order.project?.name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {order.client?.name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.total_price)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={14} />
                      {formatDate(order.updated_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginationData && renderPagination(
          paginationData.current_page,
          paginationData.last_page,
          paginationData.total,
          'orders'
        )}
      </>
    );
  };

  // Render Users Table
  const renderUsersTable = () => {
    const users = data?.data?.users?.data || [];
    const paginationData = data?.data?.users;

    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Archive size={48} className="mb-4 text-gray-300" />
          <p className="text-lg font-medium">No archived users</p>
          <p className="text-sm">Archived users will appear here</p>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Archived On
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {user.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {user.email}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-700'
                        : user.role === 'supplier'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Building2 size={14} />
                      {user.company?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={14} />
                      {formatDate(user.updated_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleViewUser(user.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginationData && renderPagination(
          paginationData.current_page,
          paginationData.last_page,
          paginationData.total,
          'users'
        )}
      </>
    );
  };

  // Render Projects Table
  const renderProjectsTable = () => {
    const projects = data?.data?.projects?.data || [];
    const paginationData = data?.data?.projects;

    if (projects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Archive size={48} className="mb-4 text-gray-300" />
          <p className="text-lg font-medium">No archived projects</p>
          <p className="text-sm">Archived projects will appear here</p>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Archived On
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {project.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {project.added_by?.name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 line-clamp-1">
                      {project.delivery_address || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={14} />
                      {formatDate(project.updated_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleViewProject(project.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginationData && renderPagination(
          paginationData.current_page,
          paginationData.last_page,
          paginationData.total,
          'projects'
        )}
      </>
    );
  };

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Archive className="w-8 h-8 text-gray-600" />
              Archives
            </h1>
            <p className="text-gray-600 mt-1">
              View archived orders, users, and projects
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Refresh'
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative bg-white rounded-xl border-2 p-6 cursor-pointer transition-all ${
                activeTab === tab.id
                  ? `border-${tab.color}-500 shadow-lg`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  tab.color === 'blue' ? 'bg-blue-100' :
                  tab.color === 'purple' ? 'bg-purple-100' : 'bg-green-100'
                }`}>
                  <tab.icon size={24} className={
                    tab.color === 'blue' ? 'text-blue-600' :
                    tab.color === 'purple' ? 'text-purple-600' : 'text-green-600'
                  } />
                </div>
                <span className={`text-3xl font-bold ${
                  tab.color === 'blue' ? 'text-blue-600' :
                  tab.color === 'purple' ? 'text-purple-600' : 'text-green-600'
                }`}>
                  {isLoading ? '-' : tab.count}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-700">
                Archived {tab.label}
              </p>
              {activeTab === tab.id && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${
                  tab.color === 'blue' ? 'bg-blue-500' :
                  tab.color === 'purple' ? 'bg-purple-500' : 'bg-green-500'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? tab.color === 'blue' 
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : tab.color === 'purple'
                        ? 'border-purple-500 text-purple-600 bg-purple-50'
                        : 'border-green-500 text-green-600 bg-green-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? tab.color === 'blue'
                        ? 'bg-blue-100 text-blue-700'
                        : tab.color === 'purple'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isLoading ? '...' : tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={40} className="animate-spin text-gray-400 mb-4" />
                <p className="text-gray-500">Loading archives...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-red-500">
                <AlertCircle size={40} className="mb-4" />
                <p className="font-medium">Failed to load archives</p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {activeTab === 'orders' && renderOrdersTable()}
                {activeTab === 'users' && renderUsersTable()}
                {activeTab === 'projects' && renderProjectsTable()}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Archives;