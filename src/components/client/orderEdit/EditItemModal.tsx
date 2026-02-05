// src/components/client/orderEdit/EditItemModal.tsx
/**
 * EDIT ITEM MODAL
 * 
 * Modal for editing an existing order item:
 * - Update quantity (must be >= delivered quantity)
 * - Manage split deliveries (scheduled only)
 * - Add new delivery slots
 * - Edit/Remove scheduled delivery slots
 * - Validates: scheduled qty sum = item qty - delivered qty
 * 
 * RULES:
 * - Cannot reduce quantity below delivered amount
 * - Delivered deliveries are read-only (shown but not editable)
 * - Scheduled deliveries can be edited, added, removed
 * - Total scheduled qty must equal (quantity - deliveredQty)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Package,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Lock,
  Info,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { OrderEditItem, EditDeliveryPayload } from '../../../types/orderEdit.types';
import {
  getDeliveredQuantity,
  getScheduledDeliveries,
  getDeliveredDeliveries,
} from '../../../types/orderEdit.types';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OrderEditItem | null;
  onSave: (data: {
    order_item_id: number;
    quantity: number;
    deliveries: EditDeliveryPayload[];
  }) => void;
}

interface LocalDelivery {
  id: number | null;
  localId: string; // For React key
  quantity: number;
  delivery_date: string;
  delivery_time: string;
  isNew: boolean;
}


const toNumber = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : fallback;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100; 


/**
 * Format time for input field (HH:mm)
 * Handles various formats: "08:00:00", "08:00", null, ""
 */
const formatTimeForInput = (time: string | null | undefined): string => {
  if (!time || time.trim() === '') return '08:00';
  
  // Handle "HH:mm:ss" or "HH:mm" format
  const parts = time.split(':');
  if (parts.length >= 2) {
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  return '08:00';
};

/**
 * Format time for API (H:i format) or null
 * Laravel expects "H:i" format like "08:00"
 */
const formatTimeForApi = (time: string | null | undefined): string | null => {
  if (!time || time.trim() === '') return null;
  
  // Ensure HH:mm format (strip seconds if present)
  const parts = time.split(':');
  if (parts.length >= 2) {
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  return null;
};

const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  // Form state
  const [quantity, setQuantity] = useState<number>(0);
  const [scheduledDeliveries, setScheduledDeliveries] = useState<LocalDelivery[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Derived values
  const deliveredQty = useMemo(() => {
    if (!item) return 0;
    return getDeliveredQuantity(item);
  }, [item]);

  const deliveredDeliveries = useMemo(() => {
    if (!item) return [];
    return getDeliveredDeliveries(item);
  }, [item]);

  const minQuantity = deliveredQty;

  // Calculate allocated vs required
  const allocatedQty = useMemo(() => {
        return round2(
        scheduledDeliveries.reduce((sum, d) => sum + toNumber(d.quantity, 0), 0)
        );
    }, [scheduledDeliveries]);
  const requiredScheduledQty = round2(toNumber(quantity, 0) - toNumber(deliveredQty, 0));
  const remainingToAllocate = round2(requiredScheduledQty - allocatedQty);
  const isAllocationValid = Math.abs(remainingToAllocate) < 0.0001; // tighter + stable

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(toNumber(item.quantity, 0));
      
      // Convert existing scheduled deliveries to local format
      // Note: API returns 'qty', we use 'quantity' in local state
      const existing = getScheduledDeliveries(item).map((d) => ({
            id: d.id,
            localId: `existing-${d.id}`,
            quantity: toNumber((d as any).quantity ?? (d as any).qty, 0), // supports qty/quantity
            delivery_date: d.delivery_date?.split('T')[0] || '',
            delivery_time: formatTimeForInput(d.delivery_time),
            isNew: false,
        }));
      
      setScheduledDeliveries(existing);
      setErrors([]);
    }
  }, [isOpen, item]);

  // Handle quantity change
  const handleQuantityChange = (newQty: number) => {
  const qtyNum = toNumber(newQty, minQuantity);
  setQuantity(qtyNum < minQuantity ? minQuantity : qtyNum);
};

  // Add new delivery slot
  const handleAddDelivery = () => {
    const rem = toNumber(remainingToAllocate, 0);
    const defaultQty = rem > 0 ? rem : 1;
    
    setScheduledDeliveries((prev) => [
      ...prev,
      {
        id: null,
        localId: uuidv4(),
        quantity: defaultQty > 0 ? defaultQty : 1,
        delivery_date: '',
        delivery_time: '08:00',
        isNew: true,
      },
    ]);
  };

  // Remove delivery slot
  const handleRemoveDelivery = (localId: string) => {
    setScheduledDeliveries((prev) => prev.filter((d) => d.localId !== localId));
  };

  // Update delivery field
  const handleDeliveryChange = (
    localId: string,
    field: keyof LocalDelivery,
    value: string | number
  ) => {
    setScheduledDeliveries((prev) =>
      prev.map((d) =>
        d.localId === localId ? { ...d, [field]: value } : d
      )
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Check quantity
    if (quantity < minQuantity) {
      newErrors.push(`Quantity cannot be less than delivered amount (${minQuantity})`);
    }

    // Check allocation
    if (!isAllocationValid) {
      if (remainingToAllocate > 0) {
        newErrors.push(
          `You have ${remainingToAllocate} unallocated. Please distribute all quantity across deliveries.`
        );
      } else {
        newErrors.push(
          `Over-allocated by ${Math.abs(remainingToAllocate)}. Please reduce delivery quantities.`
        );
      }
    }

    // Check each delivery has date
    const hasEmptyDates = scheduledDeliveries.some((d) => !d.delivery_date);
    if (hasEmptyDates) {
      newErrors.push('All delivery slots must have a delivery date.');
    }

    // Check each delivery has quantity > 0
    const hasZeroQty = scheduledDeliveries.some((d) => toNumber(d.quantity, 0) <= 0);
    if (hasZeroQty) {
      newErrors.push('All delivery slots must have quantity greater than 0.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!item) return;
    if (!validateForm()) return;

    // Convert to API payload format with proper time formatting
    const deliveriesPayload: EditDeliveryPayload[] = scheduledDeliveries.map((d) => ({
      id: d.id,
      quantity: d.quantity, // Use quantity for API payload
      delivery_date: d.delivery_date,
      delivery_time: formatTimeForApi(d.delivery_time),
    }));

    onSave({
      order_item_id: item.id,
      quantity,
      deliveries: deliveriesPayload,
    });
  };

  // Don't render if not open
  if (!isOpen || !item) return null;

  const getImageUrl = (photo: string | null): string => {
    if (!photo) return '';
    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${photo}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                {item.product?.photo ? (
                  <img
                    src={getImageUrl(item.product.photo)}
                    alt={item.product.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Item
                </h2>
                <p className="text-sm text-gray-600">
                  {item.product?.product_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Delivered Info Banner */}
          {deliveredQty > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">
                  {deliveredQty} {item.product?.unit_of_measure} already delivered
                </p>
                <p className="text-sm text-green-700">
                  Delivered quantities are locked and cannot be modified.
                  Minimum order quantity is {deliveredQty}.
                </p>
              </div>
            </div>
          )}

          {/* Quantity Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Order Quantity ({item.product?.unit_of_measure || 'units'})
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={minQuantity}
                value={quantity}
                onChange={(e) => {
                    const v = e.currentTarget.valueAsNumber;
                    handleQuantityChange(Number.isFinite(v) ? v : minQuantity);
                }}
                step="0.01"
                className="w-32 px-4 py-3 border-2 border-gray-200 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="text-sm text-gray-600">
                {deliveredQty > 0 && (
                  <span className="text-green-600 font-medium">
                    Min: {minQuantity} (delivered)
                  </span>
                )}
              </div>
            </div>
            {quantity !== item.quantity && (
              <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Changed from {item.quantity} to {quantity}
              </p>
            )}
          </div>

          {/* Allocation Progress */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Delivery Allocation
              </span>
              <span
                className={`text-sm font-bold ${
                  isAllocationValid
                    ? 'text-green-600'
                    : remainingToAllocate > 0
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {allocatedQty} / {requiredScheduledQty} allocated
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  allocatedQty > requiredScheduledQty
                    ? 'bg-red-500'
                    : isAllocationValid
                    ? 'bg-green-500'
                    : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min((allocatedQty / Math.max(requiredScheduledQty, 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {deliveredQty > 0 && (
                <span className="text-green-600 mr-3">
                  ✓ {deliveredQty} delivered (locked)
                </span>
              )}
              {isAllocationValid ? (
                <span className="text-green-600">✓ Fully allocated</span>
              ) : remainingToAllocate > 0 ? (
                <span className="text-amber-600">
                  {remainingToAllocate} remaining to allocate
                </span>
              ) : (
                <span className="text-red-600">
                  Over-allocated by {Math.abs(remainingToAllocate)}
                </span>
              )}
            </div>
          </div>

          {/* Delivered Deliveries (Read-only) */}
          {deliveredDeliveries.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-600" />
                Delivered (Locked)
              </h4>
              <div className="space-y-2">
                {deliveredDeliveries.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                      <span className="font-semibold">
                        {d.quantity} {item.product?.unit_of_measure}
                      </span>
                      <span>{d.delivery_date?.split('T')[0]}</span>
                      <span>{d.delivery_time || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Deliveries (Editable) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Scheduled Deliveries
              </h4>
              <button
                onClick={handleAddDelivery}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </button>
            </div>

            {scheduledDeliveries.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600 mb-3">No delivery slots</p>
                <button
                  onClick={handleAddDelivery}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add First Delivery Slot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledDeliveries.map((delivery, index) => (
                  <div
                    key={delivery.localId}
                    className={`p-4 rounded-lg border-2 ${
                      delivery.isNew
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Slot Number */}
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Fields Grid */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Quantity */}
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={delivery.quantity}
                            onChange={(e) => {
                                const v = e.currentTarget.valueAsNumber;
                                handleDeliveryChange(delivery.localId, 'quantity', Number.isFinite(v) ? v : 0);
                            }}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Date */}
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            Delivery Date
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="date"
                              value={delivery.delivery_date}
                              onChange={(e) =>
                                handleDeliveryChange(
                                  delivery.localId,
                                  'delivery_date',
                                  e.target.value
                                )
                              }
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Time */}
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            Time
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="time"
                              value={delivery.delivery_time}
                              onChange={(e) =>
                                handleDeliveryChange(
                                  delivery.localId,
                                  'delivery_time',
                                  e.target.value
                                )
                              }
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveDelivery(delivery.localId)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remove slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {delivery.isNew && (
                      <p className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        New delivery slot
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Please fix the following:</p>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isAllocationValid}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${
              isAllocationValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;