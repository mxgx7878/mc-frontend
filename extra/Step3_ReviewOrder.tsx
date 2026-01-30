// src/components/order/Step3_ReviewOrder.tsx
/**
 * STEP 3: REVIEW ORDER
 * 
 * Final review screen before order submission
 * - Shows complete order summary
 * - Displays all cart items
 * - Shows project and delivery details
 * - Confirms pricing note
 * - Has final "Place Order" button
 */

import React from 'react';
import { 
  Package, 
  MapPin, 
  Calendar, 
  Truck, 
  FileText, 
  Building2,
  User,
  Phone,
  Edit,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { CartItem, Project } from '../../types/order.types';
import type { OrderFormValues } from '../../utils/validators';
import Button from '../common/Buttons';

interface Step3Props {
  cartItems: CartItem[];
  orderDetails: OrderFormValues;
  selectedProject: Project | null;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const Step3_ReviewOrder: React.FC<Step3Props> = ({
  cartItems,
  orderDetails,
  selectedProject,
  onBack,
  onConfirm,
  isSubmitting,
}) => {
  const getImageUrl = (photo: string | null | undefined): string => {
    // Return fallback image if photo is null, undefined, or empty
    if (!photo) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }

    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${photo}`;
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // const deliveryMethods: Record<string, string> = {
  //   Other: 'Other',
  //   Tipper: '🚛 Tipper',
  //   Agitator: '🔄 Agitator',
  //   Pump: '⚙️ Pump',
  //   Ute: '🚐 Ute',
  // };

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
            <p className="text-secondary-600">Please review all details before placing your order</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cart Items */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="text-primary-600" size={24} />
                <h3 className="font-bold text-secondary-900">Order Items</h3>
              </div>
              <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-start gap-4 p-4 bg-secondary-50 rounded-lg border border-secondary-200"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-secondary-200">
                    <img
                      src={getImageUrl(item.product_photo)}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+';
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-secondary-900">{item.product_name}</h4>
                    <p className="text-sm text-secondary-600 mt-1">{item.product_type}</p>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-sm">
                        <span className="text-secondary-600">Quantity:</span>
                        <span className="font-semibold text-secondary-900 ml-2">
                          {item.quantity} {item.unit_of_measure}
                        </span>
                      </div>
                    </div>

                    {/* Custom Blend */}
                    {item.custom_blend_mix && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        <p className="text-xs font-semibold text-amber-900">Custom Blend Mix:</p>
                        <p className="text-sm text-amber-800">{item.custom_blend_mix}</p>
                      </div>
                    )}
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

          {/* Delivery Details */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="text-primary-600" size={24} />
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

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="text-secondary-500 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Delivery Date</p>
                    <p className="text-base font-semibold text-secondary-900">
                      {new Date(orderDetails.delivery_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* {orderDetails.delivery_time && (
                  <div className="flex items-start gap-3">
                    <Clock className="text-secondary-500 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Preferred Time</p>
                      <p className="text-base font-semibold text-secondary-900">{orderDetails.delivery_time}</p>
                    </div>
                  </div>
                )} */}
              </div>

              {/* Delivery Method
              <div className="flex items-start gap-3">
                <Truck className="text-secondary-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-secondary-600">Delivery Method</p>
                  <p className="text-base font-semibold text-secondary-900">
                    {deliveryMethods[orderDetails.delivery_method] || orderDetails.delivery_method}
                  </p>
                </div>
              </div> */}

              {/* Load Size */}
              {orderDetails.load_size && (
                <div className="flex items-start gap-3">
                  <Package className="text-secondary-500 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Load Size</p>
                    <p className="text-base text-secondary-900">{orderDetails.load_size}</p>
                  </div>
                </div>
              )}

              {/* Special Equipment */}
              {/* {orderDetails.special_equipment && (
                <div className="flex items-start gap-3">
                  <FileText className="text-secondary-500 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Special Equipment</p>
                    <p className="text-base text-secondary-900">{orderDetails.special_equipment}</p>
                  </div>
                </div>
              )} */}

              {/* Special Notes */}
              {/* {orderDetails.special_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-1">Special Instructions:</p>
                  <p className="text-sm text-amber-800">{orderDetails.special_notes}</p>
                </div>
              )} */}

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
                  <span className="font-semibold text-secondary-900">{cartItems.length}</span>
                </div>
              </div>

              {/* Pricing Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm font-semibold text-blue-900">Pricing Information</p>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Final pricing will be calculated after order placement based on delivery location and supplier 
                  availability. You'll receive a detailed invoice within 20 minutes of order confirmation.
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
                Edit Order Details
              </Button>
            </div>

            {/* Confirmation Note */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-800 leading-relaxed">
                ✅ By placing this order, you confirm that all details are correct and agree to receive 
                pricing and delivery confirmation via email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3_ReviewOrder;