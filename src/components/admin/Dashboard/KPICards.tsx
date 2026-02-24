// FILE PATH: src/components/admin/Dashboard/KPICards.tsx
// ============================================
// KPI CARDS WITH PERMISSION-BASED VISIBILITY
// ============================================

/**
 * KPI Cards Component
 * Displays key performance indicators with comparisons
 * Revenue/Invoice cards hidden for Support role
 * 
 * UPDATED: Now uses invoice-based revenue (total_invoiced, paid_amount, outstanding, collection_rate)
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  CheckCircle,
  Users,
  AlertCircle,
  FileText,
  Receipt,
  Lock
} from 'lucide-react';
import type { DashboardKPIs } from '../../../api/handlers/adminDashboard.api';

interface KPICardsProps {
  kpis: DashboardKPIs | null;
  loading: boolean;
  currency?: string;
  /** If false, hides revenue/invoice cards (for Support role) */
  showFinancialData?: boolean;
}

interface KPICardData {
  id: string;
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
  /** If true, this card requires financial permissions to view */
  isFinancial?: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ 
  kpis, 
  loading, 
  currency = 'AUD',
  showFinancialData = true 
}) => {
  if (loading || !kpis) {
    const skeletonCount = showFinancialData ? 8 : 4;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(skeletonCount)].map((_, i) => (
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

  const allCards: KPICardData[] = [
    // ── Invoice Revenue Cards (Financial) ──
    {
      id: 'total_invoiced',
      title: 'Total Invoiced',
      value: formatCurrency(kpis.total_invoiced),
      change: kpis.invoiced_change,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-500',
      subValue: `${formatCurrency(kpis.total_invoiced_prev)} last period`,
      isFinancial: true,
    },
    {
      id: 'paid_amount',
      title: 'Paid Amount',
      value: formatCurrency(kpis.paid_amount),
      change: kpis.paid_change,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-emerald-500',
      subValue: `${kpis.collection_rate}% collection rate`,
      isFinancial: true,
    },
    {
      id: 'outstanding',
      title: 'Outstanding',
      value: formatCurrency(kpis.outstanding_amount),
      change: 0,
      icon: <Receipt className="w-6 h-6" />,
      color: 'bg-amber-500',
      subValue: kpis.overdue_count > 0 ? `${kpis.overdue_count} overdue` : 'No overdue invoices',
      isFinancial: true,
    },
    {
      id: 'avg_invoice',
      title: 'Avg Invoice Value',
      value: formatCurrency(kpis.avg_invoice_value),
      change: 0,
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-purple-500',
      subValue: `${kpis.invoice_count} invoices this period`,
      isFinancial: true,
    },

    // ── Order Cards (Always Visible) ──
    {
      id: 'orders',
      title: 'Total Orders',
      value: kpis.orders_total,
      change: kpis.orders_change,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-blue-500',
      subValue: `${kpis.orders_total_prev} last period`,
      isFinancial: false,
    },
    {
      id: 'completed',
      title: 'Completed Orders',
      value: kpis.completed_orders,
      change: kpis.completed_change,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-teal-500',
      subValue: `${kpis.completed_orders_prev} last period`,
      isFinancial: false,
    },
    {
      id: 'active_clients',
      title: 'Active Clients',
      value: kpis.active_clients,
      change: kpis.active_clients_change,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-indigo-500',
      subValue: `${kpis.total_clients} total`,
      isFinancial: false,
    },
    {
      id: 'active_suppliers',
      title: 'Active Suppliers',
      value: kpis.active_suppliers,
      change: 0,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-cyan-500',
      subValue: `${kpis.total_suppliers} total`,
      isFinancial: false,
    },
    {
      id: 'awaiting_payment',
      title: 'Awaiting Payment',
      value: kpis.awaiting_payment,
      change: 0,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-orange-500',
      isFinancial: false,
    },
    {
      id: 'supplier_missing',
      title: 'Supplier Missing',
      value: kpis.supplier_missing,
      change: 0,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-red-500',
      isFinancial: false,
    },
  ];

  // Filter cards based on permissions
  const cards = showFinancialData 
    ? allCards 
    : allCards.filter(card => !card.isFinancial);

  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow"
          >
            {/* Icon & Change Badge */}
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

      {/* Hidden Cards Notice */}
      {!showFinancialData && (
        <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <Lock size={14} className="text-gray-500" />
          <span className="text-xs text-gray-600">
            Revenue and invoice metrics are hidden based on your role
          </span>
        </div>
      )}
    </div>
  );
};

export default KPICards;