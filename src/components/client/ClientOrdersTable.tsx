// FILE PATH: src/components/client/ClientOrdersTable.tsx

/**
 * Client Orders Table - UPDATED
 * 
 * WHAT CHANGED:
 * - "Total" column replaced with "Pricing" column showing full breakdown:
 *   Items Cost, Delivery Cost, GST, Discount, Other Charges
 * - Matches admin OrdersTable display pattern for consistency
 * - Uses customer_item_cost and customer_delivery_cost from API
 * - All values come from API pre-calculated totals (backend computes margins)
 */

import React, { useState } from 'react';
import { Eye, Package, RefreshCw, Trash2 } from 'lucide-react';
import type { ClientOrderListItem } from '../../types/clientOrder.types';
import { 
  getOrderStatusBadgeClass, 
  getPaymentStatusBadgeClass, 
  formatCurrency
} from '../../features/clientOrders/utils';
import { useArchiveOrder } from '../../features/clientOrders/hooks';
import ConfirmationModal from '../common/ConfirmationModal';

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
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ClientOrderListItem | null>(null);

  // Archive mutation
  const archiveMutation = useArchiveOrder();

  // Handle delete click
  const handleDeleteClick = (order: ClientOrderListItem) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      await archiveMutation.mutateAsync(orderToDelete.id);
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      // handled by mutation
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    if (!archiveMutation.isPending) {
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!orders.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Package className="text-gray-400" size={40} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-600">Try adjusting your filters to see more results.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider bg-green-50">
                  Pricing
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                  onClick={() => onViewOrder(order.id)}
                >
                  {/* PO Number */}
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

                  {/* Project */}
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{order.project?.name || 'N/A'}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusBadgeClass(order.order_status)}`}>
                      {order.order_status}
                    </span>
                    {order.order_info && (
                      <div className="text-xs text-gray-600 mt-1">{order.order_info}</div>
                    )}
                  </td>

                  {/* Payment */}
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getPaymentStatusBadgeClass(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </td>

                  {/* Items */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-900">{order.items_count}</span>
                    </div>
                  </td>

                  {/* Pricing Breakdown */}
                  <td className="px-6 py-4 text-right bg-green-50/30">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-bold text-gray-900">
                        {formatCurrency(order.total_price ?? 0)}
                      </span>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {(order.customer_item_cost ?? 0) > 0 && (
                          <div>Items: {formatCurrency(order.customer_item_cost ?? 0)}</div>
                        )}
                        {(order.customer_delivery_cost ?? 0) > 0 && (
                          <div>Delivery: {formatCurrency(order.customer_delivery_cost ?? 0)}</div>
                        )}
                        {(order.gst_tax ?? 0) > 0 && (
                          <div>GST: {formatCurrency(order.gst_tax ?? 0)}</div>
                        )}
                        {order.discount > 0 && (
                          <div className="text-red-600">
                            Discount: -{formatCurrency(order.discount)}
                          </div>
                        )}
                        {(order.other_charges ?? 0) > 0 && (
                          <div>Other: {formatCurrency(order.other_charges ?? 0)}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewOrder(order.id);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(order);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors font-medium text-sm"
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleModalClose}
        onConfirm={handleDeleteConfirm}
        title="Delete Order"
        message={`Are you sure you want to delete order "${orderToDelete?.po_number}"? This action will archive the order and it will no longer appear in your order list.`}
        confirmText="Delete Order"
        cancelText="Keep Order"
        variant="danger"
        icon="delete"
        isLoading={archiveMutation.isPending}
      />
    </>
  );
};

export default ClientOrdersTable;