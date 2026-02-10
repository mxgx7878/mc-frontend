// src/components/client/orderEdit/EditItemModal.tsx
/**
 * EDIT ITEM MODAL
 * 
 * UPDATED: Added truck_type and delivery_cost per delivery slot
 * - truck_type: visible to all users (admin + client)
 * - delivery_cost: visible to admin only (via isAdmin prop)
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
  Truck,
  DollarSign,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { OrderEditItem, EditDeliveryPayload } from '../../../types/orderEdit.types';
import {
  getDeliveredQuantity,
  getScheduledDeliveries,
  getDeliveredDeliveries,
} from '../../../types/orderEdit.types';

// ==================== TRUCK TYPES ====================
const TRUCK_TYPES = [
  { value: 'tipper_light', label: 'Tipper Truck Light (3-6 tonnes)' },
  { value: 'tipper_medium', label: 'Tipper Truck Medium (6-11 tonnes)' },
  { value: 'tipper_heavy', label: 'Tipper Truck Heavy (11-14 tonnes)' },
  { value: 'light_rigid', label: 'Light Rigid Truck (3.5 tonnes)' },
  { value: 'medium_rigid', label: 'Medium Rigid Trucks (7 tonnes)' },
  { value: 'heavy_rigid', label: 'Heavy Rigid Trucks (16-49 tonnes)' },
  { value: 'mini_body', label: 'Mini Body Truck (8 tonnes)' },
  { value: 'body_truck', label: 'Body Truck (12 tonnes)' },
  { value: 'eight_wheeler', label: 'Eight-Wheeler Body Truck (16 tonnes)' },
  { value: 'semi', label: 'Semi (28 tonnes)' },
  { value: 'truck_dog', label: 'Truck and Dog (38 tonnes)' },
];

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OrderEditItem | null;
  onSave: (data: {
    order_item_id: number;
    quantity: number;
    deliveries: EditDeliveryPayload[];
  }) => void;
  isAdmin?: boolean; // NEW: controls delivery_cost visibility
}

interface LocalDelivery {
  id: number | null;
  localId: string;
  quantity: number;
  delivery_date: string;
  delivery_time: string;
  truck_type: string;       // NEW
  delivery_cost: number;    // NEW (admin only)
  isNew: boolean;
}

const toNumber = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Format time for API (H:i format) or null
 */
