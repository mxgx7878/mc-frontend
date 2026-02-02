/**
 * STEP 3: SPLIT DELIVERY SCHEDULE WITH TRUCK TYPE
 * 
 * PURPOSE:
 * Allow users to split product quantities across multiple delivery time slots
 * and select appropriate truck type for each delivery
 * 
 * KEY FEATURES:
 * - Each product can have 1+ delivery slots
 * - Each slot has: quantity, truck type, date, time
 * - Total allocated must equal ordered quantity
 * - Visual progress bar shows allocation status
 * - Pre-filled with default slot using primary delivery date from Step 2
 * - Truck type dropdown with 11 vehicle options
 * 
 * USER FLOW:
 * 1. See all cart items with default single slot
 * 2. Click "Add Another Delivery Slot" to split
 * 3. Configure quantity, truck type, date, time per slot
 * 4. System validates total allocation and truck type selection
 * 5. Proceed to Review (Step 4)
 * 
 * WHY TRUCK TYPE MATTERS:
 * - Different quantities require different truck capacities
 * - Construction sites need to plan for vehicle access
 * - Suppliers need to dispatch appropriate vehicles
 * - Helps with logistics coordination and costing
 * 
 * CHANGES FROM ORIGINAL:
 * - Added TRUCK_TYPES constant with 11 vehicle options
 * - Added truck_type field to DeliverySlot initialization
 * - Added truck type dropdown in slot grid (between quantity and date)
 * - Added truck type validation (must be selected)
 * - Updated grid layout to accommodate new field
 * - Added Truck icon for visual clarity
 */

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CartItem, DeliverySlot } from '../../types/order.types';
import Button from '../common/Buttons';
import { v4 as uuidv4 } from 'uuid';

/**
 * TRUCK TYPE OPTIONS
 * 
 * WHY: Standardized list of available vehicles for delivery
 * WHAT: 11 truck types ranging from 3 tonnes to 38 tonnes capacity
 * HOW: Used in dropdown, stored in database, used for supplier matching
 */
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

interface Step3Props {
  cartItems: CartItem[];
  primaryDeliveryDate: string; // From Step 2
  onBack: () => void;
  onContinue: (itemsWithSlots: CartItem[]) => void;
}

const Step3_SplitDelivery: React.FC<Step3Props> = ({
  cartItems,
  primaryDeliveryDate,
  onBack,
  onContinue,
}) => {
  /**
   * Local state for managing delivery slots
   * 
   * WHY: We need to track slots separately before committing to cart
   * WHAT: Map of productId -> DeliverySlot[]
   */
  const [productSlots, setProductSlots] = useState<Record<number, DeliverySlot[]>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  /**
   * Initialize delivery slots with default values
   * 
   * WHAT: Create one slot per product with:
   * - Full quantity
   * - Default truck type (tipper_light - safest default)
   * - Primary delivery date from Step 2
   * - Default time (08:00)
   * 
   * WHY: Most orders don't need splitting - this provides sensible defaults
   * 
   * CHANGE: Added truck_type: 'tipper_light' as default
   */
  useEffect(() => {
    const initialSlots: Record<number, DeliverySlot[]> = {};
    
    cartItems.forEach((item) => {
      initialSlots[item.product_id] = [
        {
          slot_id: uuidv4(),
          quantity: item.quantity,
          truck_type: 'tipper_light', // Default truck type
          delivery_date: primaryDeliveryDate,
          delivery_time: '08:00',
        }
      ];
    });
    
    setProductSlots(initialSlots);
  }, [cartItems, primaryDeliveryDate]);

  /**
   * Get image URL with fallback
   * 
   * WHAT: Handles null/undefined photos and relative paths
   * WHY: Prevents broken images in UI
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
   * Add a new delivery slot for a product
   * 
   * WHAT: Creates new slot with:
   * - Remaining unallocated quantity (or 1.0 if none)
   * - Default truck type
   * - Primary delivery date
   * - Default time
   * 
   * WHY: User wants to split delivery across multiple dates/times/trucks
   * 
   * CHANGE: Added truck_type: 'tipper_light' to new slots
   */
  const handleAddSlot = (productId: number, totalQuantity: number) => {
    const currentSlots = productSlots[productId] || [];
    const allocatedQty = currentSlots.reduce((sum, slot) => sum + slot.quantity, 0);
    const remainingQty = totalQuantity - allocatedQty;
    
    const newSlot: DeliverySlot = {
      slot_id: uuidv4(),
      quantity: remainingQty > 0 ? Math.min(remainingQty, 1) : 1,
      truck_type: 'tipper_light', // Default truck type
      delivery_date: primaryDeliveryDate,
      delivery_time: '08:00',
    };
    
    setProductSlots({
      ...productSlots,
      [productId]: [...currentSlots, newSlot],
    });
    
    // Clear error if exists
    if (errors[productId]) {
      setErrors({ ...errors, [productId]: '' });
    }
  };

  /**
   * Remove a delivery slot
   * 
   * WHAT: Removes slot from array (unless it's the last one)
   * WHY: User changed mind or made mistake
   * NOTE: Cannot remove if only one slot exists (must have at least 1)
   */
  const handleRemoveSlot = (productId: number, slotId: string) => {
    const currentSlots = productSlots[productId] || [];
    
    // Prevent removing last slot
    if (currentSlots.length <= 1) {
      return;
    }
    
    setProductSlots({
      ...productSlots,
      [productId]: currentSlots.filter(slot => slot.slot_id !== slotId),
    });
  };

  /**
   * Update a specific slot's field
   * 
   * WHAT: Updates quantity, truck_type, date, or time for a slot
   * HOW: Find slot by ID, update field, replace in array
   * 
   * CHANGE: Now handles truck_type field updates
   */
  const handleUpdateSlot = (
    productId: number,
    slotId: string,
    field: keyof DeliverySlot,
    value: string | number
  ) => {
    const currentSlots = productSlots[productId] || [];
    
    setProductSlots({
      ...productSlots,
      [productId]: currentSlots.map(slot =>
        slot.slot_id === slotId
          ? { ...slot, [field]: value }
          : slot
      ),
    });
    
    // Clear error when user makes changes
    if (errors[productId]) {
      setErrors({ ...errors, [productId]: '' });
    }
  };

  /**
   * Calculate allocation status for a product
   * 
   * WHAT: Returns { allocated, remaining, percentage, isValid }
   * WHY: Display progress bars and validation status
   * HOW: Sum all slot quantities, compare to total, calculate percentage
   */
  const getProductAllocation = (productId: number, totalQuantity: number) => {
    const slots = productSlots[productId] || [];
    const allocated = slots.reduce((sum, slot) => sum + parseFloat(slot.quantity.toString()), 0);
    const remaining = totalQuantity - allocated;
    const percentage = (allocated / totalQuantity) * 100;
    const isValid = Math.abs(remaining) < 0.01; // Allow small floating point errors
    
    return { allocated, remaining, percentage, isValid };
  };

  /**
   * Validate all products before proceeding
   * 
   * WHAT: Check each product has:
   * 1. Slots that sum to total quantity
   * 2. All slots have truck type selected
   * 3. All slots have date and time filled
   * 
   * WHY: Prevent incomplete or over-allocated deliveries
   * HOW: Use floating point tolerance (0.01) for quantity comparison
   * 
   * CHANGE: Added validation for truck_type field
   */
  const validateAllProducts = (): boolean => {
    const newErrors: Record<number, string> = {};
    let isValid = true;
    
    cartItems.forEach((item) => {
      const { remaining, isValid: productValid } = getProductAllocation(item.product_id, item.quantity);
      
      // Check quantity allocation
      if (!productValid) {
        if (remaining > 0) {
          newErrors[item.product_id] = `You have ${remaining.toFixed(2)} ${item.unit_of_measure} unallocated. Please distribute all quantity.`;
        } else {
          newErrors[item.product_id] = `Over-allocated by ${Math.abs(remaining).toFixed(2)} ${item.unit_of_measure}. Please reduce slot quantities.`;
        }
        isValid = false;
      }
      
      // Check for empty fields (date, time, truck_type)
      const slots = productSlots[item.product_id] || [];
      const hasEmptyFields = slots.some(slot => 
        !slot.delivery_date || 
        !slot.delivery_time || 
        !slot.truck_type
      );
      
      if (hasEmptyFields) {
        newErrors[item.product_id] = 'Please fill in truck type, date and time for all delivery slots.';
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handle continue to next step
   * 
   * WHAT: Validate, update cart items with slots, proceed to review
   * WHY: User has finished configuring delivery schedule
   * HOW: Merge delivery_slots array into each cart item
   */
  const handleContinue = () => {
    if (!validateAllProducts()) {
      return;
    }
    
    // Merge slots into cart items
    const updatedCartItems = cartItems.map(item => ({
      ...item,
      delivery_slots: productSlots[item.product_id] || [],
    }));
    
    onContinue(updatedCartItems);
  };

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
            <p className="text-secondary-600">Split your order into multiple delivery time slots and select truck type</p>
          </div>
        </div>
      </div>

      {/* Products with Delivery Slots */}
      <div className="space-y-6">
        {cartItems.map((item) => {
          const slots = productSlots[item.product_id] || [];
          const { allocated, remaining, percentage, isValid } = getProductAllocation(item.product_id, item.quantity);
          const hasError = !!errors[item.product_id];

          return (
            <div
              key={item.product_id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                hasError ? 'border-red-300' : isValid ? 'border-green-300' : 'border-secondary-200'
              }`}
            >
              {/* Product Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary-100 flex-shrink-0">
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
                
                <div className="flex-1">
                  <h3 className="font-bold text-secondary-900 text-lg">{item.product_name}</h3>
                  <p className="text-sm text-secondary-600 mt-1">{item.product_type}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-secondary-600">Total Ordered:</span>
                      <span className="font-bold text-secondary-900 ml-2">
                        {item.quantity} {item.unit_of_measure}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  {isValid ? (
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      <CheckCircle2 size={16} />
                      Complete
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                      <AlertCircle size={16} />
                      Pending
                    </div>
                  )}
                </div>
              </div>

              {/* Allocation Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary-600">Allocated: {allocated.toFixed(2)} {item.unit_of_measure}</span>
                  <span className={`font-semibold ${
                    remaining > 0 ? 'text-amber-600' : remaining < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {remaining > 0 && `Remaining: ${remaining.toFixed(2)} ${item.unit_of_measure}`}
                    {remaining < 0 && `Over: ${Math.abs(remaining).toFixed(2)} ${item.unit_of_measure}`}
                    {isValid && '✓ Fully Allocated'}
                  </span>
                </div>
                <div className="w-full h-3 bg-secondary-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      percentage > 100 ? 'bg-red-500' : percentage === 100 ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Error Message */}
              {hasError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-800">{errors[item.product_id]}</p>
                </div>
              )}

              {/* Delivery Slots */}
              <div className="space-y-3">
                {slots.map((slot, index) => (
                  <div
                    key={slot.slot_id}
                    className="p-4 bg-secondary-50 rounded-lg border border-secondary-200"
                  >
                    {/* Mobile: Stacked Layout, Desktop: Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      
                      {/* Slot Number */}
                      <div className="md:col-span-1 flex items-center justify-center md:justify-start">
                        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="text-xs text-secondary-600 font-medium mb-1 block">
                          Quantity ({item.unit_of_measure})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={slot.quantity}
                          onChange={(e) => handleUpdateSlot(item.product_id, slot.slot_id, 'quantity', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      {/* Truck Type - NEW FIELD */}
                      <div className="md:col-span-3">
                        <label className="text-xs text-secondary-600 font-medium mb-1 block">
                          Truck Type
                        </label>
                        <div className="relative">
                          <Truck className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                          <select
                            value={slot.truck_type}
                            onChange={(e) => handleUpdateSlot(item.product_id, slot.slot_id, 'truck_type', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                          >
                            {TRUCK_TYPES.map((truck) => (
                              <option key={truck.value} value={truck.value}>
                                {truck.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="md:col-span-3">
                        <label className="text-xs text-secondary-600 font-medium mb-1 block">
                          Delivery Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                          <input
                            type="date"
                            value={slot.delivery_date}
                            onChange={(e) => handleUpdateSlot(item.product_id, slot.slot_id, 'delivery_date', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>

                      {/* Time */}
                      <div className="md:col-span-2">
                        <label className="text-xs text-secondary-600 font-medium mb-1 block">
                          Time
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                          <input
                            type="time"
                            value={slot.delivery_time}
                            onChange={(e) => handleUpdateSlot(item.product_id, slot.slot_id, 'delivery_time', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="md:col-span-1 flex items-end justify-center md:justify-end">
                        {slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(item.product_id, slot.slot_id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove slot"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Slot Button */}
              <button
                type="button"
                onClick={() => handleAddSlot(item.product_id, item.quantity)}
                className="mt-3 w-full px-4 py-3 border-2 border-dashed border-secondary-300 hover:border-primary-500 rounded-lg text-secondary-600 hover:text-primary-700 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Another Delivery Slot
              </button>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          ← Back to Delivery Details
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          variant="primary"
          className="flex-1"
        >
          Continue to Review →
        </Button>
      </div>
    </div>
  );
};

export default Step3_SplitDelivery;