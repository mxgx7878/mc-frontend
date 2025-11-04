// FILE PATH: src/components/admin/Orders/OrderItemsTab.tsx

/**
 * Order Items Tab Component - FIXED v2
 * Displays items with supplier assignment, quoted price, and payment status management
 * ✅ Handles both supplier_id field AND supplier object
 */

import React, { useState } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Edit3,
  X,
  Check,
  CreditCard,
  User,
} from 'lucide-react';
import type { AdminOrderItem, WorkflowStatus } from '../../../types/adminOrder.types';
import { formatCurrency } from '../../../features/adminOrders/utils';
import { 
  useAssignSupplier, 
  useSetQuotedPrice, 
  useMarkItemAsPaid 
} from '../../../features/adminOrders/hooks';

interface OrderItemsTabProps {
  items: AdminOrderItem[];
  workflow: WorkflowStatus;
  orderId: number;
}

const OrderItemsTab: React.FC<OrderItemsTabProps> = ({ items, workflow, orderId }) => {
  const [editingQuotedPrice, setEditingQuotedPrice] = useState<number | null>(null);
  const [quotedPriceValue, setQuotedPriceValue] = useState<string>('');

  const assignSupplierMutation = useAssignSupplier();
  const setQuotedPriceMutation = useSetQuotedPrice();
  const markAsPaidMutation = useMarkItemAsPaid();

  // Handle supplier selection
  const handleSupplierSelect = (itemId: number, supplierId: number, offerId: number) => {
    assignSupplierMutation.mutate({
      order_id: orderId,
      item_id: itemId,
      supplier: supplierId,
      offer_id: offerId,
    });
  };

  // Handle quoted price editing
  const handleStartEditQuotedPrice = (item: AdminOrderItem) => {
    setEditingQuotedPrice(item.id);
    setQuotedPriceValue(item.quoted_price?.toString() || '');
  };

  const handleSaveQuotedPrice = (itemId: number) => {
    const price = quotedPriceValue === '' ? null : parseFloat(quotedPriceValue);
    if (price !== null && (isNaN(price) || price < 0)) {
      return;
    }
    setQuotedPriceMutation.mutate(
      { orderId, itemId, quotedPrice: price },
      {
        onSuccess: () => {
          setEditingQuotedPrice(null);
          setQuotedPriceValue('');
        },
      }
    );
  };

  const handleCancelEditQuotedPrice = () => {
    setEditingQuotedPrice(null);
    setQuotedPriceValue('');
  };

  // Handle payment status toggle
  const handleTogglePaidStatus = (itemId: number, currentStatus: number) => {
    markAsPaidMutation.mutate({
      orderId,
      itemId,
      isPaid: currentStatus === 0,
    });
  };

  // Render item for "Supplier Missing" workflow
  const renderSupplierMissingItem = (item: AdminOrderItem) => (
    <div key={item.id} className="bg-white border-2 border-yellow-300 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-yellow-600" />
            <h4 className="font-bold text-gray-900 text-lg">{item.product_name}</h4>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">Quantity: <span className="text-gray-900 font-bold">{item.quantity}</span></span>
          </div>
        </div>
        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border-2 border-yellow-300 flex items-center gap-1.5">
          <AlertCircle size={14} />
          Missing Supplier
        </span>
      </div>

      {/* Supplier Selection */}
      <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <User size={16} className="text-yellow-600" />
          Assign Supplier
        </label>
        <select
          onChange={(e) => {
            const selected = item.eligible_suppliers?.find(
              (s) => s.supplier_id === parseInt(e.target.value)
            );
            if (selected) {
              handleSupplierSelect(item.id, selected.supplier_id, selected.offer_id);
            }
          }}
          disabled={assignSupplierMutation.isPending}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium disabled:opacity-50 bg-white transition-colors"
          defaultValue=""
        >
          <option value="" disabled>
            Choose a supplier...
          </option>
          {item.eligible_suppliers?.map((supplier) => (
            <option key={supplier.supplier_id} value={supplier.supplier_id}>
              {supplier.name}
              {supplier.distance !== null && ` - ${supplier.distance.toFixed(1)} km away`}
            </option>
          ))}
        </select>
        {item.eligible_suppliers && item.eligible_suppliers.length === 0 && (
          <p className="text-sm text-red-600 mt-3 flex items-center gap-2 font-medium">
            <AlertCircle size={16} />
            No eligible suppliers found for this product
          </p>
        )}
      </div>
    </div>
  );

  // Render item for other workflows
  const renderAssignedItem = (item: AdminOrderItem) => {
    const isConfirmed = item.supplier_confirms === 1;
    const isPaid = item.is_paid === 1;
    const isQuoted = item.is_quoted === 1;
    const isEditingPrice = editingQuotedPrice === item.id;

    return (
      <div
        key={item.id}
        className={`bg-white border-2 rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${
          isConfirmed ? 'border-green-300' : 'border-gray-300'
        }`}
      >
        {/* Item Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package size={20} className="text-blue-600" />
              <h4 className="font-bold text-gray-900 text-lg">{item.product_name}</h4>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">Quantity: <span className="text-gray-900 font-bold">{item.quantity}</span></span>
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="flex flex-col gap-2 items-end">
            {/* Confirmation Status */}
            <span
              className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 border-2 transition-colors ${
                isConfirmed
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-yellow-100 text-yellow-700 border-yellow-300'
              }`}
            >
              {isConfirmed ? (
                <>
                  <CheckCircle size={14} />
                  Confirmed
                </>
              ) : (
                <>
                  <Clock size={14} />
                  Pending
                </>
              )}
            </span>

            {/* Quoted Price Badge */}
            {isQuoted && (
              <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border-2 border-purple-300">
                Quoted Price
              </span>
            )}

            {/* Payment Status Badge/Button */}
            {(item.supplier_id || item.supplier) && (
              <button
                onClick={() => handleTogglePaidStatus(item.id, item.is_paid)}
                disabled={markAsPaidMutation.isPending}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                  isPaid
                    ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                }`}
              >
                <CreditCard size={14} />
                {isPaid ? 'Paid ✓' : 'Mark as Paid'}
              </button>
            )}
          </div>
        </div>

        {/* Supplier Info */}
        {item.supplier && (
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mb-4">
            <div className="flex items-center gap-3 mb-3">
              {item.supplier.profile_image ? (
                <img
                  src={`${import.meta.env.VITE_IMAGE_BASE_URL}${item.supplier.profile_image}`}
                  alt={item.supplier.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-300 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-300 shadow-sm">
                  <span className="text-white font-bold text-lg">
                    {item.supplier.name?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900">{item.supplier.name}</p>
                <p className="text-xs text-blue-600">Assigned Supplier</p>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="space-y-2 text-sm border-t-2 border-blue-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Unit Cost:</span>
                <span className="font-bold text-gray-900">{formatCurrency(item.supplier_unit_cost || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Quantity:</span>
                <span className="font-bold text-gray-900">×{item.quantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Subtotal:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency((item.supplier_unit_cost || 0) * item.quantity)}
                </span>
              </div>
              {item.supplier_discount && item.supplier_discount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="font-medium">Supplier Discount:</span>
                  <span className="font-bold">-{formatCurrency(item.supplier_discount)}</span>
                </div>
              )}
              {item.supplier_delivery_cost && item.supplier_delivery_cost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Delivery Cost:</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(item.supplier_delivery_cost)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quoted Price Section */}
        <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-purple-600" />
              <span className="text-sm font-bold text-purple-900">Quoted Price</span>
            </div>
            {!isEditingPrice && (
              <button
                onClick={() => handleStartEditQuotedPrice(item)}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-bold flex items-center gap-1.5"
              >
                <Edit3 size={14} />
                Edit
              </button>
            )}
          </div>

          {isEditingPrice ? (
            <div className="space-y-3">
              <input
                type="number"
                value={quotedPriceValue}
                onChange={(e) => setQuotedPriceValue(e.target.value)}
                placeholder="Enter quoted price or leave empty to clear"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold text-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveQuotedPrice(item.id)}
                  disabled={setQuotedPriceMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-bold text-sm"
                >
                  <Check size={16} />
                  Save
                </button>
                <button
                  onClick={handleCancelEditQuotedPrice}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold text-sm"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {isQuoted ? 'Custom quoted price applied' : 'Using standard pricing'}
              </span>
              <span className="text-lg font-bold text-purple-900">
                {isQuoted && item.quoted_price
                  ? formatCurrency(item.quoted_price)
                  : '—'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Package size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Order Items</h3>
              <p className="text-purple-100 text-sm mt-1">{items.length} item{items.length !== 1 ? 's' : ''} in this order</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-white/20 rounded-lg border-2 border-white/30">
            <span className="text-2xl font-bold">{items.length}</span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item) => {
          // ✅ FIX v2: Check BOTH supplier_id AND supplier object
          const hasSupplier = item.supplier_id || item.supplier;
          
          if (!hasSupplier) {
            return renderSupplierMissingItem(item);
          }
          return renderAssignedItem(item);
        })}
      </div>
    </div>
  );
};

export default OrderItemsTab;