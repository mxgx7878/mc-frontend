// src/types/order.types.ts
/**
 * ORDER SYSTEM TYPES
 * 
 * CRITICAL FIX: Project interface must match API's ProjectDTO
 * - delivery_lat and delivery_long are NUMBERS (not strings)
 * - This is what the API returns, so types must match
 * 
 * Updated to support:
 * - Split deliveries (delivery_slots per item)
 * - Contact person fields
 * - Removed: delivery_time, special_equipment, special_notes from order level
 */

// ==================== DELIVERY SLOT ====================
/**
 * Represents a single delivery slot for a product
 * Multiple slots can exist for the same product to split deliveries
 */
export interface DeliverySlot {
  slot_id: string; // UUID for frontend tracking (not sent to backend)
  quantity: number;
  delivery_date: string; // YYYY-MM-DD format
  delivery_time: string; // HH:mm format (24-hour)
}

// ==================== CART ITEM ====================
/**
 * Product in the shopping cart with delivery scheduling
 */
export interface CartItem {
  product_id: number;
  product_name: string;
  product_photo: string | null;
  product_type: string;
  unit_of_measure: string;
  quantity: number; // Total quantity ordered
  custom_blend_mix?: string | null;
  delivery_slots: DeliverySlot[]; // How the quantity is split across deliveries
}

// ==================== PRODUCT ====================
/**
 * Master product with supplier offers
 */
export interface Product {
  id: number;
  product_name: string;
  photo: string | null;
  product_type: string;
  unit_of_measure: string;
  tech_doc: string | null;
  specifications: string;
  price: string | null;
}

// ==================== PROJECT ====================
/**
 * Project interface - MUST MATCH API's ProjectDTO
 * 
 * CRITICAL: delivery_lat and delivery_long are NUMBERS from API
 * Your API returns ProjectDTO with these as numbers, not strings
 */
export interface Project {
  id: number;
  name: string;
  delivery_address: string | null;
  delivery_lat: number | null | undefined;       // Added | undefined
  delivery_long: number | null | undefined;    // Added | undefined
  site_contact_name?: string | null;
  site_contact_phone?: string | null;
  site_instructions?: string | null;
}

// ==================== ORDER FORM VALUES ====================
/**
 * Form data structure for order creation
 * 
 * CHANGES FROM ORIGINAL:
 * - Removed: delivery_time, special_equipment, special_notes
 * - Added: contact_person_name, contact_person_number
 * - items now include delivery_slots array
 */
export interface OrderFormValues {
  project_id: number;
  po_number?: string;
  delivery_address: string;
  delivery_lat: number;
  delivery_long: number;
  delivery_date: string; // Primary/default delivery date
  load_size?: string;
  
  // NEW: Contact person for this order
  contact_person_name: string;
  contact_person_number: string;
  
  repeat_order?: boolean;
  
  // Items with delivery slots
  items: Array<{
    product_id: number;
    quantity: number;
    custom_blend_mix?: string | null;
    delivery_slots: Array<{
      quantity: number;
      delivery_date: string;
      delivery_time: string;
    }>;
  }>;
}

// ==================== API RESPONSES ====================

export interface ProductsResponse {
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface OrderResponse {
  message: string;
  order: {
    id: number;
    po_number: string | null;
    client_id: number;
    project_id: number;
    delivery_address: string;
    delivery_lat: number;
    delivery_long: number;
    delivery_date: string;
    load_size: string | null;
    contact_person_name: string;
    contact_person_number: string;
    order_status: string;
    payment_status: string;
    items: Array<{
      id: number;
      product_id: number;
      quantity: number;
      supplier_id: number | null;
      custom_blend_mix: string | null;
      delivery_slots: string; // JSON string from backend
      product: Product;
    }>;
  };
}

export type OrderFormData = OrderFormValues;