// FILE PATH: src/pages/admin/Orders/AdminOrdersList.tsx

/**
 * Admin Orders List Page
 * Main page for viewing and filtering all orders
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import OrderMetricsCards from '../../../components/admin/Orders/OrderMetricsCards';
import OrderFilters from '../../../components/admin/Orders/OrderFilters';
import OrdersTable from '../../../components/admin/Orders/OrdersTable';
import { useAdminOrders } from '../../../features/adminOrders/hooks';
import { adminMenuItems } from '../../../utils/menuItems';

const AdminOrdersList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [availableFilters, setAvailableFilters] = useState<any>(null);

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
  const { data, isLoading, isFetching, refetch } = useAdminOrders(
    { ...filters, details: isFirstLoad }
  );

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
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 mt-1">View and manage all orders in the system</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Metrics Cards */}
        <OrderMetricsCards metrics={data?.metrics || null} loading={isLoading} />

        {/* Filters */}
        <OrderFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          availableFilters={availableFilters || data?.filters || null}
        />

        {/* Orders Table */}
        <OrdersTable
          orders={data?.data || []}
          loading={isLoading || isFetching}
          pagination={data?.pagination || null}
          onPageChange={handlePageChange}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminOrdersList;