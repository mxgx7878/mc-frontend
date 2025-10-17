// src/components/supplier/OrderMetricsCards.tsx

import React from 'react';
import { Package, CheckCircle, Clock, Truck } from 'lucide-react';
import type { OrderMetrics } from '../../api/handlers/supplierOrders.api';

interface OrderMetricsCardsProps {
  metrics: OrderMetrics | null;
  loading: boolean;
}

const OrderMetricsCards: React.FC<OrderMetricsCardsProps> = ({ metrics, loading }) => {
  const metricsData = [
    {
      title: 'Total Orders',
      value: metrics?.total_orders_count || 0,
      icon: Package,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Confirmed',
      value: metrics?.supplier_confirmed_count || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Awaiting Payment',
      value: metrics?.awaiting_payment_count || 0,
      icon: Clock,
      color: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Delivered',
      value: metrics?.delivered_count || 0,
      icon: Truck,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className={`${metric.bgLight} rounded-lg p-6 border border-gray-200 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {metric.title}
                </p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className={`text-3xl font-bold ${metric.textColor}`}>
                    {metric.value}
                  </p>
                )}
              </div>
              <div className={`${metric.color} p-3 rounded-full`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderMetricsCards;