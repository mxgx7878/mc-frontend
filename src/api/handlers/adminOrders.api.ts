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
   * Update order (admin only) - currently only discount
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

  /**
   * Assign supplier to order item
   */
  assignSupplier: async (payload: {
    order_id: number;
    item_id: number;
    supplier: number;
    offer_id?: number;
  }): Promise<{ message: string; order: any; item: any; offer: any }> => {
    try {
      const response = await api.post('/admin/orders/assign-supplier', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to assign supplier');
    }
  },

  /**
   * Set quoted price for order item
   */
  setItemQuotedPrice: async (
    orderId: number,
    itemId: number,
    quotedPrice: number | null
  ): Promise<{ message: string; order: any; item: any }> => {
    try {
      const response = await api.post(
        `/admin/orders/${orderId}/items/${itemId}/quoted-price`,
        { quoted_price: quotedPrice }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to set quoted price');
    }
  },

  /**
   * Mark item as paid
   */
  markItemAsPaid: async (
    orderId: number,
    itemId: number,
    isPaid: boolean
  ): Promise<{ message: string }> => {
    try {
      const response = await api.post(
        `/admin/orders/${orderId}/items/${itemId}/mark-paid`,
        { is_paid: isPaid }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update payment status');
    }
  },


  updateOrderStatus: async (
    orderId: number,
    order_status: string
  ): Promise<{ order_status: string; message: string }> => {
    try {
      const response = await api.post(
        `/admin/orders/update-order-status/${orderId}`,
        { order_status }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update order status');
    }
  },


  /**
   * Admin update order item pricing
   * Endpoint: POST /admin/update-item-pricing/{orderItem}
   */
  adminUpdateOrderItem: async (
    orderItemId: number,
    payload: {
      supplier_unit_cost?: number;
      supplier_discount?: number;
      delivery_cost?: number;
      delivery_type?: 'Included' | 'Supplier' | 'ThirdParty' | 'Fleet' | 'None';
      supplier_delivery_date?: string;
      supplier_confirms?: boolean;
      supplier_notes?: string;
      quantity?: number;
    }
  ): Promise<{ success: boolean; message: string; data: any }> => {
    try {
      const response = await api.post(
        `/admin/update-item-pricing/${orderItemId}`,
        payload
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update order item');
    }
  },


  /**
   * Update payment status for an order
   */
  updatePaymentStatus: async (
    orderId: number,
    paymentStatus: string
  ): Promise<{ payment_status: string; message: string }> => {
    try {
      const response = await api.post(`/admin/orders/payment-status/${orderId}`, {
        payment_status: paymentStatus,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update payment status');
    }
  },
};