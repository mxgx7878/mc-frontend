/* FILE: src/pages/client/projects/ProjectsList.tsx */
// src/pages/client/projects/ProjectsList.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Search, 
  Eye, 
  Edit2, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  User,
  Phone,
  Filter,
  X,
  Loader2,
  Package,
  DollarSign,
  ShoppingCart,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '../../../components/layout/DashboardLayout';
import Button from '../../../components/common/Buttons';
import type { Paginated, ProjectDTO } from '../../../api/handlers/projects.api';
import { projectsAPI } from '../../../api/handlers/projects.api';
import { clientMenuItems } from '../../../utils/menuItems';

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper to get order status badge color
const getOrderStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Payment Requested': 'bg-amber-50 text-amber-700 border-amber-200',
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
    'Supplier Missing': 'bg-orange-50 text-orange-700 border-orange-200',
    'Supplier Assigned': 'bg-blue-50 text-blue-700 border-blue-200',
    'Requested': 'bg-violet-50 text-violet-700 border-violet-200',
    'On Hold': 'bg-slate-50 text-slate-700 border-slate-200',
    'In Transit': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const ProjectsList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  
  // Filters from URL
  const page = Number(searchParams.get('page')) || 1;
  const per_page = Number(searchParams.get('per_page')) || 10;
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const dir = searchParams.get('dir') || 'desc';
  const order_status = searchParams.get('order_status') || '';
  const delivery_date_from = searchParams.get('delivery_date_from') || '';
  const delivery_date_to = searchParams.get('delivery_date_to') || '';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        updateParams({ search: localSearch, page: '1' });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Fetch projects
  const { data, isLoading, error } = useQuery<Paginated<ProjectDTO>>({
    queryKey: ['projects', { page, per_page, search, sort, dir, order_status, delivery_date_from, delivery_date_to }],
    queryFn: () => projectsAPI.list({ page, per_page, search, sort, dir, order_status, delivery_date_from, delivery_date_to }),
    placeholderData: keepPreviousData,
  });

    // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: projectsAPI.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('✅ Project deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });

  // Helper to update URL params
  const updateParams = (newParams: Record<string, string>) => {
    const current = Object.fromEntries(searchParams);
    const updated = { ...current, ...newParams };
    
    // Remove empty params
    Object.keys(updated).forEach(key => {
      if (!updated[key]) delete updated[key];
    });
    
    setSearchParams(updated);
  };

  // Clear all filters
  const clearFilters = () => {
    setLocalSearch('');
    setSearchParams({ page: '1', per_page: String(per_page) });
  };

  // Handle delete
  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const projects = data?.data ?? [];
  const pagination = {
    currentPage: data?.meta?.page ?? 1,
    lastPage: Math.ceil((data?.meta?.total ?? 0) / (data?.meta?.per_page ?? per_page)),
    total: data?.meta?.total ?? 0,
    from: ((page - 1) * per_page) + 1,
    to: Math.min(page * per_page, data?.meta?.total ?? 0),
  };

  const hasActiveFilters = search || order_status || delivery_date_from || delivery_date_to || sort !== 'created_at' || dir !== 'desc';

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage your construction projects</p>
          </div>
          <Button
            onClick={() => navigate('/client/projects/create')}
            variant="primary"
            fullWidth={false}
          >
            <Plus size={20} />
            New Project
          </Button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters Bar */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Sort */}
              <select
                value={`${sort}-${dir}`}
                onChange={(e) => {
                  const [newSort, newDir] = e.target.value.split('-');
                  updateParams({ sort: newSort, dir: newDir, page: '1' });
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={20} />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select
                      value={order_status}
                      onChange={(e) => updateParams({ order_status: e.target.value, page: '1' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="Requested">Requested</option>
                      <option value="Supplier Assigned">Supplier Assigned</option>
                      <option value="Payment Requested">Payment Requested</option>
                      <option value="On Hold">On Hold</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Supplier Missing">Supplier Missing</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Date From
                    </label>
                    <input
                      type="date"
                      value={delivery_date_from}
                      onChange={(e) => updateParams({ delivery_date_from: e.target.value, page: '1' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Date To
                    </label>
                    <input
                      type="date"
                      value={delivery_date_to}
                      onChange={(e) => updateParams({ delivery_date_to: e.target.value, page: '1' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    <X size={16} />
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
                <p className="text-gray-500">Loading projects...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-red-500">
                <p className="mb-2">Failed to load projects</p>
                <button 
                  onClick={() => queryClient.invalidateQueries({queryKey:['projects']})}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p className="mb-2">No projects found</p>
                {hasActiveFilters ? (
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Clear filters
                  </button>
                ) : (
                  <Button
                    onClick={() => navigate('/client/projects/create')}
                    variant="outline"
                    fullWidth={false}
                    className="mt-4"
                  >
                    <Plus size={18} />
                    Create Your First Project
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {projects.map((project) => {
                  // Calculate avg order value on frontend
                  const avgOrderValue = project.total_orders > 0 
                    ? project.total_order_amount / project.total_orders 
                    : 0;

                  return (
                    <div
                      key={project.id}
                      className="border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden bg-white"
                    >
                      {/* Project Header */}
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-5 border-b border-gray-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {project.name}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                              {project.delivery_address && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={15} className="text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{project.delivery_address}</span>
                                </div>
                              )}
                              {project.site_contact_name && (
                                <div className="flex items-center gap-1.5">
                                  <User size={15} className="text-gray-400 flex-shrink-0" />
                                  <span>{project.site_contact_name}</span>
                                </div>
                              )}
                              {project.site_contact_phone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone size={15} className="text-gray-400 flex-shrink-0" />
                                  <span>{project.site_contact_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => navigate(`/client/projects/${project.id}`)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm"
                              title="View Details"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/client/projects/${project.id}/edit`)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit Project"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id, project.name)}
                              disabled={deleteMutation.isPending}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Project"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Stats Section */}
                      <div className="p-5">
                        <div className="grid grid-cols-3 gap-4">
                          {/* Total Orders */}
                          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <ShoppingCart size={16} className="text-blue-600" />
                              <span className="text-xs font-medium text-blue-900">Orders</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-700">{project.total_orders}</p>
                          </div>

                          {/* Total Amount */}
                          <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <DollarSign size={16} className="text-emerald-600" />
                              <span className="text-xs font-medium text-emerald-900">Total</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-700">
                              {formatCurrency(project.total_order_amount)}
                            </p>
                          </div>

                          {/* Average Order */}
                          <div className="text-center p-4 bg-violet-50 rounded-lg border border-violet-100">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Package size={16} className="text-violet-600" />
                              <span className="text-xs font-medium text-violet-900">Average</span>
                            </div>
                            <p className="text-2xl font-bold text-violet-700">
                              {formatCurrency(avgOrderValue)}
                            </p>
                          </div>
                        </div>

                        {/* Order Status Breakdown - Only show if data exists */}
                        {project.order_status_breakdown && Object.keys(project.order_status_breakdown).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(project.order_status_breakdown).map(([status, count]) => (
                                <span
                                  key={status}
                                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(status)}`}
                                >
                                  {status}: {count}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer Info */}
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" />
                            <span>Created {formatDate(project.created_at)}</span>
                          </div>
                          
                          {project.last_order_date && (
                            <div className="flex items-center gap-1.5">
                              <span>Last order: {formatDate(project.last_order_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && projects.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {pagination.from} to {pagination.to} of {pagination.total} projects
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Per Page */}
                <select
                  value={per_page}
                  onChange={(e) => updateParams({ per_page: e.target.value, page: '1' })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateParams({ page: String(page - 1) })}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <span className="text-sm text-gray-700 px-3">
                    Page {pagination.currentPage} of {pagination.lastPage}
                  </span>

                  <button
                    onClick={() => updateParams({ page: String(page + 1) })}
                    disabled={page === pagination.lastPage}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default ProjectsList;