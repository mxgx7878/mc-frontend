// FILE PATH: src/components/admin/Dashboard/TablesSection.tsx

/**
 * Tables Section Component
 * Displays Top Clients, Top Suppliers, and Recent Activity tables
 */

import React from 'react';
import { TrendingUp, Clock, Package } from 'lucide-react';
import type { TopClient, TopSupplier, RecentActivity } from '../../../api/handlers/adminDashboard.api';

interface TablesSectionProps {
  topClients: TopClient[];
  topSuppliers: TopSupplier[];
  recentActivity: RecentActivity[];
  loading: boolean;
  currency?: string;
}

const TablesSection: React.FC<TablesSectionProps> = ({
  topClients,
  topSuppliers,
  recentActivity,
  loading,
  currency = 'AUD',
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getWorkflowBadgeClass = (workflow: string): string => {
    const styles: Record<string, string> = {
      'Requested': 'bg-yellow-100 text-yellow-800',
      'Supplier Missing': 'bg-red-100 text-red-800',
      'Supplier Assigned': 'bg-blue-100 text-blue-800',
      'Payment Requested': 'bg-orange-100 text-orange-800',
      'On Hold': 'bg-gray-100 text-gray-800',
      'Delivered': 'bg-green-100 text-green-800',
    };
    return styles[workflow] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-card p-6">
            <div className="h-96 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Clients */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top Clients
          </h3>
        </div>

        <div className="space-y-3">
          {topClients.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No data available</p>
          ) : (
            topClients.map((client, idx) => (
              <div
                key={client.client_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-400">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{client.client_name}</p>
                      <p className="text-xs text-gray-500">{client.client_email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{client.order_count} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{formatCurrency(client.total_spend)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Suppliers */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Top Suppliers
          </h3>
        </div>

        <div className="space-y-3">
          {topSuppliers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No data available</p>
          ) : (
            topSuppliers.map((supplier, idx) => (
              <div
                key={supplier.supplier_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-400">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{supplier.supplier_name}</p>
                      <p className="text-xs text-gray-500">{supplier.supplier_email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{supplier.order_count} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(supplier.revenue)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Recent Activity
          </h3>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.po_number}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.client_name} • {activity.project_name}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${getWorkflowBadgeClass(
                      activity.workflow
                    )}`}
                  >
                    {activity.workflow}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{activity.time_ago}</p>
                  {activity.amount > 0 && (
                    <p className="text-xs font-semibold text-gray-700">
                      {formatCurrency(activity.amount)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TablesSection;
