// FILE PATH: src/components/admin/Orders/OrderMetricsCards.tsx

/**
 * Order Metrics Cards Component
 * Displays key metrics at the top of the orders list
 */

import React from 'react';
import { ShoppingCart, AlertTriangle, UserCheck, CreditCard, CheckCircle } from 'lucide-react';
import type { AdminOrderMetrics } from '../../../types/adminOrder.types';

interface MetricsCardsProps {
  metrics: AdminOrderMetrics | null;
  loading: boolean;
}

const OrderMetricsCards: React.FC<MetricsCardsProps> = ({ metrics, loading }) => {
  const cards = [
    {
      label: 'Total Orders',
      value: metrics?.total_orders_count || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Supplier Missing',
      value: metrics?.supplier_missing_count || 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      label: 'Supplier Assigned',
      value: metrics?.supplier_assigned_count || 0,
      icon: UserCheck,
      color: 'bg-indigo-500',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      label: 'Awaiting Payment',
      value: metrics?.awaiting_payment_count || 0,
      icon: CreditCard,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Delivered',
      value: metrics?.delivered_count || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-lg ${card.bgLight}`}>
                <Icon className={card.textColor} size={24} />
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
              ) : (
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderMetricsCards;