// FILE PATH: src/api/handlers/orders.api.ts

/**
 * Orders API Handler
 * 
 * Handles all API calls related to order creation and management:
 * - Fetch products for client
 * - Get categories
 * - Get product details
 * - Create orders
 */

import api from '../axios.config';
import type { ProductsResponse, Product, OrderFormData, OrderResponse } from '../../types/order.types';

// ===========================
// Category Type
// ===========================

export interface Category {
  id: number;
  name: string;
}

export interface CategoriesResponse {
  data: Category[];
}

// ===========================
// API Functions
// ===========================

export const ordersAPI = {
  /**
   * Get products for client with search and filters
   * @param params - Query parameters (page, per_page, search, category)
   * @returns Paginated products list
   */
  getClientProducts: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: number;
  }): Promise<ProductsResponse> => {
    try {
      const response = await api.get('/client/products', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to fetch products');
    }
  },

  /**
   * Get all categories for filtering
   * @returns List of all product categories
   */
  getCategories: async (): Promise<CategoriesResponse> => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to fetch categories');
    }
  },

  /**
   * Get single product details
   * @param id - Product ID
   * @returns Full product details
   */
  getProductById: async (id: number): Promise<{ data: Product }> => {
    try {
      const response = await api.get(`/client/products/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to fetch product details');
    }
  },

  /**
   * Create a new order
   * @param orderData - Order form data including items, delivery details
   * @returns Created order response
   */
  createOrder: async (orderData: OrderFormData): Promise<OrderResponse> => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to create order');
    }
  },
};
// ===========================================================================
// END OF FILE
// ===========================================================================