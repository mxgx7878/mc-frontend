// FILE PATH: src/pages/admin/Dashboard.tsx
// ============================================
// ADMIN DASHBOARD WITH PERMISSION-BASED VISIBILITY
// ============================================

/**
 * Admin Dashboard Page
 * Main dashboard showing KPIs, charts, tables, and alerts
 * Revenue/Profit widgets hidden for Support role
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Eye, Lock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getMenuItemsByRole } from '../../utils/menuItems';
import { usePermissions } from '../../hooks/usePermissions';
import { 
  adminDashboardAPI, 
  type DashboardFilters 
} from '../../api/handlers/adminDashboard.api';
import KPICards from '../../components/admin/Dashboard/KPICards';
import DashboardFiltersBar from '../../components/admin/Dashboard/DashboardFilters';
import ChartsSection from '../../components/admin/Dashboard/ChartsSection';
import TablesSection from '../../components/admin/Dashboard/TablesSection';
import AlertsSection from '../../components/admin/Dashboard/AlertsSection';

const AdminDashboard = () => {
  // ==================== PERMISSIONS ====================
  const { 
    role, 
    isReadOnly,
    canViewCostPrice,
    canViewProfitMargin,
  } = usePermissions();
  
  const menuItems = getMenuItemsByRole(role);
  
  // Determine if financial data should be shown
  const showFinancialData = canViewCostPrice || canViewProfitMargin;

  // Initialize filters with default date range (current month)
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return {
      from: firstDayOfMonth.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
      granularity: 'day',
      charts: 'date,status,supplier,product,price_bucket',
      tz: 'Australia/Sydney',
    };
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  // Fetch dashboard data
  const { 
    data, 
    isLoading, 
    isFetching,
    refetch 
  } = useQuery({
    queryKey: ['admin-dashboard', filters],
    queryFn: () => adminDashboardAPI.getSummary(filters),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Handle alert dismiss
  const handleDismissAlert = (index: number) => {
    setDismissedAlerts((prev) => [...prev, index]);
  };

  // Filter out dismissed alerts
  const activeAlerts = data?.alerts?.filter((_, idx) => !dismissedAlerts.includes(idx)) || [];

  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">System overview and analytics</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Read-Only Badge for Accountant */}
            {isReadOnly && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-lg border-2 border-yellow-300 flex items-center gap-2">
                <Eye size={16} />
                Read Only Mode
              </span>
            )}
            
            {/* Data Freshness Indicator */}
            {data?.metadata && (
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(data.metadata.generated_at).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Analyzing {data.metadata.total_records_analyzed} records over {Math.round(data.metadata.period_days)} days
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Permission Notice Banner for Support */}
        {!showFinancialData && (
          <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <Lock size={16} className="text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Financial metrics (revenue, profit) are hidden based on your role permissions
            </span>
          </div>
        )}

        {/* Alerts Section */}
        {activeAlerts.length > 0 && (
          <AlertsSection
            alerts={activeAlerts}
            loading={isLoading}
            onDismiss={handleDismissAlert}
          />
        )}

        {/* Filters */}
        <DashboardFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />

        {/* KPI Cards - Pass permission flag */}
        <KPICards
          kpis={data?.kpis || null}
          loading={isLoading}
          currency={data?.filters.currency}
          showFinancialData={showFinancialData}
        />

        {/* Charts Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
          <ChartsSection
            charts={data?.charts || []}
            loading={isLoading}
          />
        </div>

        {/* Tables Section - Pass permission flag */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performers & Activity</h2>
          <TablesSection
            topClients={data?.tables.top_clients_by_spend || []}
            topSuppliers={data?.tables.top_suppliers_by_revenue || []}
            recentActivity={data?.tables.recent_activity || []}
            loading={isLoading}
            currency={data?.filters.currency}
            showFinancialData={showFinancialData}
          />
        </div>

        {/* Additional Insights - Only show financial insights to authorized users */}
        {data?.kpis && (
          <div className={`grid grid-cols-1 ${showFinancialData ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            {/* Performance Metrics - Always visible (non-financial) */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Cancellation Rate</span>
                  <span className="text-lg font-bold text-blue-900">{data.kpis.cancellation_rate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Repeat Client Rate</span>
                  <span className="text-lg font-bold text-blue-900">{data.kpis.repeat_client_rate}%</span>
                </div>
              </div>
            </div>

            {/* System Health - Always visible (non-financial) */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">System Health</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Total Clients</span>
                  <span className="text-lg font-bold text-green-900">{data.kpis.total_clients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Total Suppliers</span>
                  <span className="text-lg font-bold text-green-900">{data.kpis.total_suppliers}</span>
                </div>
              </div>
            </div>

            {/* Current Period - Only for users who can see financial data */}
            {showFinancialData && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <h3 className="text-sm font-medium text-purple-900 mb-2">Current Period</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-700">Active Clients</span>
                    <span className="text-lg font-bold text-purple-900">{data.kpis.active_clients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-700">Active Suppliers</span>
                    <span className="text-lg font-bold text-purple-900">{data.kpis.active_suppliers}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;