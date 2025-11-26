// src/pages/client/Orders/ClientOrdersList.tsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ClientOrderMetricsCards from '../../components/client/ClientOrderMetricsCards';
import ClientOrderFilters from '../../components/client/ClientOrderFilters';
import ClientActiveFilterChips from '../../components/client/ClientActiveFilterChips';
import ClientOrdersTable from '../../components/client/ClientOrdersTable';
import { useClientOrders } from '../../features/clientOrders/hooks';
import { clientMenuItems } from '../../utils/menuItems';

const ClientOrdersList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [availableFilters, setAvailableFilters] = useState<any>(null);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    project_id: searchParams.get('project_id') || '',
    order_status: searchParams.get('order_status') || '',
    payment_status: searchParams.get('payment_status') || '',
    delivery_date: searchParams.get('delivery_date') || '',
    delivery_method: searchParams.get('delivery_method') || '',
    repeat_order: searchParams.get('repeat_order') || '',
    sort: searchParams.get('sort') || 'created_at',
    dir: searchParams.get('dir') || 'desc',
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 10,
  });

  const { data, isLoading, isFetching, refetch } = useClientOrders({
    ...filters,
    details: isFirstLoad,
  });

  useEffect(() => {
    if (isFirstLoad && data) {
      if (data.projects) setProjects(data.projects);
      if (data.order_statuses || data.payment_statuses || data.delivery_methods) {
        setAvailableFilters({
          order_statuses: data.order_statuses,
          payment_statuses: data.payment_statuses,
          delivery_methods: data.delivery_methods,
        });
      }
      setIsFirstLoad(false);
    }
  }, [data, isFirstLoad]);

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
      page: key !== 'page' ? 1 : prev.page,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      project_id: '',
      order_status: '',
      payment_status: '',
      delivery_date: '',
      delivery_method: '',
      repeat_order: '',
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

  const handleViewOrder = (orderId: number) => {
    navigate(`/client/orders/${orderId}`);
  };

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              My Orders
            </h1>
            <p className="text-gray-600 mt-1">Track and manage your orders</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Metrics Cards */}
        <ClientOrderMetricsCards metrics={data?.metrics || null} loading={isLoading} />

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by PO number..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Filters */}
        <ClientOrderFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          projects={projects}
          availableFilters={availableFilters}
        />

        {/* Active Filter Chips */}
        <ClientActiveFilterChips
          filters={filters}
          onFilterChange={handleFilterChange}
          projects={projects}
        />

        {/* Orders Table */}
        <ClientOrdersTable
          orders={data?.data || []}
          loading={isLoading || isFetching}
          pagination={data?.pagination || null}
          onPageChange={handlePageChange}
          onViewOrder={handleViewOrder}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientOrdersList;