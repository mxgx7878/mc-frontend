// src/components/order/Step3_SplitDelivery.tsx
/**
 * STEP 3: SPLIT DELIVERY SCHEDULE
 *
 * UPDATED:
 * - Load size per trip is now REQUIRED (not optional)
 * - Truck type auto-selects based on load_size (falls back to quantity if no load size)
 * - Client can toggle between Auto / Manual truck selection per slot
 * - Auto mode: re-selects truck whenever load_size or quantity changes
 * - Manual mode: client picks truck freely from dropdown
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
  Zap,
} from 'lucide-react';
import type { CartItem, DeliverySlot } from '../../types/order.types';
import Button from '../common/Buttons';
import { v4 as uuidv4 } from 'uuid';
import { isConcrete, getTruckTypesForUnit, autoSelectTruckType } from '../../utils/truckTypes';

// ==================== CONSTANTS ====================

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
  // 'auto' = truck auto-selected by load_size/qty | 'manual' = client picks freely
  const [truckModes, setTruckModes] = useState<Record<string, 'auto' | 'manual'>>({});

  // ==================== INIT ====================

  useEffect(() => {
    const initial: Record<number, DeliverySlot[]> = {};
    const modes: Record<string, 'auto' | 'manual'> = {};

    cartItems.forEach((item) => {
      if (item.delivery_slots?.length > 0 && item.delivery_slots[0].delivery_date) {
        initial[item.product_id] = item.delivery_slots.map((s) => {
          const slotId = s.slot_id || uuidv4();
          modes[slotId] = 'auto';
          const loadVal = parseFloat(s.load_size || '0') || 0;
          return {
            ...s,
            slot_id: slotId,
            load_size: s.load_size || '',
            time_interval: s.time_interval || '',
            truck_type: autoSelectTruckType(
              loadVal > 0 ? loadVal : s.quantity,
              item.unit_of_measure
            ),
          };
        });
      } else {
        const slotId = uuidv4();
        modes[slotId] = 'auto';
        initial[item.product_id] = [
          {
            slot_id: slotId,
            quantity: item.quantity,
            truck_type: autoSelectTruckType(item.quantity, item.unit_of_measure),
            delivery_date: primaryDeliveryDate,
            delivery_time: '08:00',
            load_size: '',
            time_interval: '',
            accelerator_type: null,
            retarder_type: null,
          },
        ];
      }
    });

    setProductSlots(initial);
    setTruckModes(modes);
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
    const item = cartItems.find((i) => i.product_id === productId);
    const slotQty = rem > 0 ? Math.min(rem, 1) : 1;
    const newSlotId = uuidv4();

    setTruckModes((p) => ({ ...p, [newSlotId]: 'auto' }));
    setProductSlots((p) => ({
      ...p,
      [productId]: [
        ...cur,
        {
          slot_id: newSlotId,
          quantity: slotQty,
          truck_type: autoSelectTruckType(slotQty, item?.unit_of_measure || ''),
          delivery_date: primaryDeliveryDate,
          delivery_time: '08:00',
          load_size: '',
          time_interval: '',
          accelerator_type: null,
          retarder_type: null,
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
    const item = cartItems.find((i) => i.product_id === productId);
    const mode = truckModes[slotId] ?? 'auto';

    setProductSlots((p) => ({
      ...p,
      [productId]: (p[productId] || []).map((s) => {
        if (s.slot_id !== slotId) return s;
        const updated = { ...s, [field]: value };

        if (mode === 'auto' && item) {
          if (field === 'load_size') {
            const loadVal = parseFloat(value.toString()) || 0;
            updated.truck_type = autoSelectTruckType(
              loadVal > 0 ? loadVal : updated.quantity,
              item.unit_of_measure
            );
          } else if (field === 'quantity') {
            const loadVal = parseFloat(s.load_size || '0') || 0;
            updated.truck_type = autoSelectTruckType(
              loadVal > 0 ? loadVal : parseFloat(value.toString()) || 0,
              item.unit_of_measure
            );
          }
        }

        return updated;
      }),
    }));
    if (errors[productId]) setErrors((p) => ({ ...p, [productId]: '' }));
  };

  const handleToggleTruckMode = (productId: number, slotId: string, item: CartItem) => {
    const current = truckModes[slotId] ?? 'auto';
    const next = current === 'auto' ? 'manual' : 'auto';
    setTruckModes((p) => ({ ...p, [slotId]: next }));

    if (next === 'auto') {
      setProductSlots((p) => ({
        ...p,
        [productId]: (p[productId] || []).map((s) => {
          if (s.slot_id !== slotId) return s;
          const loadVal = parseFloat(s.load_size || '0') || 0;
          return {
            ...s,
            truck_type: autoSelectTruckType(
              loadVal > 0 ? loadVal : s.quantity,
              item.unit_of_measure
            ),
          };
        }),
      }));
    }
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

      slots.forEach((s, idx) => {
        const loadVal = parseFloat(s.load_size || '0') || 0;
        if (!loadVal || loadVal <= 0) {
          errs[item.product_id] = `Delivery ${idx + 1}: Load size per trip is required.`;
          ok = false;
        } else if (loadVal > s.quantity) {
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
              Split quantities across dates. Set load size per trip and optionally an interval for each delivery.
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
                  const mode = truckModes[slot.slot_id] ?? 'auto';

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
                          {/* Quantity */}
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 block">
                              Qty ({item.unit_of_measure})
                            </label>
                            <input
                              type="number"
                              step="0.20"
                              min="0.20"
                              value={slot.quantity}
                              onChange={(e) =>
                                handleUpdateSlot(item.product_id, slot.slot_id, 'quantity', parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            />
                          </div>

                          {/* Truck Type */}
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Truck size={12} /> Truck Type
                              </span>
                              {/* Auto / Manual toggle */}
                              <span className="flex items-center gap-0.5 bg-secondary-200 rounded-full p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTruckMode(item.product_id, slot.slot_id, item)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                    mode === 'auto'
                                      ? 'bg-primary-600 text-white shadow-sm'
                                      : 'text-secondary-500 hover:text-secondary-700'
                                  }`}
                                >
                                  Auto
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTruckMode(item.product_id, slot.slot_id, item)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                    mode === 'manual'
                                      ? 'bg-secondary-700 text-white shadow-sm'
                                      : 'text-secondary-500 hover:text-secondary-700'
                                  }`}
                                >
                                  Manual
                                </button>
                              </span>
                            </label>
                            <div className="relative">
                              <Truck
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
                                size={14}
                              />
                              <select
                                value={slot.truck_type}
                                disabled={mode === 'auto'}
                                onChange={(e) =>
                                  handleUpdateSlot(item.product_id, slot.slot_id, 'truck_type', e.target.value)
                                }
                                className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm transition-colors ${
                                  mode === 'auto'
                                    ? 'border-secondary-200 bg-secondary-100 text-secondary-500 cursor-not-allowed'
                                    : 'border-secondary-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer'
                                }`}
                              >
                                {getTruckTypesForUnit(item.unit_of_measure).map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Delivery Date */}
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 block">
                              Delivery Date
                            </label>
                            <div className="relative">
                              <Calendar
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
                                size={14}
                              />
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

                          {/* Start Time */}
                          <div>
                            <label className="text-xs text-secondary-600 font-medium mb-1 block">
                              Start Time
                            </label>
                            <div className="relative">
                              <Clock
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
                                size={14}
                              />
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
                              <span className="text-red-400 font-normal ml-0.5">*</span>
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
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                       {/* Row 3: Accelerator + Retarder — concrete products only */}
                        {isConcrete(item.unit_of_measure) && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="text-xs text-secondary-600 font-medium mb-1 flex items-center gap-1">
                                <Zap size={12} className="text-amber-500" />
                                Accelerator Type
                                <span className="text-secondary-400 font-normal ml-1">optional</span>
                              </label>
                              <select
                                value={slot.accelerator_type || ''}
                                onChange={(e) =>
                                  handleUpdateSlot(
                                    item.product_id,
                                    slot.slot_id,
                                    'accelerator_type',
                                    e.target.value || ''
                                  )
                                }
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                              >
                                <option value="">None</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-secondary-600 font-medium mb-1 flex items-center gap-1">
                                <Timer size={12} className="text-blue-500" />
                                Retarder Type
                                <span className="text-secondary-400 font-normal ml-1">optional</span>
                              </label>
                              <select
                                value={slot.retarder_type || ''}
                                onChange={(e) =>
                                  handleUpdateSlot(
                                    item.product_id,
                                    slot.slot_id,
                                    'retarder_type',
                                    e.target.value || ''
                                  )
                                }
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                              >
                                <option value="">None</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>
                          </div>
                        )}       
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
                            {slot.quantity} {item.unit_of_measure} total · {breakdown.length} trips ×{' '}
                            {slot.load_size} {item.unit_of_measure} · every{' '}
                            {getIntervalLabel(slot.time_interval || '')}
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