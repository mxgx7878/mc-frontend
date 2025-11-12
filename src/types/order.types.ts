/* FILE: src/types/order.types.ts */
// FILE PATH: src/types/order.types.ts

/**
 * Order Module Type Definitions
 * 
 * Defines TypeScript interfaces for:
 * - Product listings and details
 * - Shopping cart items
 * - Projects
 * - Order creation and responses
 */

// ==================== PRODUCT TYPES ====================

export interface Product {
  id: number;
  added_by: number;
  is_approved: number;
  approved_by: number;
  slug: string;
  category: {
    id: number;
    name: string;
  };
  product_name: string;
  product_type: string;
  specifications: string;
  unit_of_measure: string;
  tech_doc: string | null;
  photo: string;
  created_at: string;
  updated_at: string;
  price_min?: string;
  price_max?: string;
  price?: string;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

// ==================== CART TYPES ====================

export interface CartItem {
  product_id: number;
  product_name: string;
  product_photo: string;
  product_type: string;
  quantity: number;
  unit_of_measure: string;
  custom_blend_mix?: string;
}

// ==================== PROJECT TYPES ====================

/**
 * Project interface matching Laravel API response
 * FIXED: Using 'name' instead of 'project_name' to match API
 */
export interface Project {
  id: number;
  name: string; // ✅ Fixed: was 'project_name'
  site_contact_name?: string | null;
  site_contact_phone?: string | null;
  site_instructions?: string | null;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_long?: number;
  added_by: number;
  created_at: string;
  updated_at: string;
}

// ==================== ORDER TYPES ====================

export interface OrderFormData {
  po_number?: string;
  project_id: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_long: number;
  delivery_date: string;
  delivery_time?: string;
  delivery_method: 'Other' | 'Tipper' | 'Agitator' | 'Pump' | 'Ute';
  load_size?: string;
  special_equipment?: string;
  special_notes?: string;
  repeat_order?: boolean;
  items: {
    product_id: number;
    quantity: number;
    custom_blend_mix?: string | null;
  }[];
}

export interface OrderResponse {
  message: string;
  order: {
    id: number;
    po_number: string;
    project_id: number;
    delivery_address: string;
    delivery_date: string;
    delivery_method: string;
    order_status: string;
    payment_status: string;
    workflow: string;
    created_at: string;
    items_count: number;
  };
}