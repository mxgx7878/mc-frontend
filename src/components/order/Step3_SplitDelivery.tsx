// src/components/order/Step3_SplitDelivery.tsx
/**
 * STEP 3: SPLIT DELIVERY SCHEDULE
 *
 * FLOW:
 * - User splits total quantity across multiple delivery slots (different dates)
 * - Each slot has: quantity, truck_type, date, start time
 * - Each slot ALSO has optional load_size + time_interval
 *   → These define how that slot's quantity arrives in smaller loads
 *   → Example: 1t slot, 0.2t load, 1hr interval, start 8:00 AM
 *     = 5 trips: 8:00(0.2t), 9:00(0.2t), 10:00(0.2t), 11:00(0.2t), 12:00(0.2t)
 *   → A read-only timeline preview shows below the slot
 *   → The slot stays as ONE database row; load_size & time_interval are metadata
 *
 * BACKEND: Already accepts load_size + time_interval per delivery slot
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Weight,
  Timer,
} from 'lucide-react';
import type { CartItem, DeliverySlot } from '../../types/order.types';
import Button from '../common/Buttons';
import { v4 as uuidv4 } from 'uuid';

// ==================== CONSTANTS ====================

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

const TIME_INTERVAL_OPTIONS = [
  { value: '', label: 'No interval (single delivery)' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
  { value: '150', label: '2.5 hours' },
  { value: '180', label: '3 hours' },
  { value: '240', label: '4 hours' },
];

// ==================== HELPERS ====================

const addMinutes = (time: string, mins: number): string => {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const to12h = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
};

/**
 * Build time breakdown for a single slot
 * Returns array of { time, qty } — these are visual only, NOT new database rows
 */
const buildTimeBreakdown = (
  slotQty: number,
  startTime: string,
  loadSize: number,
  intervalMinutes: number
): Array<{ time: string; qty: number }> => {
  if (!loadSize || loadSize <= 0 || !intervalMinutes || !startTime) return [];
  const trips = Math.ceil(slotQty / loadSize);
  const result: Array<{ time: string; qty: number }> = [];
  let currentTime = startTime;

  for (let i = 0; i < trips; i++) {
    const isLast = i === trips - 1;
    const qty = isLast ? parseFloat((slotQty - loadSize * (trips - 1)).toFixed(4)) : loadSize;
    result.push({ time: currentTime, qty: Math.max(qty, 0) });
    currentTime = addMinutes(currentTime, intervalMinutes);
  }
  return result;
};

const getIntervalLabel = (val: string) =>
  TIME_INTERVAL_OPTIONS.find((t) => t.value === val)?.label || `${val} min`;

// ==================== COMPONENT ====================

interface Step3Props {
  cartItems: CartItem[];
  primaryDeliveryDate: string;
  onBack: () => void;
  onContinue: (itemsWithSlots: CartItem[]) => void;
}

const Step3_SplitDelivery: React.FC<Step3Props> = ({
  cartItems,
  primaryDeliveryDate,
  onBack,
  onContinue,
}) => {
  const [productSlots, setProductSlots] = useState<Record<number, DeliverySlot[]>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  // ==================== INIT ====================

  useEffect(() => {
    const initial: Record<number, DeliverySlot[]> = {};
    cartItems.forEach((item) => {
      if (item.delivery_slots?.length > 0 && item.delivery_slots[0].delivery_date) {
        initial[item.product_id] = item.delivery_slots.map((s) => ({
          ...s,
          slot_id: s.slot_id || uuidv4(),
          load_size: s.load_size || '',
          time_interval: s.time_interval || '',
        }));
      } else {
        initial[item.product_id] = [
          {
            slot_id: uuidv4(),
            quantity: item.quantity,
            truck_type: 'tipper_light',
            delivery_date: primaryDeliveryDate,
            delivery_time: '08:00',
            load_size: '',
            time_interval: '',
          },
        ];
      }
    });
    setProductSlots(initial);
  }, [cartItems, primaryDeliveryDate]);

  // ==================== IMAGE ====================

  const getImageUrl = (photo: string | null | undefined): string => {
    if (!photo)
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    return photo.startsWith('http') ? photo : `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${photo}`;
  };

  // ==================== SLOT CRUD ====================

  const handleAddSlot = (productId: number, totalQuantity: number) => {
    const cur = productSlots[productId] || [];
    const allocated = cur.reduce((s, sl) => s + sl.quantity, 0);
    const rem = totalQuantity - allocated;

    setProductSlots((p) => ({
      ...p,
      [productId]: [
        ...cur,
        {
          slot_id: uuidv4(),
          quantity: rem > 0 ? Math.min(rem, 1) : 1,
          truck_type: 'tipper_light',
          delivery_date: primaryDeliveryDate,
          delivery_time: '08:00',
          load_size: '',
          time_interval: '',
        },
      ],
    }));
    if (errors[productId]) setErrors((p) => ({ ...p, [productId]: '' }));
  };

  const handleRemoveSlot = (productId: number, slotId: string) => {
    const cur = productSlots[productId] || [];
    if (cur.length <= 1) return;
    setProductSlots((p) => ({ ...p, [productId]: cur.filter((s) => s.slot_id !== slotId) }));
  };

  const handleUpdateSlot = (
    productId: number,
    slotId: string,
    field: keyof DeliverySlot,
    value: string | number
  ) => {
    setProductSlots((p) => ({
      ...p,
      [productId]: (p[productId] || []).map((s) =>
        s.slot_id === slotId ? { ...s, [field]: value } : s
      ),
    }));
    if (errors[productId]) setErrors((p) => ({ ...p, [productId]: '' }));
  };

  // ==================== VALIDATION ====================

  const getProductAllocation = (productId: number, totalQuantity: number) => {
    const slots = productSlots[productId] || [];
    const allocated = slots.reduce((s, sl) => s + parseFloat(sl.quantity.toString()), 0);
    const remaining = totalQuantity - allocated;
    const percentage = (allocated / totalQuantity) * 100;
    const isValid = Math.abs(remaining) < 0.01;
    return { allocated, remaining, percentage, isValid };
  };

  const validateAllProducts = (): boolean => {
    const errs: Record<number, string> = {};
    let ok = true;

    cartItems.forEach((item) => {
      const { remaining, isValid: valid } = getProductAllocation(item.product_id, item.quantity);

      if (!valid) {
        errs[item.product_id] =
          remaining > 0
            ? `${remaining.toFixed(2)} ${item.unit_of_measure} unallocated.`
            : `Over-allocated by ${Math.abs(remaining).toFixed(2)} ${item.unit_of_measure}.`;
        ok = false;
      }

      const slots = productSlots[item.product_id] || [];
      if (slots.some((s) => !s.delivery_date || !s.delivery_time || !s.truck_type)) {
        errs[item.product_id] = 'Please fill in truck type, date and time for all slots.';
        ok = false;
      }

      // If one of load_size/time_interval is set, both must be set
      slots.forEach((s, idx) => {
        const hasLoad = s.load_size && parseFloat(s.load_size) > 0;
        const hasInterval = s.time_interval && parseInt(s.time_interval, 10) > 0;
        if ((hasLoad && !hasInterval) || (!hasLoad && hasInterval)) {
          errs[item.product_id] = `Delivery ${idx + 1}: Set both load size and time interval, or leave both empty.`;
          ok = false;
        }
        if (hasLoad && parseFloat(s.load_size!) > s.quantity) {
          errs[item.product_id] = `Delivery ${idx + 1}: Load size cannot exceed slot quantity (${s.quantity}).`;
          ok = false;
        }
      });
    });

    setErrors(errs);
    return ok;
  };

  const handleContinue = () => {
    if (!validateAllProducts()) return;
    const updated = cartItems.map((item) => ({
      ...item,
      delivery_slots: productSlots[item.product_id] || [],
    }));
    onContinue(updated);
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <Truck className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Schedule Deliveries</h2>
            <p className="text-secondary-600">
              Split quantities across dates. Optionally set load size &amp; interval for each delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-6">
        {cartItems.map((item) => {
          const slots = productSlots[item.product_id] || [];
          const { allocated, remaining, percentage, isValid } = getProductAllocation(
            item.product_id,
            item.quantity
          );
          const hasError = !!errors[item.product_id];

          return (
            <div
              key={item.product_id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                hasError ? 'border-red-300' : isValid ? 'border-green-300' : 'border-secondary-200'
              }`}
            >
              {/* Product Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-secondary-200 flex-shrink-0">
                  <img
                    src={getImageUrl(item.product_photo)}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getImageUrl(null);
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-secondary-900 text-lg">{item.product_name}</h3>
                  <p className="text-sm text-secondary-500">
                    {item.product_type} · Total: {item.quantity} {item.unit_of_measure}
                  </p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                    isValid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {isValid ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={14} /> Allocated
                    </span>
                  ) : (
                    `${allocated.toFixed(2)} / ${item.quantity} ${item.unit_of_measure}`
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-secondary-500">
                    Allocated: {allocated.toFixed(2)} {item.unit_of_measure}
                  </span>
                  <span
                    className={
                      Math.abs(remaining) < 0.01
                        ? 'text-green-600 font-medium'
                        : remaining > 0
                        ? 'text-amber-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {Math.abs(remaining) < 0.01
                      ? '✓ Balanced'
                      : remaining > 0
                      ? `${remaining.toFixed(2)} remaining`
                      : `${Math.abs(remaining).toFixed(2)} over`}
                  </span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      percentage > 100 ? 'bg-red-500' : isValid ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* ===== DELIVERY SLOTS ===== */}
              <div className="space-y-4">
                {slots.map((slot, slotIndex) => {
                  const loadSize = parseFloat(slot.load_size || '0');
                  const intervalMins = parseInt(slot.time_interval || '0', 10);
                  const hasLoadConfig = loadSize > 0 && intervalMins > 0 && slot.delivery_time;
                  const breakdown = hasLoadConfig
                    ? buildTimeBreakdown(slot.quantity, slot.delivery_time, loadSize, intervalMins)
                    : [];

                  return (
                    <div
                      key={slot.slot_id}
                      className="bg-secondary-50 rounded-xl border border-secondary-200 hover:border-secondary-300 transition-colors overflow-hidden"
                    >
                      {/* Slot header */}
                      <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <span className="text-xs font-bold text-secondary-400 uppercase tracking-wider">
                          Delivery {slotIndex + 1} of {slots.length}
                        </span>
                        <div className="flex items-center gap-2">
                          {slot.delivery_time && (
                            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                              Starts {to12h(slot.delivery_time)}
                            </span>
                          )}
                          {slots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(item.product_id, slot.slot_id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove delivery"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="px-4 pb-4">
                        {/* Row 1: Qty, Truck, Date, Time */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 block">
                              Qty ({item.unit_of_measure})
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={slot.quantity}
                              onChange={(e) =>
                                handleUpdateSlot(item.product_id, slot.slot_id, 'quantity', parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 block">
                              Truck Type
                            </label>
                            <div className="relative">
                              <Truck className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={14} />
                              <select
                                value={slot.truck_type}
                                onChange={(e) =>
                                  handleUpdateSlot(item.product_id, slot.slot_id, 'truck_type', e.target.value)
                                }
                                className="w-full pl-7 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white appearance-none"
                              >
                                {TRUCK_TYPES.map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 block">
                              Delivery Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={14} />
                              <input
                                type="date"
                                value={slot.delivery_date}
                                onChange={(e) =>
                                  handleUpdateSlot(item.product_id, slot.slot_id, 'delivery_date', e.target.value)
                                }
                                className="w-full pl-7 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 block">
                              Start Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={14} />
                              <input
                                type="time"
                                value={slot.delivery_time}
                                onChange={(e) =>
                                  handleUpdateSlot(item.product_id, slot.slot_id, 'delivery_time', e.target.value)
                                }
                                className="w-full pl-7 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Load Size + Time Interval */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 flex items-center gap-1">
                              <Weight size={12} />
                              Load Size per Trip ({item.unit_of_measure})
                              <span className="text-secondary-400 font-normal ml-1">optional</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={slot.quantity}
                              placeholder={`e.g. 0.2`}
                              value={slot.load_size || ''}
                              onChange={(e) =>
                                handleUpdateSlot(item.product_id, slot.slot_id, 'load_size', e.target.value)
                              }
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 flex items-center gap-1">
                              <Timer size={12} />
                              Time Between Loads
                              <span className="text-secondary-400 font-normal ml-1">optional</span>
                            </label>
                            <select
                              value={slot.time_interval || ''}
                              onChange={(e) =>
                                handleUpdateSlot(item.product_id, slot.slot_id, 'time_interval', e.target.value)
                              }
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                            >
                              {TIME_INTERVAL_OPTIONS.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* ===== INLINE TIMELINE PREVIEW ===== */}
                      {hasLoadConfig && breakdown.length > 1 && (
                        <div className="border-t border-secondary-200 bg-gradient-to-r from-blue-50/60 to-primary-50/40 px-4 py-3">
                          <p className="text-xs font-semibold text-secondary-700 mb-2 flex items-center gap-1.5">
                            <Timer size={13} className="text-primary-600" />
                            {breakdown.length} loads on this day
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {breakdown.map((trip, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 bg-white border border-secondary-200 rounded-lg px-3 py-1.5 text-xs shadow-sm"
                              >
                                <span className="font-bold text-primary-700">{to12h(trip.time)}</span>
                                <span className="text-secondary-400">→</span>
                                <span className="font-semibold text-secondary-800">
                                  {trip.qty} {item.unit_of_measure}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-secondary-500 mt-2">
                            {slot.quantity} {item.unit_of_measure} total · {breakdown.length} trips × {slot.load_size}{' '}
                            {item.unit_of_measure} · every {getIntervalLabel(slot.time_interval || '')}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Slot */}
              <button
                type="button"
                onClick={() => handleAddSlot(item.product_id, item.quantity)}
                className="mt-3 w-full px-4 py-3 border-2 border-dashed border-secondary-300 hover:border-primary-500 rounded-lg text-secondary-600 hover:text-primary-700 font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={18} />
                Add Another Delivery Slot
              </button>

              {/* Error */}
              {hasError && (
                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {errors[item.product_id]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button type="button" onClick={onBack} variant="outline" className="flex-1">
          ← Back to Delivery Details
        </Button>
        <Button type="button" onClick={handleContinue} variant="primary" className="flex-1">
          Continue to Review →
        </Button>
      </div>
    </div>
  );
};

export default Step3_SplitDelivery;