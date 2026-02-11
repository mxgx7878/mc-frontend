// FILE PATH: src/types/adminOrder.types.ts

/**
 * Admin Orders Type Definitions - UPDATED
 * All TypeScript interfaces for admin order management
 * Updated to match new pricing logic and backend responses
 */

// ==================== DELIVERY ZONE ====================
export interface DeliveryZone {
  address: string;
  lat: number;
  long: number;
  radius: number;
}


// ==================== ORDER LOG ====================
export interface OrderLog {
  id: number;
  action: string;
  details: string;
  order_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== ELIGIBLE SUPPLIER ====================
export interface EligibleSupplier {
  supplier_id: number;
  id:number;
  name: string;
  offer_id: number;
  distance: number | null;
  selected: boolean | null;
  unit_cost: number | null;
}

// ==================== ORDER ITEM (UPDATED) ====================
export interface ItemDelivery {
  id: number;
  order_id: number;
  order_item_id: number;
  supplier_id: number;
  quantity: string | number;
  delivery_date: string;
  delivery_time: string;
  truck_type?: string | null;              // ← ADD
  delivery_cost?: number | string | null;
  supplier_confirms: boolean;
  created_at: string;
  updated_at: string;
}
export interface AdminOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  
  // Supplier Info
  supplier?: {
    id: number;
    name: string;
    profile_image?: string;
    delivery_zones?: DeliveryZone[];
  } | null;
  supplier_id?: number | null;
  choosen_offer_id?: number | null;
  
  // Supplier Costs
  supplier_unit_cost?: number | null;
  supplier_delivery_cost?: number | null;
  supplier_discount?: number | null;
  delivery_cost?: number | null;
  delivery_type?: string | null;
  supplier_delivery_date?: string | null;
  supplier_notes?: string;
  
  // Status Fields
  supplier_confirms?: number; // 0 or 1
  is_quoted: number; // 0 or 1
  is_paid: number; // 0 or 1
  supplier_status?: string; // 'Paid' | 'Unpaid'
  
  // Quoted Price
  quoted_price?: number | null;
  
  // Eligible Suppliers (for assignment)
  eligible_suppliers?: EligibleSupplier[];
  
  // ✨ NEW: Delivery Schedules
  deliveries?: ItemDelivery[];
}

// ==================== ORDER DETAIL (UPDATED) ====================
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
  order_process?: string;
  contact_person_name?: string | null;
  contact_person_number?: string | null;
  repeat_order: boolean;
  order_info?: string | null;
  created_at: string;
  updated_at: string;
  load_size?: string;
  
  // NEW: Supplier Costs Breakdown
  supplier_item_cost: number;
  supplier_delivery_cost: number;
  supplier_total: number;
  
  
  // NEW: Customer Costs Breakdown
  customer_item_cost: number;
  customer_delivery_cost: number;
  
  // Legacy fields (kept for backward compatibility)
  supplier_cost: number;
  customer_cost: number;
  
  // Profit & Calculations
  admin_margin: number;
  profit_amount: number; // NEW - same as admin_margin
  profit_before_tax: number; // NEW
  profit_margin_percent: number; // NEW
  
  // Charges & Taxes
  gst_tax: number;
  subtotal: number;
  discount: number;
  fuel_levy: number;
  other_charges: number;
  total_price: number; // NEW - same as customer_cost
  
  // Additional Info
  special_notes?: string | null;
  delivery_method?: string;
  
  // Items
  items: AdminOrderItem[];
  
  // Filters
  filters: {
    projects: ProjectFilter[];
  };
  logs: OrderLog[];
}

// ==================== ORDER LIST ITEM (UPDATED) ====================
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

  // Supplier costs (computed from items + deliveries)
  supplier_item_cost: number;
  supplier_discount: number;       // NEW
  supplier_delivery_cost: number;
  supplier_total: number;

  // Customer costs (with margins applied)
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

  // Invoice tracking                // NEW
  invoices_count: number;           // NEW
  invoiced_amount: number;          // NEW

  order_info?: string | null;
  repeat_order?: boolean;
  created_at: string;
  updated_at: string;
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

// ==================== UPDATE PAYLOADS ====================

/**
 * Admin Update Payload
 * Used for /admin/orders/{id}/admin-update endpoint
 */
export interface AdminOrderUpdatePayload {
  discount?: number;  // For discount updates
  item_id?: number;   // For payment status updates
  is_paid?: boolean;  // For marking item as paid/unpaid
}

/**
 * Assign Supplier Payload
 * Used for /admin/orders/{orderId}/items/{itemId}/assign-supplier endpoint
 */
export interface AssignSupplierPayload {
  order_id: number;
  item_id: number;
  supplier: number;
  offer_id?: number;
}

/**
 * Set Quoted Price Payload
 * Used for /admin/orders/{orderId}/items/{itemId}/quoted-price endpoint
 */
export interface SetQuotedPricePayload {
  quoted_price: number | null;
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

// ==================== HELPER TYPES ====================

/**
 * Response from adminUpdate endpoint
 */
export interface AdminUpdateResponse {
  success: boolean;
  message: string;
  order?: AdminOrderDetail;
  item?: AdminOrderItem;
}

/**
 * Response from assignSupplier endpoint
 */
export interface AssignSupplierResponse {
  message: string;
  order: {
    id: number;
    workflow: WorkflowStatus;
    total_price: number;
    profit_amount: number;
    profit_margin_percent: number;
  };
  item: {
    id: number;
    product_id: number;
    supplier_id: number;
    choosen_offer_id: number;
    supplier_unit_cost: number;
    supplier_discount: number;
    supplier_delivery_cost: number | null;
    delivery_type: string | null;
    delivery_cost: number | null;
  };
  offer: {
    id: number;
    supplier_id: number;
    master_product_id: number;
  };
}

/**
 * Response from setItemQuotedPrice endpoint
 */
export interface SetQuotedPriceResponse {
  message: string;
  order: {
    id: number;
    customer_item_cost: number;
    customer_delivery_cost: number;
    gst_tax: number;
    total_price: number;
    profit_amount: number;
    profit_margin_percent: number;
  };
  item: {
    id: number;
    is_quoted: number;
    quoted_price: number | null;
  };
}



/**
 * Admin Update Order Item Payload
 * Used for /admin/update-item-pricing/{orderItem} endpoint
 */
export interface AdminUpdateOrderItemPayload {
  supplier_unit_cost?: number;
  supplier_discount?: number;
  delivery_cost?: number;
  delivery_type?: 'Included' | 'Supplier' | 'ThirdParty' | 'Fleet' | 'None';
  supplier_delivery_date?: string; // ISO date format
  supplier_confirms?: boolean;
  supplier_notes?: string;
  quantity?: number; // NEW: Allow quantity update
}

/**
 * Response from adminUpdateOrderItem endpoint
 */
export interface AdminUpdateOrderItemResponse {
  success: boolean;
  message: string;
  data: AdminOrderItem;
}






