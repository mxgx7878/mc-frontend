// ============================================================================
// FILE: src/api/handlers/clientOrders.api.ts - UPDATED WITH MARK REPEAT
// ============================================================================

import api from '../axios.config';

export interface ClientOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: string;
  supplier_id: number | null;
  choosen_offer_id: number;
  custom_blend_mix: string | null;
  supplier_unit_cost: string;
  supplier_delivery_cost: string;
  supplier_discount: string;
  supplier_delivery_date: string;
  supplier_confirms: boolean;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    product_name: string;
    product_type: string;
    specifications: string;
    unit_of_measure: string;
    photo: string | null;
  };
  supplier: {
    id: number;
    name: string;
    email: string;
    profile_image: string | null;
  } | null;
}

export interface ClientOrder {
  id: number;
  po_number: string;
  client_id: number;
  project_id: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_long: number;
  delivery_date: string;
  delivery_time: string;
  delivery_window: string | null;
  delivery_method: string;
  load_size: string;
  special_equipment: string;
  subtotal: string;
  fuel_levy: string;
  other_charges: string;
  gst_tax: string;
  discount: string;
  total_price: string;
  supplier_cost: string;
  customer_cost: string;
  admin_margin: string;
  payment_status: string;
  order_status: string;
  workflow: string;
  reason: string | null;
  repeat_order: boolean;
  generate_invoice: boolean;
  order_process: string;
  special_notes: string | null;
  created_at: string;
  updated_at: string;
  order_info?: string;
  project: {
    id: number;
    name: string;
    site_contact_name: string;
    site_contact_phone: string;
    site_instructions: string;
  };
  items: ClientOrderItem[];
}

export interface OrderMetrics {
  total_orders_count: number;
  supplier_missing_count: number;
  supplier_assigned_count: number;
  awaiting_payment_count: number;
  delivered_count: number;
}

export interface ProjectFilter {
  id: number;
  name: string;
}

export interface ClientOrdersResponse {
  data: ClientOrder[];
  pagination: {
    per_page: number;
    current_page: number;
    total_pages: number;
    total_items: number;
    has_more_pages: boolean;
  };
  metrics: OrderMetrics;
  projects?: ProjectFilter[];
}

export interface OrderDetailResponse {
  success: boolean;
  data: {
    order: {
      id: number;
      po_number: string;
      project_id: number;
      client_id: number;
      workflow: string;
      delivery_address: string;
      delivery_date: string;
      delivery_time: string;
      delivery_method: string;
      created_at: string;
      updated_at: string;
      gst_tax: string;
      total_price: string;
      repeat_order: boolean;
      special_notes: string | null;
      fuel_levy: string;
      other_charges: string;
      discount: string;
      subtotal: string;
      payment_status: string;
      order_status: string;
      project?: {
        id: number;
        name: string;
        site_contact_name: string;
        site_contact_phone: string;
        site_instructions: string;
      };
      order_info?: string;
    };
    items: ClientOrderItem[];
  };
}

export interface ClientOrderFilters {
  page?: number;
  per_page?: number;
  search?: string;
  project_id?: string;
  workflow?: string;
  delivery_date?: string;
  repeat_order?: string;
  sort?: string;
  dir?: string;
}

export interface RepeatOrderPayload {
  items: {
    product_id: number;
    quantity: number;
    custom_blend_mix?: string;
  }[];
}

export const clientOrdersAPI = {
  getOrders: async (filters: ClientOrderFilters = {}, includeDetails = false): Promise<ClientOrdersResponse> => {
    try {
      const params: any = { ...filters };
      if (includeDetails) {
        params.details = 'true';
      }
      const response = await api.get('/my-orders', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to fetch orders');
    }
  },

  getOrderDetails: async (orderId: number): Promise<OrderDetailResponse> => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.error || 'Failed to fetch order details');
    }
  },

  repeatOrder: async (orderId: number, payload: RepeatOrderPayload): Promise<any> => {
    try {
      const response = await api.post(`/repeat-order/${orderId}`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to repeat order');
    }
  },

  markRepeatOrder: async (orderId: number): Promise<any> => {
    try {
      const response = await api.get(`/mark-repeat-order/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to mark order as repeat');
    }
  },
};