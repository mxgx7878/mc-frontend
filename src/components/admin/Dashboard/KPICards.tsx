// FILE PATH: src/components/admin/Dashboard/KPICards.tsx

/**
 * KPI Cards Component
 * Displays key performance indicators with comparisons
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  CheckCircle,
  Users,
  AlertCircle
} from 'lucide-react';
import type { DashboardKPIs } from '../../../api/handlers/adminDashboard.api';

interface KPICardsProps {
  kpis: DashboardKPIs | null;
  loading: boolean;
  currency?: string;
}

interface KPICardData {
  id: string;
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
}

const KPICards: React.FC<KPICardsProps> = ({ kpis, loading, currency = 'AUD' }) => {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-card p-6">
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards: KPICardData[] = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: formatCurrency(kpis.revenue),
      change: kpis.revenue_change,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-500',
      subValue: `${formatCurrency(kpis.revenue_prev)} last period`,
    },
    {
      id: 'orders',
      title: 'Total Orders',
      value: kpis.orders_total,
      change: kpis.orders_change,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-blue-500',
      subValue: `${kpis.orders_total_prev} last period`,
    },
    {
      id: 'avg_order',
      title: 'Avg Order Value',
      value: formatCurrency(kpis.avg_order_value),
      change: 0,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
    {
      id: 'completed',
      title: 'Completed Orders',
      value: kpis.completed_orders,
      change: kpis.completed_change,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-green-500',
      subValue: `${kpis.completed_orders_prev} last period`,
    },
    {
      id: 'active_clients',
      title: 'Active Clients',
      value: kpis.active_clients,
      change: kpis.active_clients_change,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-indigo-500',
      subValue: `${kpis.total_clients} total`,
    },
    {
      id: 'active_suppliers',
      title: 'Active Suppliers',
      value: kpis.active_suppliers,
      change: 0,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-cyan-500',
      subValue: `${kpis.total_suppliers} total`,
    },
    {
      id: 'awaiting_payment',
      title: 'Awaiting Payment',
      value: kpis.awaiting_payment,
      change: 0,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-orange-500',
    },
    {
      id: 'supplier_missing',
      title: 'Supplier Missing',
      value: kpis.supplier_missing,
      change: 0,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow"
        >
          {/* Icon & Title */}
          <div className="flex items-center justify-between mb-4">
            <div className={`${card.color} text-white p-3 rounded-lg`}>
              {card.icon}
            </div>
            {card.change !== 0 && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  card.change > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {card.change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(card.change)}%
              </div>
            )}
          </div>

          {/* Value */}
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
          
          {/* Title */}
          <p className="text-sm text-gray-600 mb-2">{card.title}</p>

          {/* Sub Value */}
          {card.subValue && (
            <p className="text-xs text-gray-500">{card.subValue}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPICards;
