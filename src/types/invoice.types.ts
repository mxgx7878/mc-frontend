// FILE PATH: src/types/invoice.types.ts

/**
 * Invoice Type Definitions
 * TypeScript interfaces for invoice generation module
 *
 * UPDATED: Added unit_cost & delivery_cost to InvoiceableDelivery
 *          Added unit_cost to InvoiceableItem
 *          Each split delivery now carries its own delivery_cost
 */

// ==================== INVOICE STATUS ====================
export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Paid'
  | 'Partially Paid'
  | 'Overdue'
  | 'Cancelled'
  | 'Void';

// ==================== INVOICEABLE DELIVERIES ====================

export interface InvoiceableDelivery {
  id: number;
  quantity: number;
  delivery_date: string | null;
  delivery_time: string | null;
  status: string;
  supplier_confirms: boolean;
  is_invoiced: boolean;
  invoice_id: number | null;
  unit_cost: number;       // customer unit price
  delivery_cost: number;   // delivery cost for this specific split delivery
}

export interface InvoiceableItem {
  id: number;
  product_name: string;
  unit_of_measure: string;
  quantity: number;
  supplier_name: string;
  supplier_id: number | null;
  is_quoted: number;
  quoted_price: number | null;
  is_paid: number;
  unit_cost: number;       // customer unit price for display reference
  deliveries: InvoiceableDelivery[];
}

export interface InvoiceableDeliveriesResponse {
  success: boolean;
  data: {
    order_id: number;
    po_number: string;
    client: string;
    items: InvoiceableItem[];
  };
}

// ==================== INVOICE PREVIEW ====================

export interface InvoicePreviewLineItem {
  order_item_id: number;
  order_item_delivery_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  delivery_cost: number;
  line_total: number;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_status: string;
  supplier_confirms: boolean;
}

export interface InvoicePreviewData {
  line_items: InvoicePreviewLineItem[];
  subtotal: number;
  delivery_total: number;
  gst_tax: number;
  discount: number;
  total_amount: number;
}

export interface InvoicePreviewResponse {
  success: boolean;
  data: InvoicePreviewData;
}

// ==================== INVOICE ====================

export interface InvoiceSummary {
  id: number;
  invoice_number: string;
  order_id: number;
  client_id: number;
  subtotal: number;
  delivery_total: number;
  gst_tax: number;
  discount: number;
  total_amount: number;
  status: InvoiceStatus;
  issued_date: string | null;
  due_date: string | null;
  notes: string | null;
  items_count: number;
  created_by: string;
  created_at: string;
}

export interface InvoiceDetailItem {
  id: number;
  product_name: string;
  unit_of_measure: string;
  quantity: number;
  unit_price: number;
  delivery_cost: number;
  line_total: number;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_status: string;
}

export interface InvoiceDetail {
  id: number;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: string | null;
  due_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  order: {
    id: number;
    po_number: string;
    delivery_address: string;
    client_name: string;
    client_email: string;
  };
  subtotal: number;
  delivery_total: number;
  gst_tax: number;
  discount: number;
  total_amount: number;
  items: InvoiceDetailItem[];
}

// ==================== API RESPONSES ====================

export interface InvoiceListResponse {
  success: boolean;
  data: InvoiceSummary[];
}

export interface InvoiceDetailResponse {
  success: boolean;
  data: InvoiceDetail;
}

export interface InvoiceCreateResponse {
  success: boolean;
  message: string;
  data: InvoiceSummary;
}

export interface InvoiceStatusUpdateResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    status: InvoiceStatus;
  };
}

// ==================== PAYLOADS ====================

export interface InvoicePreviewPayload {
  delivery_ids: number[];
}

export interface InvoiceCreatePayload {
  delivery_ids: number[];
  notes?: string;
  due_date?: string;
  discount?: number;
}

export interface InvoiceStatusPayload {
  status: InvoiceStatus;
}