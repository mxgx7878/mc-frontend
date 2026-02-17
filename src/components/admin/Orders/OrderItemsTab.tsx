// FILE PATH: src/components/admin/Orders/OrderItemsTab.tsx

/**
 * Order Items Tab Component - WITH DELIVERY SCHEDULES
 * Displays items with supplier assignment, quoted price, payment status, and split deliveries
 * HIDES cost columns based on user permissions
 * HIDES edit actions for read-only users (Accountant)
 */

import React, { useState } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Edit,
  Lock,
  Eye,
  ChevronDown,
  ChevronUp,
  Truck,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import type { AdminOrderItem, WorkflowStatus } from '../../../types/adminOrder.types';
import { formatCurrency } from '../../../features/adminOrders/utils';
import {
  useAssignSupplier,
} from '../../../features/adminOrders/hooks';
import AdminOrderItemEditModal from './AdminOrderItemEditModal';
import AdminChangeSupplierModal from './AdminChangeSupplierModal';
import { usePermissions } from '../../../hooks/usePermissions';
import PermissionGate from '../../common/PermissionGate';

interface OrderItemsTabProps {
  items: AdminOrderItem[];
  workflow: WorkflowStatus;
  orderId: number;
  paymentStatus: string;
}

const OrderItemsTab: React.FC<OrderItemsTabProps> = ({ items, workflow, orderId, paymentStatus }) => {
  const [editingItem, setEditingItem] = useState<AdminOrderItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Inside the component, add these state variables after existing useState declarations:
const [changeSupplierItem, setChangeSupplierItem] = useState<AdminOrderItem | null>(null);
const [isChangeSupplierModalOpen, setIsChangeSupplierModalOpen] = useState(false);


// Add these handler functions after existing handlers:
const handleOpenChangeSupplierModal = (item: AdminOrderItem) => {
  if (isReadOnly) return;
  setChangeSupplierItem(item);
  setIsChangeSupplierModalOpen(true);
};

const handleCloseChangeSupplierModal = () => {
  setChangeSupplierItem(null);
  setIsChangeSupplierModalOpen(false);
};

// Add this helper function to check if supplier can be changed
const canChangeSupplier = (item: AdminOrderItem, paymentStatus: string) => {
  if (isReadOnly || !canAssignSupplier) return false;
  if (paymentStatus !== 'Pending') return false;
  if (!item.eligible_suppliers || item.eligible_suppliers.length <= 1) return false;
  return true;
};

  // Get permissions
  const {
    canViewCostPrice,
    canEditOrders,
    canAssignSupplier,
    isReadOnly,
  } = usePermissions();

  const assignSupplierMutation = useAssignSupplier();

  // Toggle delivery schedule expansion
  const toggleItemExpansion = (itemId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Date formatting helpers
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    try {
      return timeString.includes('T') 
        ? format(new Date(timeString), 'hh:mm a')
        : timeString;
    } catch {
      return timeString;
    }
  };

  // Check if admin can edit item pricing
  const canEditItemPricing = (item: AdminOrderItem) => {
      if (isReadOnly) return false;
      if (!canEditOrders) return false;
      if (workflow === 'Delivered') return false; // Lock delivered orders
      const hasSupplier = item.supplier_id || item.supplier;
      return !!hasSupplier;
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

  // Render Delivery Schedule Component
  const renderDeliverySchedule = (item: AdminOrderItem) => {
    const hasDeliveries = item.deliveries && item.deliveries.length > 0;
    if (!hasDeliveries) return null;

    const isExpanded = expandedItems.has(item.id);

    return (
      <div className="mt-4">
        {/* Toggle Button */}
        <button
          onClick={() => toggleItemExpansion(item.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium border-2 border-blue-200"
        >
          <Truck className="w-4 h-4" />
          <span>
            {isExpanded ? 'Hide' : 'Show'} Delivery Schedule 
            ({item.deliveries?.length} {item.deliveries?.length === 1 ? 'delivery' : 'deliveries'})
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Expanded Delivery Details */}
        {isExpanded && (
          <div className="mt-3 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Delivery Schedule Breakdown
            </h5>
            <div className="space-y-3">
              {item.deliveries?.map((delivery, deliveryIndex) => (
                <div
                  key={delivery.id}
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded border border-blue-300">
                          Delivery #{deliveryIndex + 1}
                        </span>
                        {item.supplier_confirms ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <div>
                          <span className="text-xs text-gray-600 block mb-1">Quantity</span>
                          <span className="text-sm font-bold text-gray-900">
                            {delivery.quantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600 block mb-1">Delivery Date</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-sm font-bold text-gray-900">
                              {formatDate(delivery.delivery_date)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600 block mb-1">Delivery Time</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-sm font-bold text-gray-900">
                              {formatTime(delivery.delivery_time)}
                            </span>
                          </div>
                        </div>
                        {((delivery as any).load_size || (delivery as any).time_interval) && (
                        <div className="flex items-center gap-4 mt-2 px-1">
                          {(delivery as any).load_size && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-600">Load Size:</span>
                              <span className="text-xs font-bold text-gray-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {(delivery as any).load_size} per trip
                              </span>
                            </div>
                          )}
                          {(delivery as any).time_interval && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-600">Interval:</span>
                              <span className="text-xs font-bold text-gray-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                {(delivery as any).time_interval === '60' ? '1 hour' : (delivery as any).time_interval === '120' ? '2 hours' : (delivery as any).time_interval + ' min'}
                              </span>
                            </div>
                          )}
                          {(delivery as any).load_size && (delivery as any).time_interval && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-600">Trips:</span>
                              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {Math.ceil(parseFloat(String(delivery.quantity)) / parseFloat(String((delivery as any).load_size)))} loads
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Delivery Summary */}
            <div className="mt-4 pt-4 border-t-2 border-blue-200 bg-blue-100 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">Total Deliveries:</span>
                <span className="font-bold text-gray-900">{item.deliveries?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="font-medium text-gray-700">Total Quantity:</span>
                <span className="font-bold text-gray-900">{item.quantity}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="font-medium text-gray-700">Confirmed Deliveries:</span>
                <span className="font-bold text-green-700">
                  {item.supplier_confirms ? (item.deliveries?.length +'/'+ item.deliveries?.length) : (0 +'/'+ item.deliveries?.length)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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

      {/* Delivery Schedule */}
      {renderDeliverySchedule(item)}
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
          
          {isReadOnly && (
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border-2 border-yellow-300 flex items-center gap-1.5">
              <Eye size={14} />
              View Only
            </span>
          )}
          
          {/* ADD THIS CHANGE SUPPLIER BUTTON */}
          {canChangeSupplier(item, paymentStatus) && (
            <button
              onClick={() => handleOpenChangeSupplierModal(item)}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs font-bold rounded-full hover:from-indigo-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
              title="Change Supplier"
            >
              <User size={14} />
              Change Supplier
            </button>
          )}
          
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

      {/* Pricing Details */}
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
        </div>
      </PermissionGate>



   

      {/* Delivery Schedule */}
      {renderDeliverySchedule(item)}
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
          
          {isReadOnly && (
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border-2 border-yellow-300 flex items-center gap-1.5">
              <Eye size={14} />
              View Only
            </span>
          )}
          
          {/* ADD THIS CHANGE SUPPLIER BUTTON */}
          {canChangeSupplier(item, paymentStatus) && (
            <button
              onClick={() => handleOpenChangeSupplierModal(item)}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs font-bold rounded-full hover:from-indigo-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
              title="Change Supplier"
            >
              <User size={14} />
              Change Supplier
            </button>
          )}
          
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
        {/* Supplier Costs */}
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
            </div>
          </div>
        </PermissionGate>


      </div>

      {/* Delivery Schedule */}
      {renderDeliverySchedule(item)}
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

      {/* Admin Edit Modal */}
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

      {/* ADD THIS CHANGE SUPPLIER MODAL */}
    {!isReadOnly && (
      <AdminChangeSupplierModal
        item={changeSupplierItem}
        orderId={orderId}
        isOpen={isChangeSupplierModalOpen}
        onClose={handleCloseChangeSupplierModal}
      />
    )}
    </div>
  );
};

export default OrderItemsTab;