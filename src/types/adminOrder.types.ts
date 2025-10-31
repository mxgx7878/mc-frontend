// FILE PATH: src/types/adminOrder.types.ts

/**
 * Admin Orders Type Definitions
 * All TypeScript interfaces for admin order management
 * Updated to match new pricing logic
 */

// ==================== DELIVERY ZONE ====================
export interface DeliveryZone {
  address: string;
  lat: number;
  long: number;
  radius: number;
}

// ==================== ORDER ITEM ====================
export interface AdminOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  supplier_id?: number | null;
  supplier?: {
    id: number;
    name: string;
    profile_image?: string;
    delivery_zones?: DeliveryZone[];
  } | null;
  choosen_offer_id?: number | null;
  supplier_confirms?: number; // 0 or 1
  supplier_unit_cost?: number;
  supplier_delivery_cost?: number;
  supplier_discount?: number;
  eligible_suppliers?: EligibleSupplier[];
}

export interface EligibleSupplier {
  supplier_id: number;
  name: string;
  offer_id: number;
  distance: number | null;
}

// ==================== ORDER (UPDATED) ====================
export interface AdminOrder {
  id: number;
  po_number: string;
  client: string;
  project: string;
  delivery_date: string;
  delivery_time: string;
  delivery_method?: string;
  workflow: WorkflowStatus;
  payment_status: PaymentStatus;
  order_process?: string;
  items_count: number;
  unassigned_items_count: number;
  suppliers_count: number;
  
  // Supplier costs
  supplier_item_cost: number;
  supplier_delivery_cost: number;
  supplier_total: number;
  
  // Customer costs
  customer_item_cost: number;
  customer_delivery_cost: number;
  
  // Totals and profit
  total_price: number;
  profit_amount: number;
  profit_margin_percent: number;
  
  // Other charges
  gst_tax: number;
  discount: number;
  other_charges: number;
  
  order_info?: string | null;
  repeat_order?: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ORDER DETAIL ====================
export interface AdminOrderDetail {
  id: number;
  po_number: string;
  client: string;
  project: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_long: number | null;
  delivery_date: string;
  delivery_time: string;
  workflow: WorkflowStatus;
  payment_status: PaymentStatus;
  supplier_cost: number;
  customer_cost: number;
  admin_margin: number;
  gst_tax: number;
  subtotal: number;
  discount: number;
  fuel_levy: number;
  other_charges: number;
  special_notes?: string | null;
  delivery_method?: string;
  items: AdminOrderItem[];
  filters: {
    projects: ProjectFilter[];
  };
}

// ==================== FILTERS ====================
export interface UserFilter {
  id: number;
  name: string;
  profile_image?: string;
}

export interface ProjectFilter {
  id: number;
  name: string;
}

export interface AdminOrderFilters {
  clients: UserFilter[];
  suppliers: UserFilter[];
  projects: ProjectFilter[];
  workflows: WorkflowStatus[];
  payment_statuses: PaymentStatus[];
  delivery_methods: string[];
}

// ==================== METRICS ====================
export interface AdminOrderMetrics {
  total_orders_count: number;
  supplier_missing_count: number;
  supplier_assigned_count: number;
  awaiting_payment_count: number;
  delivered_count: number;
}

// ==================== API RESPONSES ====================
export interface AdminOrdersListResponse {
  data: AdminOrder[];
  pagination: {
    per_page: number;
    current_page: number;
    total_pages: number;
    total_items: number;
    has_more_pages: boolean;
  };
  metrics: AdminOrderMetrics;
  filters?: AdminOrderFilters;
}

export interface AdminOrderDetailResponse {
  data: AdminOrderDetail;
}

// ==================== API QUERY PARAMS ====================
export interface AdminOrdersQueryParams {
  per_page?: number;
  search?: string;
  client_id?: string;
  project_id?: string;
  supplier_id?: string;
  workflow?: string;
  payment_status?: string;
  delivery_date_from?: string;
  delivery_date_to?: string;
  delivery_method?: string;
  repeat_order?: string;
  has_missing_supplier?: string;
  supplier_confirms?: string;
  min_total?: string;
  max_total?: string;
  sort?: string;
  dir?: string;
  details?: boolean;
  page?: number;
}

// ==================== UPDATE PAYLOAD ====================
export interface AdminOrderUpdatePayload {
  project_id?: number;
  delivery_date?: string;
  delivery_method?: string;
  special_notes?: string;
  discount?: number;
}

// ==================== ENUMS ====================
export type WorkflowStatus =
  | 'Requested'
  | 'Supplier Missing'
  | 'Supplier Assigned'
  | 'Payment Requested'
  | 'On Hold'
  | 'Delivered';

export type PaymentStatus =
  | 'Pending'
  | 'Requested'
  | 'Paid'
  | 'Partially Paid'
  | 'Partial Refunded'
  | 'Refunded';