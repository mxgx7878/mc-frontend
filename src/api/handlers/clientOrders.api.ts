// FILE PATH: src/api/handlers/clientOrders.api.ts
// Updated Client Orders API with proper type handling

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
  workflow?: string;
  project_id?: string;
  delivery_date_from?: string;
  delivery_date_to?: string;
  details?: boolean;
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
      throw new Error(error?.response?.data?.message || 'Failed to fetch orders');
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
      throw new Error(error?.response?.data?.message || 'Failed to fetch order details');
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
      throw new Error(error?.response?.data?.message || 'Failed to repeat order');
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
      throw new Error(error?.response?.data?.message || 'Failed to mark as repeat order');
    }
  },
};