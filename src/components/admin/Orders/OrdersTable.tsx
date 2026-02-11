// FILE PATH: src/components/admin/Orders/OrdersTable.tsx

/**
 * Orders Table Component - WITH PERMISSION-BASED COLUMNS
 * 
 * WHAT CHANGED:
 * - Added other_charges display in Customer Price column
 * - Consistent with new costing logic (50% item margin, 10% delivery margin)
 * - All values come from API pre-calculated totals (backend computes margins)
 * - No frontend calculation needed - listing API returns flat aggregates
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Lock, Trash2 } from 'lucide-react';
import type { AdminOrder } from '../../../types/adminOrder.types';
import { FileText } from 'lucide-react';
import {
  getWorkflowBadgeClass,
  getPaymentBadgeClass,
  formatCurrency,
  formatDate,
} from '../../../features/adminOrders/utils';
import { usePermissions } from '../../../hooks/usePermissions';
import { archivesAPI } from '../../../api/handlers/archives.api';
import { adminOrdersKeys } from '../../../features/adminOrders/hooks';
import DeleteOrderModal from './DeleteOrderModal';

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
  const queryClient = useQueryClient();

  // Get permissions
  const { canViewCostPrice, canViewProfitMargin, role } = usePermissions();

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    orderId: number | null;
    poNumber: string;
  }>({
    isOpen: false,
    orderId: null,
    poNumber: '',
  });

  // Archive order mutation
  const archiveOrderMutation = useMutation({
    mutationFn: archivesAPI.archiveOrder,
    onSuccess: () => {
      toast.success('Order archived successfully');
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
      setDeleteModal({ isOpen: false, orderId: null, poNumber: '' });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to archive order');
    },
  });

  // Delete modal handlers
  const handleOpenDeleteModal = (e: React.MouseEvent, orderId: number, poNumber: string) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, orderId, poNumber });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false, orderId: null, poNumber: '' });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.orderId) {
      archiveOrderMutation.mutate(deleteModal.orderId);
    }
  };

  // Check if user can delete orders (admin only)
  const canDeleteOrders = role === 'admin';

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

  if (!orders.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Eye className="text-gray-400" size={40} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-600">Try adjusting your filters to see more results.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Permission Notice Banner */}
        {(!canViewCostPrice || !canViewProfitMargin) && (
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2">
            <Lock size={16} className="text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Some pricing columns are hidden based on your role permissions
            </span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  PO Number
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Client / Project
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Delivery
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Items
                </th>

                {/* Supplier Cost Column - Only visible if can view cost price */}
                {canViewCostPrice && (
                  <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-blue-50">
                    Supplier Cost
                  </th>
                )}

                {/* Customer Price - Always visible */}
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-green-50">
                  Customer Price
                </th>

                {/* Invoices Column */}
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-amber-50">
                  Invoices
                </th>

                {/* Profit Column - Only visible if can view profit margin */}
                {canViewProfitMargin && (
                  <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-purple-50">
                    Profit
                  </th>
                )}

                {/* Margin % Column - Only visible if can view profit margin */}
                {canViewProfitMargin && (
                  <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-purple-50">
                    Margin %
                  </th>
                )}

                <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => {
                const profitIsPositive = order.profit_amount >= 0;
                const marginColor = profitIsPositive ? 'text-green-600' : 'text-red-600';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    {/* PO Number */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/orders/${order.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-bold text-left"
                        >
                          {order.po_number}
                        </button>
                        {order.repeat_order && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                            Repeat
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Client / Project */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-900">{order.client}</span>
                        <span className="text-sm text-gray-600">{order.project}</span>
                      </div>
                    </td>

                    {/* Delivery */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(order.delivery_date)}
                        </span>
                        <span className="text-xs text-gray-500">{order.delivery_time}</span>
                        {order.delivery_method && (
                          <span className="text-xs text-blue-600 font-medium">
                            {order.delivery_method}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getWorkflowBadgeClass(
                            order.workflow
                          )}`}
                        >
                          {order.workflow}
                        </span>
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getPaymentBadgeClass(
                            order.payment_status
                          )}`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                      {/* Show order_info only if payment status is NOT Paid or Partially Paid */}
                      {order.order_info && !['Paid', 'Partially Paid'].includes(order.payment_status) && (
                        <div className="text-xs text-gray-500 mt-1 italic">{order.order_info}</div>
                      )}
                    </td>

                    {/* Items */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-lg font-bold text-gray-900">
                          {order.items_count}
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.suppliers_count} supplier{order.suppliers_count !== 1 ? 's' : ''}
                        </span>
                        {order.unassigned_items_count > 0 && (
                          <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                            {order.unassigned_items_count} unassigned
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Supplier Cost - Only visible if can view cost price */}
                    {canViewCostPrice && (
                      <td className="px-4 py-4 text-right bg-blue-50/50">
                        <div className="flex flex-col gap-1">
                          <span className="text-base font-bold text-gray-900">
                            {formatCurrency(order.supplier_total)}
                          </span>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>Items: {formatCurrency(order.supplier_item_cost)}</div>
                            <div>Delivery: {formatCurrency(order.supplier_delivery_cost)}</div>
                            {((order as any).supplier_discount ?? 0) > 0 && (
                              <div className="text-green-600">
                                Discount: -{formatCurrency((order as any).supplier_discount)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Customer Price - Always visible */}
                    <td className="px-4 py-4 text-right bg-green-50/50">
                      <div className="flex flex-col gap-1">
                        <span className="text-base font-bold text-gray-900">
                          {formatCurrency(order.total_price)}
                        </span>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <div>Items: {formatCurrency(order.customer_item_cost)}</div>
                          <div>Delivery: {formatCurrency(order.customer_delivery_cost)}</div>
                          <div>GST: {formatCurrency(order.gst_tax)}</div>
                          {order.discount > 0 && (
                            <div className="text-red-600">
                              Discount: -{formatCurrency(order.discount)}
                            </div>
                          )}
                          {(order.other_charges ?? 0) > 0 && (
                            <div>Other: {formatCurrency(order.other_charges)}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Invoices */}
                    <td className="px-4 py-4 text-center bg-amber-50/30">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <FileText size={14} className="text-amber-600" />
                          <span className="text-base font-bold text-gray-900">
                            {(order as any).invoices_count ?? 0}
                          </span>
                        </div>
                        {((order as any).invoiced_amount ?? 0) > 0 && (
                          <span className="text-xs text-gray-600">
                            {formatCurrency((order as any).invoiced_amount)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Profit - Only visible if can view profit margin */}
                    {canViewProfitMargin && (
                      <td className="px-4 py-4 text-right bg-purple-50/50">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            {profitIsPositive ? (
                              <TrendingUp size={16} className="text-green-600" />
                            ) : (
                              <TrendingDown size={16} className="text-red-600" />
                            )}
                            <span className={`text-base font-bold ${marginColor}`}>
                              {formatCurrency(order.profit_amount)}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Margin % - Only visible if can view profit margin */}
                    {canViewProfitMargin && (
                      <td className="px-4 py-4 text-right bg-purple-50/50">
                        <span className={`text-base font-bold ${marginColor}`}>
                          {(order.profit_margin_percent * 100).toFixed(2)}%
                        </span>
                      </td>
                    )}

                    {/* Actions - View + Delete */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/orders/${order.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
                          title="View Order"
                        >
                          <Eye size={16} />
                          View
                        </button>

                        {/* Delete Button - Only for Admin */}
                        {canDeleteOrders && (
                          <button
                            onClick={(e) => handleOpenDeleteModal(e, order.id, order.po_number)}
                            className="inline-flex items-center justify-center p-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition-all"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t-2 border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600 font-medium">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of{' '}
              {pagination.total_items} orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === pagination.total_pages ||
                    Math.abs(page - pagination.current_page) <= 1
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                          page === pagination.current_page
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
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
                      <span key={page} className="px-2 text-gray-500 font-bold">
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
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteOrderModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isLoading={archiveOrderMutation.isPending}
        orderNumber={deleteModal.poNumber}
      />
    </>
  );
};

export default OrdersTable;