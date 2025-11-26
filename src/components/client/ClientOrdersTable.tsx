// src/components/client/ClientOrdersTable.tsx

import React from 'react';
import { Eye, Package, Calendar, RefreshCw } from 'lucide-react';
import type {ClientOrderListItem } from '../../types/clientOrder.types';
import { getOrderStatusBadgeClass, getPaymentStatusBadgeClass, formatCurrency, formatDate } from '../../features/clientOrders/utils';

interface ClientOrdersTableProps {
  orders: ClientOrderListItem[];
  loading: boolean;
  pagination: {
    per_page: number;
    current_page: number;
    total_pages: number;
    total_items: number;
  } | null;
  onPageChange: (page: number) => void;
  onViewOrder: (orderId: number) => void;
}

const ClientOrdersTable: React.FC<ClientOrdersTableProps> = ({
  orders,
  loading,
  pagination,
  onPageChange,
  onViewOrder,
}) => {

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <Package size={64} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Found</h3>
        <p className="text-gray-600">Try adjusting your filters or create a new order.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">PO Number</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Project</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Delivery</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Payment</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Items</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Total</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{order.po_number}</span>
                    <span className="text-xs text-gray-500">ID: {order.id}</span>
                    {order.repeat_order && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                        <RefreshCw size={12} />
                        Repeat
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{order.project?.name || 'N/A'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{formatDate(order.delivery_date)}</span>
                    </div>
                    {order.delivery_time && (
                      <span className="text-xs text-gray-600">{order.delivery_time}</span>
                    )}
                    {/* <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span>{getDeliveryMethodIcon(order.delivery_method)}</span>
                      <span>{order.delivery_method}</span>
                    </div> */}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusBadgeClass(order.order_status)}`}>
                    {order.order_status}
                  </span>
                  {order.order_info && (
                    <div className="text-xs text-gray-600 mt-1">{order.order_info}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getPaymentStatusBadgeClass(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-900">{order.items_count}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(order.total_price ?? 0)}</span>
                    {(order.gst_tax ?? 0) > 0 && (
                      <span className="text-xs text-gray-500">GST: {formatCurrency((order.gst_tax ?? 0))}</span>
                    )}
                    {order.discount > 0 && (
                      <span className="text-xs text-green-600">Discount: -{formatCurrency(order.discount)}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => onViewOrder(order.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} total orders)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.total_pages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOrdersTable;