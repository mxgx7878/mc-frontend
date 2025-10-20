// ============================================================================
// FILE: src/components/client/ClientOrderMetricsCards.tsx - FIXED WITH COLORS
// ============================================================================

import { ShoppingCart, AlertTriangle, CheckCircle, Clock, TruckIcon } from 'lucide-react';

const ClientOrderMetricsCards = ({ metrics, loading }: any) => {
  const metricsConfig = [
    {
      label: 'Total Orders',
      value: metrics?.total_orders_count || 0,
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Supplier Missing',
      value: metrics?.supplier_missing_count || 0,
      icon: AlertTriangle,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      label: 'Supplier Assigned',
      value: metrics?.supplier_assigned_count || 0,
      icon: TruckIcon,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    {
      label: 'Awaiting Payment',
      value: metrics?.awaiting_payment_count || 0,
      icon: Clock,
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      label: 'Delivered',
      value: metrics?.delivered_count || 0,
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metricsConfig.map((metric) => {
        const Icon = metric.icon;
        return (
          <div 
            key={metric.label} 
            className={`${metric.bgColor} rounded-xl border-2 ${metric.borderColor} p-6 transition-all hover:shadow-lg hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{metric.label}</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className={`text-3xl font-bold ${metric.textColor}`}>
                    {metric.value}
                  </p>
                )}
              </div>
              <div className={`${metric.color} p-3 rounded-xl shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClientOrderMetricsCards;