// FILE PATH: src/api/handlers/clientOrders.api.ts
// Updated Client Orders API with Archive and Cancel functionality

import api from '../axios.config';
import type {
  ClientOrdersResponse,
  ClientOrderDetailResponse,
  RepeatOrderPayload,
} from '../../types/clientOrder.types';

export interface ClientOrdersQueryParams {
  per_page?: number;
  page?: number;
  search?: string;
  order_status?: string;
  project_id?: string;
  delivery_date_from?: string;
  delivery_date_to?: string;
  details?: boolean;
}

// Response types for new endpoints
export interface ArchiveOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: number;
    is_archived: number;
  };
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: number;
    order_status: string;
  };
}

export const clientOrdersAPI = {
  /**
   * Get all client orders with filters
   */
  getOrders: async (params?: ClientOrdersQueryParams): Promise<ClientOrdersResponse> => {
    try {
      const response = await api.get('/my-orders', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch orders');
    }
  },

  /**
   * Get single order details
   */
  getOrderDetail: async (orderId: number): Promise<ClientOrderDetailResponse> => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch order details');
    }
  },

  /**
   * Repeat an existing order
   */
  repeatOrder: async (orderId: number, payload: RepeatOrderPayload): Promise<any> => {
    try {
      const response = await api.post(`/repeat-order/${orderId}`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to repeat order');
    }
  },

  /**
   * Mark order as repeat order
   */
  markRepeatOrder: async (orderId: number): Promise<any> => {
    try {
      const response = await api.post(`/mark-repeat-order/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to mark as repeat order');
    }
  },

  /**
   * Archive (soft delete) an order
   * Client can only archive their own orders
   * @param orderId - Order ID to archive
   */
  archiveOrder: async (orderId: number): Promise<ArchiveOrderResponse> => {
    try {
      const response = await api.delete(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to delete order');
    }
  },

  /**
   * Cancel an order (set status to Cancelled)
   * Only allowed for orders with status: Draft, Confirmed, Scheduled, In Transit
   * @param orderId - Order ID to cancel
   */
  cancelOrder: async (orderId: number): Promise<CancelOrderResponse> => {
    try {
      const response = await api.post(`/set-order-status/${orderId}`, {
        order_status: 'Cancelled',
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to cancel order');
    }
  },
};