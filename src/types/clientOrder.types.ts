// FILE PATH: src/types/clientOrder.types.ts
// Updated Client Order Types with proper pricing fields

export interface ClientOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  supplier_id: number | null;
  supplier_unit_cost: number | null;
  supplier_discount: number | null;
  delivery_cost: number | null;
  delivery_type: string | null;
  supplier_confirms: number; // 0 or 1
  is_quoted: number; // 0 or 1
  quoted_price: number | null;
  
  // Relationships
  product?: {
    id: number;
    product_name: string;
    category?: string;
  };
  supplier?: {
    id: number;
    name: string;
    profile_image?: string;
  };
  
  // Eligible suppliers (when supplier not assigned)
  eligible_suppliers?: Array<{
    id: number;
    name: string;
    profile_image?: string;
  }>;
}

export interface ClientOrder {
  id: number;
  po_number: string;
  client_id: number;
  project_id: number;
  
  // Delivery Info
  delivery_address: string;
  delivery_lat: number | null;
  delivery_long: number | null;
  delivery_date: string;
  delivery_time: string;
  delivery_window?: string | null;
  delivery_method?: string | null;
  
  // Status
  workflow: 'Supplier Missing' | 'Supplier Assigned' | 'Payment Requested' | 'Delivered' | 'On Hold';
  payment_status: 'Pending' | 'Paid' | 'Partially Paid' | 'Failed';
  order_status?: string;
  
  // Pricing - NEW STRUCTURE
  customer_item_cost: number;
  customer_delivery_cost: number;
  gst_tax: number;
  discount: number;
  other_charges: number;
  total_price: number;
  
  // Legacy fields (may be present but not used)
  subtotal?: number;
  fuel_levy?: number;
  
  // Additional Info
  repeat_order: boolean;
  order_info?: string | null;
  reason?: string | null;
  special_notes?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relationships
  project?: {
    id: number;
    name: string;
    site_contact_name?: string;
    site_contact_phone?: string;
    site_instructions?: string;
  };
}

export interface ClientOrderDetail {
  order: ClientOrder;
  items: ClientOrderItem[];
}

export interface ClientOrderListItem {
  id: number;
  po_number: string;
  project_id: number;
  client_id: number;
  workflow: string;
  payment_status: string;
  delivery_address: string;
  delivery_date: string;
  delivery_time: string;
  delivery_method?: string;
  repeat_order: boolean;
  order_info?: string | null;
  created_at: string;
  updated_at: string;
  
  // Pricing
  customer_item_cost?: number;
  customer_delivery_cost?: number;
  total_price?: number;
  
  // Legacy
  subtotal?: number;
  fuel_levy?: number;
  other_charges?: number;
  gst_tax?: number;
  
  // Relationships
  project?: {
    id: number;
    name: string;
  };
}

export interface ClientOrderMetrics {
  total_orders_count: number;
  supplier_missing_count: number;
  supplier_assigned_count: number;
  awaiting_payment_count: number;
  delivered_count: number;
}

export interface ClientOrdersResponse {
  data: ClientOrderListItem[];
  pagination: {
    per_page: number;
    current_page: number;
    total_pages: number;
    total_items: number;
    has_more_pages: boolean;
  };
  metrics: ClientOrderMetrics;
  projects?: Array<{
    id: number;
    name: string;
  }>;
}

export interface ClientOrderDetailResponse {
  success: boolean;
  data: ClientOrderDetail;
}

export interface RepeatOrderPayload {
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
}