// ============================================================================
// FILE: src/pages/client/ClientOrders.tsx - UPDATED WITH MARK REPEAT
// ============================================================================

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useClientOrders, useRepeatOrder, useMarkRepeatOrder } from '../../features/clientOrders/hooks';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ClientOrderMetricsCards from '../../components/client/ClientOrderMetricsCards';
import ClientOrderFilters from '../../components/client/ClientOrderFilters';
import ClientOrdersTable from '../../components/client/ClientOrdersTable';
import RepeatOrderModal from '../../components/client/RepeatOrderModal';
import { clientMenuItems } from '../../utils/menuItems';

const ClientOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [repeatOrderModalOpen, setRepeatOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    project_id: searchParams.get('project_id') || '',
    workflow: searchParams.get('workflow') || '',
    delivery_date: searchParams.get('delivery_date') || '',
    repeat_order: searchParams.get('repeat_order') || '',
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 10,
    sort: 'created_at',
    dir: 'desc',
  });

  const { data, isLoading, isFetching, refetch } = useClientOrders(filters);
  console.log(isFirstLoad, 'sadsadsa')
  const repeatOrderMutation = useRepeatOrder();
  const markRepeatMutation = useMarkRepeatOrder();

  useEffect(() => {
    if (isFirstLoad && data?.projects) {
      setProjects(data.projects);
      setIsFirstLoad(false);
    }
  }, [data, isFirstLoad]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.project_id) params.project_id = filters.project_id;
    if (filters.workflow) params.workflow = filters.workflow;
    if (filters.delivery_date) params.delivery_date = filters.delivery_date;
    if (filters.repeat_order) params.repeat_order = filters.repeat_order;
    if (filters.page > 1) params.page = filters.page.toString();

    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      project_id: '',
      workflow: '',
      delivery_date: '',
      repeat_order: '',
      page: 1,
      per_page: 10,
      sort: 'created_at',
      dir: 'desc',
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Orders refreshed');
  };

  const handleRepeatOrder = (order: any) => {
    setSelectedOrder(order);
    setRepeatOrderModalOpen(true);
  };

  const handleMarkRepeat = async (orderId: number) => {
    try {
      await markRepeatMutation.mutateAsync(orderId);
      toast.success('Order marked as repeat order!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark order as repeat');
    }
  };

  const handleRepeatOrderSubmit = async (items: any[]) => {
    if (!selectedOrder) return;

    try {
      await repeatOrderMutation.mutateAsync({
        orderId: selectedOrder.id,
        payload: { items },
      });
      toast.success('Order repeated successfully!');
      setRepeatOrderModalOpen(false);
      setSelectedOrder(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to repeat order');
    }
  };

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">View and manage your orders</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <ClientOrderMetricsCards 
          metrics={data?.metrics || null} 
          loading={isLoading} 
        />

        <ClientOrderFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          projects={projects}
        />

        <ClientOrdersTable
          orders={data?.data || []}
          loading={isLoading}
          pagination={data?.pagination || null}
          onPageChange={handlePageChange}
          onRepeatOrder={handleRepeatOrder}
          onMarkRepeat={handleMarkRepeat}
          navigate={navigate}
        />

        <RepeatOrderModal
          isOpen={repeatOrderModalOpen}
          onClose={() => {
            setRepeatOrderModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSubmit={handleRepeatOrderSubmit}
          isSubmitting={repeatOrderMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientOrders;