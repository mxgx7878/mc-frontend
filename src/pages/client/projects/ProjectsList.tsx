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
  const date_from = searchParams.get('date_from') || '';
  const date_to = searchParams.get('date_to') || '';

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
    queryKey: ['projects', { page, per_page, search, sort, dir, date_from, date_to }],
    queryFn: () => projectsAPI.list({ page, per_page, search, sort, dir, date_from, date_to }),
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

  const hasActiveFilters = search || date_from || date_to || sort !== 'created_at' || dir !== 'desc';

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Projects</h1>
            <p className="text-secondary-600 mt-1">Manage your construction projects</p>
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
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Filters Bar */}
          <div className="border-b border-secondary-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                />
              </div>

              {/* Sort */}
              <select
                value={`${sort}-${dir}`}
                onChange={(e) => {
                  const [newSort, newDir] = e.target.value.split('-');
                  updateParams({ sort: newSort, dir: newDir, page: '1' });
                }}
                className="px-4 py-3 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-primary-50 border-primary-500 text-primary-600'
                    : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <Filter size={20} />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-secondary-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date From */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={date_from}
                      onChange={(e) => updateParams({ date_from: e.target.value, page: '1' })}
                      className="w-full px-4 py-2 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={date_to}
                      onChange={(e) => updateParams({ date_to: e.target.value, page: '1' })}
                      className="w-full px-4 py-2 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <X size={16} />
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                  <p className="text-secondary-500">Loading projects...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-error-500">
                <p className="mb-2">Failed to load projects</p>
                <button 
                  onClick={() => queryClient.invalidateQueries({queryKey:['projects']})}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-secondary-500">
                <p className="mb-2">No projects found</p>
                {hasActiveFilters ? (
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:underline"
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
              <table className="w-full">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      Site Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {projects.map((project: any) => (
                    <tr key={project.id} className="hover:bg-secondary-50 transition-colors">
                      {/* Project Name */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-secondary-900">{project.name}</p>
                          {project.site_instructions && (
                            <p className="text-sm text-secondary-500 mt-1 line-clamp-1">
                              {project.site_instructions}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Site Contact */}
                      <td className="px-6 py-4">
                        {project.site_contact_name || project.site_contact_phone ? (
                          <div className="text-sm">
                            {project.site_contact_name && (
                              <p className="text-secondary-900 flex items-center gap-1">
                                <User size={14} className="text-secondary-400" />
                                {project.site_contact_name}
                              </p>
                            )}
                            {project.site_contact_phone && (
                              <p className="text-secondary-500 flex items-center gap-1 mt-1">
                                <Phone size={14} className="text-secondary-400" />
                                {project.site_contact_phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-secondary-400 text-sm">No contact</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-secondary-700">
                          <Calendar size={14} className="text-secondary-400" />
                          {formatDate(project.created_at)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/client/projects/${project.id}`)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/client/projects/${project.id}/edit`)}
                            className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="Edit Project"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id, project.name)}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Project"
                          >
                            <Trash2 size={18} />
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
          {!isLoading && projects.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-secondary-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary-600">
                  Showing {pagination.from} to {pagination.to} of {pagination.total} projects
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Per Page */}
                <select
                  value={per_page}
                  onChange={(e) => updateParams({ per_page: e.target.value, page: '1' })}
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
                    onClick={() => updateParams({ page: String(page - 1) })}
                    disabled={page === 1}
                    className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <span className="text-sm text-secondary-700 px-3">
                    Page {pagination.currentPage} of {pagination.lastPage}
                  </span>

                  <button
                    onClick={() => updateParams({ page: String(page + 1) })}
                    disabled={page === pagination.lastPage}
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

export default ProjectsList;