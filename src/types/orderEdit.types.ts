// src/types/orderEdit.types.ts
/**
 * ORDER EDIT TYPES
 * 
 * Types for client order editing functionality.
 * Supports: contact info updates, item add/update/remove, delivery management
 * 
 * STEP 1: Contact Information only
 * - contact_person_name
 * - contact_person_number  
 * - site_instructions
 */

// ==================== DELIVERY TYPES ====================

/**
 * Delivery slot for edit payload
 * - id: null for new deliveries, number for existing
 * - quantity: quantity for this delivery (backend expects 'quantity')
 * - delivery_date: YYYY-MM-DD format
 * - delivery_time: HH:mm format (optional)
 */
export interface EditDeliveryPayload {
  id: number | null;
  quantity: number;
  delivery_date: string;
  delivery_time?: string | null;
}

/**
 * Delivery from API response
 */
export interface OrderDelivery {
  id: number;
  order_item_id: number;
  quantity: number;
  delivery_date: string;
  delivery_time: string | null;
  status: 'scheduled' | 'pending' | 'delivered' | 'completed' | 'cancelled';
  supplier_confirms?: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ITEM TYPES ====================

/**
 * Payload for adding new item to order
 */
export interface AddItemPayload {
  product_id: number;
  quantity: number;
  deliveries?: EditDeliveryPayload[];
}

/**
 * Payload for updating existing item
 */
export interface UpdateItemPayload {
  order_item_id: number;
  quantity: number;
  deliveries?: EditDeliveryPayload[];
}

/**
 * Order item from API response
 */
export interface OrderEditItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  supplier_id: number | null;
  supplier_unit_cost: string | null;
  quoted_price: string | null;
  is_quoted: number;
  delivery_cost: string | null;
  delivery_type: string | null;
  supplier_discount: string | null;
  supplier_confirms: number;
  custom_blend_mix: string | null;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    product_name: string;
    photo: string | null;
    unit_of_measure: string;
    specifications: string;
    product_type: string;
  };
  supplier?: {
    id: number;
    name: string;
    company_name: string;
  } | null;
  deliveries: OrderDelivery[];
}

// ==================== ORDER FIELDS ====================

/**
 * Editable order fields (Step 1)
 */
export interface EditOrderFields {
  contact_person_name?: string | null;
  contact_person_number?: string | null;
  site_instructions?: string | null;
}

// ==================== MAIN PAYLOAD ====================

/**
 * Complete edit order payload sent to API
 */
export interface EditOrderPayload {
  order?: EditOrderFields;
  items_add?: AddItemPayload[];
  items_update?: UpdateItemPayload[];
  items_remove?: number[];
}

// ==================== API RESPONSE ====================

/**
 * Order data from edit response
 */
export interface EditOrderResponseOrder {
  id: number;
  po_number: string;
  client_id: number;
  project_id: number;
  
  // Contact info
  contact_person_name: string | null;
  contact_person_number: string | null;
  site_instructions: string | null;
  
  // Delivery
  delivery_address: string;
  delivery_date: string;
  delivery_time: string | null;
  delivery_lat: number | null;
  delivery_long: number | null;
  
  // Status
  order_status: string;
  payment_status: string;
  workflow: string;
  
  // Pricing
  total_price: string | null;
  gst_tax: string | null;
  discount: string | null;
  customer_item_cost: string | null;
  customer_delivery_cost: string | null;
  
  // Flags
  repeat_order: boolean;
  is_archived: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  project?: {
    id: number;
    name: string;
    site_contact_name: string | null;
    site_contact_phone: string | null;
    site_instructions: string | null;
    delivery_address: string | null;
  };
}

/**
 * Success response from edit API
 */
export interface EditOrderResponse {
  success: true;
  message: string;
  data: {
    order: EditOrderResponseOrder;
    items: OrderEditItem[];
  };
}

/**
 * Error response from edit API
 */
export interface EditOrderErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ==================== FORM STATE ====================

/**
 * Form state for contact information (Step 1)
 */
export interface ContactInfoFormState {
  contact_person_name: string;
  contact_person_number: string;
  site_instructions: string;
}

/**
 * Track what has changed for UI feedback
 */
export interface EditOrderChanges {
  contactInfoChanged: boolean;
  itemsAdded: number[];
  itemsUpdated: number[];
  itemsRemoved: number[];
}

// ==================== HELPER TYPES ====================

/**
 * Check if an item can be removed (no delivered deliveries)
 */
export const canRemoveItem = (item: OrderEditItem): boolean => {
  return !item.deliveries.some(d => d.status === 'delivered');
};

/**
 * Get delivered quantity for an item
 */
export const getDeliveredQuantity = (item: OrderEditItem): number => {
  return item.deliveries
    .filter(d => d.status === 'delivered')
    .reduce((sum, d) => sum + d.quantity, 0);
};

/**
 * Get scheduled deliveries for an item (editable)
 */
export const getScheduledDeliveries = (item: OrderEditItem): OrderDelivery[] => {
  return item.deliveries.filter(d => d.status !== 'delivered');
};

/**
 * Get delivered deliveries for an item (read-only)
 */
export const getDeliveredDeliveries = (item: OrderEditItem): OrderDelivery[] => {
  return item.deliveries.filter(d => d.status === 'delivered');
};