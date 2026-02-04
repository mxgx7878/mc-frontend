// src/api/handlers/orderEdit.api.ts
/**
 * Order Edit API Handler
 * 
 * Handles API calls for client order editing.
 * Endpoint: POST /order-edit/{order}
 * 
 * Supports:
 * - Update contact info (contact_person_name, contact_person_number, site_instructions)
 * - Add new items with deliveries
 * - Update existing items and their deliveries
 * - Remove items (if no delivered deliveries)
 */

import api from '../axios.config';
import type {
  EditOrderPayload,
  EditOrderResponse,
} from '../../types/orderEdit.types';

export const orderEditAPI = {
  /**
   * Edit an existing order
   * 
   * @param orderId - Order ID to edit
   * @param payload - Edit payload with order fields, items_add, items_update, items_remove
   * @returns Updated order data with items
   * 
   * @example
   * // Update contact info only
   * await orderEditAPI.editOrder(123, {
   *   order: {
   *     contact_person_name: "Ali Khan",
   *     contact_person_number: "0300-1234567",
   *     site_instructions: "Call before arrival"
   *   }
   * });
   * 
   * @example
   * // Full edit with items
   * await orderEditAPI.editOrder(123, {
   *   order: { contact_person_name: "Ali" },
   *   items_add: [{ product_id: 12, quantity: 5, deliveries: [...] }],
   *   items_update: [{ order_item_id: 55, quantity: 10, deliveries: [...] }],
   *   items_remove: [77]
   * });
   */
  editOrder: async (orderId: number, payload: EditOrderPayload): Promise<EditOrderResponse> => {
    try {
      const response = await api.post(`/order-edit/${orderId}`, payload);
      return response.data;
    } catch (error: any) {
      // Re-throw with structured error message
      const message = error?.message || 'Failed to update order';
      const errors = error?.errors || null;
      
      const err = new Error(message) as Error & { errors?: Record<string, string[]> };
      err.errors = errors;
      throw err;
    }
  },

  /**
   * Update contact information only
   * Convenience method for Step 1
   * 
   * @param orderId - Order ID
   * @param contactInfo - Contact fields to update
   */
  updateContactInfo: async (
    orderId: number,
    contactInfo: {
      contact_person_name?: string;
      contact_person_number?: string;
      site_instructions?: string;
    }
  ): Promise<EditOrderResponse> => {
    return orderEditAPI.editOrder(orderId, {
      order: contactInfo,
      items_add: [],
      items_update: [],
      items_remove: [],
    });
  },
};