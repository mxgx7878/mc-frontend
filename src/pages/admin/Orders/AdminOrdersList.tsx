// FILE PATH: src/pages/admin/Orders/AdminOrdersList.tsx

/**
 * Admin Orders List Page - WITH PERMISSION-BASED VISIBILITY
 * Main page with metrics, filters panel, active chips, and comprehensive table
 * Uses role-based menu items
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Filter, Search, Eye } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import OrderMetricsCards from '../../../components/admin/Orders/OrderMetricsCards';
import OrderFiltersPanel from '../../../components/admin/Orders/OrderFiltersPanel';
import ActiveFilterChips from '../../../components/admin/Orders/ActiveFilterChips';
import OrdersTable from '../../../components/admin/Orders/OrdersTable';
import { useAdminOrders } from '../../../features/adminOrders/hooks';
import { getMenuItemsByRole } from '../../../utils/menuItems';
import { usePermissions } from '../../../hooks/usePermissions';

const AdminOrdersList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [availableFilters, setAvailableFilters] = useState<any>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Get permissions and role-based menu
  const { role, isReadOnly } = usePermissions();
  const menuItems = getMenuItemsByRole(role);

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    client_id: searchParams.get('client_id') || '',
    project_id: searchParams.get('project_id') || '',
    supplier_id: searchParams.get('supplier_id') || '',
    workflow: searchParams.get('workflow') || '',
    payment_status: searchParams.get('payment_status') || '',
    delivery_method: searchParams.get('delivery_method') || '',
    delivery_date_from: searchParams.get('delivery_date_from') || '',
    delivery_date_to: searchParams.get('delivery_date_to') || '',
    repeat_order: searchParams.get('repeat_order') || '',
    has_missing_supplier: searchParams.get('has_missing_supplier') || '',
    supplier_confirms: searchParams.get('supplier_confirms') || '',
    min_total: searchParams.get('min_total') || '',
    max_total: searchParams.get('max_total') || '',
    sort: searchParams.get('sort') || 'created_at',
    dir: searchParams.get('dir') || 'desc',
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 10,
  });

  // Fetch orders with includeDetails on first load
  const { data, isLoading, isFetching, refetch } = useAdminOrders({
    ...filters,
    details: isFirstLoad,
  });

  // Store filters from first load
  useEffect(() => {
    if (isFirstLoad && data?.filters) {
      setAvailableFilters(data.filters);
      setIsFirstLoad(false);
    }
  }, [data, isFirstLoad]);

  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && key !== 'per_page') {
        params[key] = String(value);
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : prev.page, // Reset to page 1 when filter changes
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      client_id: '',
      project_id: '',
      supplier_id: '',
      workflow: '',
      payment_status: '',
      delivery_method: '',
      delivery_date_from: '',
      delivery_date_to: '',
      repeat_order: '',
      has_missing_supplier: '',
      supplier_confirms: '',
      min_total: '',
      max_total: '',
      sort: 'created_at',
      dir: 'desc',
      page: 1,
      per_page: 10,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Orders Management
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive view of all orders with full cost insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Read-Only Badge for Accountant */}
            {isReadOnly && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-lg border-2 border-yellow-300 flex items-center gap-2">
                <Eye size={16} />
                Read Only Mode
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <OrderMetricsCards metrics={data?.metrics || null} loading={isLoading} />

        {/* Search Bar and Filter Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by PO number..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFilterPanelOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <Filter size={20} />
              Advanced Filters
              {Object.values(filters).filter(
                (v, i) =>
                  v !== '' &&
                  Object.keys(filters)[i] !== 'sort' &&
                  Object.keys(filters)[i] !== 'dir' &&
                  Object.keys(filters)[i] !== 'page' &&
                  Object.keys(filters)[i] !== 'per_page' &&
                  Object.keys(filters)[i] !== 'search'
              ).length > 0 && (
                <span className="px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
                  {
                    Object.values(filters).filter(
                      (v, i) =>
                        v !== '' &&
                        Object.keys(filters)[i] !== 'sort' &&
                        Object.keys(filters)[i] !== 'dir' &&
                        Object.keys(filters)[i] !== 'page' &&
                        Object.keys(filters)[i] !== 'per_page' &&
                        Object.keys(filters)[i] !== 'search'
                    ).length
                  }
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Chips */}
          {availableFilters && (
            <div className="mt-4">
              <ActiveFilterChips
                filters={filters}
                onFilterChange={handleFilterChange}
                availableFilters={availableFilters}
              />
            </div>
          )}
        </div>

        {/* Orders Table */}
        <OrdersTable
          orders={data?.data || []}
          loading={isLoading || isFetching}
          pagination={data?.pagination || null}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Filter Panel (Slide-in) */}
      <OrderFiltersPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        availableFilters={availableFilters || data?.filters || null}
      />
    </DashboardLayout>
  );
};

export default AdminOrdersList;