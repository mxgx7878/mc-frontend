// src/components/client/ClientOrderMetricsCards.tsx

import React from 'react';
import { ShoppingCart, FileText, Truck, CheckCircle } from 'lucide-react';
import type { ClientOrderMetrics } from '../../types/clientOrder.types';

interface MetricsCardsProps {
  metrics: ClientOrderMetrics | null;
  loading: boolean;
}

const ClientOrderMetricsCards: React.FC<MetricsCardsProps> = ({ metrics, loading }) => {
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
      label: 'Draft',
      value: metrics?.draft_count || 0,
      icon: FileText,
      gradient: 'from-gray-500 to-gray-600',
      lightBg: 'bg-gray-50',
      iconColor: 'text-gray-600',
      shadowColor: 'hover:shadow-gray-200',
    },
    {
      label: 'Active',
      value: (metrics?.confirmed_count || 0) + (metrics?.scheduled_count || 0) + (metrics?.in_transit_count || 0),
      icon: Truck,
      gradient: 'from-indigo-500 to-purple-600',
      lightBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      shadowColor: 'hover:shadow-indigo-200',
    },
    {
      label: 'Completed',
      value: (metrics?.delivered_count || 0) + (metrics?.completed_count || 0),
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      lightBg: 'bg-green-50',
      iconColor: 'text-green-600',
      shadowColor: 'hover:shadow-green-200',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl shadow-lg ${card.shadowColor} transition-all duration-300 p-6 text-white group hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white/90 text-sm font-medium mb-1">{card.label}</p>
                <p className="text-4xl font-bold">{card.value}</p>
              </div>
              <div className="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors">
                <Icon size={28} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClientOrderMetricsCards;