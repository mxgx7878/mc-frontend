// src/types/clientOrder.types.ts

import type { WorkflowStatus } from "./adminOrder.types";

export type OrderStatus = 'Draft' | 'Confirmed' | 'Scheduled' | 'In Transit' | 'Delivered' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Partial Refunded' | 'Refunded' | 'Requested';

export interface ClientOrder {
  id: number;
  po_number: string;

  project: {
    id: number;
    name: string;
    added_by: number;
    site_contact_name?: string | null;
    site_contact_phone?: string | null;
    site_instructions?: string | null;
    delivery_address?: string | null;
    delivery_lat?: number | null;
    delivery_long?: number | null;
    created_at: string;
    updated_at: string;
  };

  // Delivery
  delivery_address: string;
  delivery_date: string;
  delivery_time: string;
  delivery_method: string;

  // Status
  order_status: OrderStatus;
  workflow: WorkflowStatus;
  payment_status: PaymentStatus;

  // Counts / totals
  items_count: number;
  total_price: number;
  gst_tax: number;
  discount: number;

  repeat_order: boolean;
  order_info?: string | null;

  created_at: string;
  updated_at: string;
  reason?: string;

  // Pricing breakdown (NEW)
  customer_item_cost?: number;
  customer_delivery_cost?: number;
  supplier_item_cost?: number;
  supplier_delivery_cost?: number;
  other_charges?: number;
}


export interface ClientOrderMetrics {
  total_orders_count: number;
  draft_count: number;
  confirmed_count: number;
  scheduled_count: number;
  in_transit_count: number;
  delivered_count: number;
  completed_count: number;
  cancelled_count: number;
}

export interface ProjectFilter {
  id: number;
  name: string;
}

export interface ClientOrderFilters {
  projects: ProjectFilter[];
  order_statuses: OrderStatus[];
  payment_statuses: PaymentStatus[];
  delivery_methods: string[];
}

export interface ClientOrdersListResponse {
  data: ClientOrder[];
  pagination: {
    per_page: number;
    current_page: number;
    total_pages: number;
    total_items: number;
    has_more_pages: boolean;
  };
  metrics: ClientOrderMetrics;
  projects?: ProjectFilter[];
  order_statuses?: OrderStatus[];
  payment_statuses?: PaymentStatus[];
  delivery_methods?: string[];
}

export interface ClientOrdersQueryParams {
  per_page?: number;
  search?: string;
  project_id?: string;
  order_status?: string;
  payment_status?: string;
  delivery_date?: string;
  delivery_method?: string;
  repeat_order?: string;
  sort?: string;
  dir?: string;
  details?: boolean;
  page?: number;
}

export interface RepeatOrderPayload {
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
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
  order_statuses?: OrderStatus[];
  payment_statuses?: PaymentStatus[];
  delivery_methods?: string[];
}


export interface ClientOrderListItem {
  id: number;
  po_number: string;
  project_id: number;
  client_id: number;
  workflow: string;

  // Status
  order_status: OrderStatus;
  payment_status: PaymentStatus;

  delivery_address: string;
  delivery_date: string;
  delivery_time: string;
  delivery_method?: string;

  repeat_order: boolean;
  order_info?: string | null;

  created_at: string;
  updated_at: string;

  // Counts / totals for list view
  items_count: number;
  discount: number;
  total_price?: number;
  gst_tax?: number;

  // Pricing breakdown (optional)
  customer_item_cost?: number;
  customer_delivery_cost?: number;

  // Legacy
  subtotal?: number;
  fuel_levy?: number;
  other_charges?: number;

  // Relationships
  project?: {
    id: number;
    name: string;
  };
}

export interface ClientOrderDetailResponse {
  success: boolean;
  data: ClientOrderDetail;
}


export interface ClientOrderDetail {
  order: ClientOrder;
  items: ClientOrderItem[];
}

export interface ClientOrderItem {
}