// src/pages/supplier/SupplierOrders.tsx

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSupplierOrders } from '../../features/supplierOrders/hooks';
import DashboardLayout from '../../components/layout/DashboardLayout';
import OrderMetricsCards from '../../components/supplier/OrderMetricsCards';
import OrderFilters from '../../components/supplier/OrderFilters';
import OrdersTable from '../../components/supplier/OrdersTable';
import { supplierMenuItems } from '../../utils/menuItems';
import type { ProductFilter } from '../../api/handlers/supplierOrders.api';

const SupplierOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [products, setProducts] = useState<ProductFilter[]>([]);

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    product_id: searchParams.get('product_id') || '',
    supplier_confirms: searchParams.get('supplier_confirms') || '',
    supplier_delivery_date: searchParams.get('supplier_delivery_date') || '',
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 10,
  });

  // Fetch orders with includeDetails on first load
  const { data, isLoading, isFetching, refetch } = useSupplierOrders(filters, isFirstLoad);

  // Store products from first load
  useEffect(() => {
    if (isFirstLoad && data?.data?.filters?.products) {
      setProducts(data.data.filters.products);
      setIsFirstLoad(false);
    }
  }, [data, isFirstLoad]);

  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.product_id) params.product_id = filters.product_id;
    if (filters.supplier_confirms !== '') params.supplier_confirms = filters.supplier_confirms;
    if (filters.supplier_delivery_date) params.supplier_delivery_date = filters.supplier_delivery_date;
    if (filters.page > 1) params.page = filters.page.toString();

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      product_id: '',
      supplier_confirms: '',
      supplier_delivery_date: '',
      page: 1,
      per_page: 10,
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast.success('Orders refreshed');
  };

  return (
    <DashboardLayout menuItems={supplierMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supplier Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track your order items</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Metrics Cards */}
        <OrderMetricsCards 
          metrics={data?.data?.metrics || null} 
          loading={isLoading} 
        />

        {/* Filters */}
        <OrderFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          products={products}
        />

        {/* Orders Table */}
        <OrdersTable
          orders={data?.data?.data || []}
          loading={isLoading || isFetching}
          pagination={data?.data?.pagination || null}
          onPageChange={handlePageChange}
        />
      </div>
    </DashboardLayout>
  );
};

export default SupplierOrders;