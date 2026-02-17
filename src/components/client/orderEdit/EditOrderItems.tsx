// src/components/client/orderEdit/EditOrderItems.tsx
/**
 * EDIT ORDER ITEMS COMPONENT
 * 
 * Displays list of order items with:
 * - Item details (product name, quantity, supplier)
 * - Delivery slots breakdown
 * - Edit button to open modal
 * - Remove button (disabled if has delivered deliveries)
 * - Visual indicators for delivered vs scheduled
 */

import React from 'react';
import {
  Package,
  Edit,
  Trash2,
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import type { OrderEditItem } from '../../../types/orderEdit.types';
import {
  canRemoveItem,
  getDeliveredQuantity,
  getScheduledDeliveries,
  getDeliveredDeliveries,
} from '../../../types/orderEdit.types';

interface EditOrderItemsProps {
  items: OrderEditItem[];
  itemsToRemove: number[];
  itemsUpdated: Map<number, { quantity: number; deliveriesChanged: boolean }>;
  onEditItem: (item: OrderEditItem) => void;
  onRemoveItem: (itemId: number) => void;
  onUndoRemove: (itemId: number) => void;
}

const EditOrderItems: React.FC<EditOrderItemsProps> = ({
  items,
  itemsToRemove,
  itemsUpdated,
  onEditItem,
  onRemoveItem,
  onUndoRemove,
}) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());

  const toggleExpand = (itemId: number) => {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return timeString;
  };

  const getImageUrl = (photo: string | null): string => {
    if (!photo) return '';
    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${photo}`;
  };

  const getDeliveryStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      delivered: {
        bg: 'bg-green-100 border-green-300',
        text: 'text-green-700',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      scheduled: {
        bg: 'bg-blue-100 border-blue-300',
        text: 'text-blue-700',
        icon: <Calendar className="w-3 h-3" />,
      },
      pending: {
        bg: 'bg-yellow-100 border-yellow-300',
        text: 'text-yellow-700',
        icon: <Clock className="w-3 h-3" />,
      },
      cancelled: {
        bg: 'bg-red-100 border-red-300',
        text: 'text-red-700',
        icon: <AlertCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}
      >
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No items in this order</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isMarkedForRemoval = itemsToRemove.includes(item.id);
        const isUpdated = itemsUpdated.has(item.id);
        const updateInfo = itemsUpdated.get(item.id);
        const canRemove = canRemoveItem(item);
        const deliveredQty = getDeliveredQuantity(item);
        const scheduledDeliveries = getScheduledDeliveries(item);
        const deliveredDeliveries = getDeliveredDeliveries(item);
        const isExpanded = expandedItems.has(item.id);
        const hasDeliveries = item.deliveries && item.deliveries.length > 0;
    
        return (
          <div
            key={item.id}
            className={`border-2 rounded-xl overflow-hidden transition-all ${
              isMarkedForRemoval
                ? 'border-red-300 bg-red-50 opacity-60'
                : isUpdated
                ? 'border-amber-300 bg-amber-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Item Header */}
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product?.photo ? (
                    <img
                      src={getImageUrl(item.product.photo)}
                      alt={item.product.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-900 truncate">
                        {item.product?.product_name || 'Product'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {item.product?.product_type}
                      </p>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isMarkedForRemoval && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">
                          Will be removed
                        </span>
                      )}
                      {isUpdated && !isMarkedForRemoval && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-300">
                          Modified
                        </span>
                      )}
                      {deliveredQty > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {deliveredQty} delivered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Display */}
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Quantity: </span>
                      <span className="font-bold text-gray-900">
                        {updateInfo?.quantity ?? item.quantity} {item.product?.unit_of_measure || 'units'}
                      </span>
                      {updateInfo && updateInfo.quantity !== item.quantity && (
                        <span className="text-amber-600 ml-1">
                          (was {item.quantity})
                        </span>
                      )}
                    </div>
                    {item.supplier && (
                      <div>
                        <span className="text-gray-600">Supplier: </span>
                        <span className="font-medium text-gray-900">
                          {item.supplier.company_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delivery Summary */}
                  {hasDeliveries && (
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="text-gray-600">
                        <Truck className="w-4 h-4 inline mr-1" />
                        {item.deliveries.length} delivery slot(s)
                      </span>
                      {deliveredQty > 0 && (
                        <span className="text-green-600">
                          {deliveredDeliveries.length} delivered
                        </span>
                      )}
                      {scheduledDeliveries.length > 0 && (
                        <span className="text-blue-600">
                          {scheduledDeliveries.length} scheduled
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isMarkedForRemoval ? (
                    <button
                      onClick={() => onUndoRemove(item.id)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Undo
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onEditItem(item)}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        disabled={!canRemove}
                        title={
                          canRemove
                            ? 'Remove item'
                            : 'Cannot remove: has delivered deliveries'
                        }
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium border ${
                          canRemove
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        }`}
                      >
                        {canRemove ? (
                          <Trash2 className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expand/Collapse Deliveries */}
              {hasDeliveries && !isMarkedForRemoval && (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors text-sm font-medium border border-gray-200"
                >
                  <Truck className="w-4 h-4" />
                  {isExpanded ? 'Hide' : 'Show'} Delivery Schedule
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Expanded Deliveries */}
            {hasDeliveries && isExpanded && !isMarkedForRemoval && (
              <div className="border-t-2 border-gray-200 bg-gray-50 p-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Delivery Schedule
                </h5>

                {/* Delivered Deliveries (Locked) */}
                {deliveredDeliveries.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Delivered (Read-only)
                    </p>
                    <div className="space-y-2">
                      {deliveredDeliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Qty:</span>
                              <span className="font-semibold text-gray-900 ml-1">
                                {delivery.quantity} {item.product?.unit_of_measure}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <span className="font-semibold text-gray-900 ml-1">
                                {formatDate(delivery.delivery_date)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Time:</span>
                              <span className="font-semibold text-gray-900 ml-1">
                                {formatTime(delivery.delivery_time)}
                              </span>
                            </div>
                            {((delivery as any).load_size || (delivery as any).time_interval) && (
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                {(delivery as any).load_size && (
                                  <span>{(delivery as any).load_size}/load</span>
                                )}
                                {(delivery as any).time_interval && (
                                  <span>every {(delivery as any).time_interval === '60' ? '1 hr' : (delivery as any).time_interval + ' min'}</span>
                                )}
                                {(delivery as any).load_size && (delivery as any).time_interval && (
                                  <span className="text-blue-600 font-medium">
                                    ({Math.ceil(parseFloat(String(delivery.quantity)) / parseFloat((delivery as any).load_size))} trips)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {getDeliveryStatusBadge(delivery.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Deliveries (Editable) */}
                {scheduledDeliveries.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                      <Edit className="w-3 h-3" />
                      Scheduled (Editable)
                    </p>
                    <div className="space-y-2">
                      {scheduledDeliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Qty:</span>
                              <span className="font-semibold text-gray-900 ml-1">
                                {delivery.quantity} {item.product?.unit_of_measure}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <span className="font-semibold text-gray-900 ml-1">
                                {formatDate(delivery.delivery_date)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Time:</span>
                              <span className="font-semibold text-gray-900 ml-1">
                                {formatTime(delivery.delivery_time)}
                              </span>
                            </div>
                          </div>
                          {getDeliveryStatusBadge(delivery.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.deliveries.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No delivery slots configured
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EditOrderItems;