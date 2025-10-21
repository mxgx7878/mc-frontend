// FILE PATH: src/api/handlers/adminOrders.api.ts

/**
 * Admin Orders API Handler
 * Handles all API calls for admin order management
 */

import api from '../axios.config';
import type {
  AdminOrdersListResponse,
  AdminOrderDetailResponse,
  AdminOrdersQueryParams,
  AdminOrderUpdatePayload,
} from '../../types/adminOrder.types';

export const adminOrdersAPI = {
  /**
   * Get list of all orders with filters
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated orders list with metrics and filters
   */
  getOrders: async (params: AdminOrdersQueryParams): Promise<AdminOrdersListResponse> => {
    try {
      const response = await api.get('/admin/orders', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch orders');
    }
  },

  /**
   * Get single order details
   * @param orderId - Order ID
   * @returns Detailed order information
   */
  getOrderDetail: async (orderId: number): Promise<AdminOrderDetailResponse> => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || `Failed to fetch order ${orderId}`);
    }
  },

  /**
   * Update order (admin only)
   * @param orderId - Order ID
   * @param payload - Fields to update
   * @returns Success message
   */
  updateOrder: async (
    orderId: number,
    payload: AdminOrderUpdatePayload
  ): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/admin/orders/${orderId}/admin-update`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update order');
    }
  },
};