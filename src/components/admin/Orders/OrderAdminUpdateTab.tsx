// FILE PATH: src/components/admin/Orders/OrderAdminUpdateTab.tsx

/**
 * Order Admin Update Tab Component - IMPROVED
 * Comprehensive admin controls for:
 * 1. Discount management
 * 2. Payment status management
 * 3. Supplier assignment overview
 * 4. Quoted prices summary
 */

import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import type { AdminOrderDetail, PaymentStatus } from '../../../types/adminOrder.types';
import { useUpdateAdminOrder, useUpdatePaymentStatus } from '../../../features/adminOrders/hooks';
import { canEditOrder, formatCurrency, getPaymentBadgeClass } from '../../../features/adminOrders/utils';
import ConfirmModal from '../../common/ConfirmModal';

// Payment status options
const PAYMENT_STATUSES: PaymentStatus[] = [
  'Pending',
  'Requested',
  'Paid',
  'Partially Paid',
  'Partial Refunded',
  'Refunded',
];

// Statuses that require confirmation before changing
const SENSITIVE_STATUSES: PaymentStatus[] = ['Refunded', 'Partial Refunded'];

interface OrderAdminUpdateTabProps {
  order: AdminOrderDetail;
}

const OrderAdminUpdateTab: React.FC<OrderAdminUpdateTabProps> = ({ order }) => {
  const updateMutation = useUpdateAdminOrder();
  const paymentStatusMutation = useUpdatePaymentStatus();
  const canEdit = canEditOrder(order.workflow);

  // Discount state
  const [discount, setDiscount] = useState<string>(order.discount.toString());
  const [hasChanges, setHasChanges] = useState(false);

  // Payment status state
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>(order.payment_status);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PaymentStatus | null>(null);

  const handleDiscountChange = (value: string) => {
    setDiscount(value);
    setHasChanges(value !== order.discount.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue) || discountValue < 0) {
      return;
    }

    updateMutation.mutate(
      {
        orderId: order.id,
        payload: { discount: discountValue },
      },
      {
        onSuccess: () => {
          setHasChanges(false);
        },
      }
    );
  };

  const handleReset = () => {
    setDiscount(order.discount.toString());
    setHasChanges(false);
  };

  // Payment status handlers
  const handlePaymentStatusChange = (newStatus: PaymentStatus) => {
    setSelectedPaymentStatus(newStatus);
  };

  const handlePaymentStatusSubmit = () => {
    if (selectedPaymentStatus === order.payment_status) return;

    // Check if confirmation is needed for sensitive statuses
    if (SENSITIVE_STATUSES.includes(selectedPaymentStatus)) {
      setPendingStatus(selectedPaymentStatus);
      setIsConfirmModalOpen(true);
    } else {
      executePaymentStatusUpdate(selectedPaymentStatus);
    }
  };

  const executePaymentStatusUpdate = (status: PaymentStatus) => {
    paymentStatusMutation.mutate(
      {
        orderId: order.id,
        paymentStatus: status,
      },
      {
        onSuccess: () => {
          setPendingStatus(null);
        },
      }
    );
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatus) {
      executePaymentStatusUpdate(pendingStatus);
    }
    setIsConfirmModalOpen(false);
  };

  const handleCancelStatusChange = () => {
    setSelectedPaymentStatus(order.payment_status);
    setPendingStatus(null);
    setIsConfirmModalOpen(false);
  };

  // Calculate statistics
  const totalItems = order.items.length;
  const assignedItems = order.items.filter((item) => item.supplier?.id).length;
  const unassignedItems = totalItems - assignedItems;
  const quotedItems = order.items.filter((item) => item.is_quoted === 1).length;
  const paidItems = order.items.filter((item) => item.is_paid === 1).length;
  const unpaidItems = assignedItems - paidItems;

  // Calculate price after discount
  const currentTotal = order.total_price || order.customer_cost || 0;
  const discountValue = parseFloat(discount) || 0;
  const totalAfterDiscount = currentTotal - discountValue;

  // Check if payment status has changed
  const hasPaymentStatusChanged = selectedPaymentStatus !== order.payment_status;

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl p-8 text-center">
          <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Order Cannot Be Edited</h3>
          <p className="text-gray-700">
            Delivered orders are locked and cannot be modified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Admin Controls</h3>
            <p className="text-indigo-100 text-sm mt-1">
              Manage order pricing, suppliers, and payment status
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>

        {/* Supplier Assignment */}
        <div className={`bg-white border-2 rounded-xl p-4 shadow-sm ${
          unassignedItems > 0 ? 'border-yellow-300' : 'border-green-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              unassignedItems > 0 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              {unassignedItems > 0 ? (
                <XCircle className="text-yellow-600" size={20} />
              ) : (
                <CheckCircle className="text-green-600" size={20} />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignedItems}/{totalItems}
              </p>
            </div>
          </div>
          {unassignedItems > 0 && (
            <p className="text-xs text-yellow-700 mt-2 font-medium">
              {unassignedItems} item{unassignedItems !== 1 ? 's' : ''} need supplier
            </p>
          )}
        </div>

        {/* Quoted Items */}
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Quoted Prices</p>
              <p className="text-2xl font-bold text-gray-900">{quotedItems}</p>
            </div>
          </div>
          {quotedItems > 0 && (
            <p className="text-xs text-purple-700 mt-2 font-medium">
              Custom pricing applied
            </p>
          )}
        </div>

        {/* Payment Status */}
        <div className={`bg-white border-2 rounded-xl p-4 shadow-sm ${
          unpaidItems > 0 ? 'border-orange-300' : 'border-green-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              unpaidItems > 0 ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              <CreditCard className={unpaidItems > 0 ? 'text-orange-600' : 'text-green-600'} size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Paid Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {paidItems}/{assignedItems}
              </p>
            </div>
          </div>
          {unpaidItems > 0 && (
            <p className="text-xs text-orange-700 mt-2 font-medium">
              {unpaidItems} item{unpaidItems !== 1 ? 's' : ''} unpaid
            </p>
          )}
        </div>
      </div>

      {/* Payment Status Management Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-sm">
            <CreditCard className="text-white" size={24} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900">Update Payment Status</h4>
            <p className="text-sm text-gray-600">Change the payment status for this order</p>
          </div>
        </div>

        {/* Current Status Display */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Current Status
          </label>
          <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-bold ${getPaymentBadgeClass(order.payment_status)}`}>
            {order.payment_status}
          </span>
        </div>

        {/* Status Selection */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            New Status
          </label>
          <select
            value={selectedPaymentStatus}
            onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
            disabled={paymentStatusMutation.isPending}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium transition-colors bg-white"
          >
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Status Change Preview */}
        {hasPaymentStatusChanged && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="text-blue-600" size={18} />
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900">Status Change Preview</p>
                <p className="text-xs text-blue-800 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${getPaymentBadgeClass(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                  <span className="mx-2">→</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${getPaymentBadgeClass(selectedPaymentStatus)}`}>
                    {selectedPaymentStatus}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning for Sensitive Status */}
        {hasPaymentStatusChanged && SENSITIVE_STATUSES.includes(selectedPaymentStatus) && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-amber-600 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">Warning</p>
                <p className="text-xs text-amber-800 mt-1">
                  You are about to set the payment status to "{selectedPaymentStatus}". 
                  This action may trigger refund processes. Please confirm this change.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Update Button */}
        {hasPaymentStatusChanged && (
          <button
            type="button"
            onClick={handlePaymentStatusSubmit}
            disabled={paymentStatusMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl"
          >
            <Save size={20} />
            {paymentStatusMutation.isPending ? 'Updating...' : 'Update Payment Status'}
          </button>
        )}
      </div>

      {/* Discount Management Section */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-sm">
              <DollarSign className="text-white" size={24} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">Apply Discount</h4>
              <p className="text-sm text-gray-600">Reduce the final price for this order</p>
            </div>
          </div>

          {/* Current Total Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="text-sm text-blue-700 font-medium mb-1">Current Total</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(currentTotal)}
              </div>
              <div className="text-xs text-blue-600 mt-1">Before discount</div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
              <div className="text-sm text-purple-700 font-medium mb-1">Discount</div>
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(discountValue)}
              </div>
              <div className="text-xs text-purple-600 mt-1">Amount to deduct</div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="text-sm text-green-700 font-medium mb-1">Final Total</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(totalAfterDiscount)}
              </div>
              <div className="text-xs text-green-600 mt-1">After discount</div>
            </div>
          </div>

          {/* Discount Input */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Discount Amount ($)
            </label>
            <input
              type="number"
              value={discount}
              onChange={(e) => handleDiscountChange(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold transition-colors"
              placeholder="0.00"
            />
            <p className="text-sm text-gray-600 mt-2">
              Enter the discount amount to be subtracted from the final price
            </p>
          </div>

          {/* Impact on Profit */}
          {discountValue !== order.discount && (
            <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="text-amber-600 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900 mb-1">Profit Impact</p>
                  <p className="text-xs text-amber-800">
                    Changing discount from {formatCurrency(order.discount)} to {formatCurrency(discountValue)} will{' '}
                    {discountValue > order.discount ? 'decrease' : 'increase'} profit by{' '}
                    <span className="font-bold">
                      {formatCurrency(Math.abs(discountValue - order.discount))}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl"
            >
              <Save size={20} />
              {updateMutation.isPending ? 'Saving...' : 'Save Discount'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges}
              className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg"
            >
              <RotateCcw size={20} />
              Reset
            </button>
          </div>
        )}
      </form>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* How Discount Works */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle size={16} />
            How Discount Works
          </h4>
          <div className="space-y-2 text-sm text-gray-800">
            <p>• Discount is subtracted from the final total</p>
            <p>• Formula: <code className="bg-white px-2 py-0.5 rounded font-mono text-xs">Final = Subtotal + Tax - Discount</code></p>
            <p>• Discount directly reduces profit margin</p>
          </div>
        </div>

        {/* Quick Actions Guide */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
          <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
            <Package size={16} />
            Quick Actions
          </h4>
          <div className="space-y-2 text-sm text-gray-800">
            <p>• Assign suppliers in the <span className="font-bold text-purple-700">Items</span> tab</p>
            <p>• Set quoted prices in the <span className="font-bold text-purple-700">Items</span> tab</p>
            <p>• Mark items paid in the <span className="font-bold text-purple-700">Items</span> tab</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Sensitive Status Changes */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelStatusChange}
        onConfirm={handleConfirmStatusChange}
        title="Confirm Payment Status Change"
        message={`Are you sure you want to change the payment status to "${pendingStatus}"? This action may trigger refund processes and cannot be easily undone.`}
        confirmText="Yes, Update Status"
        cancelText="Cancel"
        isDanger={true}
        loading={paymentStatusMutation.isPending}
      />
    </div>
  );
};

export default OrderAdminUpdateTab;