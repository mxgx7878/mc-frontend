// FILE PATH: src/components/admin/Orders/OrderMetricsCards.tsx

/**
 * Order Metrics Cards Component
 * Colorful gradient cards with hover effects and animations
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
      gradient: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      shadowColor: 'hover:shadow-blue-200',
    },
    {
      label: 'Supplier Missing',
      value: metrics?.supplier_missing_count || 0,
      icon: AlertTriangle,
      gradient: 'from-yellow-500 to-orange-500',
      lightBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      shadowColor: 'hover:shadow-yellow-200',
    },
    {
      label: 'Supplier Assigned',
      value: metrics?.supplier_assigned_count || 0,
      icon: UserCheck,
      gradient: 'from-indigo-500 to-purple-600',
      lightBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      shadowColor: 'hover:shadow-indigo-200',
    },
    {
      label: 'Awaiting Payment',
      value: metrics?.awaiting_payment_count || 0,
      icon: CreditCard,
      gradient: 'from-purple-500 to-pink-600',
      lightBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      shadowColor: 'hover:shadow-purple-200',
    },
    {
      label: 'Delivered',
      value: metrics?.delivered_count || 0,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      lightBg: 'bg-green-50',
      iconColor: 'text-green-600',
      shadowColor: 'hover:shadow-green-200',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`
              relative overflow-hidden
              bg-white rounded-xl border border-gray-200 
              p-6 
              transition-all duration-300
              hover:shadow-xl ${card.shadowColor}
              hover:-translate-y-1
              group
            `}
            style={{
              animation: loading ? 'none' : `slideInUp 0.4s ease-out ${index * 0.1}s both`,
            }}
          >
            {/* Gradient Background on Hover */}
            <div
              className={`
                absolute inset-0 opacity-0 group-hover:opacity-5
                bg-gradient-to-br ${card.gradient}
                transition-opacity duration-300
              `}
            />

            {/* Content */}
            <div className="relative">
              {/* Icon */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`
                    p-3 rounded-xl ${card.lightBg}
                    transform transition-transform duration-300
                    group-hover:scale-110 group-hover:rotate-3
                  `}
                >
                  <Icon className={card.iconColor} size={24} strokeWidth={2.5} />
                </div>
              </div>

              {/* Value */}
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1 transition-colors group-hover:text-gray-800">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
                  {card.label}
                </p>
              </div>

              {/* Bottom Accent Line */}
              <div
                className={`
                  absolute bottom-0 left-0 right-0 h-1 rounded-full
                  bg-gradient-to-r ${card.gradient}
                  transform scale-x-0 group-hover:scale-x-100
                  transition-transform duration-300 origin-left
                `}
              />
            </div>
          </div>
        );
      })}

      {/* Inline animation styles */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default OrderMetricsCards;