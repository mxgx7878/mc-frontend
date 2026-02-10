// FILE PATH: src/api/handlers/orders.api.ts

/**
 * Orders API Handler
 * 
 * UPDATED: getClientProducts now accepts delivery_lat & delivery_long
 * to enable location-based product availability filtering.
 * 
 * When location is provided, the backend returns is_available (true/false)
 * for each product based on whether any supplier can deliver to that location.
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
// Product Types
// ===========================
export interface ProductType {
  product_type: string;
}

export interface ProductTypesResponse {
  data: ProductType[];
}

// ===========================
// API Functions
// ===========================

export const ordersAPI = {
  /**
   * Get products for client with search, filters, and optional location
   * 
   * UPDATED: Added delivery_lat & delivery_long params
   * When provided, backend returns is_available per product
   * 
   * @param params - Query parameters (page, per_page, search, category, product_type, delivery_lat, delivery_long)
   * @returns Paginated products list with availability info
   */
  getClientProducts: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: number;
    product_type?: string;
    delivery_lat?: number;   // NEW: Latitude for availability check
    delivery_long?: number;  // NEW: Longitude for availability check
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

  getProductTypes: async (): Promise<ProductTypesResponse> => {
    try {
      const response = await api.get('/product-types');
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to fetch product types');
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