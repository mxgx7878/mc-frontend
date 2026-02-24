// FILE PATH: src/components/admin/Dashboard/TablesSection.tsx
// ============================================
// TABLES SECTION WITH PERMISSION-BASED VISIBILITY
// ============================================

/**
 * Tables Section Component
 * Displays Top Clients by Invoiced, Top Suppliers by Cost, and Recent Invoices
 * Financial amounts hidden for Support role
 * 
 * UPDATED: Tables now match invoice-based backend response
 *   - top_clients_by_invoiced (was top_clients_by_spend)
 *   - top_suppliers_by_cost (was top_suppliers_by_revenue)
 *   - recent_invoices (was recent_activity)
 */

import React from 'react';
import { TrendingUp, Package, FileText, Lock } from 'lucide-react';
import type { TopClient, TopSupplier, RecentInvoice } from '../../../api/handlers/adminDashboard.api';

interface TablesSectionProps {
  topClients: TopClient[];
  topSuppliers: TopSupplier[];
  recentInvoices: RecentInvoice[];
  loading: boolean;
  currency?: string;
  /** If false, hides financial amounts (for Support role) */
  showFinancialData?: boolean;
}

const TablesSection: React.FC<TablesSectionProps> = ({
  topClients,
  topSuppliers,
  recentInvoices,
  loading,
  currency = 'AUD',
  showFinancialData = true,
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getInvoiceStatusBadgeClass = (status: string): string => {
    const styles: Record<string, string> = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Sent': 'bg-blue-100 text-blue-800',
      'Paid': 'bg-green-100 text-green-800',
      'Partially Paid': 'bg-yellow-100 text-yellow-800',
      'Overdue': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-200 text-gray-600',
      'Void': 'bg-gray-200 text-gray-600',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
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
      {/* Top Clients by Invoiced */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top Clients
          </h3>
          {!showFinancialData && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Lock size={12} />
              Amounts hidden
            </span>
          )}
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
                  <p className="text-xs text-gray-600 mt-1">{client.invoice_count} invoices</p>
                </div>
                {showFinancialData ? (
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{formatCurrency(client.total_invoiced)}</p>
                    <p className="text-xs text-green-600">{formatCurrency(client.paid_amount)} paid</p>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                      Hidden
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Suppliers by Cost */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Top Suppliers
          </h3>
          {!showFinancialData && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Lock size={12} />
              Costs hidden
            </span>
          )}
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
                {showFinancialData ? (
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(supplier.total_cost)}</p>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                      Hidden
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Recent Invoices
          </h3>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {recentInvoices.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No recent invoices</p>
          ) : (
            recentInvoices.map((invoice) => (
              <div
                key={invoice.invoice_id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-xs text-gray-600">
                      {invoice.client_name} &bull; PO: {invoice.po_number}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${getInvoiceStatusBadgeClass(
                      invoice.status
                    )}`}
                  >
                    {invoice.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">{invoice.time_ago}</p>
                    {invoice.due_date && (
                      <p className="text-xs text-gray-400">Due: {invoice.due_date}</p>
                    )}
                  </div>
                  {showFinancialData ? (
                    <p className="text-xs font-semibold text-gray-700">
                      {formatCurrency(invoice.total_amount)}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Amount hidden
                    </span>
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