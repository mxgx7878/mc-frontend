// FILE PATH: src/components/order/Step4_ReviewOrder.tsx

/**
 * STEP 4: REVIEW ORDER (FINAL STEP)
 * 
 * UPDATED TO SHOW SPLIT DELIVERIES:
 * - Display delivery slots grouped by date
 * - Show time slots for each delivery date
 * - Product details with quantities per slot
 * - Project and contact information
 * - Final confirmation before submission
 * 
 * WHY GROUPED BY DATE:
 * - Easy to see what's being delivered on each day
 * - Helps with logistics planning
 * - Clear visualization of delivery schedule
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Calendar,
  Clock,
  Truck,
  FileText,
  Building2,
  User,
  Phone,
  Edit,
  CheckCircle2,
  AlertCircle,
  Info, ChevronDown, ChevronUp, CheckCircle, Loader2, DollarSign
} from 'lucide-react';
import type { CartItem, Project } from '../../types/order.types';
import type { OrderFormValues } from '../../utils/validators';
import { surchargesAPI } from '../../api/handlers/surcharges.api';
import { isConcrete } from '../../utils/truckTypes';
import type { Surcharge } from '../../types/surcharge.types';
import Button from '../common/Buttons';

interface Step4Props {
  cartItems: CartItem[];
  orderDetails: OrderFormValues;
  selectedProject: Project | null;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

/**
 * Helper type for grouped deliveries
 */
interface DeliveryGroup {
  date: string;
  deliveries: Array<{
    time: string;
    items: Array<{
      product_id: number;
      product_name: string;
      product_photo: string | null;
      product_type: string;
      unit_of_measure: string;
      quantity: number;
      custom_blend_mix?: string | null;
    }>;
  }>;
}
const detectAppliedCodes = (cartItems: CartItem[]): Set<string> => {
  const applied = new Set<string>();

  cartItems.forEach((item) => {
    const concrete = isConcrete(item.unit_of_measure);

    (item.delivery_slots || []).forEach((slot) => {
      if (!slot.delivery_date || !slot.delivery_time) return;

      const [yr, mo, dy] = slot.delivery_date.split('-').map(Number);
      const date = new Date(yr, mo - 1, dy); // local time — avoids UTC offset shifting the day
      const day  = date.getDay();
      const [hStr, mStr] = slot.delivery_time.split(':');
      const mins      = parseInt(hStr) * 60 + parseInt(mStr);
      const loadSize  = parseFloat(slot.load_size || '0');

      // ── Environmental Levy (concrete always) ──
      if (concrete) applied.add('EL-017');

      // ── Minimum Cartage (concrete, load_size < 4) ──
      if (concrete && loadSize > 0 && loadSize < 4) applied.add('MCART');

      // ── Accelerator ──
      if (slot.accelerator_type === 'low')    applied.add('ACCEL-LOW');
      if (slot.accelerator_type === 'medium') applied.add('ACCEL-MED');
      if (slot.accelerator_type === 'high')   applied.add('ACCEL-HIGH');

      // ── Retarder ──
      if (slot.retarder_type === 'low')    applied.add('RETARD-LOW');
      if (slot.retarder_type === 'medium') applied.add('RETARD-MED');
      if (slot.retarder_type === 'high')   applied.add('RETARD-HIGH');

      // ── Sunday ──
      if (day === 0) { applied.add('PH-003'); return; }

      // ── Saturday bands ──
      if (day === 6) {
        if (mins >= 0   && mins < 360)  applied.add('AH-007B'); // Sat midnight–6am
        if (mins >= 360 && mins < 720)  applied.add('SD-002A'); // Sat 6am–12pm
        if (mins >= 720 && mins < 960)  applied.add('SD-002B'); // Sat 12pm–4pm
        if (mins >= 960)                applied.add('SD-002C'); // Sat 4pm–midnight
        return;
      }

      // ── Weekday after hours (Mon–Fri) ──
      if (day >= 1 && day <= 5) {
        if (mins >= 960  && mins < 1080) applied.add('AH-007A'); // 4pm–6pm
        if (mins >= 1080 || mins < 240)  applied.add('AH-007B'); // 6pm–4am
      }


      if (slot.aggregate_size === '10mm') applied.add('SAP-006A');
      if (slot.aggregate_size === '7mm')  applied.add('SAP-006B');

      // ── Slump Modification (> 80mm baseline) ──
      if (slot.slump_value && slot.slump_value > 80) applied.add('SM-007');

      // ── Retarder — Normal Dose has no fee, skip ──
      if (slot.retarder_type === 'low')    applied.add('RETARD-LOW');
      if (slot.retarder_type === 'medium') applied.add('RETARD-MED');
      if (slot.retarder_type === 'high')   applied.add('RETARD-HIGH');
    });
  });

  return applied;
};
const formatAmount = (amount: number, amount_type: 'fixed' | 'percentage') =>
  amount_type === 'percentage'
    ? `${amount}%`
    : `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`;