const formatTimeForApi = (time: string | null | undefined): string | null => {
  if (!time || time.trim() === '') return null;
  const parts = time.split(':');
  if (parts.length >= 2) {
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return null;
};

/**
 * Format time from API (H:i:s or HH:mm) to input (HH:mm)
 */
const formatTimeForInput = (time: string | null | undefined): string => {
  if (!time) return '08:00';
  const clean = time.split('T').pop() || time;
  const parts = clean.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return '08:00';
};

const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  isAdmin = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [scheduledDeliveries, setScheduledDeliveries] = useState<LocalDelivery[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Derived: delivered info
  const deliveredQty = useMemo(() => (item ? getDeliveredQuantity(item) : 0), [item]);
  const deliveredDeliveries = useMemo(() => (item ? getDeliveredDeliveries(item) : []), [item]);
  const minQuantity = deliveredQty;

  // Derived: allocation check (scheduled only)
  const requiredScheduled = useMemo(
    () => Math.max(0, quantity - deliveredQty),
    [quantity, deliveredQty]
  );
  const allocatedScheduled = useMemo(
    () =>
      scheduledDeliveries.reduce(
        (sum, d) => sum + toNumber(d.quantity, 0),
        0
      ),
    [scheduledDeliveries]
  );
  const remainingToAllocate = useMemo(
    () => parseFloat((requiredScheduled - allocatedScheduled).toFixed(4)),
    [requiredScheduled, allocatedScheduled]
  );
  const isAllocationValid = useMemo(
    () => Math.abs(remainingToAllocate) < 0.01,
    [remainingToAllocate]
  );

  // Initialize from item
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(toNumber(item.quantity, 1));

      const scheduled = getScheduledDeliveries(item);
      const existing: LocalDelivery[] = scheduled.map((d) => ({
        id: d.id,
        localId: uuidv4(),
        quantity: toNumber(d.quantity ?? (d as any).qty, 0),
        delivery_date: d.delivery_date?.split('T')[0] || '',
        delivery_time: formatTimeForInput(d.delivery_time),
        truck_type: d.truck_type || '',
        delivery_cost: toNumber(d.delivery_cost, 0),
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
        truck_type: 'tipper_light',
        delivery_cost: 0,
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

    if (quantity < minQuantity) {
      newErrors.push(`Quantity cannot be less than delivered amount (${minQuantity})`);
    }

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

    const hasEmptyDates = scheduledDeliveries.some((d) => !d.delivery_date);
    if (hasEmptyDates) {
      newErrors.push('All delivery slots must have a delivery date.');
    }

    const hasZeroQty = scheduledDeliveries.some((d) => toNumber(d.quantity, 0) <= 0);
    if (hasZeroQty) {
      newErrors.push('All delivery slots must have quantity greater than 0.');
    }

    const hasNoTruckType = scheduledDeliveries.some((d) => !d.truck_type);
    if (hasNoTruckType) {
      newErrors.push('All delivery slots must have a truck type selected.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!item) return;
    if (!validateForm()) return;

    const deliveriesPayload: EditDeliveryPayload[] = scheduledDeliveries.map((d) => ({
      id: d.id,
      quantity: d.quantity,
      delivery_date: d.delivery_date,
      delivery_time: formatTimeForApi(d.delivery_time),
      truck_type: d.truck_type || null,
      ...(isAdmin ? { delivery_cost: d.delivery_cost || 0 } : {}),
    }));

    onSave({
      order_item_id: item.id,
      quantity,
      deliveries: deliveriesPayload,
    });
  };

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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

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
                  Edit: {item.product?.product_name}
                </h2>
                <p className="text-sm text-gray-600">
                  Update quantity and delivery schedule
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Delivered Info Banner */}
          {deliveredQty > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    {deliveredQty} {item.product?.unit_of_measure || 'units'} already delivered
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Quantity cannot be reduced below {deliveredQty}. Delivered slots are locked.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Total Quantity ({item.product?.unit_of_measure || 'units'})
            </label>
            <input
              type="number"
              min={minQuantity || 0.01}
              step="0.01"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
              className="w-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
            />
            {minQuantity > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum: {minQuantity} (already delivered)
              </p>
            )}
          </div>

          {/* Allocation Bar */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">Delivery Allocation</span>
              <span
                className={`text-sm font-bold ${
                  isAllocationValid ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {allocatedScheduled.toFixed(2)} / {requiredScheduled.toFixed(2)} allocated
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isAllocationValid
                    ? 'bg-green-500'
                    : allocatedScheduled > requiredScheduled
                    ? 'bg-red-500'
                    : 'bg-orange-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    requiredScheduled > 0
                      ? (allocatedScheduled / requiredScheduled) * 100
                      : 0
                  )}%`,
                }}
              />
            </div>
            {isAllocationValid && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Fully allocated
              </p>
            )}
          </div>

          {/* Delivered Deliveries (Read-Only) */}
          {deliveredDeliveries.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                Delivered (Locked)
              </h3>
              <div className="space-y-2">
                {deliveredDeliveries.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 bg-gray-100 border-2 border-gray-200 rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">
                        Qty: {toNumber(d.quantity, 0)}
                      </span>
                      <span>📅 {d.delivery_date?.split('T')[0] || '-'}</span>
                      {d.truck_type && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {TRUCK_TYPES.find((t) => t.value === d.truck_type)?.label || d.truck_type}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-medium">
                        Delivered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Deliveries (Editable) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Delivery Schedule
              </h3>
              <button
                onClick={handleAddDelivery}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 border-2 border-blue-300 rounded-lg hover:bg-blue-50 flex items-center gap-1"
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

                      {/* Fields */}
                      <div className="flex-1 space-y-3">
                        {/* Row 1: Quantity + Truck Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Quantity */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Quantity</label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={delivery.quantity}
                              onChange={(e) => {
                                const v = e.currentTarget.valueAsNumber;
                                handleDeliveryChange(
                                  delivery.localId,
                                  'quantity',
                                  Number.isFinite(v) ? v : 0
                                );
                              }}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>

                          {/* Truck Type */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Truck Type
                            </label>
                            <select
                              value={delivery.truck_type}
                              onChange={(e) =>
                                handleDeliveryChange(delivery.localId, 'truck_type', e.target.value)
                              }
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                              <option value="">Select truck type...</option>
                              {TRUCK_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Date + Time + Delivery Cost (admin) */}
                        <div className={`grid grid-cols-1 gap-3 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                          {/* Delivery Date */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Delivery Date
                            </label>
                            <input
                              type="date"
                              value={delivery.delivery_date}
                              onChange={(e) =>
                                handleDeliveryChange(delivery.localId, 'delivery_date', e.target.value)
                              }
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>

                          {/* Time */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Time
                            </label>
                            <input
                              type="time"
                              value={delivery.delivery_time}
                              onChange={(e) =>
                                handleDeliveryChange(delivery.localId, 'delivery_time', e.target.value)
                              }
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>

                          {/* Delivery Cost (Admin Only) */}
                          {isAdmin && (
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                Delivery Cost
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={delivery.delivery_cost}
                                onChange={(e) =>
                                  handleDeliveryChange(
                                    delivery.localId,
                                    'delivery_cost',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveDelivery(delivery.localId)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
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