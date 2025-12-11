// FILE PATH: src/components/admin/Orders/OrderItemsTab.tsx

/**
 * Order Items Tab Component - WITH PERMISSION-BASED VISIBILITY
 * Displays items with supplier assignment, quoted price, payment status
 * HIDES cost columns based on user permissions
 * HIDES edit actions for read-only users (Accountant)
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
  Edit,
  Lock,
  Eye,
} from 'lucide-react';
import type { AdminOrderItem, WorkflowStatus } from '../../../types/adminOrder.types';
import { formatCurrency } from '../../../features/adminOrders/utils';
import {
  useAssignSupplier,
  useSetQuotedPrice,
  useMarkItemAsPaid,
} from '../../../features/adminOrders/hooks';
import AdminOrderItemEditModal from './AdminOrderItemEditModal';
import { usePermissions } from '../../../hooks/usePermissions';
import PermissionGate from '../../common/PermissionGate';

interface OrderItemsTabProps {
  items: AdminOrderItem[];
  workflow: WorkflowStatus;
  orderId: number;
}

const OrderItemsTab: React.FC<OrderItemsTabProps> = ({ items, workflow, orderId }) => {
  const [editingQuotedPrice, setEditingQuotedPrice] = useState<number | null>(null);
  const [quotedPriceValue, setQuotedPriceValue] = useState<string>('');
  const [editingItem, setEditingItem] = useState<AdminOrderItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get permissions
  const {
    canViewCostPrice,

    canEnterQuotedRates,
    canEditOrders,
    canAssignSupplier,
  
    isReadOnly,

  } = usePermissions();

  const assignSupplierMutation = useAssignSupplier();
  const setQuotedPriceMutation = useSetQuotedPrice();
  const markAsPaidMutation = useMarkItemAsPaid();

  // Check if admin can edit item pricing
  const canEditItemPricing = (item: AdminOrderItem) => {
    // If user is read-only, they can't edit anything
    if (isReadOnly) return false;
    // Check if user has edit permission
    if (!canEditOrders) return false;

    const hasSupplier = item.supplier_id || item.supplier;
    const allowedWorkflows: WorkflowStatus[] = ['Supplier Assigned', 'Payment Requested'];
    return hasSupplier && allowedWorkflows.includes(workflow);
  };

  // Handle admin edit
  const handleOpenEditModal = (item: AdminOrderItem) => {
    if (isReadOnly) return;
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingItem(null);
    setIsEditModalOpen(false);
  };

  // Handle supplier selection
  const handleSupplierSelect = (itemId: number, supplierId: number, offerId: number) => {
    if (isReadOnly || !canAssignSupplier) return;
    assignSupplierMutation.mutate({
      order_id: orderId,
      item_id: itemId,
      supplier: supplierId,
      offer_id: offerId,
    });
  };

  // Handle quoted price editing
  const handleStartEditQuotedPrice = (item: AdminOrderItem) => {
    if (isReadOnly || !canEnterQuotedRates) return;
    setEditingQuotedPrice(item.id);
    setQuotedPriceValue(item.quoted_price?.toString() || '');
  };

  const handleSaveQuotedPrice = (itemId: number) => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    markAsPaidMutation.mutate({
      orderId,
      itemId,
      isPaid: currentStatus === 0,
    });
  };

  // Render item for "Supplier Missing" workflow
  const renderSupplierMissingItem = (item: AdminOrderItem) => (
    <div
      key={item.id}
      className="bg-white border-2 border-yellow-300 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-yellow-600" />
            <h4 className="font-bold text-gray-900 text-lg">{item.product_name}</h4>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">
              Quantity: <span className="text-gray-900 font-bold">{item.quantity}</span>
            </span>
          </div>
        </div>
        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border-2 border-yellow-300 flex items-center gap-1.5">
          <AlertCircle size={14} />
          Missing Supplier
        </span>
      </div>

      {/* Supplier Selection - Only if can assign supplier */}
      <PermissionGate
        permission="orders.assign_supplier"
        fallback={
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <div className="flex items-center gap-2 text-gray-500">
              <Lock size={16} />
              <span className="text-sm">Supplier assignment requires additional permissions</span>
            </div>
          </div>
        }
      >
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
            disabled={assignSupplierMutation.isPending || isReadOnly}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          >
            <option value="">Select a supplier...</option>
            {item.eligible_suppliers?.map((supplier) => (
              <option key={supplier.supplier_id} value={supplier.supplier_id}>
                {supplier.name}
                {/* Only show cost if user can view cost price */}
                {canViewCostPrice && ` - ${formatCurrency(supplier.unit_cost as number)}`}
              </option>
            ))}
          </select>
          {!item.eligible_suppliers?.length && (
            <p className="text-yellow-700 text-sm mt-2 flex items-center gap-1.5">
              <AlertCircle size={14} />
              No eligible suppliers found for this product
            </p>
          )}
        </div>
      </PermissionGate>
    </div>
  );

  // Render item with supplier assigned (not yet confirmed or paid)
  const renderSupplierAssignedItem = (item: AdminOrderItem) => (
    <div
      key={item.id}
      className="bg-white border-2 border-indigo-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header with Admin Edit Button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-indigo-600" />
            <h4 className="font-bold text-gray-900 text-lg">{item.product_name}</h4>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">
              Quantity: <span className="text-gray-900 font-bold">{item.quantity}</span>
            </span>
            <span className="font-medium">
              Supplier: <span className="text-indigo-700 font-bold">{item.supplier?.name || 'Unknown'}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.supplier_confirms ? (
            <span className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full border-2 border-green-300 flex items-center gap-1.5">
              <CheckCircle size={14} />
              Confirmed
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border-2 border-blue-300 flex items-center gap-1.5">
              <Clock size={14} />
              Pending Confirmation
            </span>
          )}
          
          {/* Read-Only Badge */}
          {isReadOnly && (
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border-2 border-yellow-300 flex items-center gap-1.5">
              <Eye size={14} />
              View Only
            </span>
          )}
          
          {/* Admin Edit Button - Only if can edit */}
          {canEditItemPricing(item) && !isReadOnly && (
            <button
              onClick={() => handleOpenEditModal(item)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
              title="Admin Override - Edit Item Pricing"
            >
              <Edit size={14} />
              Admin Edit
            </button>
          )}
        </div>
      </div>

      {/* Pricing Details - Only show if user can view cost price */}
      <PermissionGate
        permission="pricing.view_cost_price"
        fallback={
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <div className="flex items-center gap-2 text-gray-500">
              <Lock size={16} />
              <span className="text-sm font-medium">Pricing details hidden</span>
            </div>
          </div>
        }
      >
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Unit Cost:</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(item.supplier_unit_cost as number)}
            </span>
          </div>
          {item.supplier_discount && item.supplier_discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span className="font-medium">-{formatCurrency(item.supplier_discount)}</span>
            </div>
          )}
          {item.delivery_type && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Type:</span>
              <span className="font-medium text-gray-900">{item.delivery_type}</span>
            </div>
          )}
          {item.delivery_cost && item.delivery_cost > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Delivery Cost:</span>
              <span className="font-medium">+{formatCurrency(item.delivery_cost)}</span>
            </div>
          )}
        </div>
      </PermissionGate>

      {/* Quoted Price Section - Only if can enter quoted rates */}
      <PermissionGate permission="pricing.enter_quoted_rates">
        <div className="mt-4 bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-purple-600" />
              <span className="text-sm font-bold text-gray-900">Quoted Price Override</span>
            </div>
            {editingQuotedPrice === item.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={quotedPriceValue}
                  onChange={(e) => setQuotedPriceValue(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-32 px-3 py-1.5 text-sm border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveQuotedPrice(item.id)}
                  disabled={setQuotedPriceMutation.isPending}
                  className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancelEditQuotedPrice}
                  className="p-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-purple-700">
                  {item.is_quoted === 1 && item.quoted_price !== null
                    ? formatCurrency(item.quoted_price as number)
                    : 'Not Set'}
                </span>
                {!isReadOnly && (
                  <button
                    onClick={() => handleStartEditQuotedPrice(item)}
                    className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    title="Edit Quoted Price"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </PermissionGate>

      {/* Payment Status Section */}
      <div className="mt-4 bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-gray-900">Payment Status</span>
          </div>
          {isReadOnly ? (
            <span
              className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                item.is_paid === 1
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
              }`}
            >
              {item.is_paid === 1 ? '✓ Paid' : 'Unpaid'}
            </span>
          ) : (
            <PermissionGate
              permission="payments.mark_paid"
              fallback={
                <span
                  className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                    item.is_paid === 1
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                  }`}
                >
                  {item.is_paid === 1 ? '✓ Paid' : 'Unpaid'}
                </span>
              }
            >
              <button
                onClick={() => handleTogglePaidStatus(item.id, item.is_paid)}
                disabled={markAsPaidMutation.isPending}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                  item.is_paid === 1
                    ? 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {item.is_paid === 1 ? '✓ Paid' : 'Mark as Paid'}
              </button>
            </PermissionGate>
          )}
        </div>
      </div>
    </div>
  );

  // Render item with pricing visible (Payment Requested or Delivered)
  const renderPricedItem = (item: AdminOrderItem) => (
    <div
      key={item.id}
      className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header with Admin Edit Button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-green-600" />
            <h4 className="font-bold text-gray-900 text-lg">{item.product_name}</h4>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">
              Quantity: <span className="text-gray-900 font-bold">{item.quantity}</span>
            </span>
            <span className="font-medium">
              Supplier: <span className="text-green-700 font-bold">{item.supplier?.name || 'Unknown'}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full border-2 border-green-300 flex items-center gap-1.5">
            <CheckCircle size={14} />
            {workflow === 'Delivered' ? 'Delivered' : 'Ready'}
          </span>
          
          {/* Read-Only Badge */}
          {isReadOnly && (
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border-2 border-yellow-300 flex items-center gap-1.5">
              <Eye size={14} />
              View Only
            </span>
          )}
          
          {/* Admin Edit Button - only for Payment Requested and if can edit */}
          {workflow === 'Payment Requested' && canEditItemPricing(item) && !isReadOnly && (
            <button
              onClick={() => handleOpenEditModal(item)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
              title="Admin Override - Edit Item Pricing"
            >
              <Edit size={14} />
              Admin Edit
            </button>
          )}
        </div>
      </div>

      {/* Full Pricing Breakdown */}
      <div className="space-y-4">
        {/* Supplier Costs - Only show if can view cost price */}
        <PermissionGate
          permission="pricing.view_cost_price"
          fallback={
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 text-gray-500">
                <Lock size={16} />
                <span className="text-sm font-medium">Supplier costs hidden</span>
              </div>
            </div>
          }
        >
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <h5 className="text-xs font-bold text-gray-600 uppercase mb-3">Supplier Costs</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Unit Cost × {item.quantity}:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency((item.supplier_unit_cost || 0) * item.quantity)}
                </span>
              </div>
              {item.supplier_discount && item.supplier_discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{formatCurrency(item.supplier_discount)}</span>
                </div>
              )}
              {item.delivery_type && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery ({item.delivery_type}):</span>
                  <span className="font-medium text-gray-900">
                    {item.delivery_cost ? formatCurrency(item.delivery_cost) : 'Included'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </PermissionGate>

        {/* Payment Status */}
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-gray-900">Payment Status</span>
            </div>
            {isReadOnly ? (
              <span
                className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                  item.is_paid === 1
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                }`}
              >
                {item.is_paid === 1 ? '✓ Paid' : 'Unpaid'}
              </span>
            ) : (
              <PermissionGate
                permission="payments.mark_paid"
                fallback={
                  <span
                    className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                      item.is_paid === 1
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                    }`}
                  >
                    {item.is_paid === 1 ? '✓ Paid' : 'Unpaid'}
                  </span>
                }
              >
                <button
                  onClick={() => handleTogglePaidStatus(item.id, item.is_paid)}
                  disabled={markAsPaidMutation.isPending}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                    item.is_paid === 1
                      ? 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {item.is_paid === 1 ? '✓ Paid' : 'Mark as Paid'}
                </button>
              </PermissionGate>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Order Items</h2>
            <p className="text-blue-100">
              {items.length} item{items.length !== 1 ? 's' : ''} in this order
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Permission Indicators */}
            {!canViewCostPrice && (
              <span className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium flex items-center gap-2">
                <Lock size={14} />
                Costs Hidden
              </span>
            )}
            {isReadOnly && (
              <span className="px-3 py-1.5 bg-yellow-500/30 rounded-lg text-sm font-medium flex items-center gap-2">
                <Eye size={14} />
                Read Only
              </span>
            )}
            <div className="px-4 py-2 bg-white/20 rounded-lg border-2 border-white/30">
              <span className="text-2xl font-bold">{items.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item) => {
          const hasSupplier = item.supplier_id || item.supplier;

          if (!hasSupplier) {
            return renderSupplierMissingItem(item);
          } else if (workflow === 'Payment Requested' || workflow === 'Delivered') {
            return renderPricedItem(item);
          } else {
            return renderSupplierAssignedItem(item);
          }
        })}
      </div>

      {/* Admin Edit Modal - Only render if not read-only */}
      {!isReadOnly && (
        <AdminOrderItemEditModal
          item={editingItem}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={() => {
            // Refetch is handled by the mutation hook
          }}
        />
      )}
    </div>
  );
};

export default OrderItemsTab;