const Step4_ReviewOrder: React.FC<Step4Props> = ({
  cartItems,
  orderDetails,
  selectedProject,
  onBack,
  onConfirm,
  isSubmitting,
}) => {
  /**
   * Get image URL with fallback
   */
  const getImageUrl = (photo: string | null | undefined): string => {
    if (!photo) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${photo}`;
  };

  /**
   * Group delivery slots by date and time
   * 
   * WHAT: Transform flat list of cart items with slots into hierarchical structure:
   *       Date -> Time -> Products
   * 
   * WHY: Makes it easy to display "On Feb 15 at 9:00 AM, delivering: Product A (2 tonnes), Product B (1 m³)"
   * 
   * HOW:
   * 1. Flatten all cart items into individual slot entries
   * 2. Group by delivery_date
   * 3. Within each date, group by delivery_time
   * 4. Sort by date, then by time
   */
  const groupDeliveriesByDate = (): DeliveryGroup[] => {
    // Step 1: Flatten all slots with product info
    const allSlotEntries: Array<{
      date: string;
      time: string;
      product_id: number;
      product_name: string;
      product_photo: string | null;
      product_type: string;
      unit_of_measure: string;
      quantity: number;
      custom_blend_mix?: string | null;
    }> = [];

    cartItems.forEach((item) => {
      item.delivery_slots?.forEach((slot) => {
        allSlotEntries.push({
          date: slot.delivery_date,
          time: slot.delivery_time,
          product_id: item.product_id,
          product_name: item.product_name,
          product_photo: item.product_photo,
          product_type: item.product_type,
          unit_of_measure: item.unit_of_measure,
          quantity: slot.quantity,
          custom_blend_mix: item.custom_blend_mix,
        });
      });
    });

    // Step 2: Group by date
    const byDate = allSlotEntries.reduce((acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = [];
      }
      acc[entry.date].push(entry);
      return acc;
    }, {} as Record<string, typeof allSlotEntries>);

    // Step 3: Group by time within each date, and format
    const groups: DeliveryGroup[] = Object.entries(byDate).map(([date, entries]) => {
      // Group by time
      const byTime = entries.reduce((acc, entry) => {
        if (!acc[entry.time]) {
          acc[entry.time] = [];
        }
        acc[entry.time].push({
          product_id: entry.product_id,
          product_name: entry.product_name,
          product_photo: entry.product_photo,
          product_type: entry.product_type,
          unit_of_measure: entry.unit_of_measure,
          quantity: entry.quantity,
          custom_blend_mix: entry.custom_blend_mix,
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Convert to array and sort by time
      const deliveries = Object.entries(byTime)
        .map(([time, items]) => ({ time, items }))
        .sort((a, b) => a.time.localeCompare(b.time));

      return { date, deliveries };
    });

    // Step 4: Sort by date
    return groups.sort((a, b) => a.date.localeCompare(b.date));
  };

  const deliveryGroups = groupDeliveriesByDate();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalUniqueProducts = cartItems.length;
  const totalDeliverySlots = cartItems.reduce((sum, item) => sum + (item.delivery_slots?.length || 0), 0);

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Format time for display (convert 24h to 12h)
   */
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  const SurchargesGuide: React.FC<{ cartItems: CartItem[] }> = ({ cartItems }) => {
  const [open, setOpen] = React.useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['general-surcharges'],
    queryFn: () => surchargesAPI.getGeneralSurcharges(),
    staleTime: 5 * 60 * 1000,
  });

  const appliedCodes = React.useMemo(() => detectAppliedCodes(cartItems), [cartItems]);
  const surcharges: Surcharge[] = data?.data || [];

  // Sort: applied first, then rest alphabetically
  const sorted = [...surcharges].sort((a, b) => {
    const aApp = appliedCodes.has(a.billing_code || '');
    const bApp = appliedCodes.has(b.billing_code || '');
    if (aApp && !bApp) return -1;
    if (!aApp && bApp) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const appliedCount = surcharges.filter(s => appliedCodes.has(s.billing_code || '')).length;

  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-amber-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign size={18} className="text-amber-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">Surcharges &amp; Fees Guide</p>
            <p className="text-xs text-gray-500">
              {isLoading
                ? 'Loading...'
                : appliedCount > 0
                ? `${appliedCount} surcharge${appliedCount !== 1 ? 's' : ''} apply to your order`
                : 'No surcharges detected for your current schedule'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {appliedCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full border border-green-200">
              {appliedCount} Applied
            </span>
          )}
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-amber-100 px-5 py-4">
          {isLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading surcharges...</span>
              </div>
            ) : surcharges.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No surcharge data available.</p>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3 flex items-start gap-1.5">
                  <Info size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  Surcharges marked <span className="font-semibold text-green-700 mx-1">Applied</span> will
                  be automatically added based on your delivery schedule. Final amounts confirmed after submission.
                </p>

                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {sorted.map((s) => {
                    const isApplied = appliedCodes.has(s.billing_code || '');
                    return (
                      <div
                        key={s.id}
                        className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                          isApplied
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-100 opacity-70'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {isApplied ? (
                            <CheckCircle size={15} className="text-green-500" />
                          ) : (
                            <div className="w-[15px] h-[15px] rounded-full border-2 border-gray-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-semibold ${isApplied ? 'text-green-800' : 'text-gray-600'}`}>
                              {s.name}
                            </span>
                            {s.billing_code && (
                              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                {s.billing_code}
                              </span>
                            )}
                            {s.applies_to && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                s.applies_to === 'Concrete'
                                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              }`}>
                                {s.applies_to}
                              </span>
                            )}
                            {isApplied && (
                              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full border border-green-200">
                                APPLIED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                            {s.conditions || s.description}
                          </p>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <span className={`text-sm font-bold tabular-nums ${isApplied ? 'text-green-700' : 'text-gray-500'}`}>
                            {formatAmount(s.amount, s.amount_type)}
                          </span>
                          {s.amount_type === 'fixed' && (
                            <p className="text-[10px] text-gray-400">/unit</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
        </div>
      )}
    </div>
  );
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Review Your Order</h2>
            <p className="text-secondary-600">
              Please review all details including split delivery schedule before placing your order
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Delivery Schedule */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DELIVERY SCHEDULE - GROUPED BY DATE */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="text-primary-600" size={24} />
                <h3 className="font-bold text-secondary-900">Delivery Schedule</h3>
              </div>
              <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                {totalDeliverySlots} delivery slot{totalDeliverySlots !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-6">
              {deliveryGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="border-l-4 border-primary-500 pl-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="text-primary-600" size={20} />
                    <h4 className="font-bold text-secondary-900 text-lg">
                      {formatDate(group.date)}
                    </h4>
                  </div>

                  {/* Time Slots for this date */}
                  <div className="space-y-4">
                    {group.deliveries.map((delivery, deliveryIndex) => (
                      <div
                        key={deliveryIndex}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                      >
                        {/* Time Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="text-blue-600" size={18} />
                          <span className="font-semibold text-blue-900">
                            {formatTime(delivery.time)}
                          </span>
                        </div>

                        {/* Products for this time slot */}
                        <div className="space-y-3">
                          {delivery.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="flex items-start gap-3 bg-white p-3 rounded-lg border border-blue-200"
                            >
                              {/* Product Image */}
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary-100 flex-shrink-0">
                                <img
                                  src={getImageUrl(item.product_photo)}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+';
                                  }}
                                />
                              </div>

                              {/* Product Details */}
                              <div className="flex-1">
                                <p className="font-semibold text-secondary-900">{item.product_name}</p>
                                <p className="text-sm text-secondary-600">{item.product_type}</p>
                                <p className="text-sm font-bold text-primary-600 mt-1">
                                  Quantity: {item.quantity} {item.unit_of_measure}
                                </p>
                                
                                {/* Custom Blend */}
                                {item.custom_blend_mix && (
                                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                    <p className="text-xs font-semibold text-amber-900">Custom Blend:</p>
                                    <p className="text-xs text-amber-800">{item.custom_blend_mix}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <SurchargesGuide cartItems={cartItems} />
            </div>
          </div>

          {/* Project Details */}
          {selectedProject && (
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="text-primary-600" size={24} />
                <h3 className="font-bold text-secondary-900">Project Information</h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-3">{selectedProject.name}</p>

                <div className="space-y-2">
                  {selectedProject.site_contact_name && (
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <User size={16} />
                      <span>{selectedProject.site_contact_name}</span>
                    </div>
                  )}

                  {selectedProject.site_contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Phone size={16} />
                      <span>{selectedProject.site_contact_phone}</span>
                    </div>
                  )}

                  {selectedProject.site_instructions && (
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Site Instructions:</p>
                      <p className="text-sm text-blue-800">{selectedProject.site_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address & Contact */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-primary-600" size={24} />
              <h3 className="font-bold text-secondary-900">Delivery Information</h3>
            </div>

            <div className="space-y-4">
              {/* PO Number */}
              {orderDetails.po_number && (
                <div className="flex items-start gap-3">
                  <FileText className="text-secondary-500 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">PO Number</p>
                    <p className="text-base font-semibold text-secondary-900">{orderDetails.po_number}</p>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="text-secondary-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-secondary-600">Delivery Address</p>
                  <p className="text-base text-secondary-900">{orderDetails.delivery_address}</p>
                </div>
              </div>

              {/* Load Size */}
              {/* {orderDetails.load_size && (
                <div className="flex items-start gap-3">
                  <Package className="text-secondary-500 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Load Size</p>
                    <p className="text-base text-secondary-900">{orderDetails.load_size}</p>
                  </div>
                </div>
              )} */}

              {/* Contact Person */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-2">Order Contact Person</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <User size={16} />
                    <span>{orderDetails.contact_person_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <Phone size={16} />
                    <span>{orderDetails.contact_person_number}</span>
                  </div>
                </div>
              </div>

              {/* Repeat Order Flag */}
              {orderDetails.repeat_order && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle2 size={16} />
                  <span className="font-medium">Marked as repeat order</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Order Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <h3 className="font-bold text-secondary-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Total Items:</span>
                  <span className="font-semibold text-secondary-900">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Products:</span>
                  <span className="font-semibold text-secondary-900">{totalUniqueProducts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Delivery Slots:</span>
                  <span className="font-semibold text-secondary-900">{totalDeliverySlots}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Delivery Dates:</span>
                  <span className="font-semibold text-secondary-900">{deliveryGroups.length}</span>
                </div>
              </div>

              {/* Pricing Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm font-semibold text-blue-900">Pricing Information</p>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Final pricing will be calculated after order placement based on delivery location and
                  supplier availability. You'll receive a detailed invoice within 20 minutes of order
                  confirmation.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={onConfirm}
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                fullWidth
                className="py-4 text-lg font-bold shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⚙️</span>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={24} className="mr-2" />
                    Place Order
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
                fullWidth
                className="py-3"
              >
                <Edit size={18} className="mr-2" />
                Edit Delivery Schedule
              </Button>
            </div>

            {/* Confirmation Note */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-800 leading-relaxed">
                ✅ By placing this order, you confirm that all details including the split delivery
                schedule are correct and agree to receive pricing and delivery confirmation via email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4_ReviewOrder;