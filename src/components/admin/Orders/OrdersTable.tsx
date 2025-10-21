// FILE PATH: src/components/admin/Orders/OrdersTable.tsx

/**
 * Orders Table Component
 * Displays paginated list of orders
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminOrder } from '../../../types/adminOrder.types';
import {
  getWorkflowBadgeClass,
  getPaymentBadgeClass,
  getMarginColor,
  formatCurrency,
  formatDate,
} from '../../../features/adminOrders/utils';

interface OrdersTableProps {
  orders: AdminOrder[];
  loading: boolean;
  pagination: {
    per_page: number;
    current_page: number;
    total_pages: number;
    total_items: number;
    has_more_pages: boolean;
  } | null;
  onPageChange: (page: number) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  loading,
  pagination,
  onPageChange,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-600">Try adjusting your filters to see more results.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                PO Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Delivery Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Workflow
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Supplier Cost
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Customer Cost
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Margin
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <button
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {order.po_number}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900">{order.client}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900">{order.project}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    <div className="text-gray-900">{formatDate(order.delivery_date)}</div>
                    <div className="text-gray-500">{order.delivery_time}</div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getWorkflowBadgeClass(
                      order.workflow
                    )}`}
                  >
                    {order.workflow}
                  </span>
                  {order.order_info && (
                    <div className="text-xs text-gray-500 mt-1">{order.order_info}</div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentBadgeClass(
                      order.payment_status
                    )}`}
                  >
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium">{order.items_count}</div>
                    {order.unassigned_items_count > 0 && (
                      <div className="text-xs text-yellow-600 font-medium">
                        {order.unassigned_items_count} unassigned
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.supplier_cost)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.customer_cost)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className={`text-sm font-bold ${getMarginColor(order.admin_margin)}`}>
                    {formatCurrency(order.admin_margin)}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} total orders)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {[...Array(pagination.total_pages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.total_pages ||
                  (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        page === pagination.current_page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === pagination.current_page - 2 ||
                  page === pagination.current_page + 2
                ) {
                  return (
                    <span key={page} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>
            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={!pagination.has_more_pages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;