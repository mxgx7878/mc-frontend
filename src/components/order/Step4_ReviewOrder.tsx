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
} from 'lucide-react';
import type { CartItem, Project } from '../../types/order.types';
import type { OrderFormValues } from '../../utils/validators';
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