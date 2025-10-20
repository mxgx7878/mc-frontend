// src/api/handlers/supplierOrders.api.ts

import api from '../axios.config';

// ===========================
// Types & Interfaces
// ===========================

export interface SupplierOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: string;
  supplier_id: number;
  choosen_offer_id: number;
  custom_blend_mix: string | null;
  supplier_unit_cost: string;
  supplier_delivery_cost: string;
  supplier_discount: string;
  supplier_delivery_date: string;
  supplier_confirms: boolean;
  is_paid: boolean;
  supplier_notes?: string | null;
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
  chosen_offer: {
    id: number;
    supplier_id: number;
    master_product_id: number;
    price: string;
    availability_status: string;
    status: string;
  };
}

export interface SupplierOrder {
  id: number;
  order_number?: string;  // From listing API (backend generated)
  po_number?: string;      // From detail API (database field)
  workflow: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  supplier_items_count: number;
  supplier_items: SupplierOrderItem[];
}

export interface OrderMetrics {
  total_orders_count: number;
  supplier_confirmed_count: number;
  awaiting_payment_count: number;
  delivered_count: number;
}

export interface ProductFilter {
  id: number;
  product_name: string;
  photo: string | null;
}

export interface SupplierOrdersResponse {
  success: boolean;
  data: {
    data: SupplierOrder[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
    metrics: OrderMetrics;
    filters?: {
      products: ProductFilter[];
    };
  };
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
      delivery_window: string;
      delivery_method: string;
      load_size: string;
      special_equipment: string;
      special_notes: string;
      created_at: string;
      updated_at: string;
      client: {
        id: number;
        name: string;
        email: string;
      };
      project: {
        id: number;
        name: string;
        site_contact_name: string;
        site_contact_phone: string;
        site_instructions: string;
      };
    };
    supplier_items: SupplierOrderItem[];
  };
}

export interface UpdateOrderItemPayload {
  supplier_unit_cost?: number;
  supplier_discount?: number;
  supplier_delivery_date?: string;
  supplier_confirms?: boolean;
  supplier_notes?: string | null;
}

export interface SupplierOrderFilters {
  page?: number;
  per_page?: number;
  search?: string;
  product_id?: string;
  supplier_confirms?: string;
  supplier_delivery_date?: string;
}

// ===========================
// API Handler
// ===========================

export const supplierOrdersAPI = {
  /**
   * Get supplier orders with filters and pagination
   */
  getOrders: async (filters: SupplierOrderFilters = {}, includeDetails = false): Promise<SupplierOrdersResponse> => {
    try {
      const params: any = { ...filters };
      if (includeDetails) {
        params.details = 'true';
      }
      const response = await api.get('/supplier-orders', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to fetch orders');
    }
  },

  /**
   * Get single order details
   */
  getOrderDetails: async (orderId: number): Promise<OrderDetailResponse> => {
    try {
      const response = await api.get(`/supplier-orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.error || 'Failed to fetch order details');
    }
  },

  /**
   * Update order item
   */
  updateOrderItem: async (orderItemId: number, payload: UpdateOrderItemPayload): Promise<any> => {
    try {
      const response = await api.post(`/supplier-orders/update-pricing/${orderItemId}`, payload);
      console.log('Update order item response:', response);
      return response.data;
    } catch (error: any) {
     
      throw new Error(error?.message || 'Failed to update order item');
    }
  },
};