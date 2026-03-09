// src/components/client/orderEdit/EditItemModal.tsx
/**
 * EDIT ITEM MODAL
 *
 * UPDATED:
 * - Load size per trip is now REQUIRED
 * - Truck type auto-selects based on load_size (falls back to quantity)
 * - Auto / Manual toggle per delivery slot
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
  Weight,
  Timer,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { OrderEditItem, EditDeliveryPayload } from '../../../types/orderEdit.types';
import {
  getDeliveredQuantity,
  getScheduledDeliveries,
  getDeliveredDeliveries,
} from '../../../types/orderEdit.types';
import { getTruckTypesForUnit, autoSelectTruckType } from '../../../utils/truckTypes';

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

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OrderEditItem | null;
  onSave: (data: {
    order_item_id: number;
    quantity: number;
    deliveries: EditDeliveryPayload[];
  }) => void;
  isAdmin?: boolean;
}

interface LocalDelivery {
  id: number | null;
  localId: string;
  quantity: number;
  delivery_date: string;
  delivery_time: string;
  truck_type: string;
  delivery_cost: number;
  load_size: string;
  time_interval: string;
  isNew: boolean;
  invoice_id?: number | null;
}

const toNumber = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : fallback;
};

const formatTimeForApi = (time: string | null | undefined): string | null => {
  if (!time || time.trim() === '') return null;
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return null;
};

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
  // 'auto' = truck driven by load_size/qty | 'manual' = user picks freely
  const [truckModes, setTruckModes] = useState<Record<string, 'auto' | 'manual'>>({});

  const deliveredQty = useMemo(() => (item ? getDeliveredQuantity(item) : 0), [item]);
  const deliveredDeliveries = useMemo(() => (item ? getDeliveredDeliveries(item) : []), [item]);
  const minQuantity = deliveredQty;

  const requiredScheduled = useMemo(
    () => Math.max(0, quantity - deliveredQty),
    [quantity, deliveredQty]
  );
  const allocatedScheduled = useMemo(
    () => scheduledDeliveries.reduce((sum, d) => sum + toNumber(d.quantity, 0), 0),
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
      const modes: Record<string, 'auto' | 'manual'> = {};
      const existing: LocalDelivery[] = scheduled.map((d) => {
        const localId = uuidv4();
        modes[localId] = 'auto';
        const loadVal = parseFloat(d.load_size || '0') || 0;
        const qty = toNumber(d.quantity ?? (d as any).qty, 0);
        return {
          id: d.id,
          localId,
          quantity: qty,
          delivery_date: d.delivery_date?.split('T')[0] || '',
          invoice_id: d.invoice_id ?? null,
          delivery_time: formatTimeForInput(d.delivery_time),
          truck_type: autoSelectTruckType(
            loadVal > 0 ? loadVal : qty,
            item.product?.unit_of_measure || ''
          ),
          delivery_cost: toNumber(d.delivery_cost, 0),
          load_size: d.load_size || '',
          time_interval: d.time_interval || '',
          isNew: false,
        };
      });

      setScheduledDeliveries(existing);
      setTruckModes(modes);
      setErrors([]);
    }
  }, [isOpen, item]);

  const handleQuantityChange = (newQty: number) => {
    const qtyNum = toNumber(newQty, minQuantity);
    setQuantity(qtyNum < minQuantity ? minQuantity : qtyNum);
  };

  const handleAddDelivery = () => {
    const rem = toNumber(remainingToAllocate, 0);
    const defaultQty = rem > 0 ? rem : 1;
    const unitOfMeasure = item?.product?.unit_of_measure || '';
    const newId = uuidv4();
    setTruckModes((p) => ({ ...p, [newId]: 'auto' }));
    setScheduledDeliveries((prev) => [
      ...prev,
      {
        id: null,
        localId: newId,
        quantity: defaultQty > 0 ? defaultQty : 1,
        delivery_date: '',
        delivery_time: '08:00',
        truck_type: autoSelectTruckType(defaultQty > 0 ? defaultQty : 1, unitOfMeasure),
        delivery_cost: 0,
        load_size: '',
        time_interval: '',
        isNew: true,
      },
    ]);
  };

  const handleRemoveDelivery = (localId: string) => {
    setScheduledDeliveries((prev) => prev.filter((d) => d.localId !== localId));
  };

  const handleDeliveryChange = (
    localId: string,
    field: keyof LocalDelivery,
    value: string | number
  ) => {
    const unitOfMeasure = item?.product?.unit_of_measure || '';
    const mode = truckModes[localId] ?? 'auto';

    setScheduledDeliveries((prev) =>
      prev.map((d) => {
        if (d.localId !== localId) return d;
        const updated = { ...d, [field]: value };

        if (mode === 'auto') {
          if (field === 'load_size') {
            const loadVal = parseFloat(value.toString()) || 0;
            updated.truck_type = autoSelectTruckType(
              loadVal > 0 ? loadVal : updated.quantity,
              unitOfMeasure
            );
          } else if (field === 'quantity') {
            const loadVal = parseFloat(d.load_size || '0') || 0;
            updated.truck_type = autoSelectTruckType(
              loadVal > 0 ? loadVal : parseFloat(value.toString()) || 0,
              unitOfMeasure
            );
          }
        }

        return updated;
      })
    );
  };

  const handleToggleTruckMode = (localId: string) => {
    const current = truckModes[localId] ?? 'auto';
    const next = current === 'auto' ? 'manual' : 'auto';
    const unitOfMeasure = item?.product?.unit_of_measure || '';
    setTruckModes((p) => ({ ...p, [localId]: next }));

    if (next === 'auto') {
      setScheduledDeliveries((prev) =>
        prev.map((d) => {
          if (d.localId !== localId) return d;
          const loadVal = parseFloat(d.load_size || '0') || 0;
          return {
            ...d,
            truck_type: autoSelectTruckType(
              loadVal > 0 ? loadVal : d.quantity,
              unitOfMeasure
            ),
          };
        })
      );
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    const editableDeliveries = scheduledDeliveries.filter(
      (d) => !(d.invoice_id != null && d.invoice_id > 0)
    );

    if (quantity < minQuantity) {
      newErrors.push(`Quantity cannot be less than delivered amount (${minQuantity})`);
    }

    if (!isAllocationValid) {
      if (remainingToAllocate > 0) {
        newErrors.push(`You have ${remainingToAllocate} unallocated. Please distribute all quantity across deliveries.`);
      } else {
        newErrors.push(`Over-allocated by ${Math.abs(remainingToAllocate)}. Please reduce delivery quantities.`);
      }
    }

    if (editableDeliveries.some((d) => !d.delivery_date)) {
      newErrors.push('All delivery slots must have a delivery date.');
    }
    if (editableDeliveries.some((d) => toNumber(d.quantity, 0) <= 0)) {
      newErrors.push('All delivery slots must have quantity greater than 0.');
    }

    const missingLoadSize = editableDeliveries.some(
      (d) => !d.load_size || parseFloat(d.load_size) <= 0
    );
    if (missingLoadSize) {
      newErrors.push('All delivery slots must have a load size per trip.');
    }

    if (editableDeliveries.some((d) => !d.truck_type)) {
      newErrors.push('All delivery slots must have a truck type selected.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!item) return;
    if (!validateForm()) return;

    const deliveriesPayload: EditDeliveryPayload[] = scheduledDeliveries
      .filter((d) => !(d.invoice_id != null && d.invoice_id > 0))
      .map((d) => ({
        id: d.id,
        quantity: d.quantity,
        delivery_date: d.delivery_date,
        delivery_time: formatTimeForApi(d.delivery_time),
        truck_type: d.truck_type || null,
        load_size: d.load_size || null,
        time_interval: d.time_interval || null,
        ...(isAdmin ? { delivery_cost: d.delivery_cost || 0 } : {}),
      }));

    onSave({ order_item_id: item.id, quantity, deliveries: deliveriesPayload });
  };

  if (!isOpen || !item) return null;

  const getImageUrl = (photo: string | null): string => {
    if (!photo) return '';
    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${photo}`;
  };

  // ==================== RENDER ====================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

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
                <h2 className="text-lg font-bold text-gray-900">{item.product?.product_name}</h2>
                <p className="text-sm text-gray-500">
                  {item.product?.product_type} · {item.product?.unit_of_measure}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quantity */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Total Quantity ({item.product?.unit_of_measure})
            </label>
            {deliveredQty > 0 && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                {deliveredQty} {item.product?.unit_of_measure} already delivered — minimum quantity is locked at {minQuantity}.
              </div>
            )}
            <input
              type="number"
              min={minQuantity}
              step="0.01"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className={isAllocationValid ? 'text-green-600' : 'text-amber-600'}>
                Scheduled: {allocatedScheduled.toFixed(2)} / {requiredScheduled.toFixed(2)} needed
              </span>
              {!isAllocationValid && (
                <span className={remainingToAllocate > 0 ? 'text-amber-600' : 'text-red-600'}>
                  {remainingToAllocate > 0
                    ? `${remainingToAllocate.toFixed(2)} remaining`
                    : `${Math.abs(remainingToAllocate).toFixed(2)} over`}
                </span>
              )}
            </div>
          </div>

          {/* Delivered (read-only) */}
          {deliveredDeliveries.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Delivered ({deliveredDeliveries.length})
              </p>
              <div className="space-y-2">
                {deliveredDeliveries.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-green-700">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="font-medium">{toNumber(d.quantity)} {item.product?.unit_of_measure}</span>
                      <span className="text-green-500">·</span>
                      <span>{d.delivery_date?.split('T')[0]}</span>
                    </div>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">Delivered</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Deliveries */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Scheduled Deliveries
            </p>

            {scheduledDeliveries.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600 mb-3">No delivery slots</p>
                <button
                  type="button"
                  onClick={handleAddDelivery}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add First Delivery Slot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledDeliveries.map((delivery, index) => {
                  const invoiced = delivery.invoice_id != null && delivery.invoice_id > 0;
                  const disabledClass = invoiced
                    ? 'bg-gray-100 cursor-not-allowed text-gray-500 border-gray-200'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
                  const mode = truckModes[delivery.localId] ?? 'auto';

                  return (
                    <div
                      key={delivery.localId}
                      className={`p-4 rounded-lg border-2 ${
                        invoiced
                          ? 'bg-amber-50 border-amber-200'
                          : delivery.isNew
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Invoiced Banner */}
                      {invoiced && (
                        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-md border border-amber-200">
                          <Lock className="w-3.5 h-3.5" />
                          Invoiced — this delivery cannot be modified or deleted
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Slot Number */}
                        <div
                          className={`w-8 h-8 ${
                            invoiced ? 'bg-amber-500' : 'bg-blue-600'
                          } text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0`}
                        >
                          {index + 1}
                        </div>

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
                                disabled={invoiced}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className={`w-full px-3 py-2 border-2 rounded-lg text-sm ${disabledClass}`}
                              />
                            </div>

                            {/* Truck Type */}
                            <div>
                              <label className="text-xs text-gray-600 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Truck className="w-3 h-3" /> Truck Type
                                </span>
                                {!invoiced && (
                                  <span className="flex items-center gap-0.5 bg-gray-200 rounded-full p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTruckMode(delivery.localId)}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                        mode === 'auto'
                                          ? 'bg-blue-600 text-white shadow-sm'
                                          : 'text-gray-500 hover:text-gray-700'
                                      }`}
                                    >
                                      Auto
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTruckMode(delivery.localId)}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                        mode === 'manual'
                                          ? 'bg-gray-700 text-white shadow-sm'
                                          : 'text-gray-500 hover:text-gray-700'
                                      }`}
                                    >
                                      Manual
                                    </button>
                                  </span>
                                )}
                              </label>
                              <select
                                value={delivery.truck_type}
                                disabled={invoiced || mode === 'auto'}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'truck_type', e.target.value)
                                }
                                className={`w-full px-3 py-2 border-2 rounded-lg text-sm transition-colors ${
                                  invoiced
                                    ? 'bg-gray-100 cursor-not-allowed text-gray-500 border-gray-200'
                                    : mode === 'auto'
                                    ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer'
                                }`}
                              >
                                {getTruckTypesForUnit(item?.product?.unit_of_measure || '').map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Date + Time */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Delivery Date
                              </label>
                              <input
                                type="date"
                                value={delivery.delivery_date}
                                disabled={invoiced}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'delivery_date', e.target.value)
                                }
                                className={`w-full px-3 py-2 border-2 rounded-lg text-sm ${disabledClass}`}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Time
                              </label>
                              <input
                                type="time"
                                value={delivery.delivery_time}
                                disabled={invoiced}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'delivery_time', e.target.value)
                                }
                                className={`w-full px-3 py-2 border-2 rounded-lg text-sm ${disabledClass}`}
                              />
                            </div>
                          </div>

                          {/* Row 2b: Delivery Cost (admin only) */}
                          {isAdmin && (
                            <div>
                              <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Delivery Cost
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={delivery.delivery_cost}
                                disabled={invoiced}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'delivery_cost', parseFloat(e.target.value) || 0)
                                }
                                className={`w-full px-3 py-2 border-2 rounded-lg text-sm ${disabledClass}`}
                                placeholder="0.00"
                              />
                            </div>
                          )}

                          {/* Row 3: Load Size + Time Interval */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <Weight className="w-3 h-3" />
                                Load Size per Trip
                                {!invoiced && <span className="text-red-400 ml-0.5">*</span>}
                                {invoiced && <span className="text-gray-400 font-normal ml-1">optional</span>}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={delivery.quantity}
                                placeholder="e.g. 0.2"
                                value={delivery.load_size || ''}
                                disabled={invoiced}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'load_size', e.target.value)
                                }
                                className={`w-full px-3 py-2 border-2 rounded-lg text-sm ${disabledClass}`}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                Time Between Loads
                                <span className="text-gray-400 font-normal ml-1">optional</span>
                              </label>
                              <select
                                value={delivery.time_interval || ''}
                                disabled={invoiced}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'time_interval', e.target.value)
                                }
                                className={`w-full px-3 py-2 border-2 rounded-lg text-sm ${
                                  invoiced
                                    ? 'bg-gray-100 cursor-not-allowed text-gray-500 border-gray-200'
                                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              >
                                {TIME_INTERVAL_OPTIONS.map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Timeline Preview */}
                          {(() => {
                            const ls = parseFloat(delivery.load_size || '0');
                            const iv = parseInt(delivery.time_interval || '0', 10);
                            const breakdown =
                              ls > 0 && iv > 0 && delivery.delivery_time
                                ? buildTimeBreakdown(delivery.quantity, delivery.delivery_time, ls, iv)
                                : [];
                            if (breakdown.length <= 1) return null;
                            return (
                              <div className="border border-blue-200 bg-blue-50 rounded-lg px-3 py-2.5">
                                <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1.5">
                                  <Timer className="w-3.5 h-3.5" />
                                  {breakdown.length} loads scheduled
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {breakdown.map((trip, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-1 text-xs"
                                    >
                                      <span className="font-bold text-blue-700">{to12h(trip.time)}</span>
                                      <span className="text-gray-400">→</span>
                                      <span className="font-medium text-gray-700">{trip.qty} {item.product?.unit_of_measure}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Remove Button */}
                        {!invoiced && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDelivery(delivery.localId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Slot Button */}
            {scheduledDeliveries.length > 0 && (
              <button
                type="button"
                onClick={handleAddDelivery}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Another Delivery Slot
              </button>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {err}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 px-6 py-4 flex gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;